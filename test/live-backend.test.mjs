import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchScopedTask,
  createSimpulMcpAdapter,
  createNativeSubagentAdapter,
  ResourceBudgetLedger
} from '../src/live-backend.mjs';

const task = (scope = { readOnly: true, operationClass: 'safe' }) => ({
  id: 'T1',
  title: 'Review test failures',
  scope,
  requiresDelegation: true,
  independent: true
});

const fake = (healthy, log, cap = {}) => ({
  async probe() {
    log.push('probe');
    return { healthy, noNestedDelegation: true, supportsParallel: true, ...cap };
  },
  async executeTask(_task, opts) {
    log.push('execute');
    assert.equal(opts.noNestedDelegation, true);
    return { workerId: 'real-worker-1', verified: true, evidenceRefs: ['test-log.txt'] };
  },
  async cancelTask() {
    log.push('cancel');
  }
});

test('dispatcher never invents workers: unhealthy backends fall back to real inline adapter', async () => {
  const log = [];
  const inline = { async executeTask() { log.push('inline'); return { report: 'reviewed' }; } };
  const result = await dispatchScopedTask({ task: task(), inlineAdapter: inline, backends: { simpul: fake(false, log) } });
  assert.equal(result.backend, 'inline');
  assert.equal(result.workerId, null);
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.deepEqual(log, ['probe', 'inline']);
});

test('verified healthy Simpul outranks native; task still needs independent verifier', async () => {
  const log = [], never = { async executeTask() { throw new Error('inline must not run'); } };
  const result = await dispatchScopedTask({
    task: task(),
    inlineAdapter: never,
    backends: { simpul: fake(true, log), native: fake(true, []) },
    verifyEvidence: async (_task, refs) => refs[0] === 'test-log.txt'
  });
  assert.equal(result.backend, 'simpul');
  assert.equal(result.parallelism, 2);
  assert.equal(result.workerId, 'real-worker-1');
  assert.equal(result.status, 'VERIFIED');
  assert.deepEqual(log, ['probe', 'execute']);
});

test('provider self verification alone cannot mark task VERIFIED', async () => {
  const result = await dispatchScopedTask({
    task: task(),
    inlineAdapter: { async executeTask() {} },
    backends: { native: fake(true, []) },
    verifyEvidence: async () => false
  });
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.equal(result.verified, false);
});

test('write task without task-scoped approval cannot probe, spawn, or fall back', async () => {
  const log = [];
  await assert.rejects(dispatchScopedTask({
    task: task({ readOnly: false, operationClass: 'external' }),
    inlineAdapter: { async executeTask() { log.push('inline'); } },
    backends: { simpul: fake(true, log) }
  }), /authorization/);
  assert.deepEqual(log, []);
});

test('write tasks cannot select read-only backends or parallelize without isolation', async () => {
  const log = [], scope = { readOnly: false, operationClass: 'safe' };
  const result = await dispatchScopedTask({
    task: { ...task(scope), isolatedWorktrees: false },
    inlineAdapter: { async executeTask() { log.push('inline'); return {}; } },
    approvedTaskIds: ['T1'],
    authorizeOperation: async () => 'allow-once',
    backends: { simpul: fake(true, log, { supportsWrites: true }) }
  });
  assert.equal(result.backend, 'simpul');
  assert.equal(result.parallelism, 1);
});

test('backend must implement cancellation and disallow nested worker spawning', async () => {
  const log = [], stub = { ...fake(true, log) };
  delete stub.cancelTask;
  const result = await dispatchScopedTask({
    task: task(),
    inlineAdapter: { async executeTask() { return {}; } },
    backends: { simpul: stub }
  });
  assert.equal(result.backend, 'inline');
  assert.equal(log.length, 0);
});

test('write authorization cannot escalate to always-allow or be inferred from task ID', async () => {
  const taskWithWrite = task({ readOnly: false, operationClass: 'safe' });
  const inline = { async executeTask() { throw Error('unapproved dispatch'); } };
  await assert.rejects(dispatchScopedTask({ task: taskWithWrite, inlineAdapter: inline, approvedTaskIds: ['T1'] }), /allow-once/);
  await assert.rejects(dispatchScopedTask({
    task: taskWithWrite,
    inlineAdapter: inline,
    approvedTaskIds: ['T1'],
    authorizeOperation: async () => 'always-allow'
  }), /allow-once/);
});

test('createSimpulMcpAdapter adheres to exact FastMCP signatures and uses server-confirmed run_id', async () => {
  const calls = [];
  const mockMcpClient = {
    async callTool(name, params) {
      calls.push({ name, params });
      if (name === 'get_model_usage') return { tokens: 1500, costMicro: 3000 };
      if (name === 'submit_goal') {
        assert.ok(params.goal);
        assert.equal(typeof params.workspace_path, 'string');
        // Must NOT send invented run_id, project_id, or policy_revision
        assert.equal(params.run_id, undefined);
        assert.equal(params.project_id, undefined);
        return {
          status: 'SUBMITTED',
          run_id: 'simpul-server-run-uuid-1234',
          initial_task_id: 'simpul-task-init-01',
          goal: params.goal
        };
      }
      if (name === 'get_run') {
        assert.equal(params.run_id, 'simpul-server-run-uuid-1234');
        return { run_id: params.run_id, status: 'SUBMITTED', task_count: 1 };
      }
      if (name === 'get_task_evidence') {
        assert.equal(params.run_id, 'simpul-server-run-uuid-1234');
        assert.equal(params.task_id, 'simpul-task-init-01');
        return {
          run_id: params.run_id,
          task_id: params.task_id,
          status: 'VERIFIED',
          verified: true,
          evidence_ids: ['sha256:abc123evidence']
        };
      }
      if (name === 'cancel_run') {
        assert.equal(params.run_id, 'simpul-server-run-uuid-1234');
        return { status: 'CANCELLED', run_id: params.run_id };
      }
      return {};
    }
  };

  const adapter = createSimpulMcpAdapter({ mcpClient: mockMcpClient });
  const probe = await adapter.probe();
  assert.equal(probe.healthy, true);
  assert.equal(probe.noNestedDelegation, true);
  assert.equal(probe.supportsWrites, true);
  assert.equal(probe.executionReady, false); // Accurately reflects upstream candidate status

  const exec = await adapter.executeTask({ id: 'task-42', title: 'Compile harness' }, { noNestedDelegation: true });
  // Worker ID must be the server-confirmed run_id, NOT a locally fabricated string
  assert.equal(exec.workerId, 'simpul-server-run-uuid-1234');
  assert.equal(exec.verified, true);
  assert.deepEqual(exec.evidenceRefs, ['sha256:abc123evidence']);

  await adapter.cancelTask({ taskId: 'task-42', reason: 'user-cancel' });
  assert.ok(calls.some(c => c.name === 'submit_goal'));
  assert.ok(calls.some(c => c.name === 'get_task_evidence'));
  assert.ok(calls.some(c => c.name === 'cancel_run'));
});

test('createNativeSubagentAdapter obtains identity exclusively from host runner and handles errors', async () => {
  let cancelledWorker = null;
  const mockRunner = {
    async status() {
      return {
        available: true,
        capabilities: { supportsWrites: true, supportsParallel: true }
      };
    },
    async run(task, options) {
      assert.equal(options.noNestedDelegation, true);
      // Host runner assigns worker identity
      return {
        workerId: 'host-managed-worker-uuid-999',
        verified: true,
        evidenceRefs: ['native-execution-output.log']
      };
    },
    async cancel({ workerId }) {
      cancelledWorker = workerId;
    }
  };

  const adapter = createNativeSubagentAdapter({ runner: mockRunner });
  const probe = await adapter.probe();
  assert.equal(probe.healthy, true);
  assert.equal(probe.supportsWrites, true);
  assert.equal(probe.supportsParallel, true);

  const exec = await adapter.executeTask({ id: 'task-native-1', title: 'Local audit' }, { noNestedDelegation: true });
  assert.equal(exec.workerId, 'host-managed-worker-uuid-999');
  assert.equal(exec.verified, true);
  assert.deepEqual(exec.evidenceRefs, ['native-execution-output.log']);

  await adapter.cancelTask({ taskId: 'task-native-1', reason: 'cleanup' });
  assert.equal(cancelledWorker, 'host-managed-worker-uuid-999');
});

test('createNativeSubagentAdapter fails closed on missing status API or fabricated IDs', async () => {
  // 1. Missing runner.status must not be assumed available
  const runnerNoStatus = { async run() { return { workerId: 'w1' }; } };
  const adapterNoStatus = createNativeSubagentAdapter({ runner: runnerNoStatus });
  const probeNoStatus = await adapterNoStatus.probe();
  assert.equal(probeNoStatus.healthy, false);

  // 2. Runner returning fabricated or invalid worker ID fails closed
  const fakeRunner = {
    async status() { return { available: true }; },
    async run() { return { workerId: 'fake', verified: true }; }
  };
  const fakeAdapter = createNativeSubagentAdapter({ runner: fakeRunner });
  await assert.rejects(
    fakeAdapter.executeTask({ id: 't1', title: 'Task' }, { noNestedDelegation: true }),
    /invalid or fabricated worker identity/
  );

  // 3. Worker crash fails closed
  const crashRunner = {
    async status() { return { available: true }; },
    async run() { return { workerId: 'real-worker-x', crashed: true, error: 'OOM error' }; }
  };
  const crashAdapter = createNativeSubagentAdapter({ runner: crashRunner });
  await assert.rejects(
    crashAdapter.executeTask({ id: 't2', title: 'Task' }, { noNestedDelegation: true }),
    /crashed or encountered error/i
  );

  // 4. Missing cancellation API fails closed on cancelTask
  const noCancelRunner = {
    async status() { return { available: true }; },
    async run() { return { workerId: 'real-worker-y' }; }
  };
  const noCancelAdapter = createNativeSubagentAdapter({ runner: noCancelRunner });
  await assert.rejects(
    noCancelAdapter.cancelTask({ taskId: 't3' }),
    /Runner lacks cancellation API/
  );
});

test('ResourceBudgetLedger prevents over-budget operations upfront', () => {
  const ledger = new ResourceBudgetLedger({ tokenLimit: 5000, costLimitMicro: 10000, maxConcurrency: 2 });

  ledger.acquireWorker('worker-1');
  ledger.acquireWorker('worker-2');
  assert.throws(() => ledger.acquireWorker('worker-3'), /Concurrency ceiling/);

  ledger.releaseWorker('worker-1');
  assert.equal(ledger.summary.activeWorkers, 1);

  // Initial usage within budget
  ledger.recordUsage({ taskId: 't1', tokens: 3000, costMicro: 4000 });
  assert.equal(ledger.summary.usedTokens, 3000);

  // checkBudget passes when within remaining budget
  assert.equal(ledger.checkBudget({ estimatedTokens: 1000 }), true);

  // checkBudget throws when estimated tokens breach ceiling
  assert.throws(() => ledger.checkBudget({ estimatedTokens: 2500 }), /Token budget ceiling breached/);

  // recordUsage refuses overspend upfront
  assert.throws(() => ledger.recordUsage({ taskId: 't2', tokens: 2500, costMicro: 1000 }), /Token budget ceiling breached/);
  // Total tokens must remain uncorrupted at 3000
  assert.equal(ledger.summary.usedTokens, 3000);
});
