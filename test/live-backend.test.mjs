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

test('createSimpulMcpAdapter probes health, executes tasks and collects evidence', async () => {
  const calls = [];
  const mockMcpClient = {
    async callTool(name, params) {
      calls.push({ name, params });
      if (name === 'get_model_usage') return { tokens: 1500, costMicro: 3000 };
      if (name === 'submit_goal') return { status: 'submitted' };
      if (name === 'get_task_evidence') return { evidenceRefs: ['sha256:abc123evidence'] };
      if (name === 'cancel_run') return { status: 'cancelled' };
      return {};
    }
  };

  const adapter = createSimpulMcpAdapter({ mcpClient: mockMcpClient });
  const probe = await adapter.probe();
  assert.equal(probe.healthy, true);
  assert.equal(probe.noNestedDelegation, true);
  assert.equal(probe.supportsWrites, true);

  const exec = await adapter.executeTask({ id: 'task-42', title: 'Compile harness' }, { noNestedDelegation: true });
  assert.ok(exec.workerId.startsWith('simpul-task-42-'));
  assert.equal(exec.verified, true);
  assert.deepEqual(exec.evidenceRefs, ['sha256:abc123evidence']);

  await adapter.cancelTask({ taskId: 'task-42', reason: 'user-cancel' });
  assert.ok(calls.some(c => c.name === 'submit_goal'));
  assert.ok(calls.some(c => c.name === 'get_task_evidence'));
});

test('createNativeSubagentAdapter executes via runner with worker identification and cleanup', async () => {
  let cancelledWorker = null;
  const mockRunner = {
    async status() { return { available: true }; },
    async run(task, options) {
      assert.equal(options.noNestedDelegation, true);
      assert.ok(options.workerId.startsWith('native-task-native-1-'));
      return { verified: true, evidenceRefs: ['native-execution-output.log'] };
    },
    async cancel({ workerId }) {
      cancelledWorker = workerId;
    }
  };

  const adapter = createNativeSubagentAdapter({ runner: mockRunner });
  const probe = await adapter.probe();
  assert.equal(probe.healthy, true);

  const exec = await adapter.executeTask({ id: 'task-native-1', title: 'Local audit' }, { noNestedDelegation: true });
  assert.equal(exec.verified, true);
  assert.deepEqual(exec.evidenceRefs, ['native-execution-output.log']);
});

test('ResourceBudgetLedger enforces token ceilings and concurrency limits', () => {
  const ledger = new ResourceBudgetLedger({ tokenLimit: 5000, costLimitMicro: 10000, maxConcurrency: 2 });

  ledger.acquireWorker('worker-1');
  ledger.acquireWorker('worker-2');
  assert.throws(() => ledger.acquireWorker('worker-3'), /Concurrency ceiling/);

  ledger.releaseWorker('worker-1');
  assert.equal(ledger.summary.activeWorkers, 1);

  ledger.recordUsage({ taskId: 't1', tokens: 3000, costMicro: 4000 });
  assert.equal(ledger.summary.usedTokens, 3000);

  // Exceed token limit
  assert.throws(() => ledger.recordUsage({ taskId: 't2', tokens: 2500, costMicro: 1000 }), /Token budget ceiling breached/);
});
