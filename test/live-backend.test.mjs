import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchScopedTask,
  createSimpulMcpAdapter,
  createNativeSubagentAdapter,
  ResourceBudgetLedger,
  acquireWorkspaceWriteLock
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
    return {
      healthy,
      executionReady: cap.executionReady ?? (healthy === true),
      noNestedDelegation: true,
      supportsParallel: true,
      ...cap
    };
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
      if (name === 'submit_goal') assert.deepEqual(Object.keys(params).sort(), ['goal','workspace_path']);
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
        return { run_id: params.run_id, status: 'COMPLETED', task_count: 1 };
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
  assert.equal(probe.supportsWrites, false);
  assert.equal(probe.supportsParallel, false);
  assert.equal(probe.executionReady, false); // Accurately reflects upstream candidate status

  const exec = await adapter.executeTask({ id: 'task-42', title: 'Compile harness', scope: { readOnly: true } }, { noNestedDelegation: true });
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

test('regression: healthy transport with unavailable executor (executionReady: false) falls back to native or inline', async () => {
  const log = [];
  // Simpul is transport-healthy but NOT execution-ready
  const simpulBackend = fake(true, log, { executionReady: false });
  // Native is execution-ready
  const nativeBackend = fake(true, log, { executionReady: true });
  const inline = { async executeTask() { log.push('inline'); return { report: 'fallback' }; } };

  const result1 = await dispatchScopedTask({
    task: task(),
    inlineAdapter: inline,
    backends: { simpul: simpulBackend, native: nativeBackend }
  });
  assert.equal(result1.backend, 'native');

  // When native is also unavailable or not execution-ready, falls back to inline
  const result2 = await dispatchScopedTask({
    task: task(),
    inlineAdapter: inline,
    backends: { simpul: simpulBackend }
  });
  assert.equal(result2.backend, 'inline');
});

test('createNativeSubagentAdapter supports spawn-only host runners without requiring run()', async () => {
  let cancelled = false;
  const mockSpawnOnlyRunner = {
    async status() {
      return { available: true, capabilities: { supportsWrites: true, supportsParallel: true } };
    },
    async spawn(task, options) {
      assert.equal(options.noNestedDelegation, true);
      return {
        workerId: 'worker-host-proc-42',
        async wait() {
          return { verified: true, evidenceRefs: ['spawn-output.log'] };
        },
        async cancel() {
          cancelled = true;
        }
      };
    }
  };

  const adapter = createNativeSubagentAdapter({ runner: mockSpawnOnlyRunner });
  const probe = await adapter.probe();
  assert.equal(probe.healthy, true);
  assert.equal(probe.executionReady, true);

  const exec = await adapter.executeTask({ id: 't-spawn', title: 'Spawn test' }, { noNestedDelegation: true });
  assert.equal(exec.workerId, 'worker-host-proc-42');
  assert.equal(exec.verified, true);
  assert.deepEqual(exec.evidenceRefs, ['spawn-output.log']);

  await adapter.cancelTask({ taskId: 't-spawn' });
  assert.equal(cancelled, true);
});

test('positive worker contract validation rejects invalid formats and placeholder identities', async () => {
  const testCases = [
    '',
    '   ',
    'a',
    'inv@lid!ch@rs',
    'fake',
    'fake-worker-1',
    'dummy-runner',
    'mock-worker-handle',
    'synthetic-agent-0',
    'fabricated-123'
  ];

  for (const badId of testCases) {
    const badRunner = {
      async status() { return { available: true }; },
      async run() { return { workerId: badId }; }
    };
    const adapter = createNativeSubagentAdapter({ runner: badRunner });
    await assert.rejects(
      adapter.executeTask({ id: 't-id', title: 'Test ID' }, { noNestedDelegation: true }),
      /invalid|placeholder|format/i
    );
  }

  // Valid positive format succeeds
  const validRunner = {
    async status() { return { available: true }; },
    async run() { return { workerId: 'worker-srv-01-node', verified: true, evidenceRefs: ['ok.log'] }; }
  };
  const validAdapter = createNativeSubagentAdapter({ runner: validRunner });
  const okExec = await validAdapter.executeTask({ id: 't-ok', title: 'Test OK' }, { noNestedDelegation: true });
  assert.equal(okExec.workerId, 'worker-srv-01-node');
  assert.equal(okExec.verified, true);
});

test('Simpul MCP adapter bounded polling never interprets SUBMITTED or PENDING as completed', async () => {
  const mockMcpClient = {
    async callTool(tool, args) {
      if (tool === 'submit_goal') {
        return { run_id: 'simpul-run-xyz', status: 'SUBMITTED', initial_task_id: 't-init' };
      }
      if (tool === 'get_run') {
        return { run_id: 'simpul-run-xyz', status: 'PENDING' };
      }
      if (tool === 'get_task_evidence') {
        // Even if mock returns evidence, pending run cannot be verified
        return { verified: true, evidence_ids: ['some-ev'] };
      }
      if (tool === 'get_model_usage') {
        return { tokens: 100, costMicro: 50 };
      }
      return {};
    }
  };

  const adapter = createSimpulMcpAdapter({ mcpClient: mockMcpClient });
  const execResult = await adapter.executeTask({ id: 't-simpul-pending', title: 'Pending task', scope: { readOnly: true } }, {
    noNestedDelegation: true,
    maxPollAttempts: 2
  });

  assert.equal(execResult.workerId, 'simpul-run-xyz');
  assert.equal(execResult.status, 'PENDING');
  assert.equal(execResult.completed, false);
  assert.equal(execResult.verified, false);
  assert.deepEqual(execResult.evidenceRefs, []);
});

test('regression P04: Simpul adapter refuses write-capable delegation when protocol cannot enforce scope/permissions', async () => {
  const writeTask = { id: 't-write', title: 'Write code', scope: { readOnly: false, operationClass: 'safe' } };
  const adapter = createSimpulMcpAdapter({
    mcpClient: { async callTool() { return {}; } }
  });

  // Must refuse write delegation if write scope enforcement is unsupported
  await assert.rejects(
    adapter.executeTask(writeTask, { noNestedDelegation: true }),
    /Refusing write-capable delegation to Simpul/
  );

  // A caller-supplied enforceWriteScope flag is not an authenticated host
  // boundary; the upstream submit_goal schema cannot carry it.
  let callCount = 0;
  const mockClient = { async callTool() { callCount++; return {}; } };
  const scopedAdapter = createSimpulMcpAdapter({ mcpClient: mockClient });
  await assert.rejects(
    scopedAdapter.executeTask(writeTask, { noNestedDelegation: true, enforceWriteScope: true }),
    /only explicit read-only submission/
  );
  assert.equal(callCount, 0);
  await assert.rejects(
    scopedAdapter.executeTask({ id: 'r', title: 'Review', scope: {readOnly:true} },
      { noNestedDelegation: true, permissions: { allow: true } }),
    /cannot enforce caller-supplied permissions/
  );
  assert.equal(callCount, 0);
});

test('regression P04: Simpul adapter fails when budget ceiling breached (never swallowed)', async () => {
  const ledger = new ResourceBudgetLedger({ tokenLimit: 1000 });
  const mockClient = {
    async callTool(tool) {
      if (tool === 'submit_goal') return { run_id: 'r2', status: 'COMPLETED', initial_task_id: 'i2' };
      if (tool === 'get_run') return { status: 'COMPLETED' };
      if (tool === 'get_model_usage') return { tokens: 5000, costMicro: 10000 };
      return {};
    }
  };
  const adapter = createSimpulMcpAdapter({ mcpClient: mockClient, ledger });
  await assert.rejects(
    adapter.executeTask({ id: 't-budget', title: 'Task', scope: { readOnly: true } }, { noNestedDelegation: true }),
    /budget ceiling breached/
  );
});

test('regression P04: concurrent write dispatches in shared workspace are serialized using write lock', async () => {
  const log = [];
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const makeAdapter = id => ({
    async executeTask() {
      log.push(`start:${id}`);
      await delay(50);
      log.push(`end:${id}`);
      return { workerId: `w-${id}` };
    }
  });

  const p1 = dispatchScopedTask({
    task: { id: 'W1', title: 'write 1', scope: { readOnly: false, operationClass: 'safe' } },
    inlineAdapter: makeAdapter('1'),
    approvedTaskIds: ['W1'],
    authorizeOperation: async () => 'allow-once'
  });
  const p2 = dispatchScopedTask({
    task: { id: 'W2', title: 'write 2', scope: { readOnly: false, operationClass: 'safe' } },
    inlineAdapter: makeAdapter('2'),
    approvedTaskIds: ['W2'],
    authorizeOperation: async () => 'allow-once'
  });

  await Promise.all([p1, p2]);
  assert.deepEqual(log, ['start:1', 'end:1', 'start:2', 'end:2']);
});

test('regression P04: public backend APIs are exported and importable from index.mjs', async () => {
  const indexExports = await import('../src/index.mjs');
  assert.equal(typeof indexExports.dispatchScopedTask, 'function');
  assert.equal(typeof indexExports.createSimpulMcpAdapter, 'function');
  assert.equal(typeof indexExports.createNativeSubagentAdapter, 'function');
  assert.equal(typeof indexExports.ResourceBudgetLedger, 'function');
  assert.equal(typeof indexExports.healthyAdapter, 'function');
  assert.equal(typeof indexExports.selectSubagentBackend, 'function');
});

test('regression P04: write-lock is released on Harness denial, execution failure, or timeout allowing subsequent writes', async () => {
  // Scenario 1: Rejection by Harness gate releases lock so second dispatch succeeds
  const blockingGate = {
    preToolGate() {
      return { blocked: true, decision: 'DENY', reason: 'Blocked by policy' };
    }
  };

  const failingDispatch = dispatchScopedTask({
    task: { id: 'blocked-w1', title: 'blocked write', scope: { readOnly: false, operationClass: 'destructive' } },
    inlineAdapter: { async executeTask() { return { workerId: 'w-fail' }; } },
    harnessGate: blockingGate,
    approvedTaskIds: ['blocked-w1'],
    authorizeOperation: async () => 'allow-once'
  });

  await assert.rejects(failingDispatch, /Task execution blocked by Harness gate/);

  // Subsequent write dispatch on same workspace must not deadlock and must acquire lock cleanly
  let secondRan = false;
  const subsequentDispatch = await dispatchScopedTask({
    task: { id: 'allowed-w2', title: 'allowed write', scope: { readOnly: false, operationClass: 'safe' } },
    inlineAdapter: {
      async executeTask() {
        secondRan = true;
        return { workerId: 'w-success' };
      }
    },
    approvedTaskIds: ['allowed-w2'],
    authorizeOperation: async () => 'allow-once'
  });

  assert.equal(secondRan, true);
  assert.equal(subsequentDispatch.taskId, 'allowed-w2');

  // Scenario 2: Adapter throwing error releases lock so third dispatch succeeds
  const throwingDispatch = dispatchScopedTask({
    task: { id: 'throwing-w3', title: 'throwing write', scope: { readOnly: false, operationClass: 'safe' } },
    inlineAdapter: { async executeTask() { throw new Error('Simulated adapter crash'); } },
    approvedTaskIds: ['throwing-w3'],
    authorizeOperation: async () => 'allow-once'
  });

  await assert.rejects(throwingDispatch, /Simulated adapter crash/);

  let thirdRan = false;
  const thirdDispatch = await dispatchScopedTask({
    task: { id: 'allowed-w4', title: 'allowed write after crash', scope: { readOnly: false, operationClass: 'safe' } },
    inlineAdapter: {
      async executeTask() {
        thirdRan = true;
        return { workerId: 'w-success-3' };
      }
    },
    approvedTaskIds: ['allowed-w4'],
    authorizeOperation: async () => 'allow-once'
  });

  assert.equal(thirdRan, true);
  assert.equal(thirdDispatch.taskId, 'allowed-w4');
});



test('Simpul MCP SDK content wrappers are parsed with exact submission arguments, without model execution',async()=>{
  const calls=[];
  const wrapped=data=>({content:[{type:'text',text:JSON.stringify(data)}]});
  const client={async callTool(name,params){
    calls.push({name,params});
    switch(name){
      case 'get_model_usage': return wrapped({tokens:0,costMicro:0});
      case 'submit_goal':
        assert.deepEqual(Object.keys(params).sort(),['goal','workspace_path']);
        return wrapped({status:'SUBMITTED',run_id:'run_abcd1234abcd',initial_task_id:'task_ab123456'});
      case 'get_run': return wrapped({status:'PENDING',run_id:params.run_id});
      default: throw Error('Unexpected MCP call '+name);
    }
  }};
  const adapter=createSimpulMcpAdapter({mcpClient:client});
  assert.equal((await adapter.probe()).executionReady,false);
  const out=await adapter.executeTask({id:'T1',title:'Read-only status',scope:{readOnly:true}},{
    noNestedDelegation:true,maxPollAttempts:1,cwd:'/tmp/workspace'
  });
  assert.equal(out.status,'PENDING');
  assert.equal(out.completed,false);
  assert.equal(out.verified,false);
  assert.deepEqual(out.evidenceRefs,[]);
  assert.ok(!calls.some(x=>x.name==='execute_run'||x.name==='execute_task'));
});
test('Simpul MCP malformed/failed responses do not imply transport health or execution readiness',async()=>{
  for(const bad of [{isError:true,content:[{type:'text',text:'error'}]},
    {content:[{type:'text',text:'not-json'}]},
    {content:[{type:'text',text:' '.repeat(65537)}]}]){
    const adapter=createSimpulMcpAdapter({mcpClient:{async callTool(){return bad;}}});
    const p=await adapter.probe();
    assert.equal(p.healthy,false);
    assert.equal(p.executionReady,undefined);
    await assert.rejects(adapter.executeTask({id:'T1',title:'Review',scope:{readOnly:true}},{
      noNestedDelegation:true,maxPollAttempts:1
    }));
  }
});
test('Simpul ignores caller claims of permission enforcement and rejects ambiguous task scope',async()=>{
  let invoked=false;
  const adapter=createSimpulMcpAdapter({mcpClient:{async callTool(){invoked=true;return {};}}});
  for(const scope of [undefined,{}, {readOnly:false},{readOnly:'true'}]){
    await assert.rejects(adapter.executeTask({id:'T1',title:'Audit',scope},{
      noNestedDelegation:true,enforceWriteScope:true,supportsPermissionEnforcement:true
    }),/only explicit read-only submission/);
  }
  assert.equal(invoked,false);
});

test('host-provided invalid worker IDs are rejected without echoing hostile content into errors',async()=>{
  const secret='sk-sensitive-worker-token-and-private-path';
  const samples=[secret+'!', 'fake-'+secret, 'C:\\Users\\Private\\token-123',
    'x'.repeat(512), 'fake-worker-id'];
  for(const id of samples){
    const adapter=createNativeSubagentAdapter({runner:{
      async status(){return {available:true}},
      async run(){return {workerId:id}}
    }});
    await assert.rejects(adapter.executeTask({id:'redaction',title:'Read-only review'},{
      noNestedDelegation:true
    }),err=>{
      assert.match(err.message,/invalid or fabricated worker identity/i);
      assert.ok(!err.message.includes(secret));
      assert.ok(!err.message.includes('C:\\Users\\Private'));
      assert.ok(!err.message.includes('fake-worker-id'));
      return true;
    });
  }
});

test('workspace write-lock queue serializes waiting callers and survives duplicate release',async()=>{
  const key='write-lock-queue-order-'+Date.now();
  const one=await acquireWorkspaceWriteLock(key);
  let secondEntered=false,thirdEntered=false;
  const second=acquireWorkspaceWriteLock(key).then(release=>{
    secondEntered=true;
    return release;
  });
  const third=acquireWorkspaceWriteLock(key).then(release=>{
    thirdEntered=true;
    return release;
  });
  await Promise.resolve();
  assert.equal(secondEntered,false);
  assert.equal(thirdEntered,false);
  one();
  one(); // idempotent release must not leapfrog queue
  const releaseSecond=await second;
  assert.equal(secondEntered,true);
  assert.equal(thirdEntered,false);
  releaseSecond();
  const releaseThird=await third;
  assert.equal(thirdEntered,true);
  releaseThird();
  const releaseFresh=await acquireWorkspaceWriteLock(key);
  releaseFresh();
});
test('workspace lock isolation permits unrelated workspaces to acquire immediately',async()=>{
  const a=await acquireWorkspaceWriteLock('write-lock-test-a');
  const b=await acquireWorkspaceWriteLock('write-lock-test-b');
  b();
  a();
  const again=await acquireWorkspaceWriteLock('write-lock-test-a');
  again();
});
