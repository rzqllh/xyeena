/**
 * Xyeena Core - Default Capability Registry & 64 Contract Seed (P10 / DEC-27)
 * High-performance, zero-external-dependency contract repository.
 * Binds all 64 native capability contracts to executable method handlers.
 */

import { CAPABILITY_LAYERS, CapabilityRegistry } from './registry.mjs';
import {
  ThinkingMethods,
  EngineeringMethods,
  DesignMethods,
  QualityMethods,
  SecurityMethods,
  DeliveryMethods,
  ExtensibilityMethods,
  KnowledgeMethods,
  CoordinationMethods
} from '../methods/index.mjs';
import { BehavioralKernel } from './kernel.mjs';
import { EpistemicEvidenceClassifier } from './evidence.mjs';
import { CapabilityResolver } from './resolver.mjs';
import { ContextCompactor } from '../runtime/compaction.mjs';
import { TaskGraph } from '../runtime/task-dag.mjs';
import { MemoryStore } from '../runtime/memory.mjs';
import { CheckpointManager } from '../runtime/checkpoint.mjs';

/**
 * Complete canonical list of all 64 native capability contracts.
 */
export const DEFAULT_CAPABILITIES = Object.freeze([
  // 1. CORE DOMAIN (L0 Kernel & Invariants)
  {
    id: 'core.intent',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L0,
    name: 'Intent & Authority Classification',
    purpose: 'Classify user intent, authority level, and execution mode without ceremony.',
    positive_trigger: 'All incoming requests'
  },
  {
    id: 'core.authority',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L0,
    name: 'Authority & Boundary Enforcement',
    purpose: 'Enforce task consent boundaries and prevent unauthorized system mutations.',
    positive_trigger: 'All state-changing tasks'
  },
  {
    id: 'core.evidence',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L0,
    name: 'Epistemic Evidence Tiers',
    purpose: 'Enforce distinction between VERIFIED, INFERRED, UNKNOWN, and PROPOSED claims.',
    positive_trigger: 'All assertions, completions, and review claims'
  },
  {
    id: 'core.capability-routing',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L0,
    name: 'Adaptive Capability Routing',
    purpose: 'Resolve minimal, lazy-loaded capability sets according to task tier and intent.',
    positive_trigger: 'Incoming user requests'
  },
  {
    id: 'core.requirement-drift',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Requirement Drift Detection',
    purpose: 'Detect speculative additions and unfulfilled requirements during implementation.',
    positive_trigger: 'Scope checks, PR review, task completion'
  },
  {
    id: 'core.decision-framing',
    domain: 'core',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Decision Framing & ADR Authoring',
    purpose: 'Structure Architecture Decision Records with context, decision, and consequences.',
    positive_trigger: 'Architectural crossroads, technical decisions'
  },

  // 2. QUALITY DOMAIN (L1 / L2)
  {
    id: 'quality.anti-slop',
    domain: 'quality',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Anti-Slop Hygiene Filter',
    purpose: 'Sanitize redundant AI code comments and eliminate robotic copywriting clichés.',
    positive_trigger: 'Code creation, prose editing, documentation writing'
  },
  {
    id: 'quality.lean',
    domain: 'quality',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Lean Diff Auditing',
    purpose: 'Prevent speculative helper abstractions and enforce minimal coherent diffs.',
    positive_trigger: 'Diff review, pull requests, refactoring'
  },
  {
    id: 'quality.context-economy',
    domain: 'quality',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Context Compaction & Economy',
    purpose: 'Compact session history into high-density state without losing crucial context.',
    positive_trigger: 'Long conversations, session handoff, context recovery'
  },

  // 3. THINKING & REASONING DOMAIN
  {
    id: 'thinking.discovery',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Problem Discovery & Sizing',
    purpose: 'Structure problem discovery and constraint sizing before proposing architecture.',
    positive_trigger: 'New features, ambiguous bug reports, exploratory tasks'
  },
  {
    id: 'thinking.research',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Primary-Source Research Evaluation',
    purpose: 'Validate primary sources and flag ungrounded secondary blog citations.',
    positive_trigger: 'Technical investigations, library selection, API lookups'
  },
  {
    id: 'thinking.plan',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Phased Planning & Gating',
    purpose: 'Compose reviewable, phased execution plans with explicit rollback and gate commands.',
    positive_trigger: 'Multi-step tasks, cross-module features, migrations'
  },
  {
    id: 'thinking.hypothesis',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Falsifiable Hypothesis Formulation',
    purpose: 'Formulate ranked hypotheses with explicit disproof criteria for debugging.',
    positive_trigger: 'Hard bugs, regressions, performance bottlenecks'
  },
  {
    id: 'thinking.domain-model',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Domain Modeling & Ubiquitous Language',
    purpose: 'Define bounded domain entities, invariants, and ubiquitous glossary terms.',
    positive_trigger: 'Data modeling, schema design, domain boundaries'
  },
  {
    id: 'thinking.counterexample',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Adversarial Counterexample Generation',
    purpose: 'Generate stress-testing edge cases and falsification criteria for architectural claims.',
    positive_trigger: 'Architecture stress testing, security boundaries, edge cases'
  },
  {
    id: 'thinking.grill',
    domain: 'thinking',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Relentless Decision Stress-Testing (Grill)',
    purpose: 'Interrogate plan assumptions, expose single points of failure, and enforce rollback paths.',
    positive_trigger: 'Plan reviews, irreversible decisions, architectural sign-off'
  },

  // 4. ENGINEERING DOMAIN
  {
    id: 'engineering.architecture',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Deep Module Seam Evaluation',
    purpose: 'Evaluate module seams: distinguish deep modules from shallow wrappers.',
    positive_trigger: 'Module extraction, refactoring, API boundary design'
  },
  {
    id: 'engineering.application-logic',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Application Logic Isolation',
    purpose: 'Separate pure business logic from UI, transport, and infrastructure wrappers.',
    positive_trigger: 'Backend services, controllers, business rules'
  },
  {
    id: 'engineering.root-cause',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Root Cause 5-Whys Tracing',
    purpose: 'Trace defects to fundamental root causes rather than stacking superficial patches.',
    positive_trigger: 'Bug fixes, regressions, production incidents'
  },
  {
    id: 'engineering.tdd',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'TDD Red-Green-Refactor Gating',
    purpose: 'Enforce test-first discipline: verify failing test (RED) prior to implementation.',
    positive_trigger: 'Feature implementation, bug fixes, algorithmic changes'
  },
  {
    id: 'engineering.test-strategy',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Balanced Test Strategy Formulation',
    purpose: 'Formulate fast, deterministic unit and integration test strategies.',
    positive_trigger: 'Testing roadmaps, QA planning, test suite optimization'
  },
  {
    id: 'engineering.code-review',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Dual-Axis Code Review',
    purpose: 'Review code along two independent axes: Standards Compliance and Spec Satisfaction.',
    positive_trigger: 'PR reviews, commit audits, diff inspection'
  },
  {
    id: 'engineering.performance',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Performance Budget Auditing',
    purpose: 'Audit latency, CPU, and memory budgets against empirical ceilings.',
    positive_trigger: 'Performance tuning, latency regressions, load testing'
  },
  {
    id: 'engineering.reliability',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Reliability & Circuit Breaking',
    purpose: 'Formulate backoff, circuit breaking, and graceful degradation strategies.',
    positive_trigger: 'External API integrations, distributed calls, resilience'
  },
  {
    id: 'engineering.data',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Two-Phase Data Migration',
    purpose: 'Plan safe, zero-downtime expand/contract schema and data migrations.',
    positive_trigger: 'Database changes, schema refactoring, state migrations'
  },
  {
    id: 'engineering.release',
    domain: 'engineering',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Release Readiness Verification',
    purpose: 'Verify release checklist: tests, provenance, notices, package contents.',
    positive_trigger: 'Release candidate checks, pre-publish validation'
  },

  // 5. DESIGN & ACCESSIBILITY DOMAIN
  {
    id: 'design.experience',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'User Experience Flow Validation',
    purpose: 'Validate end-to-end user flows, state transitions, and interaction clarity.',
    positive_trigger: 'UI flows, onboarding, multi-step forms'
  },
  {
    id: 'design.interface',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Token Architecture & Hierarchy',
    purpose: 'Enforce three-tier token architecture (primitive -> semantic -> component).',
    positive_trigger: 'Design systems, styling, component design'
  },
  {
    id: 'design.direction',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Visual Design Direction',
    purpose: 'Formulate purposeful design direction briefs and anti-generic visual identity.',
    positive_trigger: 'New UI surfaces, branding, aesthetic shaping'
  },
  {
    id: 'design.visual-critique',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Visual Hierarchy Critique',
    purpose: 'Critique focal points, typographical scale, and spatial balance.',
    positive_trigger: 'UI reviews, landing pages, dashboard redesigns'
  },
  {
    id: 'design.accessibility',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'WCAG Contrast & Math',
    purpose: 'Compute exact WCAG 2.1 relative luminance and contrast ratios (4.5:1 / 3:1 / 7:1).',
    positive_trigger: 'Color palette review, accessibility audits, text readability'
  },
  {
    id: 'design.responsive',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Responsive & Reduced Motion',
    purpose: 'Verify media queries, container queries, and prefers-reduced-motion support.',
    positive_trigger: 'Mobile layouts, CSS animations, responsive breakpoints'
  },
  {
    id: 'design.color-theory',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: '60/30/10 Color Harmony',
    purpose: 'Evaluate dominant, secondary, and accent color proportions.',
    positive_trigger: 'Theme generation, palette formulation, UI polish'
  },
  {
    id: 'design.platform-guidelines',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Platform Guidelines Compliance',
    purpose: 'Audit against Apple Human Interface Guidelines and Google Material Design 3.',
    positive_trigger: 'Mobile app UI, native look-and-feel, platform consistency'
  },
  {
    id: 'design.system',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Design System Governance',
    purpose: 'Audit component reusability, token layering, and design consistency.',
    positive_trigger: 'Component libraries, design token updates'
  },
  {
    id: 'design.motion',
    domain: 'design',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Functional Motion Design',
    purpose: 'Design purpose-driven easing curves and micro-interaction timing.',
    positive_trigger: 'Transitions, modal dialogs, layout animations'
  },

  // 6. SECURITY DOMAIN
  {
    id: 'security.guidance',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Defensive Security Guidance',
    purpose: 'Provide passive, principle-of-least-privilege guidance for auth, CORS, and secrets.',
    positive_trigger: 'Security questions, auth configuration, defensive design'
  },
  {
    id: 'security.threat-model',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'STRIDE Threat Modeling',
    purpose: 'Deconstruct trust boundaries and enumerate STRIDE threats with mitigations.',
    positive_trigger: 'Architecture review, new API boundaries, data pipelines'
  },
  {
    id: 'security.scoped-review',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Scoped Diff Security Review',
    purpose: 'Inspect proposed code changes and diffs for OWASP Top 10 vulnerabilities.',
    positive_trigger: 'Diff review, auth PRs, sensitive data handling'
  },
  {
    id: 'security.full-audit',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Full Security Audit Gate',
    purpose: 'Repository-wide security sweep. Strictly gates activation on explicit owner consent.',
    positive_trigger: 'Explicit full security audit request',
    negative_trigger: 'Must not activate on passive queries or routine coding tasks'
  },
  {
    id: 'security.findings-validation',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Cloudflare Structured Finding Validation',
    purpose: 'Validate security findings against structured schema with CWE, severity, and remediation.',
    positive_trigger: 'Audit reports, vulnerability triage'
  },
  {
    id: 'security.hardening',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Hardening Specification',
    purpose: 'Formulate security headers, CSP rules, cookie flags, and rate-limiting specs.',
    positive_trigger: 'Production deployment, server configuration, web security'
  },
  {
    id: 'security.retest',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Retest Remediation Verification',
    purpose: 'Verify evidence that reported vulnerabilities have been remediated and proven by test.',
    positive_trigger: 'Security fixes, vulnerability closure'
  },
  {
    id: 'security.skill-supply-chain',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Skill Supply Chain Vetting',
    purpose: 'Audit third-party skills for provenance, suspicious executable scripts, and license compatibility.',
    positive_trigger: 'Skill installation, plugin evaluation, third-party adoption'
  },
  {
    id: 'security.runtime-isolation',
    domain: 'security',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Runtime Boundary & Isolation',
    purpose: 'Verify task sandboxing, path confinement, and prevent prompt injection traversal.',
    positive_trigger: 'Task runner execution, subagent dispatch'
  },

  // 7. COORDINATION DOMAIN
  {
    id: 'coordination.local-skill-discovery',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Local Skill Discovery',
    purpose: 'Discover installed Agent Skills and plugins in workspace and global locations.',
    positive_trigger: 'Runtime startup, capability resolution'
  },
  {
    id: 'coordination.agent-discovery',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Agent Definition Discovery',
    purpose: 'Discover specialized agent definitions (.agents/personas/) without overwriting them.',
    positive_trigger: 'Agent routing, role specialization'
  },
  {
    id: 'coordination.graph',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Task DAG Execution Gating',
    purpose: 'Manage task dependency graphs, topological sorting, and dependency gating.',
    positive_trigger: 'Multi-task execution, phased plans, subagent orchestration'
  },
  {
    id: 'coordination.explainability',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Execution Plan Explainability',
    purpose: 'Provide transparent explanations for capability routing and task dispatch decisions.',
    positive_trigger: 'Task previews, diagnostic logs'
  },
  {
    id: 'coordination.dispatch',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Task Dispatch Consent Gate',
    purpose: 'Gate external and destructive operations on explicit task authorization.',
    positive_trigger: 'Terminal command execution, subagent dispatch'
  },
  {
    id: 'coordination.recovery',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Durable Checkpoint & Crash Recovery',
    purpose: 'Persist execution state snapshots and resume without re-running verified tasks.',
    positive_trigger: 'Session resume, process restart recovery'
  },
  {
    id: 'coordination.isolation',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Runtime Isolation Boundary',
    purpose: 'Enforce task scope containment and prevent cross-agent workspace collisions.',
    positive_trigger: 'Multi-agent orchestration, parallel worker dispatch'
  },
  {
    id: 'coordination.external-discovery',
    domain: 'coordination',
    layer: CAPABILITY_LAYERS.L1,
    name: 'External Discovery Gate',
    purpose: 'Disallow unsolicited external network discovery without explicit user instruction.',
    positive_trigger: 'External tool lookup'
  },

  // 8. KNOWLEDGE DOMAIN
  {
    id: 'knowledge.memory',
    domain: 'knowledge',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Scoped Persistent Memory',
    purpose: 'Store persistent decisions, conventions, and learnings across sessions safely.',
    positive_trigger: 'Memory store, recall, decision tracking'
  },
  {
    id: 'knowledge.compaction',
    domain: 'knowledge',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Context Compaction Engine',
    purpose: 'Compact session state into high-density representation under token constraints.',
    positive_trigger: 'Context recovery, token budget management'
  },
  {
    id: 'knowledge.research-quality',
    domain: 'knowledge',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Grounded Research Citation Quality',
    purpose: 'Verify citations against local source files and prevent hallucinated references.',
    positive_trigger: 'Documentation, technical research'
  },
  {
    id: 'knowledge.reasoning-discipline',
    domain: 'knowledge',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Epistemic Discipline Classification',
    purpose: 'Classify output statements into Observed, Inferred, Unknown, and Proposed.',
    positive_trigger: 'Audit reports, completion claims'
  },

  // 9. EXTENSIBILITY DOMAIN
  {
    id: 'extensibility.skill-authoring',
    domain: 'extensibility',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Agent Skill Manifest Authoring',
    purpose: 'Validate and scaffold standard SKILL.md and capability manifests.',
    positive_trigger: 'Skill creation, skill repairing'
  },
  {
    id: 'extensibility.skill-evaluation',
    domain: 'extensibility',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Skill Quality & Performance Audit',
    purpose: 'Audit third-party skills against Antigravity, Claude, and Codex specs.',
    positive_trigger: 'Skill review, plugin auditing'
  },
  {
    id: 'extensibility.mcp-design',
    domain: 'extensibility',
    layer: CAPABILITY_LAYERS.L1,
    name: 'MCP Tool Schema Validation',
    purpose: 'Validate Model Context Protocol tool schemas, inputs, and security boundaries.',
    positive_trigger: 'MCP server authoring, tool integration'
  },

  // 10. DELIVERY DOMAIN
  {
    id: 'delivery.documentation',
    domain: 'delivery',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Documentation Rubric Quality',
    purpose: 'Enforce human-first, concise technical documentation without generic filler.',
    positive_trigger: 'README writing, API guides, user documentation'
  },
  {
    id: 'delivery.product-copy',
    domain: 'delivery',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Human UX Microcopy Generation',
    purpose: 'Compose direct, functional action labels and dialog microcopy.',
    positive_trigger: 'UI copy, button text, error messages'
  },
  {
    id: 'delivery.artifacts',
    domain: 'delivery',
    layer: CAPABILITY_LAYERS.L1,
    name: 'Structured Artifact Delivery',
    purpose: 'Compose persistent structured Markdown artifacts with verified metadata.',
    positive_trigger: 'Deliverables generation, summary reports'
  },
  {
    id: 'delivery.release-check',
    domain: 'delivery',
    layer: CAPABILITY_LAYERS.L2,
    name: 'Pre-Release Artifact Check',
    purpose: 'Audit metadata, userFacing flags, and feedback requests before handoff.',
    positive_trigger: 'Final delivery, completion handoff'
  }
]);

/**
 * Concrete, executable handler mappings for all 64 capability contracts.
 */
export const CAPABILITY_HANDLERS = Object.freeze({
  'core.intent': (args) => new BehavioralKernel().formatKernelPrompt(),
  'core.authority': (args) => new BehavioralKernel().formatKernelPrompt(),
  'core.evidence': (args) => EpistemicEvidenceClassifier.classify(args?.claim || 'claim', args?.provenance || ''),
  'core.capability-routing': (args) => new CapabilityResolver().resolve(args?.prompt || '', args?.mode || 'DISCUSSION', args?.tier || 'TIER_0_MICRO'),
  'quality.anti-slop': (args) => QualityMethods.sanitizeCodeComments(args?.code || '// test\nconst x = 1;'),
  'quality.lean': (args) => QualityMethods.auditLeanDiff(args?.diff || 'diff --git a/a b/b\n+const x = 1;'),
  'quality.context-economy': (args) => ContextCompactor.compactState(args?.records || [{ key: 'k', value: 'v' }], args?.budget || 1000),
  'core.requirement-drift': (args) => ThinkingMethods.detectRequirementDrift({ agreedScope: args?.agreedScope || ['scope'], actualChanges: args?.actualChanges || ['scope'] }),
  'core.decision-framing': (args) => DeliveryMethods.composeAdr({ id: args?.id || 'ADR-001', title: args?.title || 'Title', status: args?.status || 'PROPOSED', context: args?.context || 'Context', decision: args?.decision || 'Decision', consequences: args?.consequences || 'Consequences' }),
  'thinking.discovery': (args) => ThinkingMethods.sizeProblem(args?.problem || 'prob', args?.constraints || []),
  'thinking.research': (args) => ThinkingMethods.conductResearchEvaluation({ topic: args?.topic || 'topic', primarySources: args?.primarySources || [], secondarySources: args?.secondarySources || [] }),
  'thinking.plan': (args) => ThinkingMethods.composePhasedPlan({ goal: args?.goal || 'goal', phases: args?.phases || [{ name: 'Phase 1', tasks: [] }] }),
  'thinking.hypothesis': (args) => ThinkingMethods.rankHypotheses(args?.symptom || 'symptom', args?.candidates || [{ name: 'h1', mechanism: 'm', testCommand: 'cmd' }]),
  'thinking.domain-model': (args) => ThinkingMethods.defineDomainModel({ domainName: args?.domainName || 'domain', entities: args?.entities || ['Entity'] }),
  'thinking.counterexample': (args) => ThinkingMethods.evaluateCounterexamples({ claim: args?.claim || 'claim', counterexamples: args?.counterexamples || ['counter'] }),
  'engineering.architecture': (args) => EngineeringMethods.evaluateModuleSeam({ moduleName: args?.moduleName || 'mod', interfaceSurface: args?.interfaceSurface || ['fn()'] }),
  'engineering.application-logic': (args) => EngineeringMethods.evaluateApplicationLogic({ entrypoint: args?.entrypoint || 'app.js', dependencies: args?.dependencies || [] }),
  'engineering.root-cause': (args) => EngineeringMethods.traceRootCause5Whys({ symptom: args?.symptom || 'failure', whyChain: args?.whyChain || ['step 1'] }),
  'engineering.tdd': (args) => EngineeringMethods.verifyTddCycle(args?.stage || 'GREEN', { testFailedInitially: args?.testFailedInitially ?? true, testPassedAfterCode: args?.testPassedAfterCode ?? true }),
  'engineering.test-strategy': (args) => EngineeringMethods.formulateTestStrategy({ component: args?.component || 'comp', riskLevel: args?.riskLevel || 'LOW' }),
  'engineering.code-review': (args) => EngineeringMethods.dualAxisReview(args?.diff || 'diff', args?.rubric || {}),
  'engineering.performance': (args) => EngineeringMethods.auditPerformanceBudget({ budgetMs: args?.budgetMs || 100, actualMs: args?.actualMs || 50 }),
  'engineering.reliability': (args) => EngineeringMethods.evaluateReliabilityStrategy({ service: args?.service || 'svc', failureModes: args?.failureModes || ['timeout'] }),
  'engineering.data': (args) => EngineeringMethods.planTwoPhaseMigration({ migrationName: args?.migrationName || 'mig', steps: args?.steps || [] }),
  'design.experience': (args) => DesignMethods.evaluateUserExperienceFlow({ userGoal: args?.userGoal || 'checkout', steps: args?.steps || ['cart'] }),
  'design.interface': (args) => DesignMethods.validateTokenArchitecture(Array.isArray(args) ? args : (args?.tokens || [{ name: 'color.primary', value: '#000', layer: 'semantic' }])),
  'design.direction': (args) => DesignMethods.formulateDesignDirection({ projectType: args?.projectType || 'web', targetAudience: args?.targetAudience || 'users' }),
  'design.visual-critique': (args) => DesignMethods.critiqueVisualHierarchy({ layoutTree: args?.layoutTree || {} }),
  'design.accessibility': (args) => DesignMethods.calculateWcagContrast(args?.foreground || '#000000', args?.background || '#ffffff'),
  'design.responsive': (args) => DesignMethods.verifyReducedMotionSupport(args?.cssText || '@media (prefers-reduced-motion) { * {} }'),
  'design.color-theory': (args) => DesignMethods.evaluate603010Heuristic({ dominant: args?.dominant || '#ffffff', secondary: args?.secondary || '#000000', accent: args?.accent || '#ff0000' }),
  'design.platform-guidelines': (args) => DesignMethods.auditPlatformGuidelines({ platform: args?.platform || 'web', components: args?.components || ['button'] }),
  'design.system': (args) => DesignMethods.validateTokenArchitecture(Array.isArray(args) ? args : (args?.tokens || [{ name: 'color.primary', value: '#000', layer: 'semantic' }])),
  'design.motion': (args) => DesignMethods.designMotionCurve(args?.durationMs || 300, args?.easing || 'ease-in-out'),
  'security.guidance': (args) => SecurityMethods.getDefensiveGuidance(args?.vulnerabilityClass || 'injection'),
  'security.threat-model': (args) => SecurityMethods.composeStrideThreatModel(args?.systemName || 'sys', args?.assets || ['db']),
  'security.scoped-review': (args) => SecurityMethods.auditScopedDiffSecurity(args?.diff || 'diff', args?.scope || {}),
  'coordination.local-skill-discovery': (args) => CoordinationMethods.auditLocalSkillDiscovery(args?.workspaceDir || process.cwd()),
  'coordination.agent-discovery': (args) => CoordinationMethods.auditAgentDiscovery(args?.agentsDir || process.cwd()),
  'coordination.graph': (args) => new TaskGraph(),
  'coordination.explainability': (args) => CoordinationMethods.generateExecutionExplanation(args?.task || { id: 't1' }, args?.evidence || []),
  'knowledge.memory': (args) => new MemoryStore(),
  'knowledge.compaction': (args) => ContextCompactor.compactState(args?.records || [{ key: 'k', value: 'v' }], args?.budget || 1000),
  'knowledge.research-quality': (args) => KnowledgeMethods.evaluateResearchQuality(args?.citation || { source: 'docs', primary: true }),
  'knowledge.reasoning-discipline': (args) => KnowledgeMethods.classifyReasoningDiscipline(args?.reasoningTrace || 'First principles analysis'),
  'extensibility.skill-authoring': (args) => ExtensibilityMethods.validateSkillManifest(args?.markdownContent || '---\nname: skill\ndescription: desc\n---\n# Body'),
  'extensibility.skill-evaluation': (args) => ExtensibilityMethods.evaluateSkillQuality(args?.skillPath || process.cwd()),
  'extensibility.mcp-design': (args) => ExtensibilityMethods.validateMcpToolSchema(args?.schema || { name: 'tool', parameters: {} }),
  'delivery.documentation': (args) => DeliveryMethods.auditDocumentationRubric(args?.markdown || '# Readme\n\n```bash\nnpm test\n```'),
  'delivery.product-copy': (args) => DeliveryMethods.composeHumanUxCopy({ stateType: args?.stateType || 'EMPTY', headline: args?.headline || 'No items', body: args?.body || 'Add an item to get started', actionLabel: args?.actionLabel || 'Create Item' }),
  'delivery.artifacts': (args) => DeliveryMethods.composeStructuredArtifact({ title: args?.title || 'Report', summary: args?.summary || 'Summary', sections: args?.sections || [{ label: 'Details', content: 'Content' }] }),
  'thinking.grill': (args) => ThinkingMethods.grillPlanOrDecision(args?.topic || 'plan', args?.assumptions || ['assump']),
  'engineering.release': (args) => EngineeringMethods.evaluateReleaseReadiness({ checks: args?.checks || [{ name: 'lint', passed: true }] }),
  'security.full-audit': (args) => SecurityMethods.assertAuditActivationAllowed(args?.prompt || 'full security audit', args?.mode || 'EXPLICIT_RISK_GATE'),
  'security.findings-validation': (args) => SecurityMethods.validateFinding({ findingId: args?.findingId || 'SEC-1', severity: args?.severity || 'HIGH' }),
  'security.hardening': (args) => SecurityMethods.formulateHardeningSpec({ component: args?.component || 'auth', policies: args?.policies || ['tls'] }),
  'security.retest': (args) => SecurityMethods.verifyRetestRemediation({ findingId: args?.findingId || 'SEC-1', retestCommand: args?.retestCommand || 'npm test', pass: args?.pass ?? true }),
  'security.skill-supply-chain': (args) => SecurityMethods.auditSkillSupplyChain(args?.packageJson || { dependencies: {} }),
  'security.runtime-isolation': (args) => SecurityMethods.verifyRuntimeIsolation({ runtime: args?.runtime || 'antigravity', mode: args?.mode || 'copy' }),
  'coordination.dispatch': (args) => CoordinationMethods.assertTaskDispatchConsent(args?.task || { id: 't1' }, args?.consentGiven ?? true),
  'coordination.recovery': (args) => new CheckpointManager(),
  'coordination.isolation': (args) => CoordinationMethods.verifyIsolationBoundary(args?.path || process.cwd()),
  'delivery.release-check': (args) => DeliveryMethods.formatArtifactMetadata({ summary: args?.summary || 'Doc summary', userFacing: args?.userFacing ?? true }),
  'coordination.external-discovery': (args) => CoordinationMethods.assertExternalDiscoveryGate(args?.prompt || 'search external registry')
});

/**
 * Creates and returns a pre-seeded, validated CapabilityRegistry instance
 * containing all 64 official native capability contracts with executable handlers.
 * @returns {CapabilityRegistry}
 */
export function createDefaultRegistry() {
  const registry = new CapabilityRegistry();
  for (const cap of DEFAULT_CAPABILITIES) {
    const handler = CAPABILITY_HANDLERS[cap.id] || null;
    registry.register({
      ...cap,
      handler
    });
  }
  registry.validate();
  return registry;
}
