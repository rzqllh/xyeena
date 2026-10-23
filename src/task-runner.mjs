import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { readyTasks, validateTaskGraph } from './task-graph.mjs';

/**
 * Durable Checkpoint Store for Crash-Safe DAG Recovery and Smart Resume
 */
export class DurableCheckpointStore {
  static validateRunId(runId) {
    if (!runId || typeof runId !== 'string') {
      throw new Error('Run ID must be a non-empty string');
    }
    const trimmed = runId.trim();
    if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('\0') || trimmed === '.' || trimmed === '..') {
      throw new Error(`Invalid runId "${runId}": path traversal characters not permitted`);
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(trimmed)) {
      throw new Error(`Invalid runId "${runId}": must match alphanumeric identifier format`);
    }
    return trimmed;
  }

  static checkpointPath(cwd, runId) {
    const validId = this.validateRunId(runId);
    const root = fs.realpathSync(path.resolve(cwd));
    return path.join(root, '.xyeena', 'runs', validId, 'dag-checkpoint.json');
  }

  static isProcessAlive(pid) {
    if (!pid || typeof pid !== 'number' || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (err) {
      return err.code === 'EPERM';
    }
  }

  static acquireRunLock(cwd, runId, { staleThresholdMs = 30000 } = {}) {
    const validId = this.validateRunId(runId);
    const root = fs.realpathSync(path.resolve(cwd));
    const runDir = path.join(root, '.xyeena', 'runs', validId);
    fs.mkdirSync(runDir, { recursive: true });
    const lockFile = path.join(runDir, 'run.lock');

    const ownerId = `${process.pid}-${crypto.randomUUID()}`;
    const host = os.hostname ? os.hostname() : 'localhost';
    let fenceToken = 1;

    let acquired = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      let existingFence = 0;
      try {
        if (fs.existsSync(lockFile)) {
          let existing = null;
          try {
            existing = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
          } catch {
            existing = null;
          }
          if (existing) {
            existingFence = Number(existing.fenceToken) || 0;
            const isAlive = existing.pid ? this.isProcessAlive(existing.pid) : false;
            if (isAlive) {
              // Active owner is NEVER reclaimed solely due to elapsed time
              throw new Error(`Cannot resume or execute run "${validId}": exclusive lease already held by active process (PID ${existing.pid}, owner ${existing.ownerId || 'unknown'})`);
            }
            // Stale or dead process lock detected: safely reclaim with incremented fencing token
            try {
              fs.rmSync(lockFile, { force: true });
            } catch {}
          }
        }

        fenceToken = existingFence + 1;
        const lockData = {
          ownerId,
          pid: process.pid,
          fenceToken,
          acquiredAt: new Date().toISOString(),
          runId: validId,
          host
        };

        const fd = fs.openSync(lockFile, 'wx');
        fs.writeSync(fd, JSON.stringify(lockData) + '\n');
        fs.closeSync(fd);
        acquired = true;
        break;
      } catch (err) {
        if (err.message && err.message.includes('exclusive lease already held by active process')) {
          throw err;
        }
        if (err.code !== 'EEXIST') throw err;

        // If EEXIST occurred because of a race with another contender, inspect on next loop
        try {
          const content = fs.readFileSync(lockFile, 'utf8');
          const raced = JSON.parse(content);
          if (raced?.pid && this.isProcessAlive(raced.pid)) {
            throw new Error(`Cannot resume or execute run "${validId}": exclusive lease already held by active process (PID ${raced.pid}, owner ${raced.ownerId || 'unknown'})`);
          }
        } catch (innerErr) {
          if (innerErr.message && innerErr.message.includes('exclusive lease already held by active process')) {
            throw innerErr;
          }
        }
      }
    }

    if (!acquired) {
      throw new Error(`Cannot resume or execute run "${validId}": exclusive lease contention prevented lock acquisition`);
    }

    return () => {
      try {
        if (fs.existsSync(lockFile)) {
          try {
            const current = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            if (current?.ownerId === ownerId) {
              fs.rmSync(lockFile, { force: true });
            }
          } catch {
            fs.rmSync(lockFile, { force: true });
          }
        }
      } catch {}
    };
  }

  static save(cwd, runId, payload) {
    if (!runId || typeof runId !== 'string') return;
    const validId = this.validateRunId(runId);
    const file = this.checkpointPath(cwd, validId);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.' + crypto.randomUUID() + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify({
        schema: 1,
        runId: validId,
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
    const validId = this.validateRunId(runId);
    try {
      const file = this.checkpointPath(cwd, validId);
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

  // Acquire exclusive per-run lease before checkpoint resume/execution
  let releaseRunLock = null;
  if (runId) {
    DurableCheckpointStore.validateRunId(runId);
    if (resume) {
      releaseRunLock = DurableCheckpointStore.acquireRunLock(cwd, runId);
    }
  }

  try {
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
        const taskController = new AbortController();
        let abortHandler = null;

        if (cancelSignal) {
          if (cancelSignal.aborted) {
            taskController.abort();
          } else {
            abortHandler = () => {
              taskController.abort();
              if (typeof adapter.cancelTask === 'function') {
                adapter.cancelTask({ taskId: task.id, reason: 'cancel-signal' }).catch(() => {});
              }
            };
            cancelSignal.addEventListener('abort', abortHandler, { once: true });
          }
        }

        try {
          const result = await adapter.executeTask(structuredClone(task), { signal: taskController.signal });
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
          // Never automatically retry potentially non-idempotent external/destructive actions without safe reconciliation
          const isPrivilegedOrNonIdempotent = ['external', 'destructive'].includes(task.scope?.operationClass) ||
            task.scope?.idempotent === false;

          if (isPrivilegedOrNonIdempotent) {
            return {
              taskId: task.id,
              status: 'FAILED',
              evidenceRefs: [],
              reason: `Non-idempotent or privileged task (${task.scope?.operationClass || 'non-idempotent'}) failed; automatic retry prohibited without safe reconciliation: ${String(error?.message || error)}`
            };
          }

          // Bounded retries with real exponential backoff
          const retries = (retryCount.get(task.id) || 0) + 1;
          retryCount.set(task.id, retries);
          if (retries <= maxRetries) {
            const baseDelayMs = 20;
            const maxDelayMs = 2000;
            const backoffMs = Math.min(baseDelayMs * Math.pow(2, retries - 1), maxDelayMs);
            await new Promise(resolve => setTimeout(resolve, backoffMs));

            return {
              taskId: task.id,
              status: 'READY',
              evidenceRefs: [],
              reason: `Transient error (attempt ${retries}/${maxRetries}, backoff ${backoffMs}ms): ${String(error?.message || error)}`,
              retry: true
            };
          }
          return {
            taskId: task.id,
            status: 'FAILED',
            evidenceRefs: [],
            reason: String(error?.message || error)
          };
        } finally {
          if (cancelSignal && abortHandler) {
            cancelSignal.removeEventListener('abort', abortHandler);
          }
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
  } finally {
    releaseRunLock?.();
  }
}
