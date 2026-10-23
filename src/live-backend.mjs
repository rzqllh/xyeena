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
 */
export class ResourceBudgetLedger {
  constructor({ tokenLimit = 200000, costLimitMicro = 1000000, maxConcurrency = 4 } = {}) {
    this.tokenLimit = tokenLimit;
    this.costLimitMicro = costLimitMicro;
    this.maxConcurrency = maxConcurrency;
    this.usedTokens = 0;
    this.usedCostMicro = 0;
    this.activeWorkers = new Set();
    this.records = [];
  }

  recordUsage({ taskId, backend, tokens = 0, costMicro = 0 } = {}) {
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
    this.assertBudget();
  }

  acquireWorker(workerId) {
    if (this.activeWorkers.size >= this.maxConcurrency) {
      throw new Error(`Concurrency ceiling exceeded: max ${this.maxConcurrency} parallel workers`);
    }
    this.activeWorkers.add(workerId);
  }

  releaseWorker(workerId) {
    this.activeWorkers.delete(workerId);
  }

  assertBudget() {
    if (this.usedTokens > this.tokenLimit) {
      throw new Error(`Token budget ceiling breached: ${this.usedTokens} > ${this.tokenLimit}`);
    }
    if (this.usedCostMicro > this.costLimitMicro) {
      throw new Error(`Cost budget ceiling breached: ${this.usedCostMicro} > ${this.costLimitMicro}`);
    }
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

/**
 * Simpul MCP Adapter Contract
 * Wraps communication with Simpul (SubagentBridge) FastMCP control plane.
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

  return {
    async probe() {
      try {
        const ping = await mcpClient.callTool('get_model_usage', {});
        return {
          healthy: ping !== null,
          noNestedDelegation: true,
          supportsWrites: true,
          supportsParallel: true,
          provider: 'simpul-mcp'
        };
      } catch {
        return { healthy: false, noNestedDelegation: true };
      }
    },

    async executeTask(task, options = {}) {
      if (options.noNestedDelegation !== true) {
        throw new Error('Nested delegation prohibited');
      }
      const runId = `simpul-${task.id}-${Date.now()}`;
      activeRuns.set(task.id, runId);

      // 1. Submit goal to Simpul
      await mcpClient.callTool('submit_goal', {
        goal: task.title,
        run_id: runId,
        project_id: projectId,
        policy_revision: policyRevision
      });

      // 2. Retrieve task evidence from Simpul
      let evidenceRefs = [];
      try {
        const evidenceResult = await mcpClient.callTool('get_task_evidence', { task_id: task.id });
        if (Array.isArray(evidenceResult?.evidenceRefs)) {
          evidenceRefs = safeEvidence(evidenceResult.evidenceRefs);
        } else if (Array.isArray(evidenceResult?.refs)) {
          evidenceRefs = safeEvidence(evidenceResult.refs);
        }
      } catch {
        evidenceRefs = [];
      }

      // 3. Track model usage and account against budget
      try {
        const usage = await mcpClient.callTool('get_model_usage', {});
        if (usage && typeof usage === 'object') {
          ledger?.recordUsage({
            taskId: task.id,
            backend: 'simpul',
            tokens: usage.tokens || 0,
            costMicro: usage.costMicro || 0
          });
        }
      } catch {
        // Usage reporting is best-effort accounting
      }

      activeRuns.delete(task.id);
      return {
        workerId: runId,
        verified: evidenceRefs.length > 0,
        evidenceRefs
      };
    },

    async cancelTask({ taskId, reason = 'canceled' } = {}) {
      const runId = activeRuns.get(taskId);
      if (runId) {
        activeRuns.delete(taskId);
        try {
          await mcpClient.callTool('cancel_run', { run_id: runId });
        } catch {
          // Best effort
        }
      }
    }
  };
}

/**
 * Host-Native Subagent Adapter Contract
 */
export function createNativeSubagentAdapter({
  runner,
  tokenBudget = 100000,
  ledger = null
} = {}) {
  if (!runner || typeof runner.run !== 'function') {
    throw new Error('Native subagent adapter requires a host runner with run()');
  }

  const activeWorkers = new Map();

  return {
    async probe() {
      try {
        const status = typeof runner.status === 'function' ? await runner.status() : { available: true };
        return {
          healthy: status.available === true,
          noNestedDelegation: true,
          supportsWrites: true,
          supportsParallel: true,
          provider: 'host-native'
        };
      } catch {
        return { healthy: false, noNestedDelegation: true };
      }
    },

    async executeTask(task, options = {}) {
      if (options.noNestedDelegation !== true) {
        throw new Error('Nested delegation prohibited');
      }
      const workerId = `native-${task.id}-${Date.now()}`;
      activeWorkers.set(task.id, workerId);

      const result = await runner.run(clone(task), {
        workerId,
        noNestedDelegation: true,
        parallelism: options.parallelism || 1
      });

      activeWorkers.delete(task.id);
      const evidenceRefs = safeEvidence(result?.evidenceRefs);
      return {
        workerId,
        verified: result?.verified === true && evidenceRefs.length > 0,
        evidenceRefs
      };
    },

    async cancelTask({ taskId, reason = 'canceled' } = {}) {
      const workerId = activeWorkers.get(taskId);
      if (workerId) {
        activeWorkers.delete(taskId);
        if (typeof runner.cancel === 'function') {
          try {
            await runner.cancel({ workerId, taskId, reason });
          } catch {
            // Best effort
          }
        }
      }
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
  maxParallel = 2,
  timeoutMs = 120000,
  onEvent = null
} = {}) {
  validTask(task);
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
      if (capabilities) offers[backend] = capabilities;
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

  onEvent?.({ type: 'task.started', taskId: task.id, backend: decision.backend });

  try {
    const invoke = Promise.resolve().then(() => adapter.executeTask(clone(task), {
      signal: controller.signal,
      noNestedDelegation: true,
      parallelism: effectiveParallelism
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
  }
}
