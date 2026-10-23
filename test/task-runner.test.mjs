import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runTaskGraph, DurableCheckpointStore } from '../src/task-runner.mjs';

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-dag-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const independentProof = async (_task, refs) => refs.length > 0;
const task = (id, depends_on = [], readOnly = false) => ({
  id,
  title: id,
  state: depends_on.length ? 'PENDING' : 'READY',
  depends_on,
  scope: { readOnly }
});

test('fails closed without an execution adapter', async () => {
  await assert.rejects(runTaskGraph({ tasks: { A: task('A') } }), /Live execution adapter required/);
});

test('executes verified dependencies in order', async () => {
  const order = [];
  const adapter = {
    async executeTask(t) {
      order.push(t.id);
      return { verified: true, evidenceRefs: ['proof:' + t.id] };
    }
  };
  const result = await runTaskGraph({
    tasks: { A: task('A'), B: task('B', ['A']) },
    adapter,
    verifyEvidence: independentProof
  });
  assert.equal(result.complete, true);
  assert.deepEqual(order, ['A', 'B']);
});

test('does not parallelize shared writes', async () => {
  let inFlight = 0, peak = 0;
  const adapter = {
    async executeTask() {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise(resolve => setTimeout(resolve, 3));
      inFlight--;
      return { verified: true, evidenceRefs: ['proof'] };
    }
  };
  await runTaskGraph({ tasks: { A: task('A'), B: task('B') }, adapter, maxParallel: 2 });
  assert.equal(peak, 1);
});

test('parallelizes explicit read-only tasks', async () => {
  let active = 0, peak = 0;
  const adapter = {
    async executeTask() {
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 3));
      active--;
      return { verified: true, evidenceRefs: ['proof'] };
    }
  };
  const result = await runTaskGraph({
    tasks: { A: task('A', [], true), B: task('B', [], true) },
    adapter,
    verifyEvidence: independentProof
  });
  assert.equal(peak, 2);
  assert.equal(result.complete, true);
});

test('does not claim completion without evidence and blocks dependents', async () => {
  const executed = [];
  const result = await runTaskGraph({
    tasks: { A: task('A'), B: task('B', ['A']) },
    adapter: { async executeTask(t) { executed.push(t.id); return { verified: true }; } }
  });
  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'REVIEW_REQUIRED');
  assert.deepEqual(executed, ['A']);
  assert.deepEqual(result.unresolved, ['A', 'B']);
});

test('captures adapter errors without dispatching blocked dependents', async () => {
  const result = await runTaskGraph({
    tasks: { A: task('A'), B: task('B', ['A']) },
    adapter: { async executeTask() { throw new Error('Host runtime unavailable'); } },
    maxRetries: 0
  });
  assert.equal(result.tasks.A.state, 'FAILED');
  assert.equal(result.tasks.B.state, 'PENDING');
  assert.match(result.attempts[0].reason, /unavailable/);
});

test('gates external and destructive tasks on explicit task authorization', async () => {
  let calls = 0;
  const tasks = { A: { ...task('A'), scope: { operationClass: 'external' } } };
  const adapter = { async executeTask() { calls++; return { verified: true, evidenceRefs: ['proof'] }; } };
  const blocked = await runTaskGraph({ tasks, adapter });
  assert.equal(blocked.tasks.A.state, 'BLOCKED');
  assert.equal(calls, 0);
  const approved = await runTaskGraph({ tasks, adapter, approvedTaskIds: ['A'], verifyEvidence: independentProof });
  assert.equal(approved.complete, true);
  assert.equal(calls, 1);
});

test('rejects corrupted task maps before calling host adapter', async () => {
  let calls = 0;
  await assert.rejects(runTaskGraph({
    tasks: { other: task('A') },
    adapter: { async executeTask() { calls++; } }
  }), /Task map key/);
  assert.equal(calls, 0);
});

test('self-certified model output never counts as VERIFIED without independent proof', async () => {
  const adapter = { async executeTask() { return { verified: true, evidenceRefs: ['invented-proof'] }; } };
  const result = await runTaskGraph({ tasks: { A: task('A') }, adapter });
  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'REVIEW_REQUIRED');
  assert.match(result.attempts[0].reason, /Independent verification/);
});

test('verifier rejection or throw keeps task REVIEW_REQUIRED', async () => {
  const adapter = { async executeTask() { return { verified: true, evidenceRefs: ['test-report'] }; } };
  const failure = await runTaskGraph({
    tasks: { A: task('A') },
    adapter,
    verifyEvidence: async () => { throw new Error('No independent proof'); }
  });
  assert.equal(failure.tasks.A.state, 'REVIEW_REQUIRED');
  assert.equal(failure.complete, false);
  await assert.rejects(runTaskGraph({ tasks: { A: task('A') }, adapter, verifyEvidence: true }), /verifier function/);
});

test('empty task graph is not a verified run', async () => {
  const result = await runTaskGraph({ tasks: {}, adapter: { async executeTask() { throw Error('unexpected'); } } });
  assert.equal(result.complete, false);
});

test('DurableCheckpointStore persists checkpoints and formats Smart Resume suggestions', t => {
  const cwd = temp(t);
  const runId = 'run-recovery-123';

  DurableCheckpointStore.save(cwd, runId, {
    tasks: {
      A: { id: 'A', state: 'VERIFIED' },
      B: { id: 'B', state: 'PENDING' }
    }
  });

  const loaded = DurableCheckpointStore.load(cwd, runId);
  assert.ok(loaded);
  assert.equal(loaded.runId, runId);
  assert.equal(loaded.tasks.A.state, 'VERIFIED');

  const suggestion = DurableCheckpointStore.formatResumeSuggestion(loaded);
  assert.equal(suggestion.completedCount, 1);
  assert.equal(suggestion.pendingCount, 1);
  assert.deepEqual(suggestion.completedTaskIds, ['A']);
  assert.deepEqual(suggestion.pendingTaskIds, ['B']);
  assert.ok(suggestion.recommendation.includes('Resume execution at pending tasks: [B]'));
});

test('crash recovery: resuming from checkpoint does not re-execute verified tasks', async t => {
  const cwd = temp(t);
  const runId = 'run-crash-test';
  const executed = [];

  // Step 1: Initial partial run where task A succeeds
  DurableCheckpointStore.save(cwd, runId, {
    tasks: {
      A: { id: 'A', state: 'VERIFIED', evidence_refs: ['proof:A'] },
      B: { id: 'B', state: 'PENDING', depends_on: ['A'] }
    }
  });

  // Step 2: Resume execution
  const adapter = {
    async executeTask(t) {
      executed.push(t.id);
      return { verified: true, evidenceRefs: ['proof:' + t.id] };
    }
  };

  const resumed = await runTaskGraph({
    tasks: { A: task('A'), B: task('B', ['A']) },
    adapter,
    runId,
    cwd,
    resume: true,
    verifyEvidence: independentProof
  });

  assert.equal(resumed.complete, true);
  // Task A was NOT executed again because checkpoint had it as VERIFIED!
  assert.deepEqual(executed, ['B']);
});

test('recovery handles unconsumed worker results without re-dispatching', async t => {
  const cwd = temp(t);
  const runId = 'run-unconsumed-test';
  let executionDispatched = false;

  // Simulate orchestrator crash where task was left in RUNNING but worker finished
  DurableCheckpointStore.save(cwd, runId, {
    tasks: {
      T1: { id: 'T1', state: 'RUNNING' }
    }
  });

  const adapter = {
    async executeTask() {
      executionDispatched = true;
      return { verified: true, evidenceRefs: ['new-proof'] };
    }
  };

  // Inspector finds unconsumed evidence recorded on disk
  const inspectUnconsumedResult = async (t) => {
    if (t.id === 'T1') {
      return { verified: true, evidenceRefs: ['unconsumed-disk-proof'] };
    }
    return null;
  };

  const result = await runTaskGraph({
    tasks: { T1: task('T1') },
    adapter,
    runId,
    cwd,
    resume: true,
    inspectUnconsumedResult,
    verifyEvidence: independentProof
  });

  assert.equal(result.complete, true);
  assert.equal(result.tasks.T1.state, 'VERIFIED');
  // Worker was NOT dispatched again; unconsumed result was reclaimed
  assert.equal(executionDispatched, false);
});

test('anti-loop review cycle breaker terminates oscillating review cycles', async () => {
  const tasks = { A: task('A') };
  const adapter = {
    async executeTask() {
      return { verified: false, evidenceRefs: [] }; // Always review required
    }
  };

  const result = await runTaskGraph({
    tasks,
    adapter,
    autoRetryReview: true,
    maxReviewCycles: 3
  });

  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'BLOCKED');
  assert.ok(result.tasks.A.failure_reason.includes('anti-loop breaker triggered'));
});

test('cancellation signal marks in-flight and pending tasks as CANCELED', async () => {
  const controller = new AbortController();
  controller.abort(); // Cancel before execution

  const tasks = { A: task('A'), B: task('B', ['A']) };
  const adapter = {
    async executeTask() {
      return { verified: true, evidenceRefs: ['proof'] };
    }
  };

  const result = await runTaskGraph({
    tasks,
    adapter,
    cancelSignal: controller.signal
  });

  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'CANCELED');
  assert.equal(result.tasks.B.state, 'CANCELED');
});

test('regression P05: validateRunId rejects path traversal characters in runId', t => {
  const badRunIds = [
    '../escape',
    '..\\escape',
    'dir/sub',
    'dir\\sub',
    '/absolute',
    '.',
    '..',
    'run\0evil',
    '   '
  ];

  for (const bad of badRunIds) {
    assert.throws(
      () => DurableCheckpointStore.validateRunId(bad),
      /Invalid runId|Run ID must be/
    );
  }

  // Valid runId succeeds
  assert.equal(DurableCheckpointStore.validateRunId('valid-run_123.test'), 'valid-run_123.test');
});

test('regression P05: exclusive per-run lock blocks concurrent resume on same runId', async t => {
  const cwd = temp(t);
  const runId = 'exclusive-run-test';

  // Seed checkpoint
  DurableCheckpointStore.save(cwd, runId, { tasks: { A: task('A') } });

  // Acquire lock manually
  const releaseLock = DurableCheckpointStore.acquireRunLock(cwd, runId);

  // Second acquire must throw
  assert.throws(
    () => DurableCheckpointStore.acquireRunLock(cwd, runId),
    /exclusive lease already held/
  );

  // Resume must fail because lock is held
  await assert.rejects(
    runTaskGraph({
      tasks: { A: task('A') },
      adapter: { async executeTask() { return { verified: true, evidenceRefs: ['proof'] }; } },
      runId,
      cwd,
      resume: true
    }),
    /exclusive lease already held/
  );

  // Release lock
  releaseLock();

  // Now resume succeeds
  const result = await runTaskGraph({
    tasks: { A: task('A') },
    adapter: { async executeTask() { return { verified: true, evidenceRefs: ['proof'] }; } },
    runId,
    cwd,
    resume: true,
    verifyEvidence: independentProof
  });
  assert.equal(result.complete, true);
});

test('regression P05: cancellation signal propagates to active worker and triggers cancelTask', async () => {
  const controller = new AbortController();
  let receivedSignal = null;
  let cancelTaskCalled = false;

  const adapter = {
    async executeTask(t, options) {
      receivedSignal = options?.signal;
      // Trigger abort while task is executing
      controller.abort();
      return { verified: true, evidenceRefs: ['proof'] };
    },
    async cancelTask({ taskId }) {
      if (taskId === 'A') cancelTaskCalled = true;
    }
  };

  await runTaskGraph({
    tasks: { A: task('A') },
    adapter,
    cancelSignal: controller.signal
  });

  assert.ok(receivedSignal);
  assert.equal(receivedSignal.aborted, true);
  assert.equal(cancelTaskCalled, true);
});

test('regression P05: non-idempotent or external/destructive tasks are never automatically retried', async () => {
  let executions = 0;
  const adapter = {
    async executeTask() {
      executions++;
      throw new Error('Network timeout during external action');
    }
  };

  const tasks = {
    A: { ...task('A'), scope: { operationClass: 'external', idempotent: false } }
  };

  const result = await runTaskGraph({
    tasks,
    adapter,
    approvedTaskIds: ['A'],
    maxRetries: 3
  });

  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'FAILED');
  assert.ok(result.tasks.A.failure_reason.includes('automatic retry prohibited'));
  // Must execute exactly ONCE (no retries)
  assert.equal(executions, 1);
});

test('regression P05: transient errors on safe tasks undergo bounded exponential backoff', async () => {
  let attempts = 0;
  const adapter = {
    async executeTask() {
      attempts++;
      if (attempts < 3) throw new Error('Transient I/O failure');
      return { verified: true, evidenceRefs: ['proof'] };
    }
  };

  const startTime = Date.now();
  const result = await runTaskGraph({
    tasks: { A: task('A', [], true) },
    adapter,
    maxRetries: 3,
    verifyEvidence: independentProof
  });

  const durationMs = Date.now() - startTime;
  assert.equal(result.complete, true);
  assert.equal(attempts, 3);
  // Backoff attempts: 1st backoff (20ms), 2nd backoff (40ms) -> total >= 50ms
  assert.ok(durationMs >= 40, `Expected backoff delay, got ${durationMs}ms`);
});

test('regression P05: safe crash recovery reclaims stale lock from dead PID without duplicate concurrent execution', async t => {
  const cwd = temp(t);
  const runId = 'crash-recovery-test';

  const runDir = path.join(cwd, '.xyeena', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const lockFile = path.join(runDir, 'run.lock');

  // Find a PID that is guaranteed not alive
  let deadPid = 999999;
  while (DurableCheckpointStore.isProcessAlive(deadPid)) {
    deadPid++;
  }

  // Simulate crashed process by writing lockfile with dead PID
  fs.writeFileSync(lockFile, JSON.stringify({ pid: deadPid, acquiredAt: new Date().toISOString() }) + '\n');

  // Should safely detect dead process, break stale lock, and acquire lease
  const releaseLock = DurableCheckpointStore.acquireRunLock(cwd, runId);
  assert.equal(typeof releaseLock, 'function');

  // Verify the lock now holds current process PID
  const currentLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  assert.equal(currentLock.pid, process.pid);

  // Active PID now blocks another concurrent acquire
  assert.throws(
    () => DurableCheckpointStore.acquireRunLock(cwd, runId),
    /exclusive lease already held by active process/
  );

  releaseLock();
  assert.equal(fs.existsSync(lockFile), false);
});

test('regression P05: active live PID in run.lock strictly blocks concurrent duplicate execution', t => {
  const cwd = temp(t);
  const runId = 'live-pid-lock-test';

  const runDir = path.join(cwd, '.xyeena', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const lockFile = path.join(runDir, 'run.lock');

  // Write lock with current live PID and fresh timestamp
  fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }) + '\n');

  // Must strictly block concurrent execution
  assert.throws(
    () => DurableCheckpointStore.acquireRunLock(cwd, runId),
    new RegExp(`exclusive lease already held by active process \\(PID ${process.pid}`)
  );
});

test('regression P05: active owner exceeding lease threshold is NEVER reclaimed solely due to elapsed time', t => {
  const cwd = temp(t);
  const runId = 'active-exceeding-threshold-test';

  const runDir = path.join(cwd, '.xyeena', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const lockFile = path.join(runDir, 'run.lock');

  // Write lock held by active PID from 1 hour ago
  const oldTime = new Date(Date.now() - 3600000).toISOString();
  fs.writeFileSync(lockFile, JSON.stringify({
    ownerId: `${process.pid}-old-lease`,
    pid: process.pid,
    fenceToken: 1,
    acquiredAt: oldTime
  }) + '\n');

  // With a small staleThresholdMs, an active process must NEVER be reclaimed solely due to elapsed time
  assert.throws(
    () => DurableCheckpointStore.acquireRunLock(cwd, runId, { staleThresholdMs: 1000 }),
    new RegExp(`exclusive lease already held by active process \\(PID ${process.pid}`)
  );

  // Lock file must still be intact and held by original owner
  const current = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  assert.equal(current.ownerId, `${process.pid}-old-lease`);
});

test('regression P05: concurrent contenders compete safely for exclusive run lock with single winner', async t => {
  const cwd = temp(t);
  const runId = 'concurrent-contenders-test';

  let successCount = 0;
  let contentionCount = 0;
  let releaseFn = null;

  const attempts = Array.from({ length: 8 }, async () => {
    try {
      const release = DurableCheckpointStore.acquireRunLock(cwd, runId);
      successCount++;
      releaseFn = release;
    } catch (err) {
      if (err.message.includes('exclusive lease')) {
        contentionCount++;
      } else {
        throw err;
      }
    }
  });

  await Promise.all(attempts);

  // Exactly one contender must have succeeded in acquiring the exclusive lease
  assert.equal(successCount, 1);
  assert.equal(contentionCount, 7);

  if (releaseFn) releaseFn();
});

test('regression P05: crash recovery safely reclaims dead PID with incremented monotonic fenceToken', t => {
  const cwd = temp(t);
  const runId = 'crash-recovery-fence-test';

  const runDir = path.join(cwd, '.xyeena', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const lockFile = path.join(runDir, 'run.lock');

  // Find a verified dead PID
  let deadPid = 999990;
  while (DurableCheckpointStore.isProcessAlive(deadPid)) {
    deadPid++;
  }

  // Write orphaned lock from crashed process with fenceToken 5
  fs.writeFileSync(lockFile, JSON.stringify({
    ownerId: `${deadPid}-crashed`,
    pid: deadPid,
    fenceToken: 5,
    acquiredAt: new Date(Date.now() - 60000).toISOString()
  }) + '\n');

  // Contender reclaims crashed lock
  const release = DurableCheckpointStore.acquireRunLock(cwd, runId);
  assert.equal(typeof release, 'function');

  // Lock must have incremented fenceToken to 6 and new active PID
  const current = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  assert.equal(current.pid, process.pid);
  assert.equal(current.fenceToken, 6);

  release();
  assert.equal(fs.existsSync(lockFile), false);
});

test('regression P05: lock release enforces strict owner identity and does not delete stolen or reclaimed lock', t => {
  const cwd = temp(t);
  const runId = 'owner-identity-release-test';

  const runDir = path.join(cwd, '.xyeena', 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const lockFile = path.join(runDir, 'run.lock');

  // Process acquires lock
  const releaseOwnerA = DurableCheckpointStore.acquireRunLock(cwd, runId);

  // Simulate external reclamation or foreign owner write with different ownerId
  const foreignOwnerData = {
    ownerId: 'different-foreign-owner-uuid',
    pid: process.pid,
    fenceToken: 2,
    acquiredAt: new Date().toISOString()
  };
  fs.writeFileSync(lockFile, JSON.stringify(foreignOwnerData) + '\n');

  // Owner A calling release must NOT delete Owner B's lock
  releaseOwnerA();

  assert.equal(fs.existsSync(lockFile), true);
  const surviving = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  assert.equal(surviving.ownerId, 'different-foreign-owner-uuid');
});

