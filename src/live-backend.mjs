import { selectSubagentBackend } from './enterprise-policy.mjs';

const clone = obj => structuredClone(obj);
const safeEvidence = refs => Array.isArray(refs)
  ? [...new Set(refs.filter(x => typeof x === 'string' && x.trim() && x.length <= 1024))].slice(0, 64)
  : [];

function validTask(task) {
  if (!task || typeof task !== 'object' || typeof task.id !== 'string' || !task.id ||
      typeof task.title !== 'string' || !task.title.trim() ||
      !task.scope || typeof task.scope !== 'object') {
    throw new Error('Delegation requires a bounded task ID, title and scope');
  }
  if (task.scope.operationClass && !['safe', 'external', 'destructive'].includes(task.scope.operationClass)) {
    throw new Error('Unsupported task operation class');
  }
  if (typeof task.scope.readOnly !== 'boolean') throw new Error('Task must declare readOnly explicitly');
}

function assertValidHostWorkerId(workerId) {
  if (!workerId || typeof workerId !== 'string') {
    throw new Error('Host runner returned invalid or fabricated worker identity: identity must be a non-empty string');
  }
  const trimmed = workerId.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,127}$/.test(trimmed)) {
    throw new Error("Host runner returned invalid or fabricated worker identity: does not match required format");
  }
  if (/^(fake|dummy|mock|placeholder|synthetic|fabricated)([-_.]|$)/i.test(trimmed)) {
    throw new Error("Host runner returned invalid or fabricated worker identity: placeholder rejected");
  }
  return trimmed;
}

export async function healthyAdapter(adapter, probeTimeoutMs = 3000) {
  if (!adapter || typeof adapter.probe !== 'function' ||
      typeof adapter.executeTask !== 'function' || typeof adapter.cancelTask !== 'function') return null;
  let timer;
  try {
    const capabilities = await Promise.race([
      Promise.resolve().then(() => adapter.probe()),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Probe timed out')), probeTimeoutMs); })
    ]);
    if (capabilities?.healthy !== true || capabilities.noNestedDelegation !== true) return null;
    return {
      enabled: true,
      healthy: true,
      transportHealthy: capabilities.healthy === true,
      executionReady: capabilities.executionReady === true,
      adapterAvailable: true,
      supportsWrites: capabilities.supportsWrites === true,
      supportsParallel: capabilities.supportsParallel === true
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ResourceBudgetLedger tracks per-run tokens, micro-costs, and concurrency limits.
 * Never coerce untrusted provider usage into valid budget arithmetic.
 */
function nonNegativeSafeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid ${name}: expected a non-negative safe integer`);
  }
  return value;
}

export class ResourceBudgetLedger {
  constructor({ tokenLimit = 200000, costLimitMicro = 1000000, maxConcurrency = 4 } = {}) {
    this.tokenLimit = nonNegativeSafeInteger(tokenLimit, 'tokenLimit');
    this.costLimitMicro = nonNegativeSafeInteger(costLimitMicro, 'costLimitMicro');
    if (!Number.isSafeInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new Error('Invalid maxConcurrency: expected a positive safe integer');
    }
    this.maxConcurrency = maxConcurrency;
    this.usedTokens = 0;
    this.usedCostMicro = 0;
    this.activeWorkers = new Set();
    this.records = [];
  }

  checkBudget({ estimatedTokens = 0, estimatedCostMicro = 0 } = {}) {
    nonNegativeSafeInteger(estimatedTokens, 'estimatedTokens');
    nonNegativeSafeInteger(estimatedCostMicro, 'estimatedCostMicro');
    // Subtraction avoids unsafe integer overflow during cap comparisons.
    if (estimatedTokens > this.tokenLimit - this.usedTokens) {
      throw new Error(`Token budget ceiling breached: ${this.usedTokens + estimatedTokens} > ${this.tokenLimit}`);
    }
    if (estimatedCostMicro > this.costLimitMicro - this.usedCostMicro) {
      throw new Error(`Cost budget ceiling breached: ${this.usedCostMicro + estimatedCostMicro} > ${this.costLimitMicro}`);
    }
    return true;
  }

  recordUsage({ taskId, backend, tokens = 0, costMicro = 0 } = {}) {
    this.checkBudget({ estimatedTokens: tokens, estimatedCostMicro: costMicro });
    this.usedTokens += tokens;
    this.usedCostMicro += costMicro;
    this.records.push({
      timestamp: new Date().toISOString(),
      taskId,
      backend,
      tokens,
      costMicro,
      totalTokens: this.usedTokens,
      totalCostMicro: this.usedCostMicro
    });
  }

  acquireWorker(workerId) {
    if (typeof workerId !== 'string' || !workerId.trim() || workerId.length > 128) {
      throw new Error('Invalid budget worker identifier');
    }
    if (this.activeWorkers.has(workerId)) {
      throw new Error('Budget worker identifier is already active');
    }
    if (this.activeWorkers.size >= this.maxConcurrency) {
      throw new Error(`Concurrency ceiling exceeded: max ${this.maxConcurrency} parallel workers`);
    }
    this.activeWorkers.add(workerId);
  }

  releaseWorker(workerId) {
    this.activeWorkers.delete(workerId);
  }

  assertBudget() {
    this.checkBudget();
  }

  get summary() {
    return {
      usedTokens: this.usedTokens,
      tokenLimit: this.tokenLimit,
      usedCostMicro: this.usedCostMicro,
      costLimitMicro: this.costLimitMicro,
      activeWorkers: this.activeWorkers.size,
      maxConcurrency: this.maxConcurrency,
      recordsCount: this.records.length
    };
  }
}

const workspaceWriteQueues = new Map();

export async function acquireWorkspaceWriteLock(workspaceKey) {
  const key = workspaceKey || 'default-workspace';
  let release;
  const waitPromise = new Promise(resolve => { release = resolve; });
  const prev = workspaceWriteQueues.get(key) || Promise.resolve();
  // Every queue entry points to its own tail; comparing it to
  // waitPromise would never match and would leak one settled entry per key.
  const tail = prev.then(() => waitPromise, () => waitPromise);
  workspaceWriteQueues.set(key, tail);
  try {
    await prev;
  } catch {}
  let released = false;
  return () => {
    if (released) return;
    released = true;
    release();
    // A newer waiter owns the key if it replaced our tail. Never delete it.
    if (workspaceWriteQueues.get(key) === tail) {
      workspaceWriteQueues.delete(key);
    }
  };
}

/** Normalize only bounded FastMCP SDK call-tool results; do not infer execution readiness. */
async function simpulCall(mcpClient, name, params) {
  const response = await mcpClient.callTool(name, params);
  if (!response || typeof response !== 'object' || Array.isArray(response) || response.isError === true)
    throw new Error('Simpul MCP tool returned an invalid or failed response');
  if (!Array.isArray(response.content)) return response;
  if (response.structuredContent && typeof response.structuredContent === 'object' &&
      !Array.isArray(response.structuredContent))
    return response.structuredContent;
  if (response.content.length !== 1 || response.content[0]?.type !== 'text' ||
      typeof response.content[0]?.text !== 'string' ||
      response.content[0].text.length > 65536)
    throw new Error('Simpul MCP response content is not a bounded JSON object');
  let parsed;
  try { parsed = JSON.parse(response.content[0].text); }
  catch { throw new Error('Simpul MCP response is not JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Simpul MCP response is not a JSON object');
  return parsed;
}

/**
 * Simpul MCP Adapter Contract
 * Wraps communication with Simpul (SubagentBridge) FastMCP control plane.
 * Submission-only compatibility with the exposed upstream FastMCP signature:
 * submit_goal(goal, workspace_path=None, model=None, execute=False).
 * No write-scope or permission fields exist in that signature, so this
 * adapter must not claim it can delegate write-capable tasks.
 */
export function createSimpulMcpAdapter({
  mcpClient,
  projectId = 'xyeena-rig',
  policyRevision = 'enterprise-v1',
  tokenBudget = 100000,
  ledger = null
} = {}) {
  if (!mcpClient || typeof mcpClient.callTool !== 'function') {
    throw new Error('Simpul MCP adapter requires an active MCP client with callTool');
  }

  const activeRuns = new Map();
  const recentRuns = new Map();

  return {
    async probe() {
      try {
        const ping = await simpulCall(mcpClient, 'get_model_usage', {});
        return {
          healthy: ping !== null && typeof ping === 'object',
          noNestedDelegation: true,
          supportsWrites: false,
          supportsParallel: false,
          provider: 'simpul-mcp',
          executionReady: false, // A ping or a callable submit_goal is NOT supervisor execution readiness
          upstreamStatus: 'SUBMISSION_ONLY_UNVERIFIED'
        };
      } catch {
        return { healthy: false, noNestedDelegation: true };
      }
    },

    async executeTask(task, options = {}) {
      if (options.noNestedDelegation !== true) {
        throw new Error('Nested delegation prohibited');
      }
      if (ledger) {
        ledger.checkBudget();
      }

      // FastMCP submit_goal has NO task-scope or permission parameters.
      // Never treat caller-supplied booleans such as enforceWriteScope as
      // proof of a host security boundary, and never silently discard an
      // explicit permissions request.
      if (task?.scope?.readOnly !== true)
        throw new Error('Refusing write-capable delegation to Simpul: only explicit read-only submission is supported');
      if (options.permissions !== undefined || options.supportsPermissionEnforcement === true ||
          options.enforceWriteScope === true)
        throw new Error('Simpul submit_goal cannot enforce caller-supplied permissions or write scope');

      // Only submit metadata using the exact upstream FastMCP signature.
      // This intentionally does NOT invoke execute_run or submit_goal(execute:true).
      const submitParams = {
        goal: task.title,
        workspace_path: options.cwd || ''
      };
      const submitRes = await simpulCall(mcpClient, 'submit_goal', submitParams);

      if (!submitRes || submitRes.status === 'ERROR' || !submitRes.run_id) {
        throw new Error(`Simpul goal submission failed: ${submitRes?.error || 'No run_id returned'}`);
      }

      const runId = submitRes.run_id;
      const initialTaskId = submitRes.initial_task_id || task.id;
      activeRuns.set(task.id, { runId, initialTaskId });
      recentRuns.set(task.id, { runId, initialTaskId });

      // 2. Bounded polling for terminal state using get_run
      let runStatus = submitRes.status || 'SUBMITTED';
      const maxPollAttempts = Number.isSafeInteger(options.maxPollAttempts) &&
        options.maxPollAttempts > 0 ? Math.min(10, options.maxPollAttempts) : 3;

      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        if (options.signal?.aborted) {
          await this.cancelTask({ taskId: task.id, runId, reason: 'signal-aborted' });
          runStatus = 'CANCELED';
          break;
        }

        try {
          const runInfo = await simpulCall(mcpClient, 'get_run', { run_id: runId });
          if (runInfo?.status) {
            runStatus = runInfo.status;
            if (['COMPLETED', 'FAILED', 'CANCELED'].includes(runStatus)) {
              break;
            }
          }
        } catch {
          // Best effort status query
        }
      }

      // 3. Retrieve task evidence with exact signature: get_task_evidence(run_id, task_id)
      let evidenceRefs = [];
      let isVerified = false;
      const isComplete = runStatus === 'COMPLETED';

      if (isComplete) {
        try {
          const evidenceResult = await simpulCall(mcpClient, 'get_task_evidence', {
            run_id: runId,
            task_id: initialTaskId
          });
          if (evidenceResult?.verified === true) {
            isVerified = true;
          }
          if (Array.isArray(evidenceResult?.evidence_ids)) {
            evidenceRefs = safeEvidence(evidenceResult.evidence_ids);
          } else if (Array.isArray(evidenceResult?.evidenceRefs)) {
            evidenceRefs = safeEvidence(evidenceResult.evidenceRefs);
          } else if (Array.isArray(evidenceResult?.refs)) {
            evidenceRefs = safeEvidence(evidenceResult.refs);
          }
        } catch {
          evidenceRefs = [];
        }
      }

      // 4. Track model usage and account against budget (fail on budget violation)
      if (ledger) {
        // A failed/malformed usage report must not silently become zero spend.
        // This is post-run settlement, never a provider-enforced spending cap.
        let usage;
        try { usage = await simpulCall(mcpClient, 'get_model_usage', {}); }
        catch { throw new Error('Simpul usage accounting unavailable'); }
        if (!usage || typeof usage !== 'object' || Array.isArray(usage) ||
            !Number.isSafeInteger(usage.tokens) || usage.tokens < 0 ||
            !Number.isSafeInteger(usage.costMicro) || usage.costMicro < 0) {
          throw new Error('Simpul usage accounting invalid');
        }
        ledger.recordUsage({
          taskId: task.id,
          backend: 'simpul',
          tokens: usage.tokens,
          costMicro: usage.costMicro
        });
      }

      activeRuns.delete(task.id);

      // NEVER interpret SUBMITTED or PENDING as completed or verified execution
      return {
        workerId: runId, // Server-confirmed run identity
        status: runStatus,
        completed: isComplete,
        verified: isComplete && isVerified && evidenceRefs.length > 0,
        evidenceRefs
      };
    },

    async cancelTask({ taskId, runId = null, reason = 'canceled' } = {}) {
      const active = activeRuns.get(taskId) || recentRuns.get(taskId);
      const effectiveRunId = runId || active?.runId;
      activeRuns.delete(taskId);
      if (effectiveRunId) {
        try {
          await simpulCall(mcpClient, 'cancel_run', { run_id: effectiveRunId, reason });
        } catch {
          // Best effort
        }
      }
    }
  };
}

/**
 * Host-Native Subagent Adapter Contract
 * Obtains worker identity exclusively from the real host runner.
 * Never invents fabricated worker IDs.
 */
export function createNativeSubagentAdapter({
  runner,
  tokenBudget = 100000,
  ledger = null
} = {}) {
  if (!runner || (typeof runner.run !== 'function' && typeof runner.spawn !== 'function')) {
    throw new Error('Native subagent adapter requires a host runner with spawn() or run()');
  }

  const activeWorkers = new Map();
  const recentWorkers = new Map();

  return {
    async probe() {
      // Must NOT interpret absence of runner.status as availability
      if (typeof runner.status !== 'function') {
        return { healthy: false, executionReady: false, noNestedDelegation: true, reason: 'Runner lacks status API' };
      }
      try {
        const status = await runner.status();
        if (!status || status.available !== true) {
          return { healthy: false, executionReady: false, noNestedDelegation: true, reason: 'Runner reported unavailable' };
        }
        // Do not assume read/write or parallel capabilities: must be explicitly declared
        const caps = status.capabilities || status.workerCapabilities || {};
        return {
          healthy: true,
          executionReady: true,
          noNestedDelegation: true,
          supportsWrites: caps.supportsWrites === true,
          supportsParallel: caps.supportsParallel === true,
          provider: 'host-native'
        };
      } catch (err) {
        return { healthy: false, executionReady: false, noNestedDelegation: true, reason: err.message };
      }
    },

    async executeTask(task, options = {}) {
      if (options.noNestedDelegation !== true) {
        throw new Error('Nested delegation prohibited');
      }
      if (ledger) {
        ledger.checkBudget();
      }

      // Harness permission propagation if gate is present
      if (options.harnessGate && task.scope?.operationClass && task.scope.operationClass !== 'safe') {
        const gateDecision = options.harnessGate.preToolGate({
          toolName: 'native_subagent_dispatch',
          actionType: task.scope.operationClass,
          args: { taskId: task.id, title: task.title }
        });
        if (gateDecision.blocked) {
          throw new Error(`Native subagent dispatch blocked by harness: ${gateDecision.reason || gateDecision.decision}`);
        }
      }

      // Obtain worker identity from the real host runner (spawn or run)
      // The host runner must provide the real worker identity, validated positively
      let runResult;
      let hostWorkerId = null;

      try {
        if (typeof runner.spawn === 'function') {
          const handle = await runner.spawn(clone(task), {
            noNestedDelegation: true,
            parallelism: options.parallelism || 1,
            signal: options.signal
          });
          if (!handle || typeof handle !== 'object') {
            throw new Error('Host runner spawn() must return an active worker handle object');
          }
          hostWorkerId = assertValidHostWorkerId(handle.workerId);
          activeWorkers.set(task.id, { workerId: hostWorkerId, handle });
          recentWorkers.set(task.id, { workerId: hostWorkerId, handle });

          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              if (typeof handle.cancel === 'function') {
                handle.cancel('aborted');
              } else if (typeof runner.cancel === 'function') {
                runner.cancel({ workerId: hostWorkerId, taskId: task.id, reason: 'aborted' });
              }
            }, { once: true });
          }

          runResult = typeof handle.wait === 'function'
            ? await handle.wait()
            : (typeof handle.then === 'function' ? await handle : handle);
        } else {
          activeWorkers.set(task.id, { workerId: null });
          runResult = await runner.run(clone(task), {
            noNestedDelegation: true,
            parallelism: options.parallelism || 1,
            signal: options.signal
          });
          hostWorkerId = assertValidHostWorkerId(runResult?.workerId);
          activeWorkers.set(task.id, { workerId: hostWorkerId });
          recentWorkers.set(task.id, { workerId: hostWorkerId });
        }
      } catch (err) {
        activeWorkers.delete(task.id);
        throw err;
      }

      activeWorkers.delete(task.id);

      if (runResult?.crashed === true || runResult?.status === 'CRASHED' || runResult?.error) {
        throw new Error(`Host worker crashed or encountered error: ${runResult.error || 'Worker crash'}`);
      }

      const evidenceRefs = safeEvidence(runResult?.evidenceRefs);
      return {
        workerId: hostWorkerId,
        verified: runResult?.verified === true && evidenceRefs.length > 0,
        evidenceRefs
      };
    },

    async cancelTask({ taskId, workerId = null, reason = 'canceled' } = {}) {
      const active = activeWorkers.get(taskId) || recentWorkers.get(taskId);
      const effectiveWorkerId = workerId || active?.workerId;
      activeWorkers.delete(taskId);

      if (active?.handle && typeof active.handle.cancel === 'function') {
        try {
          await active.handle.cancel(reason);
          return true;
        } catch (err) {
          throw new Error(`Worker handle cancellation failed: ${err.message}`);
        }
      }
      if (typeof runner.cancel === 'function') {
        try {
          await runner.cancel({ workerId: effectiveWorkerId, taskId, reason });
          return true;
        } catch (err) {
          throw new Error(`Runner cancellation failed: ${err.message}`);
        }
      }
      throw new Error('Runner lacks cancellation API: unable to cancel active worker safely');
    }
  };
}

/**
 * Adapter-only execution boundary.
 * The controller must supply real authenticated and scoped Simpul/native adapters.
 */
export async function dispatchScopedTask({
  task,
  inlineAdapter,
  backends = {},
  approvedTaskIds = [],
  verifyEvidence = null,
  authorizeOperation = null,
  budgetLedger = null,
  harnessGate = null,
  maxParallel = 2,
  timeoutMs = 120000,
  onEvent = null
} = {}) {
  validTask(task);
  if (budgetLedger) {
    budgetLedger.checkBudget();
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
    throw new Error('Invalid dispatch timeout');
  }
  if (!Array.isArray(approvedTaskIds)) throw new Error('Explicit approvedTaskIds list is required');
  if (verifyEvidence !== null && typeof verifyEvidence !== 'function') {
    throw new Error('Independent verifier must be a function');
  }
  if (onEvent !== null && typeof onEvent !== 'function') throw new Error('Invalid event callback');
  if (!inlineAdapter || typeof inlineAdapter.executeTask !== 'function') {
    throw new Error('Real inline adapter required for safe fallback');
  }

  const permission = task.scope.operationClass || 'safe';
  if (task.scope.readOnly !== true || permission !== 'safe') {
    if (!approvedTaskIds.includes(task.id)) {
      throw new Error('Task-scoped authorization required; host approval is separately mandatory');
    }
    if (typeof authorizeOperation !== 'function' || await authorizeOperation(clone(task)) !== 'allow-once') {
      throw new Error('An explicit allow-once host authorization callback is mandatory');
    }
  }

  // Probe available backends
  const offers = {};
  if (task.requiresDelegation === true) {
    for (const backend of ['simpul', 'native']) {
      const capabilities = await healthyAdapter(backends[backend]);
      if (capabilities && capabilities.executionReady === true) offers[backend] = capabilities;
    }
  }

  const decision = selectSubagentBackend({
    task: {
      requiresDelegation: task.requiresDelegation === true,
      independent: task.independent === true,
      readOnly: task.scope.readOnly === true,
      isolatedWorktrees: task.isolatedWorktrees === true
    },
    backends: offers,
    maxParallel
  });

  const adapter = decision.backend === 'inline' ? inlineAdapter : backends[decision.backend];
  const controller = new AbortController();
  let timer;

  // Enforce worktree isolation for parallel writes:
  // If not readOnly and isolatedWorktrees is not true, serialize to parallelism 1
  const effectiveParallelism = (task.scope.readOnly === false && task.isolatedWorktrees !== true)
    ? 1
    : decision.parallelism;

  let releaseWriteLock = null;
  if (task.scope.readOnly === false && task.isolatedWorktrees !== true) {
    releaseWriteLock = await acquireWorkspaceWriteLock(task.cwd || 'default-workspace');
  }

  try {
    // Enforce Harness gate check on dispatch if gate is provided
    if (harnessGate && task.scope?.operationClass && task.scope.operationClass !== 'safe') {
      const gateDecision = harnessGate.preToolGate({
        toolName: `dispatch_${decision.backend}`,
        actionType: task.scope.operationClass,
        args: { taskId: task.id, title: task.title }
      });
      if (gateDecision.blocked) {
        throw new Error(`Task execution blocked by Harness gate: ${gateDecision.reason || gateDecision.decision}`);
      }
    }

    onEvent?.({ type: 'task.started', taskId: task.id, backend: decision.backend });
    const invoke = Promise.resolve().then(() => adapter.executeTask(clone(task), {
      signal: controller.signal,
      noNestedDelegation: true,
      parallelism: effectiveParallelism,
      harnessGate
    }));

    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Scoped task execution timed out')), timeoutMs);
    });

    const result = await Promise.race([invoke, timeout]);
    if (decision.backend !== 'inline' && (typeof result?.workerId !== 'string' || !result.workerId.trim())) {
      throw new Error('Subagent adapter did not return a real worker identifier');
    }

    const evidence = safeEvidence(result?.evidenceRefs);
    let verified = false;
    if (result?.verified === true && evidence.length > 0 && verifyEvidence) {
      try {
        verified = await verifyEvidence(clone(task), [...evidence], result) === true;
      } catch {
        verified = false;
      }
    }

    const output = {
      taskId: task.id,
      backend: decision.backend,
      parallelism: effectiveParallelism,
      status: verified ? 'VERIFIED' : 'REVIEW_REQUIRED',
      verified,
      evidenceRefs: evidence,
      workerId: typeof result?.workerId === 'string' ? result.workerId : null
    };

    onEvent?.({ type: 'task.finished', ...output });
    return output;
  } catch (error) {
    controller.abort();
    if (decision.backend !== 'inline') {
      try {
        await adapter.cancelTask({ taskId: task.id, reason: 'failed-or-timed-out' });
      } catch {
        /* best-effort cleanup */
      }
    } else if (typeof adapter.cancelTask === 'function') {
      try {
        await adapter.cancelTask({ taskId: task.id, reason: 'failed-or-timed-out' });
      } catch {
        /* best-effort */
      }
    }
    onEvent?.({ type: 'task.failed', taskId: task.id, backend: decision.backend });
    throw error;
  } finally {
    clearTimeout(timer);
    releaseWriteLock?.();
  }
}
