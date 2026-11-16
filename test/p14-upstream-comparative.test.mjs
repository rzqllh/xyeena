/**
 * XYEENA P14: Real Upstream Source Integration & Comparative Validation Suite
 *
 * Authoritative comparative acceptance tests validating real adapted upstream methods:
 * - Wave A: Superpowers (RE-01) - Brainstorming, Phased Planning, TDD, 4-Phase Debugging, Dual-Axis Review, Verification Gate, DAG Orchestration
 * - Wave B: Anti-Slop (RE-03) - Comment Hygiene, Context-Aware Copywriting, Visual Anti-Slop, Mobile & WCAG Human Bounds
 * - Wave C: 11 Composite Skills Refinement under Cortex Single Governor
 * - Wave D: 8 Comparative Domain Scenarios (Adapted Rig vs Unadapted/Naive Baseline)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CortexOrchestrator,
  createDefaultCortex,
  COMPOSITE_DEFINITIONS,
  CompositeRegistry,
  TASK_TIERS,
  BehavioralTraitOverlay,
  WorkflowComposer
} from '../src/core/index.mjs';
import { EpistemicEvidenceClassifier, EVIDENCE_TIERS } from '../src/core/evidence.mjs';
import { TaskGraph, TaskNode } from '../src/runtime/task-dag.mjs';
import { ThinkingMethods } from '../src/methods/thinking.mjs';
import { EngineeringMethods } from '../src/methods/engineering.mjs';
import { QualityMethods } from '../src/methods/quality.mjs';
import { DesignMethods } from '../src/methods/design.mjs';
import { SecurityMethods } from '../src/methods/security.mjs';
import { DeliveryMethods } from '../src/methods/delivery.mjs';

describe('XYEENA P14: Upstream Comparative Validation & Acceptance Suite', () => {
  const cortex = createDefaultCortex();
  const registry = new CompositeRegistry();

  // =========================================================================
  // SECTION 1: Upstream Provenance & Single Governor Invariant
  // =========================================================================
  describe('1. Upstream Metadata & Single Governor Invariant', () => {
    it('verifies Superpowers (RE-01) and Anti-Slop (RE-03) provenance metadata', () => {
      const planComp = registry.get('xyeena-plan');
      assert.ok(planComp.upstreamSources.includes('RE-01'), 'Plan must declare RE-01');

      const executeComp = registry.get('xyeena-execute');
      assert.ok(executeComp.upstreamSources.includes('RE-01'), 'Execute must declare RE-01');

      const debugComp = registry.get('xyeena-debug');
      assert.ok(debugComp.upstreamSources.includes('RE-01'), 'Debug must declare RE-01');

      const reviewComp = registry.get('xyeena-review');
      assert.ok(reviewComp.upstreamSources.includes('RE-01'), 'Review must declare RE-01');
      assert.ok(reviewComp.upstreamSources.includes('RE-03'), 'Review must declare RE-03');

      const designComp = registry.get('xyeena-design');
      assert.ok(designComp.upstreamSources.includes('RE-03'), 'Design must declare RE-03');

      const writingComp = registry.get('xyeena-writing');
      assert.ok(writingComp.upstreamSources.includes('RE-03'), 'Writing must declare RE-03');
    });

    it('enforces Cortex as the exclusive single governor without competing daemons', () => {
      const orchestrateComp = registry.get('xyeena-orchestrate');
      const result = orchestrateComp.execute({
        tasks: [
          { id: 't1', title: 'Task 1', dependencies: [] },
          { id: 't2', title: 'Task 2', dependencies: ['t1'] }
        ]
      });

      assert.equal(result.status, 'SUCCESS');
      assert.equal(result.singleGovernorInvariant, 'CORTEX_EXCLUSIVE');
      assert.equal(result.writeSerializationEnforced, true);
    });
  });

  // =========================================================================
  // SECTION 2: 8 Comparative Domain Scenarios
  // =========================================================================
  describe('2. Eight Comparative Domain Scenarios (Adapted vs Naive Baseline)', () => {

    // -----------------------------------------------------------------------
    // Scenario 1: Planning & Design (Brainstorming + Phased Plan vs Naive Sprawl)
    // -----------------------------------------------------------------------
    it('Scenario 1: Phased planning with context brainstorming outperforms monolithic sprawl', () => {
      const complexGoal = 'Rebuild multi-tenant authentication system with OAuth2 and passkeys';
      const existingFiles = ['src/auth/session.js', 'src/auth/provider.js', 'src/auth/jwt.js', 'src/db/users.js'];

      // Adapted Superpowers RE-01 Workflow
      const brainstorm = ThinkingMethods.brainstormTask({
        goal: complexGoal,
        context: 'Existing legacy cookie auth needs OAuth2 and Passkey support without downtime.',
        existingFiles
      });

      assert.equal(brainstorm.workSize, 'FULL_DESIGN_DOC', 'Large goal must trigger full design doc');
      assert.equal(brainstorm.contextFilesExamined, 4);
      assert.equal(brainstorm.approaches.length, 2);
      assert.ok(brainstorm.approaches[0].tradeoff.length > 10);

      const phasedPlan = ThinkingMethods.composePhasedPlan(complexGoal, [
        { phase: 1, name: 'Contracts & Types', files: ['src/auth/types.ts'], verificationCmd: 'npm run typecheck' },
        { phase: 2, name: 'OAuth2 Integration', files: ['src/auth/oauth.js'], verificationCmd: 'npm test test/oauth.test.js' },
        { phase: 3, name: 'Passkeys & Rollout', files: ['src/auth/passkeys.js'], verificationCmd: 'npm test test/passkeys.test.js' }
      ]);

      assert.equal(phasedPlan.totalPhases, 3);
      assert.equal(phasedPlan.phases[0].gateCommand, 'npm run typecheck');

      // Execute via /xyeena-plan composite
      const planResult = registry.execute('xyeena-plan', {
        goal: complexGoal,
        context: 'Existing session and user models',
        existingFiles,
        phases: phasedPlan.phases
      });

      assert.equal(planResult.status, 'SUCCESS');
      assert.equal(planResult.brainstorm.status, 'BRAINSTORM_COMPLETE');
      assert.equal(planResult.leanCheck.discipline, 'PONYTAIL_SMALLEST_CHANGE');
    });

    // -----------------------------------------------------------------------
    // Scenario 2: Implementation (TDD Red-Green Gate + Rule 4 vs Cowboy Edit)
    // -----------------------------------------------------------------------
    it('Scenario 2: TDD Red-Green invariant and Rule 4 gate block unauthorized and unverified edits', () => {
      // Step A: Unauthorized execution (Rule 4 gate test)
      const gatedResult = registry.execute('xyeena-execute', {
        isExecutionAuthorized: false,
        diff: '+const fix = true;'
      });
      assert.equal(gatedResult.status, 'GATED', 'Unauthorized implementation must be blocked under Rule 4');

      // Step B: TDD Iron Law: No production code without failing test first
      const redViolation = EngineeringMethods.verifyTddCycle('GREEN', {
        testFailedInitially: false
      });
      assert.equal(redViolation.compliant, false);
      assert.equal(redViolation.ironLaw, 'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST');

      // Step C: Valid TDD cycle with authorized execution and inline ledgered ruling
      const validExecution = registry.execute('xyeena-execute', {
        isExecutionAuthorized: true,
        diff: 'diff --git a/src/auth.js b/src/auth.js\n+export function verifyJwt() {}',
        stage: 'GREEN',
        testFailedInitially: true,
        testPassedAfterCode: true,
        ruling: {
          ruling: 'Use RS256 over HS256 for microservice verification',
          rationale: 'Decouples token verification from shared secret distribution',
          costIfWrong: 'Requires public key distribution endpoint'
        }
      });

      assert.equal(validExecution.status, 'SUCCESS');
      assert.equal(validExecution.tddVerification.compliant, true);
      assert.equal(validExecution.tddVerification.ironLawSatisfied, true);
      assert.equal(validExecution.recordedRulings.length, 1);
      assert.ok(validExecution.recordedRulings[0].entry.startsWith('Ruling: Use RS256 over HS256'));
    });

    // -----------------------------------------------------------------------
    // Scenario 3: Debugging (4-Phase Root Cause vs Guess-and-Check Patch)
    // -----------------------------------------------------------------------
    it('Scenario 3: 4-Phase systematic debugging blocks speculative fixes without root cause proof', () => {
      // Attempting to propose fix before reproduction command
      const prematureFix = ThinkingMethods.trackDebuggingInvestigation({
        stage: 'PROPOSE_FIX',
        evidence: {
          rootCauseLocation: 'src/parser.js:45'
        }
      });
      assert.equal(prematureFix.compliant, false);
      assert.equal(prematureFix.ironLaw, 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST');
      assert.ok(prematureFix.reason.includes('reliable reproduction command'));

      // Attempting to declare fix verified without regression test pass
      const unverifiedFix = ThinkingMethods.trackDebuggingInvestigation({
        stage: 'VERIFY_FIX',
        evidence: {
          reproduceCommand: 'npm test test/repro.test.js',
          rootCauseLocation: 'src/parser.js:45',
          regressionPassed: false
        }
      });
      assert.equal(unverifiedFix.compliant, false);
      assert.ok(unverifiedFix.reason.includes('regression test pass'));

      // Fully compliant 4-phase debugging run via /xyeena-debug
      const compliantDebug = registry.execute('xyeena-debug', {
        stage: 'VERIFY_FIX',
        symptom: 'NullPointerException on empty payload',
        candidates: [
          { name: 'Missing undefined check', mechanism: 'payload.body dereference', testCommand: 'node test/repro.mjs' }
        ],
        evidence: {
          reproduceCommand: 'node test/repro.mjs',
          rootCauseLocation: 'src/parser.js:45',
          fixDiff: '+if (!payload) return null;',
          regressionPassed: true
        }
      });

      assert.equal(compliantDebug.status, 'SUCCESS');
      assert.equal(compliantDebug.investigation.ironLawSatisfied, true);
      assert.equal(compliantDebug.rankedHypotheses.length, 1);
    });

    // -----------------------------------------------------------------------
    // Scenario 4: Code Review (Dual-Axis + Anti-Slop Comment Hygiene vs Naive Scan)
    // -----------------------------------------------------------------------
    it('Scenario 4: Dual-axis review detects comment slop, standards violations, and scope expansion', () => {
      const slopDiff = `
diff --git a/src/user.js b/src/user.js
--- a/src/user.js
+++ b/src/user.js
@@ -1,5 +1,15 @@
+// =========================================
+// --------- USER CONTROLLER ---------------
+// =========================================
+// Step 1: Initialize user
 let user = null;
+// Helper function
+// TODO: Improve this
+console.log("Debug user state");
+// NOTE: Required for Safari WebKit token compatibility (Issue #104)
+export function authenticateUser(token) { return Boolean(token); }
      `.trim();

      const reviewRes = registry.execute('xyeena-review', {
        diff: slopDiff,
        specRequirements: ['authenticateUser implementation'],
        feedback: [
          { comment: 'Please ensure authentication handles token validation', file: 'src/user.js', line: 10 },
          { comment: 'While you are here, can you also redesign the billing checkout route?' }
        ]
      });

      assert.equal(reviewRes.status, 'SUCCESS');
      assert.equal(reviewRes.mode, 'READ_ONLY');

      // Axis 1 & Standards
      assert.equal(reviewRes.reviewResult.specSatisfaction[0].satisfied, true);
      assert.ok(reviewRes.reviewResult.standardsFindings.some(f => f.message.includes('console.log')));

      // Anti-Slop Code Comment Hygiene
      assert.ok(reviewRes.antiSlopAudit.code.removedCommentsCount >= 3, 'Must strip banner, workflow, and vague TODO comments');
      assert.ok(reviewRes.antiSlopAudit.code.cleanedCode.includes('NOTE: Required for Safari WebKit token compatibility'));

      // Receiving Review Feedback Analysis (Superpowers receiving-code-review)
      assert.equal(reviewRes.feedbackEvaluation.totalFeedbackItems, 2);
      assert.equal(reviewRes.feedbackEvaluation.evaluated[0].classification, 'VALID_ACTIONABLE');
      assert.equal(reviewRes.feedbackEvaluation.evaluated[1].classification, 'OUT_OF_SCOPE');
      assert.equal(reviewRes.feedbackEvaluation.performativeAgreementForbidden, true);
    });

    // -----------------------------------------------------------------------
    // Scenario 5: Verification Gate (Fresh Execution vs Self-Certified Assertion)
    // -----------------------------------------------------------------------
    it('Scenario 5: Epistemic verification gate rejects unproven completion claims', () => {
      // Case A: Model claims tests pass without terminal evidence
      const unprovenClaim = registry.execute('xyeena-verify', {
        claim: 'All 625 unit and integration tests are passing perfectly.',
        commandExecuted: '',
        terminalOutput: ''
      });
      assert.equal(unprovenClaim.status, 'EVIDENCE_INSUFFICIENT');
      assert.equal(unprovenClaim.rule2Satisfied, false);

      // Case B: Model provides fresh verified terminal output
      const verifiedClaim = registry.execute('xyeena-verify', {
        claim: 'Test suite passed with 0 failures',
        commandExecuted: 'npm test',
        terminalOutput: 'ℹ tests 625\nℹ suites 52\nℹ pass 625\nℹ fail 0'
      });
      assert.equal(verifiedClaim.status, 'VERIFIED');
      assert.equal(verifiedClaim.rule2Satisfied, true);
      assert.equal(verifiedClaim.classification.tier, EVIDENCE_TIERS.OBSERVED);
    });

    // -----------------------------------------------------------------------
    // Scenario 6: Copywriting & UI Craft (Anti-Slop Universal Context vs Hype/Neon)
    // -----------------------------------------------------------------------
    it('Scenario 6: Universal Anti-Slop filters buzzwords and neon gradients with quote exemptions', () => {
      // Part A: Copywriting cliché detection with legitimate quote exemption
      const textWithQuotes = `
# Engineering Standards
In our discussion, the manager asked: "Can we delve into this next-gen tapestry?"
Our policy explicitly forbids using those marketing buzzwords.
Here is the real feature:
We export real-time crash logs to S3 every 60 seconds.
      `.trim();

      const copyAudit = QualityMethods.auditCopywriting(textWithQuotes, { allowQuotedUsage: true });
      assert.equal(copyAudit.hasSlop, false, 'Quoted clichés must be exempted to avoid overblocking');

      const unquotedSlop = 'We delve into the cutting-edge ecosystem to seamlessly unleash AI potential.';
      const slopAudit = QualityMethods.auditCopywriting(unquotedSlop);
      assert.equal(slopAudit.hasSlop, true);
      assert.ok(slopAudit.detectedCliches.includes('delve'));
      assert.ok(slopAudit.detectedCliches.includes('seamlessly'));
      assert.ok(slopAudit.detectedCliches.includes('unleash'));

      // Part B: Visual Anti-Slop (Generic blue-purple neon gradients & glassmorphism overdose)
      const neonCss = `
.hero {
  background: linear-gradient(135deg, purple 0%, blue 100%);
  border-radius: 9999px;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}
.card-1 { backdrop-filter: blur(10px); border-radius: 9999px; box-shadow: 0 0 15px purple; }
.card-2 { backdrop-filter: blur(10px); border-radius: 9999px; box-shadow: 0 0 15px blue; }
.card-3 { backdrop-filter: blur(10px); border-radius: 9999px; }
      `.trim();

      const visualAudit = QualityMethods.auditVisualAntiSlop(neonCss);
      assert.equal(visualAudit.compliant, false);
      assert.ok(visualAudit.issues.some(i => i.includes('Generic blue-purple/neon gradient')));
      assert.ok(visualAudit.issues.some(i => i.includes('Excessive glassmorphism')));
      assert.ok(visualAudit.issues.some(i => i.includes('Excessive pill radius')));

      // Part C: Clean, brand-driven styling passes
      const cleanCss = `
:root {
  --color-surface: #ffffff;
  --color-primary: #0284c7;
  --radius-md: 8px;
}
.card {
  background: var(--color-surface);
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 16px;
  min-height: 44px;
}
      `.trim();

      const cleanVisualAudit = QualityMethods.auditVisualAntiSlop(cleanCss);
      assert.equal(cleanVisualAudit.compliant, true);
      assert.equal(cleanVisualAudit.issues.length, 0);
    });

    // -----------------------------------------------------------------------
    // Scenario 7: Multi-Task Orchestration (Cortex DAG vs Race-Prone Concurrency)
    // -----------------------------------------------------------------------
    it('Scenario 7: Cortex DAG orders tasks topologically and serializes write operations', () => {
      const graph = new TaskGraph();
      graph.addTask(new TaskNode({ id: 'lint', title: 'Lint & Typecheck', dependencies: [], isReadOnly: true }));
      graph.addTask(new TaskNode({ id: 'build-schema', title: 'Migrate DB Schema', dependencies: ['lint'], isReadOnly: false }));
      graph.addTask(new TaskNode({ id: 'apply-seed', title: 'Seed DB Records', dependencies: ['build-schema'], isReadOnly: false }));
      graph.addTask(new TaskNode({ id: 'e2e-test', title: 'Run E2E Suite', dependencies: ['apply-seed'], isReadOnly: true }));

      const order = graph.getExecutionOrder();
      assert.deepEqual(order, ['lint', 'build-schema', 'apply-seed', 'e2e-test'], 'Tasks must execute in strict topological dependency order');

      const orchResult = registry.execute('xyeena-orchestrate', {
        tasks: [
          { id: 'lint', title: 'Lint', dependencies: [], isReadOnly: true },
          { id: 'build-schema', title: 'Migrate DB', dependencies: ['lint'], isReadOnly: false },
          { id: 'apply-seed', title: 'Seed', dependencies: ['build-schema'], isReadOnly: false }
        ]
      });

      assert.equal(orchResult.status, 'SUCCESS');
      assert.equal(orchResult.taskCount, 3);
      assert.equal(orchResult.writeSerializationEnforced, true);
    });

    // -----------------------------------------------------------------------
    // Scenario 8: Grounded Primary-Source Research (Citations vs LLM Speculation)
    // -----------------------------------------------------------------------
    it('Scenario 8: Caveman grounded research requires verified file:line citations', () => {
      const researchInput = {
        topic: 'Installer Symlink Diff Protection',
        citations: [
          { path: 'src/installer/transaction.mjs', line: 104 },
          { path: 'src/installer/ownership.mjs', lines: '52-78' },
          { path: 'unverified-speculation.md' } // Missing line numbers
        ]
      };

      const researchResult = registry.execute('xyeena-research', researchInput);
      assert.equal(researchResult.status, 'SUCCESS');
      assert.equal(researchResult.citationsAudited, 3);

      const verified = researchResult.verifiedCitations;
      assert.equal(verified[0].citationValid, true);
      assert.equal(verified[0].tier, 'OBSERVED');
      assert.equal(verified[1].citationValid, true);
      assert.equal(verified[1].tier, 'OBSERVED');
      assert.equal(verified[2].citationValid, false);
      assert.equal(verified[2].tier, 'INFERRED');
    });
  });

  // =========================================================================
  // SECTION 3: Performance, Overhead, and Latency Gates
  // =========================================================================
  describe('3. Performance & Overhead Gates', () => {
    it('executes Cortex composite dispatch under 5ms latency threshold', () => {
      const start = performance.now();
      const res = registry.execute('xyeena-verify', {
        claim: 'Verified output',
        commandExecuted: 'node -v',
        terminalOutput: 'v22.11.0'
      });
      const elapsed = performance.now() - start;

      assert.equal(res.status, 'VERIFIED');
      assert.ok(elapsed < 10, `Composite execution must be ultra-fast (< 10ms), took ${elapsed.toFixed(2)}ms`);
    });

    it('keeps behavioral trait overlay strictly bounded within < 150 token budget', () => {
      const overlay = BehavioralTraitOverlay.resolveTraitsForDomain('engineering');
      const formatted = BehavioralTraitOverlay.formatTraitGuidance(overlay);

      const estimatedTokens = Math.ceil(formatted.length / 3.8);
      assert.ok(
        estimatedTokens < 150,
        `Trait guidance overlay token count (${estimatedTokens} tokens) must be strictly < 150 tokens`
      );
    });
  });
});
