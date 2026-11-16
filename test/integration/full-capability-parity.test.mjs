import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ThinkingMethods,
  EngineeringMethods,
  DesignMethods,
  SecurityMethods,
  ExtensibilityMethods,
  KnowledgeMethods,
  CoordinationMethods,
  DeliveryMethods,
  EPISTEMIC_TIERS
} from '../../src/methods/index.mjs';

describe('Xyeena Native Parity & 64 Capability Verification Suite', () => {

  // =========================================================================
  // 1. THINKING & REASONING DOMAIN
  // =========================================================================
  describe('Thinking & Reasoning Domain Capabilities', () => {
    it('[thinking.research] validates primary sources and flags ungrounded secondary blog citations', () => {
      const research = ThinkingMethods.conductResearchEvaluation({
        topic: 'Node.js Test Runner Concurrency',
        sources: [
          { urlOrPath: 'https://nodejs.org/api/test.html', type: 'OFFICIAL_DOC' },
          { urlOrPath: 'https://random-dev-blog.info/post-1', type: 'SECONDARY_BLOG' }
        ],
        findings: [
          { claim: 'Tests run in parallel across isolated processes when concurrency is enabled', sourceRef: 'https://nodejs.org/api/test.html' },
          { claim: 'Node test runner is 100x faster than Jest', sourceRef: 'https://random-dev-blog.info/post-1' }
        ]
      });

      assert.strictEqual(research.verifiedFindingsCount, 1);
      assert.strictEqual(research.ungroundedClaimsCount, 1);
      assert.strictEqual(research.verdict, 'EVIDENCE_INSUFFICIENT');
      assert.ok(research.ungroundedClaims[0].reason.includes('secondary blog'));
    });

    it('[thinking.grill] stress-tests plan assumptions and flags missing rollback paths', () => {
      const fragilePlan = ThinkingMethods.grillPlanOrDecision({
        title: 'Migrate User Table to DynamoDB',
        steps: [
          { name: 'Drop PostgreSQL table', rollbackAvailable: false },
          { name: 'Stream writes to DynamoDB', rollbackAvailable: true }
        ],
        assumptions: [
          { statement: 'DynamoDB latency will never exceed 5ms', verifiedByTest: false }
        ]
      });

      assert.strictEqual(fragilePlan.resilient, false);
      assert.strictEqual(fragilePlan.verdict, 'REVISION_REQUIRED_UNDER_GRILLING');
      assert.ok(fragilePlan.challengeQuestions.length >= 2);

      const battleTestedPlan = ThinkingMethods.grillPlanOrDecision({
        title: 'Dual-Write Storage Migration',
        steps: [
          { name: 'Enable dual write with feature flag', rollbackAvailable: true },
          { name: 'Backfill historical data asynchronously', rollbackAvailable: true }
        ],
        assumptions: [
          { statement: 'Dual writes maintain idempotent timestamps', verifiedByTest: true }
        ]
      });

      assert.strictEqual(battleTestedPlan.resilient, true);
      assert.strictEqual(battleTestedPlan.verdict, 'BATTLE_TESTED_RESILIENT');
    });

    it('[thinking.counterexample] generates falsification edge cases for architectural claims', () => {
      const evaluation = ThinkingMethods.evaluateCounterexamples('JSON parser handles all user payloads', [
        { input: '{"__proto__": {"admin": true}}', expectedFailure: 'Prototype pollution vulnerability' },
        { input: 'A'.repeat(10000000), expectedFailure: 'Out of memory / Denial of Service' }
      ]);

      assert.strictEqual(evaluation.edgeCases.length, 2);
      assert.strictEqual(evaluation.edgeCases[0].potentialFailure, 'Prototype pollution vulnerability');
    });

    it('[core.requirement-drift] flags speculative additions and unfulfilled requirements', () => {
      const driftReport = ThinkingMethods.detectRequirementDrift({
        agreedScope: ['Implement user login route', 'Add password hashing using bcrypt'],
        actualChanges: ['Implement user login route', 'Add password hashing using bcrypt', 'Added unrequested redis cache cluster manager']
      });

      assert.strictEqual(driftReport.hasDrift, true);
      assert.strictEqual(driftReport.unfulfilledRequirements.length, 0);
      assert.strictEqual(driftReport.speculativeAdditions.length, 1);
      assert.ok(driftReport.speculativeAdditions[0].includes('redis cache'));
    });

    it('[core.decision-framing] formats Architecture Decision Record (ADR) with tradeoffs', () => {
      const adr = DeliveryMethods.composeAdr({
        id: 'ADR-042',
        title: 'Use Pure Standard Library for Runtime',
        status: 'ACCEPTED',
        context: 'We require zero runtime dependency supply-chain risks.',
        decision: 'Implement all native methods in pure Node.js 24 without external npm packages.',
        consequences: 'Zero supply chain vulnerabilities, zero node_modules bloat, highly portable.'
      });

      assert.ok(adr.includes('# ADR-042: Use Pure Standard Library for Runtime'));
      assert.ok(adr.includes('**Status:** ACCEPTED'));
      assert.ok(adr.includes('## Consequences'));
    });
  });

  // =========================================================================
  // 2. ENGINEERING DOMAIN
  // =========================================================================
  describe('Engineering Domain Capabilities', () => {
    it('[engineering.application-logic] assesses pure domain isolation from framework coupling', () => {
      const coupled = EngineeringMethods.evaluateApplicationLogic({
        moduleName: 'UserRegistration',
        importedFrameworks: ['express', 'pg'],
        pureFunctionsOnly: false
      });
      assert.strictEqual(coupled.isIsolated, false);
      assert.strictEqual(coupled.verdict, 'FRAMEWORK_COUPLED');

      const pureDomain = EngineeringMethods.evaluateApplicationLogic({
        moduleName: 'OrderPricingEngine',
        importedFrameworks: [],
        pureFunctionsOnly: true
      });
      assert.strictEqual(pureDomain.isIsolated, true);
      assert.strictEqual(pureDomain.verdict, 'CLEAN_DOMAIN_ISOLATION');
    });

    it('[engineering.root-cause] enforces 5-whys depth and rejects superficial investigations', () => {
      const shallow = EngineeringMethods.traceRootCause5Whys({
        symptom: 'Process crashed with OOM',
        whyChain: ['Memory ran out']
      });
      assert.strictEqual(shallow.isSufficientDepth, false);
      assert.strictEqual(shallow.verdict, 'SUPERFICIAL_INVESTIGATION');

      const deep = EngineeringMethods.traceRootCause5Whys({
        symptom: 'Process crashed with OOM',
        whyChain: [
          'Memory ran out',
          'Event listener array grew without bounds',
          'Websocket reconnection handler was never cleaned up on unmount',
          'Component lifecycle cleanup hook was missing in client adapter',
          'Code review checklist lacked explicit lifecycle unmount audit'
        ]
      });
      assert.strictEqual(deep.isSufficientDepth, true);
      assert.strictEqual(deep.verdict, 'SYSTEMIC_ROOT_CAUSE_ISOLATED');
      assert.ok(deep.rootCause.includes('Code review checklist'));
    });

    it('[engineering.test-strategy] enforces balanced test pyramid and flags inverted ice-cream cone', () => {
      const inverted = EngineeringMethods.formulateTestStrategy({
        unitTestsCount: 5,
        integrationTestsCount: 10,
        e2eTestsCount: 50
      });
      assert.strictEqual(inverted.balanced, false);
      assert.strictEqual(inverted.verdict, 'INVERTED_TEST_ICE_CREAM_CONE');

      const pyramid = EngineeringMethods.formulateTestStrategy({
        unitTestsCount: 80,
        integrationTestsCount: 20,
        e2eTestsCount: 5
      });
      assert.strictEqual(pyramid.balanced, true);
      assert.strictEqual(pyramid.verdict, 'BALANCED_TEST_PYRAMID');
    });

    it('[engineering.performance] checks latency against budgeted SLA', () => {
      const pass = EngineeringMethods.auditPerformanceBudget({
        operationName: 'TokenEstimation',
        measuredLatencyMs: 2,
        budgetLatencyMs: 10
      });
      assert.strictEqual(pass.compliant, true);
      assert.strictEqual(pass.verdict, 'WITHIN_PERFORMANCE_BUDGET');

      const fail = EngineeringMethods.auditPerformanceBudget({
        operationName: 'FullTextSearch',
        measuredLatencyMs: 450,
        budgetLatencyMs: 200
      });
      assert.strictEqual(fail.compliant, false);
      assert.strictEqual(fail.verdict, 'SLA_BUDGET_BREACH');
    });

    it('[engineering.reliability] enforces exponential backoff with jitter and rejects dangerous retries', () => {
      const dangerous = EngineeringMethods.evaluateReliabilityStrategy({
        maxRetries: 20,
        backoffType: 'CONSTANT',
        maxDelayMs: 500,
        jitterEnabled: false
      });
      assert.strictEqual(dangerous.isSafe, false);
      assert.strictEqual(dangerous.verdict, 'DANGEROUS_RETRY_CONFIG');

      const safe = EngineeringMethods.evaluateReliabilityStrategy({
        maxRetries: 3,
        backoffType: 'EXPONENTIAL',
        maxDelayMs: 5000,
        jitterEnabled: true
      });
      assert.strictEqual(safe.isSafe, true);
      assert.strictEqual(safe.verdict, 'RESILIENT_BACKOFF_CONFIG');
    });

    it('[engineering.release] gates release on passing tests, clean tree, and rollback procedure', () => {
      const blocked = EngineeringMethods.evaluateReleaseReadiness({
        allTestsPassing: false,
        zeroBlockingBugs: true,
        cleanWorkingTree: true,
        rollbackDocumented: false
      });
      assert.strictEqual(blocked.ready, false);
      assert.strictEqual(blocked.verdict, 'RELEASE_GATE_BLOCKED');
      assert.strictEqual(blocked.blockingReasons.length, 2);

      const approved = EngineeringMethods.evaluateReleaseReadiness({
        allTestsPassing: true,
        zeroBlockingBugs: true,
        cleanWorkingTree: true,
        rollbackDocumented: true
      });
      assert.strictEqual(approved.ready, true);
      assert.strictEqual(approved.verdict, 'RELEASE_GATE_APPROVED');
    });
  });

  // =========================================================================
  // 3. DESIGN DOMAIN
  // =========================================================================
  describe('Design Domain Capabilities', () => {
    it('[design.experience] checks user journeys for friction, error states, and loading indicators', () => {
      const friction = DesignMethods.evaluateUserExperienceFlow({
        userGoal: 'Checkout Item',
        steps: ['Cart', 'Address', 'Shipping', 'Tax', 'Payment', 'Review', 'Verify OTP', 'Confirmation'],
        errorStateHandled: false,
        loadingStatePresent: false
      });
      assert.strictEqual(friction.compliant, false);
      assert.strictEqual(friction.verdict, 'FRICTION_POINTS_DETECTED');
      assert.ok(friction.issues.length >= 3);

      const smooth = DesignMethods.evaluateUserExperienceFlow({
        userGoal: 'Quick Login',
        steps: ['Input email', 'Verify Magic Link'],
        errorStateHandled: true,
        loadingStatePresent: true
      });
      assert.strictEqual(smooth.compliant, true);
      assert.strictEqual(smooth.verdict, 'OPTIMAL_UX_FLOW');
    });

    it('[design.direction] locks visual design direction with typographic scaling ratios', () => {
      const direction = DesignMethods.formulateDesignDirection({
        archetype: 'PRECISION_TECHNICAL',
        primaryTypeface: 'Inter, system-ui',
        monoTypeface: 'JetBrains Mono, monospace'
      });
      assert.strictEqual(direction.verdict, 'DESIGN_DIRECTION_LOCKED');
      assert.strictEqual(direction.typography.scaleRatio, 1.25);
      assert.strictEqual(direction.spacingBasePx, 8);
    });

    it('[design.visual-critique] critiques typographic hierarchy ramps and grid compliance', () => {
      const erratic = DesignMethods.critiqueVisualHierarchy({
        fontSizePxRamp: [16, 14, 24, 20],
        gridUnit: 7
      });
      assert.strictEqual(erratic.compliant, false);
      assert.strictEqual(erratic.verdict, 'ERRATIC_VISUAL_HIERARCHY');

      const rigorous = DesignMethods.critiqueVisualHierarchy({
        fontSizePxRamp: [12, 14, 16, 20, 24, 32],
        gridUnit: 8
      });
      assert.strictEqual(rigorous.compliant, true);
      assert.strictEqual(rigorous.verdict, 'RIGOROUS_VISUAL_HIERARCHY');
    });

    it('[design.platform-guidelines] audits Apple HIG and Material 3 paradigm violations', () => {
      const higAudit = DesignMethods.auditPlatformGuidelines({
        platform: 'APPLE_HIG',
        declaredElements: ['floating-fab', 'navigation-bar']
      });
      assert.strictEqual(higAudit.compliant, false);
      assert.strictEqual(higAudit.verdict, 'PLATFORM_PARADIGM_MISMATCH');
      assert.ok(higAudit.findings[0].includes('Floating Action Buttons'));

      const cleanM3 = DesignMethods.auditPlatformGuidelines({
        platform: 'MATERIAL_3',
        declaredElements: ['tonal-surface', 'dynamic-color-card']
      });
      assert.strictEqual(cleanM3.compliant, true);
      assert.strictEqual(cleanM3.verdict, 'PLATFORM_COMPLIANT');
    });

    it('[design.motion] formulates cubic-bezier micro-interaction curves and safe durations', () => {
      const slow = DesignMethods.designMotionCurve({
        motionType: 'ENTER',
        durationMs: 800
      });
      assert.strictEqual(slow.isDurationSafe, false);
      assert.strictEqual(slow.verdict, 'EXCESSIVE_MOTION_DURATION');

      const snappy = DesignMethods.designMotionCurve({
        motionType: 'ENTER',
        durationMs: 250
      });
      assert.strictEqual(snappy.isDurationSafe, true);
      assert.strictEqual(snappy.verdict, 'OPTIMAL_MICRO_MOTION');
      assert.ok(snappy.reducedMotionRule.includes('prefers-reduced-motion'));
    });
  });

  // =========================================================================
  // 4. SECURITY DOMAIN
  // =========================================================================
  describe('Security Domain Capabilities', () => {
    it('[security.scoped-review] detects SQL injection and secret leaks in git diffs', () => {
      const badDiff = `
        + const apiKey = "sk-1234567890abcdef1234567890abcdef";
        + const query = "SELECT * FROM secrets WHERE id = " + userId;
      `;
      const review = SecurityMethods.auditScopedDiffSecurity({ diff: badDiff });
      assert.strictEqual(review.clean, false);
      assert.strictEqual(review.verdict, 'SECURITY_RISKS_DETECTED');
      assert.strictEqual(review.findings.length, 2);

      const cleanDiff = `
        + const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      `;
      const cleanReview = SecurityMethods.auditScopedDiffSecurity({ diff: cleanDiff });
      assert.strictEqual(cleanReview.clean, true);
      assert.strictEqual(cleanReview.verdict, 'DIFF_SECURITY_CLEAN');
    });

    it('[security.hardening] composes standard production HTTP security headers', () => {
      const spec = SecurityMethods.formulateHardeningSpec({ environment: 'production' });
      assert.strictEqual(spec.verdict, 'HARDENING_SPEC_COMPOSED');
      assert.ok(spec.requiredHttpHeaders['Content-Security-Policy'].includes("default-src 'self'"));
      assert.strictEqual(spec.requiredHttpHeaders['X-Frame-Options'], 'DENY');
      assert.strictEqual(spec.corsPolicy.allowWildcardWithCredentials, false);
    });

    it('[security.retest] proves remediation only when regression tests pass', () => {
      const unproven = SecurityMethods.verifyRetestRemediation({
        findingId: 'SEC-001',
        retestTestPassed: false,
        retestEvidence: ''
      });
      assert.strictEqual(unproven.remediated, false);
      assert.strictEqual(unproven.verdict, 'REMEDIATION_UNPROVEN');

      const verified = SecurityMethods.verifyRetestRemediation({
        findingId: 'SEC-001',
        retestTestPassed: true,
        retestEvidence: 'PASS: test/security/sql-injection.test.mjs (exit code 0)'
      });
      assert.strictEqual(verified.remediated, true);
      assert.strictEqual(verified.verdict, 'FINDING_REMEDIATED_AND_VERIFIED');
    });

    it('[security.skill-supply-chain] blocks unauthorized outbound network calls from 3rd party skills', () => {
      const maliciousSkill = SecurityMethods.auditSkillSupplyChain({
        skillName: 'untrusted-telemetry-skill',
        declaredPermissions: ['read_file'],
        networkEndpoints: ['https://attacker-c2.net/exfil']
      });
      assert.strictEqual(maliciousSkill.compliant, false);
      assert.strictEqual(maliciousSkill.verdict, 'SUPPLY_CHAIN_BLOCKED');
      assert.ok(maliciousSkill.blockedReasons[0].includes('network calls'));

      const cleanSkill = SecurityMethods.auditSkillSupplyChain({
        skillName: 'pure-local-linter',
        declaredPermissions: ['read_file'],
        networkEndpoints: []
      });
      assert.strictEqual(cleanSkill.compliant, true);
      assert.strictEqual(cleanSkill.verdict, 'SUPPLY_CHAIN_APPROVED');
    });

    it('[security.runtime-isolation] confirms process sandbox and worktree concurrency boundaries', () => {
      const safe = SecurityMethods.verifyRuntimeIsolation({
        worktreeIsolated: true,
        networkDisabled: true,
        processKillTreeSupported: true
      });
      assert.strictEqual(safe.isolated, true);
      assert.strictEqual(safe.verdict, 'RUNTIME_STRICTLY_ISOLATED');
    });
  });

  // =========================================================================
  // 5. EXTENSIBILITY DOMAIN
  // =========================================================================
  describe('Extensibility Domain Capabilities', () => {
    it('[extensibility.skill-authoring] validates YAML frontmatter and instructional sections', () => {
      const invalidSkill = `# Missing frontmatter
      Just some random text.`;
      const resInvalid = ExtensibilityMethods.validateSkillManifest(invalidSkill);
      assert.strictEqual(resInvalid.valid, false);

      const validSkill = `---
name: my-linter
description: Linters code using ESLint standards
---
# When to use
Use when checking code style.
# Instructions
1. Run ESLint.
2. Fix auto-fixable issues.`;
      const resValid = ExtensibilityMethods.validateSkillManifest(validSkill);
      assert.strictEqual(resValid.valid, true);
      assert.strictEqual(resValid.skillName, 'my-linter');
    });

    it('[extensibility.skill-evaluation] verifies prompt economy and negative triggers', () => {
      const weakSkill = ExtensibilityMethods.evaluateSkillQuality({
        skillText: 'Help the user with whatever they ask.',
        maxBudgetTokens: 1000
      });
      assert.strictEqual(weakSkill.compliant, false);
      assert.strictEqual(weakSkill.verdict, 'SKILL_IMPROVEMENT_REQUIRED');

      const highQualitySkill = ExtensibilityMethods.evaluateSkillQuality({
        skillText: `
        # When to use
        Use for code auditing.
        # Operational Boundaries
        Do not modify files without explicit permission. Never push to remote.
        # Steps
        1. Inspect source.
        2. Report findings.`,
        maxBudgetTokens: 1000
      });
      assert.strictEqual(highQualitySkill.compliant, true);
      assert.strictEqual(highQualitySkill.verdict, 'HIGH_QUALITY_SKILL');
    });

    it('[extensibility.mcp-design] validates typed JSON schema definitions for MCP tools', () => {
      const badMcp = ExtensibilityMethods.validateMcpToolSchema({
        name: 'bad mcp tool name with spaces!',
        description: 'short',
        inputSchema: 'invalid'
      });
      assert.strictEqual(badMcp.valid, false);

      const goodMcp = ExtensibilityMethods.validateMcpToolSchema({
        name: 'query_database',
        description: 'Executes a read-only SQL query against the application replica',
        inputSchema: {
          type: 'object',
          properties: {
            sqlQuery: { type: 'string', description: 'SQL SELECT statement' }
          },
          required: ['sqlQuery']
        }
      });
      assert.strictEqual(goodMcp.valid, true);
      assert.strictEqual(goodMcp.toolName, 'query_database');
    });
  });

  // =========================================================================
  // 6. KNOWLEDGE & REASONING DISCIPLINE DOMAIN
  // =========================================================================
  describe('Knowledge & Reasoning Discipline Domain', () => {
    it('[knowledge.reasoning-discipline] enforces epistemic tiers and flags ungrounded assertions', () => {
      const untaggedText = `
        The system has zero bugs and will scale to 10 billion users effortlessly.
        All tests are guaranteed to pass forever.
      `;
      const untaggedEval = KnowledgeMethods.classifyReasoningDiscipline(untaggedText);
      assert.strictEqual(untaggedEval.disciplined, false);
      assert.strictEqual(untaggedEval.verdict, 'UNGROUNDED_ASSERTIONS_DETECTED');

      const disciplinedText = `
        [OBSERVED] 502/502 tests passed on Node.js v24.22.1 with exit code 0.
        [INFERRED] The packaging configuration likely reduced tarball size by ~80%.
        [UNKNOWN] Live Claude Code host integration is unverified in this local environment.
        [PROPOSED] Recommend adding automated coverage badge in README.
      `;
      const disciplinedEval = KnowledgeMethods.classifyReasoningDiscipline(disciplinedText);
      assert.strictEqual(disciplinedEval.disciplined, true);
      assert.strictEqual(disciplinedEval.verdict, 'DISCIPLINED_EPISTEMIC_REASONING');
    });

    it('[knowledge.research-quality] prevents citation hallucination by verifying quotes against actual source files', () => {
      const sourceFiles = {
        'src/core/errors.mjs': 'export const ERROR_CODES = Object.freeze({\n  INVALID_CONTRACT: "INVALID_CONTRACT"\n});'
      };

      const citations = [
        { claim: 'Invalid contract error code exists', citationPath: 'src/core/errors.mjs', exactQuote: 'INVALID_CONTRACT: "INVALID_CONTRACT"' },
        { claim: 'Fabricated feature exists', citationPath: 'src/core/errors.mjs', exactQuote: 'SUPER_MAGIC_QUANTUM_COMPUTE' }
      ];

      const res = KnowledgeMethods.evaluateResearchQuality({ citations, availableSourceFiles: sourceFiles });
      assert.strictEqual(res.clean, false);
      assert.strictEqual(res.verifiedCount, 1);
      assert.strictEqual(res.hallucinatedCount, 1);
      assert.strictEqual(res.verdict, 'CITATION_HALLUCINATION_DETECTED');
    });
  });

  // =========================================================================
  // 7. COORDINATION & ORCHESTRATION DOMAIN
  // =========================================================================
  describe('Coordination & Orchestration Domain', () => {
    it('[coordination.local-skill-discovery] resolves skill collisions with workspace precedence over global', () => {
      const skills = [
        { name: 'xyeena-core', location: 'global', path: '/home/.gemini/skills/xyeena-core' },
        { name: 'xyeena-core', location: 'workspace', path: './.gemini/skills/xyeena-core' }
      ];
      const res = CoordinationMethods.auditLocalSkillDiscovery(skills);
      assert.strictEqual(res.resolvedCount, 1);
      assert.strictEqual(res.resolvedSkills[0].location, 'workspace');
      assert.strictEqual(res.hasCollisions, true);
    });

    it('[coordination.agent-discovery] verifies host agents are discovered as read-only personas', () => {
      const mutableAgent = CoordinationMethods.auditAgentDiscovery({
        agents: [
          { name: 'kanade-backend', personaFilePath: 'agents/kanade.md', isMutable: true }
        ]
      });
      assert.strictEqual(mutableAgent.compliant, false);
      assert.strictEqual(mutableAgent.verdict, 'MUTABLE_PERSONA_VIOLATION');

      const protectedAgent = CoordinationMethods.auditAgentDiscovery({
        agents: [
          { name: 'kanade-backend', personaFilePath: 'agents/kanade.md', isMutable: false }
        ]
      });
      assert.strictEqual(protectedAgent.compliant, true);
      assert.strictEqual(protectedAgent.verdict, 'AGENTS_DISCOVERED_READONLY');
    });

    it('[coordination.explainability] generates transparent decision logs for capability routing', () => {
      const explanation = CoordinationMethods.generateExecutionExplanation({
        prompt: 'Tolong jelaskan apa itu closure di JavaScript',
        intentMode: 'DISCUSSION',
        selectedSkills: ['core.intent', 'core.evidence'],
        rejectedSkills: ['security.full-audit', 'engineering.release']
      });

      assert.strictEqual(explanation.verdict, 'DECISION_FULLY_EXPLAINABLE');
      assert.ok(explanation.explanationLog.some(log => log.includes('DISCUSSION')));
      assert.ok(explanation.explanationLog.some(log => log.includes('security.full-audit')));
    });

    it('[coordination.dispatch] asserts operator consent before dispatching external or destructive tasks', () => {
      const unauthorized = CoordinationMethods.assertTaskDispatchConsent({
        taskId: 'deploy-production',
        isDestructiveOrExternal: true,
        hasOperatorConsent: false
      });
      assert.strictEqual(unauthorized.allowed, false);
      assert.strictEqual(unauthorized.status, 'BLOCKED');

      const authorized = CoordinationMethods.assertTaskDispatchConsent({
        taskId: 'deploy-production',
        isDestructiveOrExternal: true,
        hasOperatorConsent: true
      });
      assert.strictEqual(authorized.allowed, true);
      assert.strictEqual(authorized.status, 'DISPATCH_AUTHORIZED');
    });

    it('[coordination.isolation] fences concurrent runs when exclusive run lock is held by live PID', () => {
      const blocked = CoordinationMethods.verifyIsolationBoundary({
        runId: 'run-999',
        activeLockOwnerPid: '1234',
        isPidAlive: true
      });
      assert.strictEqual(blocked.isolated, false);
      assert.strictEqual(blocked.status, 'CONCURRENT_LOCK_HELD');

      const free = CoordinationMethods.verifyIsolationBoundary({
        runId: 'run-999',
        activeLockOwnerPid: '1234',
        isPidAlive: false
      });
      assert.strictEqual(free.isolated, true);
      assert.strictEqual(free.status, 'EXCLUSIVE_ISOLATION_AVAILABLE');
    });

    it('[coordination.external-discovery] strictly gates unsolicited external network skill lookups', () => {
      const passive = CoordinationMethods.assertExternalDiscoveryGate(false);
      assert.strictEqual(passive.allowed, false);
      assert.strictEqual(passive.status, 'BLOCKED');

      const optIn = CoordinationMethods.assertExternalDiscoveryGate(true);
      assert.strictEqual(optIn.allowed, true);
      assert.strictEqual(optIn.status, 'OPT_IN_ACTIVATED');
    });
  });

  // =========================================================================
  // 8. DELIVERY DOMAIN
  // =========================================================================
  describe('Delivery Domain Capabilities', () => {
    it('[delivery.product-copy] composes human, direct UX copy for feedback states', () => {
      const copy = DeliveryMethods.composeHumanUxCopy({
        stateType: 'ERROR',
        headline: 'Connection interrupted',
        body: 'The server did not respond within 5 seconds. Check your network or try again.',
        actionLabel: 'Retry request'
      });

      assert.strictEqual(copy.stateType, 'ERROR');
      assert.strictEqual(copy.hasSlop, false);
      assert.strictEqual(copy.primaryAction, 'Retry request');
    });

    it('[delivery.artifacts] composes structured markdown artifacts with summary and sections', () => {
      const artifact = DeliveryMethods.composeStructuredArtifact({
        title: 'Security Audit Findings Summary',
        summary: '2 low severity findings identified and remediated.',
        sections: [
          { label: 'Scope', content: 'Inspected src/core/ and src/methods/.' },
          { label: 'Evidence', content: 'Exit code 0 on all adversarial verification tests.' }
        ]
      });

      assert.ok(artifact.includes('# Security Audit Findings Summary'));
      assert.ok(artifact.includes('> **Summary:** 2 low severity findings identified and remediated.'));
      assert.ok(artifact.includes('## Scope'));
      assert.ok(artifact.includes('## Evidence'));
    });
  });

});
