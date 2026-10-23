import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readyTasks, validateTaskGraph } from './task-graph.mjs';

/**
 * Durable Checkpoint Store for Crash-Safe DAG Recovery and Smart Resume
 */
export class DurableCheckpointStore {
  static checkpointPath(cwd, runId) {
    const root = fs.realpathSync(path.resolve(cwd));
    return path.join(root, '.xyeena', 'runs', runId, 'dag-checkpoint.json');
  }

  static save(cwd, runId, payload) {
    if (!runId || typeof runId !== 'string') return;
    const file = this.checkpointPath(cwd, runId);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.' + crypto.randomUUID() + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify({
        schema: 1,
        runId,
        savedAt: new Date().toISOString(),
        ...payload
      }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      fs.renameSync(tmp, file);
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
    }
  }

  static load(cwd, runId) {
    if (!runId || typeof runId !== 'string') return null;
    try {
      const file = this.checkpointPath(cwd, runId);
      if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink()) return null;
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }

  static formatResumeSuggestion(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') return null;
    const tasks = checkpoint.tasks || {};
    const completed = Object.values(tasks).filter(t => t.state === 'VERIFIED').map(t => t.id);
    const pending = Object.values(tasks).filter(t => !['VERIFIED', 'SUPERSEDED'].includes(t.state)).map(t => t.id);
    return {
      runId: checkpoint.runId,
      savedAt: checkpoint.savedAt,
      completedCount: completed.length,
      pendingCount: pending.length,
      completedTaskIds: completed,
      pendingTaskIds: pending,
      recommendation: pending.length === 0
        ? 'All tasks previously verified. Run is complete.'
        : `Resume execution at pending tasks: [${pending.join(', ')}]. ${completed.length} tasks will be reused without re-execution.`
    };
  }
}

/** Run verified tasks through a caller-provided, real host adapter; no simulated workers. */
export async function runTaskGraph({
  tasks,
  adapter,
  maxParallel = 2,
  approvedTaskIds = [],
  onTransition = null,
  verifyEvidence = null,
  runId = null,
  cwd = process.cwd(),
  resume = false,
  maxRetries = 2,
  maxReviewCycles = 3,
  autoRetryReview = false,
  inspectUnconsumedResult = null,
  cancelSignal = null
} = {}) {
  if (!adapter || typeof adapter.executeTask !== 'function') {
    throw new Error('Live execution adapter required; no task was executed');
  }
  if (!Number.isInteger(maxParallel) || maxParallel < 1 || maxParallel > 16) {
    throw new Error('maxParallel must be between 1 and 16');
  }
  if (!tasks || typeof tasks !== 'object' || Array.isArray(tasks)) {
    throw new Error('tasks must be a task map');
  }
  if (!Array.isArray(approvedTaskIds)) {
    throw new Error('approvedTaskIds must be an array');
  }
  if (verifyEvidence !== null && typeof verifyEvidence !== 'function') {
    throw new Error('verifyEvidence must be an independent verifier function');
  }
  for (const [key, task] of Object.entries(tasks)) {
    if (task?.id !== key) throw new Error('Task map key does not match task id: ' + key);
  }
  validateTaskGraph(tasks);

  const approved = new Set(approvedTaskIds);
  let states = Object.fromEntries(Object.entries(tasks).map(([key, task]) => [key, { ...task }]));
  const attempts = [];
  const retryCount = new Map(); // taskId -> count
  const reviewCycles = new Map(); // taskId -> count

  // Resume from durable checkpoint if requested
  if (resume && runId) {
    const checkpoint = DurableCheckpointStore.load(cwd, runId);
    if (checkpoint && checkpoint.tasks) {
      for (const [taskId, savedTask] of Object.entries(checkpoint.tasks)) {
        if (states[taskId]) {
          // If task was already VERIFIED, preserve it
          if (savedTask.state === 'VERIFIED') {
            states[taskId] = { ...states[taskId], ...savedTask };
          } else if (savedTask.state === 'RUNNING' && inspectUnconsumedResult) {
            // Failure mode: worker finished but orchestrator did not consume its result before interruption
            try {
              const unconsumed = await inspectUnconsumedResult(savedTask);
              if (unconsumed && unconsumed.evidenceRefs?.length > 0 && verifyEvidence) {
                const verified = await verifyEvidence(structuredClone(savedTask), [...unconsumed.evidenceRefs], unconsumed) === true;
                if (verified) {
                  states[taskId] = {
                    ...states[taskId],
                    state: 'VERIFIED',
                    evidence_refs: unconsumed.evidenceRefs
                  };
                }
              }
            } catch {
              // Re-run safely
            }
          }
        }
      }
    }
  }

  const persistCheckpoint = () => {
    if (runId) {
      DurableCheckpointStore.save(cwd, runId, {
        tasks: states,
        attemptsCount: attempts.length
      });
    }
  };

  const update = (task, state, extra = {}) => {
    states[task.id] = { ...states[task.id], state, ...extra };
    onTransition?.(states[task.id]);
    persistCheckpoint();
  };

  // Initial checkpoint
  persistCheckpoint();

  while (true) {
    if (cancelSignal?.aborted) {
      for (const task of Object.values(states)) {
        if (!['VERIFIED', 'FAILED', 'CANCELED'].includes(task.state)) {
          update(task, 'CANCELED', { failure_reason: 'Execution cancelled via signal' });
        }
      }
      break;
    }

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
        const evidence = Array.isArray(result?.evidenceRefs)
          ? result.evidenceRefs.filter(ref => typeof ref === 'string' && ref.trim() && ref.length <= 1024)
          : [];

        // Model/host assertions alone are not independent verification.
        let verified = false;
        if (result?.verified === true && evidence.length > 0 && verifyEvidence) {
          try {
            verified = await verifyEvidence(structuredClone(task), [...evidence], result) === true;
          } catch {
            verified = false;
          }
        }

        // Anti-loop review-cycle check
        if (!verified && autoRetryReview) {
          const cycles = (reviewCycles.get(task.id) || 0) + 1;
          reviewCycles.set(task.id, cycles);
          if (cycles >= maxReviewCycles) {
            return {
              taskId: task.id,
              status: 'BLOCKED',
              evidenceRefs: evidence,
              reason: `Review cycle limit reached (${cycles}/${maxReviewCycles}); anti-loop breaker triggered`
            };
          }
          return {
            taskId: task.id,
            status: 'READY',
            evidenceRefs: evidence,
            reason: `Review required (cycle ${cycles}/${maxReviewCycles}); retrying review loop`,
            retry: true
          };
        }

        return {
          taskId: task.id,
          status: verified ? 'VERIFIED' : 'REVIEW_REQUIRED',
          evidenceRefs: evidence,
          reason: verified ? null : 'Independent verification is missing or failed'
        };
      } catch (error) {
        // Bounded retries with backoff
        const retries = (retryCount.get(task.id) || 0) + 1;
        retryCount.set(task.id, retries);
        if (retries <= maxRetries) {
          // Reset to READY for bounded retry
          return {
            taskId: task.id,
            status: 'READY',
            evidenceRefs: [],
            reason: `Transient error (attempt ${retries}/${maxRetries}): ${String(error?.message || error)}`,
            retry: true
          };
        }
        return {
          taskId: task.id,
          status: 'FAILED',
          evidenceRefs: [],
          reason: String(error?.message || error)
        };
      }
    }));

    for (const result of settled) {
      attempts.push(result);
      if (result.retry) {
        update(states[result.taskId], 'READY', { failure_reason: result.reason });
      } else {
        update(states[result.taskId], result.status, {
          evidence_refs: result.evidenceRefs,
          failure_reason: result.reason
        });
      }
    }
  }

  const unresolved = Object.values(states).filter(task => !['VERIFIED', 'FAILED', 'CANCELED', 'SUPERSEDED'].includes(task.state));
  const complete = Object.keys(states).length > 0 && Object.values(states).every(task => task.state === 'VERIFIED');

  persistCheckpoint();

  return {
    complete,
    tasks: states,
    attempts,
    unresolved: unresolved.map(task => task.id)
  };
}
