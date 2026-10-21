import { readyTasks, validateTaskGraph } from './task-graph.mjs';

/** Run verified tasks through a caller-provided, real host adapter; no simulated workers. */
export async function runTaskGraph({ tasks, adapter, maxParallel = 2, approvedTaskIds = [], onTransition = null,
  verifyEvidence = null } = {}) {
  if (!adapter || typeof adapter.executeTask !== 'function')
    throw new Error('Live execution adapter required; no task was executed');
  if (!Number.isInteger(maxParallel) || maxParallel < 1 || maxParallel > 16)
    throw new Error('maxParallel must be between 1 and 16');
  if (!tasks || typeof tasks !== 'object' || Array.isArray(tasks)) throw new Error('tasks must be a task map');
  if (!Array.isArray(approvedTaskIds)) throw new Error('approvedTaskIds must be an array');
  if (verifyEvidence !== null && typeof verifyEvidence !== 'function')
    throw new Error('verifyEvidence must be an independent verifier function');
  for (const [key, task] of Object.entries(tasks)) if (task?.id !== key) throw new Error('Task map key does not match task id: ' + key);
  validateTaskGraph(tasks);
  const approved = new Set(approvedTaskIds);
  const states = Object.fromEntries(Object.entries(tasks).map(([key, task]) => [key, { ...task }]));
  const attempts = [];
  const update = (task, state, extra = {}) => {
    states[task.id] = { ...states[task.id], state, ...extra };
    onTransition?.(states[task.id]);
  };
  while (true) {
    const ready = readyTasks(states);
    if (!ready.length) break;
    for (const task of ready) {
      if (['external', 'destructive'].includes(task.scope?.operationClass) && !approved.has(task.id)) {
        update(task, 'BLOCKED', { failure_reason: 'Explicit task-scoped authorization required' });
      }
    }
    const authorizedReady = ready.filter(task => states[task.id].state !== 'BLOCKED');
    if (!authorizedReady.length) continue;
    // Shared-write work is never parallelized without host-proven isolated worktrees.
    const batch = authorizedReady[0].scope?.readOnly === true
      ? authorizedReady.filter(task => task.scope?.readOnly === true).slice(0, maxParallel)
      : [authorizedReady[0]];
    for (const task of batch) update(task, 'RUNNING');
    const settled = await Promise.all(batch.map(async task => {
      try {
        const result = await adapter.executeTask(structuredClone(task));
        const evidence = Array.isArray(result?.evidenceRefs) ? result.evidenceRefs
          .filter(ref => typeof ref === 'string' && ref.trim() && ref.length <= 1024) : [];
        // Model/host assertions alone are not independent verification.
        let verified = false;
        if (result?.verified === true && evidence.length > 0 && verifyEvidence) {
          try { verified = await verifyEvidence(structuredClone(task), [...evidence], result) === true; }
          catch { verified = false; }
        }
        return { taskId: task.id, status: verified ? 'VERIFIED' : 'REVIEW_REQUIRED',
          evidenceRefs: evidence, reason: verified ? null : 'Independent verification is missing or failed' };
      } catch (error) {
        return { taskId: task.id, status: 'FAILED', evidenceRefs: [], reason: String(error?.message || error) };
      }
    }));
    for (const result of settled) {
      attempts.push(result);
      update(states[result.taskId], result.status, { evidence_refs: result.evidenceRefs, failure_reason: result.reason });
    }
  }
  const unresolved = Object.values(states).filter(task => !['VERIFIED','FAILED','CANCELED','SUPERSEDED'].includes(task.state));
  return { complete: Object.keys(states).length > 0 && Object.values(states).every(task => task.state === 'VERIFIED'),
    tasks: states, attempts, unresolved: unresolved.map(task => task.id) };
}
