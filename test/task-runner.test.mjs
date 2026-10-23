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
