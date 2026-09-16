import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask, readyTasks, taskTransition, validateTaskGraph } from '../src/task-graph.mjs';

test('task graph exposes only tasks whose dependencies are verified', () => {
  const a = createTask({ title: 'research' });
  const b = createTask({ title: 'implement', dependsOn: [a.id] });
  const tasks = { [a.id]: a, [b.id]: b };
  assert.deepEqual(readyTasks(tasks).map((x) => x.id), [a.id]);
  tasks[a.id] = taskTransition(a, 'VERIFIED');
  assert.deepEqual(readyTasks(tasks).map((x) => x.id), [b.id]);
});

test('task graph rejects dependency cycles', () => {
  const tasks = {
    a: { id: 'a', state: 'PENDING', depends_on: ['b'] },
    b: { id: 'b', state: 'PENDING', depends_on: ['a'] },
  };
  assert.throws(() => validateTaskGraph(tasks), /cycle/);
});
