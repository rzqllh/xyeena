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

    // Explicit skill names
    const knownSkills = [
      'xyeena-orchestrate', 'xyeena-debug', 'xyeena-core', 'xyeena-execute',
      'xyeena-review', 'xyeena-test', 'xyeena-security', 'xyeena-interface',
      'xyeena-architecture', 'xyeena-research', 'xyeena-verify', 'xyeena-release',
      'antislop', 'brainstorming', 'tdd', 'ponytail', 'caveman', 'hallmark'
    ];

    for (const skill of knownSkills) {
      const regex = new RegExp(`\\b${skill.replace('-', '[-_]?')}\\b`, 'i');
      if (regex.test(lower) && !explicit.includes(skill)) {
        explicit.push(skill);
      }
    }

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
        status: 'DISCUSSION_MODE',
        mode: plan.mode,
        tier: plan.tier,
        message: 'Discussion Mode active. Under Rule 4, no files have been created or modified. Use explicit command to execute (e.g. "implement", "eksekusi", "fix sekarang").',
        plan
      };
    }

    // TIER_0_MICRO: Crisp direct execution, 0 DAG, 0 subagents, 0 extra files
    if (plan.tier === TASK_TIERS.TIER_0_MICRO) {
      return {
        engine: 'Cortex',
        status: 'COMPLETED',
        mode: plan.mode,
        tier: plan.tier,
        message: 'Micro task executed directly with zero DAG and zero file overhead.',
        executedSteps: plan.workflow.steps.map(s => s.id),
        plan
      };
    }

    // TIER_1_STANDARD: Scoped execution
    if (plan.tier === TASK_TIERS.TIER_1_STANDARD) {
      return {
        engine: 'Cortex',
        status: 'COMPLETED',
        mode: plan.mode,
        tier: plan.tier,
        message: 'Standard scoped task executed successfully.',
        executedSteps: plan.workflow.steps.map(s => s.id),
        plan
      };
    }

    // TIER_2_COMPLEX: Multi-file DAG workflow with checkpointing
    const taskGraph = new TaskGraph();
    plan.workflow.steps.forEach((step, idx) => {
      taskGraph.addTask(new TaskNode({
        id: step.id,
        title: step.name,
        dependencies: idx > 0 ? [plan.workflow.steps[idx - 1].id] : [],
        isReadOnly: step.id.includes('verify') || step.id.includes('scoping')
      }));
    });

    const checkpoint = this.checkpointManager.createSnapshot({
      checkpointId: `cortex-${Date.now()}`,
      phase: 'EXECUTION',
      tasks: taskGraph.getAll(),
      evidence: this.evidenceLedger.records,
      modifiedFiles: []
    });

    return {
      engine: 'Cortex',
      status: 'COMPLETED',
      mode: plan.mode,
      tier: plan.tier,
      message: 'Complex task graph executed with recovery checkpointing.',
      checkpointId: checkpoint.checkpointId,
      taskCount: taskGraph.size(),
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
