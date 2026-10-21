import test from 'node:test';
import assert from 'node:assert/strict';
import { runTaskGraph } from '../src/task-runner.mjs';

const task = (id, depends_on = [], readOnly = false) => ({ id, title: id, state: depends_on.length ? 'PENDING' : 'READY', depends_on, scope: { readOnly } });

test('fails closed without an execution adapter', async () => {
  await assert.rejects(runTaskGraph({ tasks: { A: task('A') } }), /Live execution adapter required/);
});
test('executes verified dependencies in order', async () => {
  const order = [];
  const adapter = { async executeTask(t) { order.push(t.id); return { verified: true, evidenceRefs: ['proof:' + t.id] }; } };
  const result = await runTaskGraph({ tasks: { A: task('A'), B: task('B', ['A']) }, adapter });
  assert.equal(result.complete, true);
  assert.deepEqual(order, ['A', 'B']);
});
test('does not parallelize shared writes', async () => {
  let inFlight = 0, peak = 0;
  const adapter = { async executeTask() { inFlight++; peak = Math.max(peak, inFlight); await new Promise(resolve => setTimeout(resolve, 3)); inFlight--; return { verified:true,evidenceRefs:['proof'] }; } };
  await runTaskGraph({ tasks: { A: task('A'), B: task('B') }, adapter, maxParallel: 2 });
  assert.equal(peak, 1);
});
test('parallelizes explicit read-only tasks', async () => {
  let active = 0, peak = 0;
  const adapter = { async executeTask() { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 3)); active--; return { verified:true,evidenceRefs:['proof'] }; } };
  const result = await runTaskGraph({ tasks: { A: task('A', [], true), B: task('B', [], true) }, adapter });
  assert.equal(peak, 2);
  assert.equal(result.complete, true);
});
test('does not claim completion without evidence and blocks dependents', async () => {
  const executed = [];
  const result = await runTaskGraph({ tasks: { A: task('A'), B: task('B', ['A']) },
    adapter: { async executeTask(t) { executed.push(t.id); return { verified: true }; } } });
  assert.equal(result.complete, false);
  assert.equal(result.tasks.A.state, 'REVIEW_REQUIRED');
  assert.deepEqual(executed, ['A']);
  assert.deepEqual(result.unresolved, ['A', 'B']);
});
test('captures adapter errors without dispatching blocked dependents', async () => {
  const result = await runTaskGraph({ tasks: { A: task('A'), B: task('B', ['A']) },
    adapter: { async executeTask() { throw new Error('Host runtime unavailable'); } } });
  assert.equal(result.tasks.A.state, 'FAILED');
  assert.equal(result.tasks.B.state, 'PENDING');
  assert.match(result.attempts[0].reason, /unavailable/);
});
test('gates external and destructive tasks on explicit task authorization', async () => {
  let calls = 0;
  const tasks = { A: { ...task('A'), scope: { operationClass: 'external' } } };
  const adapter = { async executeTask() { calls++; return { verified: true, evidenceRefs:['proof'] }; } };
  const blocked = await runTaskGraph({ tasks, adapter });
  assert.equal(blocked.tasks.A.state, 'BLOCKED');
  assert.equal(calls, 0);
  const approved = await runTaskGraph({ tasks, adapter, approvedTaskIds: ['A'] });
  assert.equal(approved.complete, true);
  assert.equal(calls, 1);
});
test('rejects corrupted task maps before calling host adapter', async () => {
  let calls = 0;
  await assert.rejects(runTaskGraph({ tasks: { other: task('A') }, adapter: { async executeTask() { calls++; } } }), /Task map key/);
  assert.equal(calls, 0);
});
