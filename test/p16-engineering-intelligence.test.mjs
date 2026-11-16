import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EngineeringMethods,
  DesignMethods,
  QualityMethods,
  SecurityMethods
} from '../src/methods/index.mjs';
import { CompositeRegistry } from '../src/core/composites.mjs';

describe('P16 — Engineering Intelligence Upstream Integration & P15 Targeted Closure', () => {
  const registry = new CompositeRegistry();

  describe('1. Superior Skills (RE-02) — Deep Modules, Seams & Architecture Boundaries', () => {
    it('Scenario 3: evaluates multi-module architecture with measured boundary trade-offs and depth leverage', () => {
      // Deep module: 5 methods, 180 lines of rich logic, called across 6 sites
      const deepResult = EngineeringMethods.evaluateModuleDepth({
        moduleName: 'OrderFulfillmentService',
        publicMethods: ['submitOrder', 'cancelOrder', 'trackShipment', 'calculateRefund', 'reissueInvoice'],
        internalLinesOfCode: 180,
        callerSitesCount: 6
      });

      assert.strictEqual(deepResult.classification, 'DEEP_MODULE');
      assert.strictEqual(deepResult.isDeep, true);
      assert.ok(deepResult.depthRatio >= 15);
      assert.ok(deepResult.leverageScore > 100);
      assert.strictEqual(deepResult.verdict, 'HIGH_LEVERAGE_SEAM');

      // Shallow wrapper: 8 methods, only 30 lines (thin passthrough)
      const shallowResult = EngineeringMethods.evaluateModuleDepth({
        moduleName: 'UserPassthroughProxy',
        publicMethods: ['getA', 'getB', 'getC', 'getD', 'getE', 'getF', 'getG', 'getH'],
        internalLinesOfCode: 30,
        callerSitesCount: 1
      });

      assert.strictEqual(shallowResult.classification, 'SHALLOW_WRAPPER');
      assert.strictEqual(shallowResult.isDeep, false);
      assert.strictEqual(shallowResult.verdict, 'SHALLOW_MODULE_CONSOLIDATION_ADVISED');
    });

    it('enforces Clean Architecture boundaries between pure domain policy and transport/persistence drivers', () => {
      const cleanDomain = EngineeringMethods.evaluateArchitectureBoundaries({
        moduleName: 'DomainPricingRules',
        domainRules: ['calculateDiscount', 'validateCoupon'],
        importedDependencies: ['./money.mjs', './tax-tables.mjs']
      });

      assert.strictEqual(cleanDomain.cleanBoundaries, true);
      assert.strictEqual(cleanDomain.verdict, 'ARCHITECTURAL_BOUNDARIES_VERIFIED');

      const coupledDomain = EngineeringMethods.evaluateArchitectureBoundaries({
        moduleName: 'DirtyPricingService',
        domainRules: ['calculateDiscount'],
        importedDependencies: ['express', 'pg', './money.mjs']
      });

      assert.strictEqual(coupledDomain.cleanBoundaries, false);
      assert.strictEqual(coupledDomain.verdict, 'BOUNDARY_COUPLING_DETECTED');
      assert.ok(coupledDomain.transportViolations.includes('express'));
      assert.ok(coupledDomain.persistenceViolations.includes('pg'));
    });

    it('audits code-as-documentation: preserves invariant comments while identifying redundant syntax narration', () => {
      const codeWithSlopComments = `
        // set timeout to 500
        const timeout = 500;
        // loop over items
        for (const item of items) {
          // invariant: token must never be null during active session
          validate(item);
        }
      `;

      const audit = EngineeringMethods.auditCodeAsDocumentation(codeWithSlopComments);
      assert.strictEqual(audit.redundantComments.length, 2);
      assert.strictEqual(audit.valuableComments.length, 1);
      assert.ok(audit.valuableComments[0].comment.includes('invariant:'));
      assert.strictEqual(audit.verdict, 'REDUNDANT_COMMENT_SLOP_DETECTED');
    });
  });

  describe('2. Matt Pocock Skills (RE-08) — Question Frontier, to-spec & to-tickets', () => {
    it('Scenario 5: technical discovery with sufficient codebase data skips grilling entirely', () => {
      // All facts are known or discoverable in the repository
      const decisions = [
        { id: 'framework-choice', title: 'Target Framework', question: 'Which framework?', recommended: 'Next.js', factKey: 'detectedFramework' },
        { id: 'package-manager', title: 'Package Manager', question: 'Which package manager?', recommended: 'pnpm', factKey: 'detectedPm' }
      ];

      const facts = {
        detectedFramework: 'nextjs',
        detectedPm: 'pnpm'
      };

      const result = EngineeringMethods.grillFrontier({
        decisions,
        facts
      });

      assert.strictEqual(result.isDone, true);
      assert.strictEqual(result.frontierCount, 0);
      assert.strictEqual(result.sharedUnderstandingReached, true);
      assert.strictEqual(result.verdict, 'FRONTIER_EMPTY_SHARED_UNDERSTANDING');
    });

    it('Scenario 6: ambiguous product specification genuinely requiring owner decision computes active frontier', () => {
      const decisions = [
        {
          id: 'auth-strategy',
          title: 'Authentication Strategy',
          question: 'Should we support OAuth2 social login alongside passwordless magic links?',
          recommended: 'Yes, support both for maximum user retention.',
          isMaterial: true
        },
        {
          id: 'token-storage',
          title: 'Token Storage Strategy',
          question: 'Should refresh tokens be stored in httpOnly cookies or secure localStorage?',
          recommended: 'httpOnly cookies with SameSite=Strict.',
          blockedBy: ['auth-strategy'],
          isMaterial: true
        }
      ];

      // Round 1: Only auth-strategy is unblocked
      const round1 = EngineeringMethods.grillFrontier({ decisions, settled: [] });
      assert.strictEqual(round1.isDone, false);
      assert.strictEqual(round1.frontierCount, 1);
      assert.strictEqual(round1.frontier[0].id, 'auth-strategy');
      assert.ok(round1.formattedQuestions[0].includes('❓ **Q1** - **Authentication Strategy**'));
      assert.ok(round1.formattedQuestions[0].includes('➡️ Yes, support both'));

      // Round 2: After user accepts auth-strategy, token-storage becomes the active frontier
      const round2 = EngineeringMethods.grillFrontier({
        decisions,
        userResponses: { 'auth-strategy': 'Yes' }
      });
      assert.strictEqual(round2.isDone, false);
      assert.strictEqual(round2.frontierCount, 1);
      assert.strictEqual(round2.frontier[0].id, 'token-storage');
      assert.ok(round2.formattedQuestions[0].includes('❓ **Q1** - **Token Storage Strategy**'));

      // Round 3: All answered
      const round3 = EngineeringMethods.grillFrontier({
        decisions,
        userResponses: { 'auth-strategy': 'Yes', 'token-storage': 'httpOnly' }
      });
      assert.strictEqual(round3.isDone, true);
      assert.strictEqual(round3.verdict, 'FRONTIER_EMPTY_SHARED_UNDERSTANDING');
    });

    it('synthesizes technical spec (to-spec) with user stories, implementation decisions, and highest-seam testing', () => {
      const spec = EngineeringMethods.synthesizeTechnicalSpec({
        problemStatement: 'Users cannot safely export their session history.',
        solution: 'Add transactional export endpoint with checksum validation.',
        userStories: [
          'export my audit log as encrypted json',
          'verify my export checksum before storing'
        ],
        seams: ['ExportController / HTTP seam'],
        implementationDecisions: ['Use streams for memory efficiency', 'SHA-256 for integrity']
      });

      assert.strictEqual(spec.status, 'SPEC_SYNTHESIZED');
      assert.ok(spec.userStories[0].startsWith('As a user, I want export my audit log'));
      assert.strictEqual(spec.primarySeam, 'ExportController / HTTP seam');
    });

    it('breaks down tracer-bullet vertical slice tickets (to-tickets) with expand-contract for wide refactors', () => {
      const breakdown = EngineeringMethods.breakdownTracerBulletTickets({
        featureTitle: 'Session Export Feature',
        verticalSlices: [
          { id: 'ticket-1', title: 'Export API and schema slice', blockedBy: [], delivers: 'End-to-end export stream' },
          { id: 'ticket-2', title: 'UI export modal and progress indicator', blockedBy: ['ticket-1'], delivers: 'Visible download UI' }
        ],
        wideRefactor: {
          name: 'rename-user-token',
          targetSymbol: 'AuthTokenToSessionToken'
        }
      });

      assert.strictEqual(breakdown.verdict, 'TRACER_BULLET_TICKETS_GENERATED');
      assert.ok(breakdown.expandContractPlan !== null);
      assert.strictEqual(breakdown.expandContractPlan.pattern, 'EXPAND_CONTRACT');
      assert.strictEqual(breakdown.expandContractPlan.sequence.length, 3);
      assert.strictEqual(breakdown.ticketsCount, 5); // 3 expand-contract + 2 vertical slices
    });
  });

  describe('3. Ponytail (RE-04) — Smallest Correct Change & Anti-Overengineering', () => {
    it('Scenario 2 & 8: accepts small one-file change with scoped diff and flags premature wrappers', () => {
      // Clean 3-line scoped fix
      const scopedFixDiff = `
diff --git a/src/api/auth.ts b/src/api/auth.ts
--- a/src/api/auth.ts
+++ b/src/api/auth.ts
@@ -10,2 +10,3 @@
- if (token.exp < now) {
+ if (token.exp <= now) {
+   // shortcut: upgrade to asymmetric token validation in P18
`;
      const cleanAudit = EngineeringMethods.auditPonytailLeanDiff({
        diff: scopedFixDiff,
        level: 'full'
      });

      assert.strictEqual(cleanAudit.isClean, true);
      assert.strictEqual(cleanAudit.verdict, 'PONYTAIL_LEAN_PASS');
      assert.strictEqual(cleanAudit.shortcuts.length, 1);
      assert.ok(cleanAudit.shortcuts[0].includes('shortcut: upgrade to asymmetric token'));

      // Over-engineered diff introducing wrapper class and unnecessary lodash dependency
      const overengineeredDiff = `
diff --git a/src/utils/math.ts b/src/utils/math.ts
+++ b/src/utils/math.ts
+import _ from 'lodash';
+export class NumberValidationAdapterProxy {
+  validate(n) { return _.isNumber(n); }
+}
`;
      const overAudit = EngineeringMethods.auditPonytailLeanDiff({
        diff: overengineeredDiff,
        level: 'full'
      });

      assert.strictEqual(overAudit.isClean, false);
      assert.strictEqual(overAudit.verdict, 'OVERENGINEERING_DETECTED');
      assert.ok(overAudit.findings.some(f => f.type === 'UNNECESSARY_ABSTRACTION'));
      assert.ok(overAudit.findings.some(f => f.type === 'AVOIDABLE_DEPENDENCY'));
    });
  });

  describe('4. Caveman (RE-05) — Context Economy, Verify-and-Stop & Safe Refactor', () => {
    it('Scenario 1: verifies safe refactor boundary preservation and blocks unauthorized public API breaks', () => {
      const originalExports = ['fetchUser', 'saveUser', 'deleteUser'];

      // Safe refactor: internals restructured, all exports preserved, tests pass
      const safeResult = EngineeringMethods.auditSafeRefactor({
        targetModule: 'UserRepository',
        originalExports,
        newExports: ['fetchUser', 'saveUser', 'deleteUser'],
        testsPassing: true
      });

      assert.strictEqual(safeResult.boundaryPreserved, true);
      assert.strictEqual(safeResult.verdict, 'SAFE_REFACTOR_VERIFIED');

      // Unsafe refactor: deleteUser was silently dropped
      const breakingResult = EngineeringMethods.auditSafeRefactor({
        targetModule: 'UserRepository',
        originalExports,
        newExports: ['fetchUser', 'saveUser'],
        testsPassing: true
      });

      assert.strictEqual(breakingResult.boundaryPreserved, false);
      assert.strictEqual(breakingResult.verdict, 'PUBLIC_API_BREAK_DETECTED');
      assert.deepStrictEqual(breakingResult.missingExports, ['deleteUser']);
    });

    it('Scenario 7: evaluates received code review feedback, forbidding performative agreement and checking scope', () => {
      const feedback = [
        { comment: 'Please make sure token expiry compares with <= to prevent edge race.', file: 'auth.ts', line: 12 },
        { comment: 'While you are here, can you also redesign the entire billing subsystem?', file: 'billing.ts' },
        { comment: 'clean this up' }
      ];

      const reviewEvaluation = EngineeringMethods.receiveReviewFeedback(feedback);

      assert.strictEqual(reviewEvaluation.performativeAgreementForbidden, true);
      assert.strictEqual(reviewEvaluation.totalFeedbackItems, 3);
      assert.strictEqual(reviewEvaluation.evaluated[0].classification, 'VALID_ACTIONABLE');
      assert.strictEqual(reviewEvaluation.evaluated[1].classification, 'OUT_OF_SCOPE');
      assert.strictEqual(reviewEvaluation.evaluated[2].classification, 'REQUIRES_CLARIFICATION');
    });

    it('Scenario 9: systematic debugging isolates root cause with reproducer and 5-whys causal chain', () => {
      const result = EngineeringMethods.traceRootCause5Whys({
        symptom: 'Process exits with ECONNRESET during peak traffic load',
        whyChain: [
          'Database pool exhausted connections',
          'Queries took > 3000ms instead of 50ms',
          'Missing index on tenant_id column in transactions table',
          'Migration script was applied without concurrent index creation flag'
        ]
      });

      assert.strictEqual(result.isSufficientDepth, true);
      assert.strictEqual(result.depth, 4);
      assert.strictEqual(result.verdict, 'SYSTEMIC_ROOT_CAUSE_ISOLATED');
      assert.ok(result.rootCause.includes('Migration script was applied without concurrent index'));
    });

    it('Scenario 10: compresses long technical output while preserving 100% of commands, paths, errors, and warnings verbatim', () => {
      const rawChattyOutput = `
        Hello there! Sure, I'd be happy to help you with that!
        Basically, the issue is that \`src/core/auth.mjs\` failed at line 42.
        Here is the exact error:
        \`\`\`
        Error: ENOENT: no such file or directory, open 'C:/Users/app/config.json'
        \`\`\`
        To fix this, simply run:
        \`\`\`
        npm run verify -- --fix-paths
        \`\`\`
        Hope this helps! Let me know if you need anything else!
      `;

      const compressed = EngineeringMethods.compressTechnicalOutput(rawChattyOutput);

      assert.strictEqual(compressed.verbatimPayloadPreserved, true);
      assert.strictEqual(compressed.verdict, 'TECHNICAL_OUTPUT_COMPRESSED');
      assert.ok(compressed.bytesSaved > 50);

      // Factual payload checks
      assert.ok(compressed.compressedText.includes('src/core/auth.mjs'));
      assert.ok(compressed.compressedText.includes("open 'C:/Users/app/config.json'"));
      assert.ok(compressed.compressedText.includes('npm run verify -- --fix-paths'));

      // Fluff removed
      assert.ok(!compressed.compressedText.includes('Hello there!'));
      assert.ok(!compressed.compressedText.includes("I'd be happy to help"));
      assert.ok(!compressed.compressedText.includes('Hope this helps'));
    });

    it('enforces verify-and-stop discipline: smallest sufficient proof set and halt immediately upon completion', () => {
      const proofResult = EngineeringMethods.verifyAndStop({
        acceptanceConditions: ['Endpoint returns 200', 'Database row created'],
        executedChecks: [
          { name: 'Unit test suite', status: 'PASS' },
          { name: 'Integration endpoint check', status: 'PASS' }
        ]
      });

      assert.strictEqual(proofResult.verified, true);
      assert.strictEqual(proofResult.stopCondition, 'STOP_IMMEDIATELY_NO_POLISH');
      assert.strictEqual(proofResult.verdict, 'VERIFY_AND_STOP_SATISFIED');

      // Empty checks fails closed
      const emptyResult = EngineeringMethods.verifyAndStop({
        acceptanceConditions: ['Test condition'],
        executedChecks: []
      });
      assert.strictEqual(emptyResult.verified, false);
      assert.strictEqual(emptyResult.status, 'ZERO_CHECKS_EXECUTED');
    });
  });

  describe('5. Huashu Design (RE-32) & WCAG 2.2 Target Size Precision', () => {
    it('generates 3 distinct visual directions before execution (Huashu RE-32)', () => {
      const result = DesignMethods.exploreVisualDirections('Design a financial dashboard for enterprise treasury');

      assert.strictEqual(result.directionsCount, 3);
      assert.strictEqual(result.userSelectionRequired, true);
      assert.strictEqual(result.verdict, 'VISUAL_DIRECTIONS_EXPLORED');
      assert.ok(result.directions.some(d => d.archetype === 'EDITORIAL_CLEAN'));
      assert.ok(result.directions.some(d => d.archetype === 'PRECISION_TECHNICAL'));
      assert.ok(result.directions.some(d => d.archetype === 'DYNAMIC_SPATIAL'));
    });

    it('generates standalone interactive prototype specification with isolation quarantine', () => {
      const proto = DesignMethods.generateInteractivePrototype({
        title: 'Trading Ledger Interactive Mockup',
        states: ['idle', 'calculating', 'settled']
      });

      assert.strictEqual(proto.isStandaloneHtml, true);
      assert.strictEqual(proto.isolation.isolated, true);
      assert.ok(proto.isolation.quarantine.includes('Do not merge to production without formal review'));
    });

    it('truthfully reports export capabilities without claiming unverified backends', () => {
      const capabilities = DesignMethods.checkExportCapabilities();

      assert.strictEqual(capabilities.nativeHtmlExport, true);
      assert.strictEqual(capabilities.nativeVisualDirections, true);
      assert.strictEqual(capabilities.videoExport.available, false);
      assert.ok(capabilities.installInstructions.includes('playwright pptxgenjs pdf-lib'));
      assert.strictEqual(capabilities.verdict, 'EXPORT_CAPABILITIES_TRUTHFULLY_REPORTED');
    });

    it('evaluates WCAG 2.2 Target Size: SC 2.5.8 AA (24x24px) vs SC 2.5.5 AAA (44x44px) with inline text exception', () => {
      // 24x24px button passes AA but fails AAA
      const buttonAA = DesignMethods.evaluateTouchTargetSize({ widthPx: 24, heightPx: 24 });
      assert.strictEqual(buttonAA.passesAA, true);
      assert.strictEqual(buttonAA.passesAAA, false);
      assert.strictEqual(buttonAA.verdict, 'WCAG_AA_COMPLIANT');

      // 44x44px button passes both AA and AAA
      const buttonAAA = DesignMethods.evaluateTouchTargetSize({ widthPx: 48, heightPx: 48 });
      assert.strictEqual(buttonAAA.passesAA, true);
      assert.strictEqual(buttonAAA.passesAAA, true);
      assert.strictEqual(buttonAAA.verdict, 'WCAG_AAA_COMPLIANT');

      // 16x16px button fails both
      const smallButton = DesignMethods.evaluateTouchTargetSize({ widthPx: 16, heightPx: 16 });
      assert.strictEqual(smallButton.passesAA, false);
      assert.strictEqual(smallButton.passesAAA, false);
      assert.strictEqual(smallButton.verdict, 'TARGET_SIZE_VIOLATION');

      // Inline text exception
      const inlineLink = DesignMethods.evaluateTouchTargetSize({ widthPx: 14, heightPx: 14, isInlineText: true });
      assert.strictEqual(inlineLink.passesAA, true);
      assert.strictEqual(inlineLink.exceptionApplied, 'INLINE_TARGET_EXCEPTION');
      assert.strictEqual(inlineLink.verdict, 'WCAG_AA_EXEMPTION_INLINE');
    });
  });

  describe('6. Cortex Composites Integration (/xyeena-architecture, /xyeena-grill, /xyeena-handoff)', () => {
    it('executes /xyeena-architecture composite skill', () => {
      const result = registry.execute('/xyeena-architecture', {
        moduleName: 'PaymentsCore',
        publicMethods: ['charge', 'refund', 'verifyCard'],
        internalLinesOfCode: 90,
        callerSitesCount: 4,
        domainRules: ['validateAmount'],
        importedDependencies: ['./currency.mjs']
      });

      assert.strictEqual(result.compositeId, 'xyeena-architecture');
      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(result.depthEvaluation.isDeep, true);
      assert.strictEqual(result.boundaryEvaluation.cleanBoundaries, true);
    });

    it('executes /xyeena-grill composite skill', () => {
      const result = registry.execute('/xyeena-grill', {
        decisions: [
          { id: 'd1', title: 'DB Engine', question: 'Use Postgres or SQLite?', recommended: 'Postgres' }
        ],
        settled: []
      });

      assert.strictEqual(result.compositeId, 'xyeena-grill');
      assert.strictEqual(result.status, 'FRONTIER_ACTIVE');
      assert.strictEqual(result.grillResult.frontierCount, 1);
    });

    it('executes /xyeena-handoff composite skill', () => {
      const result = registry.execute('/xyeena-handoff', {
        text: 'Sure! I will do this now. Error at path /tmp/log.txt: failed with code 500. Hope this helps!'
      });

      assert.strictEqual(result.compositeId, 'xyeena-handoff');
      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(result.checkpointReady, true);
      assert.ok(result.compression.compressedText.includes('/tmp/log.txt'));
      assert.ok(!result.compression.compressedText.includes('Sure!'));
    });

    it('Scenario 4: gates full security audit on explicit user approval under /xyeena-security', () => {
      // Unapproved full audit fails closed
      const unapproved = registry.execute('/xyeena-security', {
        fullAuditRequested: true,
        explicitOwnerApproval: false
      });

      assert.strictEqual(unapproved.status, 'BLOCKED_CONSENT_REQUIRED');

      // Approved full audit proceeds
      const approved = registry.execute('/xyeena-security', {
        fullAuditRequested: true,
        explicitOwnerApproval: true,
        findings: []
      });

      assert.strictEqual(approved.status, 'SUCCESS');
      assert.strictEqual(approved.mode, 'FULL_AUDIT');
    });
  });
});
