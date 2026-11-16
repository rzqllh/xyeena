/**
 * Cortex Orchestrator (P10 / DEC-27)
 * Native default intelligence engine for Xyeena Rig.
 *
 * Key Principles:
 * 1. Active by default: users give natural task prompts without manual xyeena-* skill picking.
 * 2. Intelligent Tier Adaptation:
 *    - TIER_0_MICRO: Crisp direct answer, 0 DAG, 0 subagents, 0 extra files.
 *    - TIER_1_STANDARD: Scoped single-task execution, lazy domain loading.
 *    - TIER_2_COMPLEX: Multi-file workflow DAG, checkpoints, adaptive persistent plan.
 *    - TIER_3_ARCHITECTURAL: Explicit risk gates, host-native delegation, strict evidence ledger.
 * 3. User Explicit Selection Priority: If user specifies /skill or xyeena-*, Cortex prioritizes it.
 * 4. Trusted External Routing: Routes to external ecosystem skills when relevant and permitted.
 * 5. Rule 4 Discussion & Execution Gate: Never mutates state in Discussion Mode without explicit consent.
 */

import { VERSION } from '../paths.mjs';
import { ERROR_CODES, XyeenaError } from './errors.mjs';
import { TASK_TIERS, IntentRouter } from './router.mjs';
import { CAPABILITY_LAYERS, CapabilityRegistry } from './registry.mjs';
import { createDefaultRegistry, DEFAULT_CAPABILITIES } from './default-registry.mjs';
import { CapabilityResolver } from './resolver.mjs';
import { PolicyGovernor, PERMISSION_TYPES, EXECUTION_MODES } from './policy.mjs';
import { EffortBudgetGovernor, BUDGET_LIMITS, estimateTokens } from './budget.mjs';
import { EvidenceLedger, EVIDENCE_TIERS, VERDICT_STATUS, EvidenceRecord } from './evidence.mjs';
import { HostNegotiator, HOST_NAMES, SUPPORT_LEVELS } from './negotiator.mjs';
import { WorkflowComposer } from './composer.mjs';
import { TaskGraph, TaskNode, TASK_STATUS } from '../runtime/task-dag.mjs';
import { CheckpointManager } from '../runtime/checkpoint.mjs';
import { CompositeRegistry } from './composites.mjs';

export const CORTEX_EXECUTION_STATUS = Object.freeze({
  PLANNED: 'PLANNED',
  METHOD_EVALUATED: 'METHOD_EVALUATED',
  READY_FOR_EXECUTION: 'READY_FOR_EXECUTION',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  UNSUPPORTED: 'UNSUPPORTED',
  DISCUSSION_MODE: 'DISCUSSION_MODE'
});

export class CortexOrchestrator {
  /**
   * @param {object} [options={}]
   * @param {CapabilityRegistry} [options.registry]
   * @param {IntentRouter} [options.router]
   * @param {CapabilityResolver} [options.resolver]
   * @param {PolicyGovernor} [options.policyGovernor]
   * @param {EffortBudgetGovernor} [options.budgetGovernor]
   * @param {EvidenceLedger} [options.evidenceLedger]
   * @param {HostNegotiator} [options.negotiator]
   * @param {CheckpointManager} [options.checkpointManager]
   */
  constructor(options = {}) {
    this.registry = options.registry || createDefaultRegistry();
    this.router = options.router || new IntentRouter();
    this.resolver = options.resolver || new CapabilityResolver(this.registry, this.router);
    this.policyGovernor = options.policyGovernor || new PolicyGovernor();
    this.budgetGovernor = options.budgetGovernor || new EffortBudgetGovernor();
    this.evidenceLedger = options.evidenceLedger || new EvidenceLedger();
    this.negotiator = options.negotiator || new HostNegotiator();
    this.checkpointManager = options.checkpointManager || new CheckpointManager();
    this.composer = new WorkflowComposer();
    this.compositeRegistry = options.compositeRegistry || new CompositeRegistry();
  }

  /**
   * Detect explicitly mentioned skills or slash-commands in prompt.
   * e.g., /antislop, /xyeena-orchestrate, xyeena-debug, /brainstorming, /tdd
   * @param {string} prompt
   * @returns {string[]}
   */
  detectExplicitSkills(prompt) {
    if (!prompt || typeof prompt !== 'string') return [];
    const lower = prompt.toLowerCase();
    const explicit = [];

    // Slash commands
    const slashMatches = lower.match(/\/([a-z0-9_-]+)/g);
    if (slashMatches) {
      for (const m of slashMatches) {
        explicit.push(m.slice(1));
      }
    }

    // Explicit skill names & composites
    const knownSkills = [
      'xyeena-design', 'xyeena-plan', 'xyeena-execute', 'xyeena-debug',
      'xyeena-review', 'xyeena-test', 'xyeena-verify', 'xyeena-security',
      'xyeena-research', 'xyeena-writing', 'xyeena-orchestrate',
      'xyeena-core', 'xyeena-interface', 'xyeena-architecture', 'xyeena-release',
      'antislop', 'brainstorming', 'tdd', 'ponytail', 'caveman', 'hallmark',
      'impeccable', 'huashu-design', 'ui-ux-pro-max', 'design-taste-frontend',
      'verification-before-completion', 'dispatching-parallel-agents',
      'subagent-driven-development', 'writing-plans'
    ];

    for (const skill of knownSkills) {
      const regex = new RegExp(`\\b${skill.replace('-', '[-_]?')}\\b`, 'i');
      if (regex.test(lower) && !explicit.includes(skill)) {
        explicit.push(skill);
      }
    }

    explicit.hasExplicit = explicit.length > 0;
    explicit.primarySkill = explicit[0] || null;
    explicit.explicitSkills = [...explicit];

    return explicit;
  }

  /**
   * Filter and map external trusted skills according to permission boundaries.
   * @param {Array<object>} availableSkills
   * @returns {Array<object>}
   */
  detectExternalSkills(availableSkills = []) {
    if (!Array.isArray(availableSkills)) return [];
    return availableSkills.filter(s => {
      if (!s || !s.name) return false;
      // Filter out internal duplicate names
      return !s.name.startsWith('xyeena-');
    });
  }

  /**
   * Resolve execution plan for an incoming natural language prompt.
   * Native default entrypoint for all user requests.
   *
   * @param {string} prompt
   * @param {object} [options={}]
   * @returns {object} Full resolution plan
   */
  resolve(prompt, options = {}) {
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Prompt must be a non-empty string');
    }

    const explicitSkills = this.detectExplicitSkills(prompt);
    const mode = options.mode || this.router.classifyIntent(prompt);
    const tier = options.tier || this.router.classifyTier(prompt, mode);

    // Resolve native capability contracts topologically
    const capabilities = this.resolver.resolve(prompt, mode, tier);

    // Host detection and delegation readiness
    const host = this.negotiator.detectHost();
    const isExecutionAuthorized = (
      mode === EXECUTION_MODES.EXECUTION ||
      mode === EXECUTION_MODES.EXPLICIT_RISK_GATE ||
      options.execute === true
    );

    // Build structured workflow steps based on complexity tier
    let workflowSteps = [];
    let delegationStrategy = 'none';
    let requiresSubagent = false;

    if (tier === TASK_TIERS.TIER_0_MICRO) {
      workflowSteps = [
        {
          id: 'step-micro-0',
          name: 'Direct Resolution',
          tier: TASK_TIERS.TIER_0_MICRO,
          description: 'Direct response without DAG overhead, subagent dispatch, or unnecessary file persistence.'
        }
      ];
      delegationStrategy = 'none';
      requiresSubagent = false;
    } else if (tier === TASK_TIERS.TIER_1_STANDARD) {
      workflowSteps = [
        {
          id: 'step-std-1',
          name: 'Scoped Analysis',
          tier: TASK_TIERS.TIER_1_STANDARD,
          description: 'Inspect relevant source and context before making changes.'
        },
        {
          id: 'step-std-2',
          name: 'Targeted Execution',
          tier: TASK_TIERS.TIER_1_STANDARD,
          description: 'Apply narrow, root-cause modification within agreed boundary.'
        },
        {
          id: 'step-std-3',
          name: 'Verification Gate',
          tier: TASK_TIERS.TIER_1_STANDARD,
          description: 'Verify with targeted check before completing.'
        }
      ];
      delegationStrategy = 'internal-inline';
      requiresSubagent = false;
    } else if (tier === TASK_TIERS.TIER_2_COMPLEX) {
      workflowSteps = [
        {
          id: 'step-cpx-1',
          name: 'Phase Scoping & Contract Definition',
          tier: TASK_TIERS.TIER_2_COMPLEX,
          description: 'Define clear phase boundaries and acceptance criteria.'
        },
        {
          id: 'step-cpx-2',
          name: 'DAG Construction & Checkpointing',
          tier: TASK_TIERS.TIER_2_COMPLEX,
          description: 'Build execution task graph with recovery checkpoints.'
        },
        {
          id: 'step-cpx-3',
          name: 'Test-Driven Implementation',
          tier: TASK_TIERS.TIER_2_COMPLEX,
          description: 'Execute implementation phase by phase.'
        },
        {
          id: 'step-cpx-4',
          name: 'Phase Boundary Verification',
          tier: TASK_TIERS.TIER_2_COMPLEX,
          description: 'Run project verification suite at phase end.'
        }
      ];
      delegationStrategy = 'internal-dag';
      requiresSubagent = false;
    } else if (tier === TASK_TIERS.TIER_3_ARCHITECTURAL) {
      workflowSteps = [
        {
          id: 'step-arch-1',
          name: 'Threat Modeling & Architectural Audit',
          tier: TASK_TIERS.TIER_3_ARCHITECTURAL,
          description: 'Analyze security boundaries, trust models, and cross-cutting impacts.'
        },
        {
          id: 'step-arch-2',
          name: 'Subagent Handoff & Parallel Coordination',
          tier: TASK_TIERS.TIER_3_ARCHITECTURAL,
          description: 'Formulate host-native subagent delegation plans (e.g. Antigravity subagents).'
        },
        {
          id: 'step-arch-3',
          name: 'Multi-Phase DAG Execution & Checkpointing',
          tier: TASK_TIERS.TIER_3_ARCHITECTURAL,
          description: 'Execute independent tasks with transactional rollback and state snapshots.'
        },
        {
          id: 'step-arch-4',
          name: 'Independent Evidence Ledger & Release Gate',
          tier: TASK_TIERS.TIER_3_ARCHITECTURAL,
          description: 'Compile fresh evidence proofs; require explicit consent before release.'
        }
      ];
      delegationStrategy = 'host-native-subagent';
      requiresSubagent = true;
    }

    // Compose prompt context
    const composition = this.composer.compose({
      prompt,
      mode,
      tier,
      activeCapabilities: capabilities
    });

    return {
      engine: 'Cortex',
      version: VERSION,
      status: 'RESOLVED',
      prompt,
      mode,
      tier,
      host,
      isExecutionAuthorized,
      explicitSkills,
      activeCapabilities: capabilities.map(c => ({
        id: c.id,
        name: c.name,
        layer: c.layer,
        domain: c.domain
      })),
      workflow: {
        tier,
        steps: workflowSteps,
        requiresSubagent,
        delegationStrategy,
        requiresRiskGate: mode === EXECUTION_MODES.EXPLICIT_RISK_GATE
      },
      budget: {
        maxTokens: this.budgetGovernor.getCeiling(tier),
        estimatedTokens: composition.stats.estimatedTokens,
        l0TokenShare: composition.stats.l0TokenShare
      },
      contextPayload: composition.payloadText
    };
  }

  /**
   * Dispatch an executable handler for a registered capability contract.
   * Proves operational execution binding rather than contract registration alone.
   * @param {string} capabilityId
   * @param {Record<string, unknown>} [args={}]
   * @returns {any} Result of capability execution
   */
  dispatch(capabilityId, args = {}) {
    const cap = this.registry.get(capabilityId);
    if (!cap) {
      throw new XyeenaError(ERROR_CODES.CAPABILITY_NOT_FOUND, `Capability contract not found in registry: ${capabilityId}`);
    }
    if (typeof cap.handler !== 'function') {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Capability contract "${capabilityId}" has no executable handler bound.`);
    }
    return cap.handler(args);
  }

  /**
   * Dispatch an authoritative composite skill workflow.
   * @param {string} compositeId
   * @param {Record<string, unknown>} [input={}]
   * @param {Record<string, unknown>} [context={}]
   * @returns {any} Result of composite workflow execution
   */
  dispatchComposite(compositeId, input = {}, context = {}) {
    return this.compositeRegistry.execute(compositeId, input, context);
  }

  /**
   * Execute task through Cortex orchestration.
   * If in Discussion Mode and execution is not authorized, fails closed gracefully
   * and returns the discussion advice without mutating project files.
   *
   * @param {string} prompt
   * @param {object} [options={}]
   * @returns {object} Execution result
   */
  async execute(prompt, options = {}) {
    const plan = this.resolve(prompt, options);

    // Rule 4 Gate: discussion mode does not permit modification
    if (!plan.isExecutionAuthorized) {
      return {
        engine: 'Cortex',
        status: CORTEX_EXECUTION_STATUS.DISCUSSION_MODE,
        mode: plan.mode,
        tier: plan.tier,
        message: 'Discussion Mode active. Under Rule 4, no files have been created or modified. Use explicit command to execute (e.g. "implement", "eksekusi", "fix sekarang").',
        plan
      };
    }

    // Dry-run mode: plans the execution truthfully without running tasks
    if (options.dryRun === true) {
      return {
        engine: 'Cortex',
        status: CORTEX_EXECUTION_STATUS.PLANNED,
        mode: plan.mode,
        tier: plan.tier,
        message: 'Workflow planned in dry-run mode. Ready for execution.',
        plan
      };
    }

    // Execute composite workflow if explicitly triggered
    let compositeResult = null;
    let matchedSkill = null;
    if (plan.explicitSkills.length > 0) {
      for (const sk of plan.explicitSkills) {
        const comp = this.compositeRegistry.get(sk);
        if (comp) {
          compositeResult = await comp.execute(options.input || { prompt }, options.context || {});
          matchedSkill = comp.id || sk;
          break;
        }
      }
      if (compositeResult) {
        // A composite's SUCCESS/GATED return describes methodology evaluation,
        // not host execution. Only the TaskGraph executor path can attest task completion.
        const blocked = ['GATED', 'BLOCKED', 'BLOCKED_CONSENT_REQUIRED'].includes(compositeResult.status);
        const status = blocked
          ? CORTEX_EXECUTION_STATUS.BLOCKED
          : CORTEX_EXECUTION_STATUS.METHOD_EVALUATED;
        const message = blocked
          ? 'Composite methodology blocked by its permission or prerequisite gate.'
          : 'Composite methodology evaluated; no host task execution was claimed.';

        return {
          engine: 'Cortex',
          status,
          mode: plan.mode,
          tier: plan.tier,
          message,
          compositeResult,
          plan
        };
      }
    }

    // TIER_0_MICRO: Crisp direct execution, 0 DAG, 0 subagents, 0 extra files
    if (plan.tier === TASK_TIERS.TIER_0_MICRO) {
      if (options.requireResponseProvider && !options.responseProvider && !options.executor) {
        return {
          engine: 'Cortex',
          status: CORTEX_EXECUTION_STATUS.READY_FOR_EXECUTION,
          mode: plan.mode,
          tier: plan.tier,
          message: 'Micro task planned and ready for execution with response provider.',
          executedSteps: [],
          compositeResult: null,
          plan
        };
      }

      let output = null;
      if (typeof options.responseProvider === 'function') {
        output = await options.responseProvider(prompt);
      } else {
        const mathMatch = prompt.match(/(?:hitung|calculate|\bmath\b)?\s*([0-9\s+\-*/().%]+)$/i);
        if (mathMatch && mathMatch[1] && /[0-9]/.test(mathMatch[1]) && /[+\-*/]/.test(mathMatch[1])) {
          try {
            const sanitized = mathMatch[1].replace(/[^0-9+\-*/().\s]/g, '');
            output = Function(`'use strict'; return (${sanitized})`)();
          } catch {
            output = null;
          }
        }
      }

      const failed = output === false ||
        (output && typeof output === 'object' && (output.success === false || output.status === 'FAILED'));
      const noResult = output === null || output === undefined || output === '';
      return {
        engine: 'Cortex',
        status: failed ? CORTEX_EXECUTION_STATUS.FAILED
          : (noResult ? CORTEX_EXECUTION_STATUS.READY_FOR_EXECUTION : CORTEX_EXECUTION_STATUS.COMPLETED),
        mode: plan.mode,
        tier: plan.tier,
        message: failed ? 'Micro task provider reported failure.'
          : (noResult ? 'Micro task has no response provider or deterministic result; awaiting execution.' : 'Micro task produced an actual result.'),
        output,
        executedSteps: plan.workflow.steps.map(s => s.id),
        compositeResult: null,
        plan
      };
    }

    // TIER_1_STANDARD & TIER_2_COMPLEX: Construct TaskGraph
    const taskGraph = new TaskGraph();
    plan.workflow.steps.forEach((step, idx) => {
      taskGraph.addTask(new TaskNode({
        id: step.id,
        title: step.name,
        dependencies: idx > 0 ? [plan.workflow.steps[idx - 1].id] : [],
        isReadOnly: step.id.includes('verify') || step.id.includes('scoping'),
        metadata: { ...step }
      }));
    });

    const executorFn = typeof options.executor === 'function'
      ? options.executor
      : (options.executor?.runTask ? options.executor.runTask.bind(options.executor) : null);

    // If an executor is provided, execute tasks through TaskGraph state machine
    if (executorFn) {
      let executionFailed = false;
      let failureError = null;
      const executedTaskIds = [];

      const order = taskGraph.getExecutionOrder();

      if (options.signal?.aborted) {
        for (const taskId of order) {
          const n = taskGraph.get(taskId);
          if (n && (n.status === TASK_STATUS.READY || n.status === TASK_STATUS.RUNNING)) {
            taskGraph.transition(taskId, TASK_STATUS.BLOCKED, { reason: 'Execution cancelled by signal' });
          }
        }
        return {
          engine: 'Cortex',
          status: CORTEX_EXECUTION_STATUS.BLOCKED,
          mode: plan.mode,
          tier: plan.tier,
          message: 'Execution cancelled by signal.',
          taskCount: taskGraph.size(),
          executedSteps: executedTaskIds,
          taskGraph,
          plan
        };
      }

      for (const taskId of order) {
        if (options.signal?.aborted) {
          for (const remainingId of order.slice(order.indexOf(taskId))) {
            const nextNode = taskGraph.get(remainingId);
            if (nextNode && (nextNode.status === TASK_STATUS.READY || nextNode.status === TASK_STATUS.RUNNING)) {
              taskGraph.transition(remainingId, TASK_STATUS.BLOCKED, { reason: 'Execution cancelled by signal' });
            }
          }
          return {
            engine: 'Cortex',
            status: CORTEX_EXECUTION_STATUS.BLOCKED,
            mode: plan.mode,
            tier: plan.tier,
            message: 'Execution cancelled by signal.',
            taskCount: taskGraph.size(),
            executedSteps: executedTaskIds,
            taskGraph,
            plan
          };
        }

        const node = taskGraph.get(taskId);
        if (!node) continue;

        const depFailed = node.dependencies.some(depId => {
          const dep = taskGraph.get(depId);
          return dep && (dep.status === TASK_STATUS.FAILED || dep.status === TASK_STATUS.BLOCKED);
        });

        if (depFailed) {
          taskGraph.transition(taskId, TASK_STATUS.BLOCKED, { reason: 'Upstream dependency failed or was blocked' });
          continue;
        }

        try {
          taskGraph.transition(taskId, TASK_STATUS.RUNNING);
          const res = await executorFn(node, {
            prompt,
            plan,
            tier: plan.tier,
            context: options.context || {},
            signal: options.signal
          });

          // Check for structured failure signals: false, { success: false }, { status: 'FAILED' }
          const isFailureSignal = res === false || (res && typeof res === 'object' && (res.success === false || res.status === 'FAILED' || res.status === 'failed'));

          if (isFailureSignal) {
            executionFailed = true;
            const failureReason = (res && typeof res === 'object' && (res.error || res.message || res.reason)) || 'Executor returned failure signal';
            failureError = new Error(typeof failureReason === 'string' ? failureReason : JSON.stringify(failureReason));
            taskGraph.transition(taskId, TASK_STATUS.FAILED, res || { failed: true });
            this.evidenceLedger.add(new EvidenceRecord({
              claim: `Task "${taskId}" execution reported failure signal`,
              tier: EVIDENCE_TIERS.OBSERVED,
              provenance: 'cortex.executor',
              status: VERDICT_STATUS.FAILED,
              metadata: { taskId, result: res }
            }));

            // Mark remaining unexecuted tasks as BLOCKED due to upstream failure
            const remainingIndex = order.indexOf(taskId);
            for (let i = remainingIndex + 1; i < order.length; i++) {
              const nextId = order[i];
              const nextNode = taskGraph.get(nextId);
              if (nextNode && nextNode.status === TASK_STATUS.READY) {
                taskGraph.transition(nextId, TASK_STATUS.BLOCKED, {
                  reason: `Execution aborted due to failure of upstream task "${taskId}"`
                });
              }
            }
            break;
          }

          taskGraph.transition(taskId, TASK_STATUS.COMPLETED, res || { completed: true });
          executedTaskIds.push(taskId);

          this.evidenceLedger.add(new EvidenceRecord({
            claim: `Task "${taskId}" executed successfully`,
            tier: EVIDENCE_TIERS.OBSERVED,
            provenance: 'cortex.executor',
            status: VERDICT_STATUS.VERIFIED,
            metadata: { taskId, result: res || { completed: true } }
          }));
        } catch (err) {
          executionFailed = true;
          failureError = err;
          if (node.status === TASK_STATUS.RUNNING) {
            taskGraph.transition(taskId, TASK_STATUS.FAILED, {
              message: err.message,
              stack: err.stack
            });
          }
          this.evidenceLedger.add(new EvidenceRecord({
            claim: `Task "${taskId}" execution failed: ${err.message}`,
            tier: EVIDENCE_TIERS.OBSERVED,
            provenance: 'cortex.executor',
            status: VERDICT_STATUS.FAILED,
            metadata: { taskId, error: err.message }
          }));

          // Mark remaining unexecuted tasks as BLOCKED due to upstream failure
          const remainingIndex = order.indexOf(taskId);
          for (let i = remainingIndex + 1; i < order.length; i++) {
            const nextId = order[i];
            const nextNode = taskGraph.get(nextId);
            if (nextNode && nextNode.status === TASK_STATUS.READY) {
              taskGraph.transition(nextId, TASK_STATUS.BLOCKED, {
                reason: `Execution aborted due to failure of upstream task "${taskId}"`
              });
            }
          }
          break;
        }
      }

      const checkpoint = this.checkpointManager.createSnapshot({
        checkpointId: `cortex-${Date.now()}`,
        phase: 'EXECUTION',
        tasks: taskGraph.getAll(),
        evidence: this.evidenceLedger.records,
        modifiedFiles: []
      });

      if (executionFailed) {
        return {
          engine: 'Cortex',
          status: CORTEX_EXECUTION_STATUS.FAILED,
          mode: plan.mode,
          tier: plan.tier,
          message: `Workflow execution failed at task: ${failureError?.message || 'unknown error'}`,
          checkpointId: checkpoint.checkpointId,
          taskCount: taskGraph.size(),
          executedSteps: executedTaskIds,
          taskGraph,
          plan
        };
      }

      return {
        engine: 'Cortex',
        status: CORTEX_EXECUTION_STATUS.COMPLETED,
        mode: plan.mode,
        tier: plan.tier,
        message: plan.tier === TASK_TIERS.TIER_1_STANDARD
          ? 'Standard scoped task executed successfully via provided executor.'
          : 'Complex task graph executed with recovery checkpointing.',
        checkpointId: checkpoint.checkpointId,
        taskCount: taskGraph.size(),
        executedSteps: executedTaskIds,
        taskGraph,
        plan
      };
    }

    // Honest status under DEC-31 & Rule 2:
    // Workflow is planned and ready for execution, but no host executor was provided.
    const checkpoint = this.checkpointManager.createSnapshot({
      checkpointId: `cortex-${Date.now()}`,
      phase: 'PLANNING',
      tasks: taskGraph.getAll(),
      evidence: this.evidenceLedger.records,
      modifiedFiles: []
    });

    return {
      engine: 'Cortex',
      status: CORTEX_EXECUTION_STATUS.READY_FOR_EXECUTION,
      mode: plan.mode,
      tier: plan.tier,
      message: 'Task workflow planned and ready for host execution. Provide an executor to run tasks.',
      checkpointId: checkpoint.checkpointId,
      taskCount: taskGraph.size(),
      plannedSteps: taskGraph.getAll().map(t => ({ id: t.id, title: t.title, status: t.status })),
      taskGraph,
      plan
    };
  }

  /**
   * Diagnostic inspection of Cortex decision tree for a given prompt.
   * @param {string} prompt
   * @param {object} [options={}]
   * @returns {object}
   */
  inspect(prompt, options = {}) {
    const plan = this.resolve(prompt, options);
    return {
      cortexEngine: 'ONLINE',
      version: VERSION,
      inspectionTarget: prompt,
      intentClassification: {
        mode: plan.mode,
        tier: plan.tier,
        isExecutionAuthorized: plan.isExecutionAuthorized
      },
      skills: {
        explicitDetected: plan.explicitSkills,
        nativeCapabilitiesResolved: plan.activeCapabilities.length,
        capabilities: plan.activeCapabilities
      },
      governance: {
        rule4GateActive: !plan.isExecutionAuthorized,
        hostDetected: plan.host,
        delegationStrategy: plan.workflow.delegationStrategy,
        requiresSubagent: plan.workflow.requiresSubagent
      },
      budgetCeiling: plan.budget.maxTokens,
      estimatedTokens: plan.budget.estimatedTokens
    };
  }

  /**
   * Get operational health and readiness status of the Cortex engine.
   * @returns {object}
   */
  getStatus() {
    return {
      engine: 'Cortex',
      version: VERSION,
      status: 'ONLINE',
      isDefault: true,
      role: 'Native Default Intelligence Layer',
      registrySize: this.registry.size(),
      activeInvariants: [
        'Rule 4: Discussion & Execution Gate',
        'Four-Tier Epistemic Evidence Classification',
        'Adaptive Token & Effort Ceilings',
        'Negative Trigger Enforcement',
        'Zero-External-Dependency Runtime'
      ],
      supportedTiers: Object.values(TASK_TIERS),
      supportedHosts: Object.values(HOST_NAMES)
    };
  }
}

/**
 * Creates and returns a ready-to-use CortexOrchestrator instance.
 * @param {object} [options]
 * @returns {CortexOrchestrator}
 */
export function createDefaultCortex(options = {}) {
  return new CortexOrchestrator(options);
}
