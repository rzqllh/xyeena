import { id, nowIso } from './util.mjs';

export const TASK_STATES = Object.freeze([
  'PENDING', 'READY', 'RUNNING', 'BLOCKED', 'REVIEW_REQUIRED',
  'CHANGES_REQUIRED', 'VERIFIED', 'FAILED', 'CANCELED', 'SUPERSEDED',
]);

const TERMINAL = new Set(['VERIFIED', 'FAILED', 'CANCELED', 'SUPERSEDED']);

export function createTask({ title, kind = 'work', dependsOn = [], parentTaskId = null, scope = {}, acceptance = [] } = {}) {
  if (!title) throw new Error('task title is required');
  return Object.freeze({
    id: id('task'),
    title,
    kind,
    state: dependsOn.length ? 'PENDING' : 'READY',
    depends_on: [...new Set(dependsOn)],
    parent_task_id: parentTaskId,
    scope,
    acceptance,
    created_at: nowIso(),
  });
}

export function validateTaskGraph(tasks) {
  const byId = new Map(Object.values(tasks).map((t) => [t.id, t]));
  for (const task of byId.values()) {
    for (const dep of task.depends_on || []) {
      if (!byId.has(dep)) throw new Error(`${task.id}: unknown dependency ${dep}`);
    }
  }
  const visiting = new Set();
  const done = new Set();
  function visit(taskId, stack = []) {
    if (done.has(taskId)) return;
    if (visiting.has(taskId)) throw new Error(`task graph cycle: ${[...stack, taskId].join(' -> ')}`);
    visiting.add(taskId);
    const task = byId.get(taskId);
    for (const dep of task.depends_on || []) visit(dep, [...stack, taskId]);
    visiting.delete(taskId);
    done.add(taskId);
  }
  for (const id of byId.keys()) visit(id);
  return true;
}

export function readyTasks(tasks) {
  validateTaskGraph(tasks);
  const byId = new Map(Object.values(tasks).map((t) => [t.id, t]));
  return [...byId.values()].filter((task) => {
    if (!['PENDING', 'READY'].includes(task.state)) return false;
    return (task.depends_on || []).every((dep) => byId.get(dep)?.state === 'VERIFIED');
  });
}

export function taskTransition(task, to) {
  if (!TASK_STATES.includes(to)) throw new Error(`unknown task state ${to}`);
  if (TERMINAL.has(task.state)) throw new Error(`task ${task.id} is terminal (${task.state})`);
  return Object.freeze({ ...task, state: to, updated_at: nowIso() });
}

export function supersedeTask(task, replacement) {
  if (!replacement?.id) throw new Error('replacement task is required');
  return {
    old: Object.freeze({ ...task, state: 'SUPERSEDED', superseded_by: replacement.id, updated_at: nowIso() }),
    replacement,
  };
}
