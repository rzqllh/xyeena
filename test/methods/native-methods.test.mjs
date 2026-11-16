import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ThinkingMethods,
  EngineeringMethods,
  DesignMethods,
  QualityMethods,
  SecurityMethods,
  DeliveryMethods,
  ATTACK_CLASSES,
  SEVERITY_LEVELS
} from '../../src/methods/index.mjs';

describe('M2 Native Methods: Unit Verification Suite', () => {

  describe('Thinking & Reasoning Methods', () => {
    it('sizes problems and identifies high constraint risk profiles', () => {
      const res = ThinkingMethods.sizeProblem('Migrate database', ['No downtime', 'Zero data loss', 'No schema break', 'Memory limit 512MB']);
      assert.strictEqual(res.riskProfile, 'HIGH_CONSTRAINT');
      assert.strictEqual(res.constraints.length, 4);
    });

    it('ranks falsifiable hypotheses with disproof criteria', () => {
      const hypotheses = ThinkingMethods.rankHypotheses('Slow API endpoint', [
        { name: 'Missing index on user_id', mechanism: 'Full table scan', testCommand: 'EXPLAIN ANALYZE SELECT...' },
        { name: 'Lock contention', mechanism: 'Thread pool exhaustion', testCommand: 'SHOW PROCESSLIST' }
      ]);
      assert.strictEqual(hypotheses.length, 2);
      assert.strictEqual(hypotheses[0].rank, 1);
      assert.ok(hypotheses[0].disproofCommand.length > 0);
    });

    it('composes phased plan with testable gates', () => {
      const plan = ThinkingMethods.composePhasedPlan('Feature X', [
        { phase: 1, name: 'Primitives', files: ['tokens.css'], verificationCmd: 'npm test' },
        { phase: 2, name: 'Component', files: ['button.jsx'], verificationCmd: 'npm run test:ui' }
      ]);
      assert.strictEqual(plan.totalPhases, 2);
      assert.strictEqual(plan.phases[0].gateCommand, 'npm test');
    });

    it('extracts domain models and enforces invariants', () => {
      const model = ThinkingMethods.defineDomainModel(
        { Order: 'Customer intent to purchase items', Cart: 'Transient item collection' },
        ['An order cannot be modified once shipped']
      );
      assert.strictEqual(model.invariants.length, 1);
      assert.strictEqual(model.ubiquitousLanguage.Order, 'Customer intent to purchase items');
    });

    it('evaluates adversarial counterexamples', () => {
      const res = ThinkingMethods.evaluateCounterexamples('Function accepts positive integers', [
        { input: 0, expectedFailure: 'Zero is non-positive' },
        { input: -5, expectedFailure: 'Negative input' },
        { input: null, expectedFailure: 'Null input type' }
      ]);
      assert.strictEqual(res.edgeCases.length, 3);
      assert.strictEqual(res.edgeCases[0].mitigationRequired, true);
    });
  });

  describe('Engineering Methods', () => {
    it('evaluates deep modules vs shallow wrappers', () => {
      const deep = EngineeringMethods.evaluateModuleSeam({
        publicMethods: ['calculate(x)', 'validate(x)'],
        internalLinesOfCode: 120
      });
      assert.strictEqual(deep.classification, 'DEEP_MODULE');

      const shallow = EngineeringMethods.evaluateModuleSeam({
        publicMethods: ['step1()', 'step2()', 'step3()', 'step4()'],
        internalLinesOfCode: 20
      });
      assert.strictEqual(shallow.classification, 'SHALLOW_WRAPPER');
    });

    it('performs dual-axis review separating Standards from Spec satisfaction', () => {
      const review = EngineeringMethods.dualAxisReview({
        diff: '+ console.log(data);\n+ export function authLogin() {}',
        specRequirements: ['authLogin implementation']
      });
      assert.strictEqual(review.standardsFindings.length, 1);
      assert.strictEqual(review.standardsFindings[0].axis, 'STANDARDS');
      assert.strictEqual(review.specSatisfaction[0].satisfied, true);
    });

    it('enforces TDD red-green-refactor cycle', () => {
      // Disallow GREEN if not previously RED
      const invalidGreen = EngineeringMethods.verifyTddCycle('GREEN', { testFailedInitially: false });
      assert.strictEqual(invalidGreen.compliant, false);

      // Allow valid RED -> GREEN transition
      const validGreen = EngineeringMethods.verifyTddCycle('GREEN', { testFailedInitially: true });
      assert.strictEqual(validGreen.compliant, true);
    });

    it('generates non-destructive two-phase migration plans', () => {
      const migration = EngineeringMethods.planTwoPhaseMigration('users', 'rename username to handle');
      assert.strictEqual(migration.phase1_Expand.destructive, false);
      assert.strictEqual(migration.phase2_Contract.destructive, false);
    });
  });

  describe('Design & Accessibility Methods', () => {
    it('calculates WCAG 2.1 AA contrast accurately', () => {
      // Black on White: 21:1
      const blackOnWhite = DesignMethods.calculateWcagContrast([0, 0, 0], [255, 255, 255]);
      assert.strictEqual(blackOnWhite.passesAA, true);
      assert.strictEqual(blackOnWhite.passesAAA, true);
      assert.strictEqual(blackOnWhite.ratio, 21);

      // Light gray on White: ~1.5:1 -> fails AA
      const lightGrayOnWhite = DesignMethods.calculateWcagContrast([200, 200, 200], [255, 255, 255]);
      assert.strictEqual(lightGrayOnWhite.passesAA, false);
    });

    it('evaluates 60/30/10 visual balance heuristic', () => {
      const balanced = DesignMethods.evaluate603010Heuristic(60, 30, 10);
      assert.strictEqual(balanced.balanced, true);

      const unbalanced = DesignMethods.evaluate603010Heuristic(33, 33, 34);
      assert.strictEqual(unbalanced.balanced, false);
    });

    it('validates three-tier token architecture and flags primitive leaks', () => {
      const validTokens = [
        { name: 'primitive.blue500', tier: 'primitive', references: '#3b82f6' },
        { name: 'semantic.colorBrand', tier: 'semantic', references: 'primitive.blue500' },
        { name: 'component.btnBg', tier: 'component', references: 'semantic.colorBrand' }
      ];
      assert.strictEqual(DesignMethods.validateTokenArchitecture(validTokens).valid, true);

      const invalidTokens = [
        { name: 'primitive.blue500', tier: 'primitive', references: '#3b82f6' },
        { name: 'component.btnBg', tier: 'component', references: 'primitive.blue500' }
      ];
      const res = DesignMethods.validateTokenArchitecture(invalidTokens);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.violations.length, 1);
    });

    it('verifies prefers-reduced-motion in animation stylesheets', () => {
      const withReduced = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `;
      assert.strictEqual(DesignMethods.verifyReducedMotionSupport(withReduced).compliant, true);

      const withoutReduced = `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `;
      assert.strictEqual(DesignMethods.verifyReducedMotionSupport(withoutReduced).compliant, false);
    });
  });

  describe('Quality & Anti-Slop Methods', () => {
    it('removes redundant obvious AI code comments', () => {
      const code = `
// import express
import express from 'express';
// initialize variable
const i = 0;
// NOTE: Must keep this workaround for safari
const isSafari = true;
      `;
      const res = QualityMethods.sanitizeCodeComments(code);
      assert.strictEqual(res.removedCommentsCount, 2);
      assert.ok(res.cleanedCode.includes('NOTE: Must keep this workaround'));
    });

    it('detects banned generic AI marketing buzzwords', () => {
      const slopText = 'We delve into the cutting-edge realm to seamlessly unleash potential.';
      const res = QualityMethods.auditCopywriting(slopText);
      assert.strictEqual(res.hasSlop, true);
      assert.ok(res.detectedCliches.includes('delve'));
      assert.ok(res.detectedCliches.includes('unleash'));
      assert.ok(res.detectedCliches.includes('seamlessly'));
    });

    it('flags speculative utility additions in diffs', () => {
      const badDiff = '+export function stringHelper() {}';
      assert.strictEqual(QualityMethods.auditLeanDiff(badDiff).leanCompliant, false);

      const goodDiff = '+const result = parseInput(data);';
      assert.strictEqual(QualityMethods.auditLeanDiff(goodDiff).leanCompliant, true);
    });
  });

  describe('Security Guidance & Threat Model Methods', () => {
    it('provides defensive guidance for CORS and Auth', () => {
      const corsGuidance = SecurityMethods.getDefensiveGuidance('cors');
      assert.strictEqual(corsGuidance.topic, 'CORS');
      assert.ok(corsGuidance.recommendations.length >= 3);
    });

    it('composes STRIDE threat models', () => {
      const tm = SecurityMethods.composeStrideThreatModel('API Gateway', [
        { category: 'Spoofing', threat: 'Forged JWT signature', mitigation: 'Asymmetric RS256 verification' },
        { category: 'Denial of Service', threat: 'Rate limit exhaustion', mitigation: 'Token bucket limiter' }
      ]);
      assert.strictEqual(tm.totalThreats, 2);
      assert.strictEqual(tm.threatMatrix[0].status, 'MITIGATED');
    });

    it('validates finding schema correctly', () => {
      const validFinding = {
        file: 'src/auth.js',
        line: 42,
        attackClass: 'AUTHENTICATION_BYPASS',
        severity: 'CRITICAL',
        remediation: 'Verify signature before trusting payload'
      };
      assert.strictEqual(SecurityMethods.validateFinding(validFinding).valid, true);

      const invalidFinding = {
        file: 'src/auth.js',
        attackClass: 'INVALID_ATTACK',
        severity: 'UNKNOWN'
      };
      const res = SecurityMethods.validateFinding(invalidFinding);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.length >= 3);
    });

    it('strictly gates full security audit on explicit user command', () => {
      const withoutExplicit = SecurityMethods.assertAuditActivationAllowed(false);
      assert.strictEqual(withoutExplicit.allowed, false);
      assert.strictEqual(withoutExplicit.status, 'BLOCKED');

      const withExplicit = SecurityMethods.assertAuditActivationAllowed(true);
      assert.strictEqual(withExplicit.allowed, true);
      assert.strictEqual(withExplicit.status, 'ACTIVATED');
    });
  });

  describe('Delivery & Artifacts Methods', () => {
    it('composes structured Architecture Decision Records (ADR)', () => {
      const adr = DeliveryMethods.composeAdr({
        id: 'ADR-001',
        title: 'Use Hybrid Anti-Slop Engine',
        status: 'ACCEPTED',
        context: 'Need deterministic contrast combined with semantic tone evaluation',
        decision: 'Implement JS math for WCAG and contextual checks for copy',
        consequences: 'Zero false positives on code keywords'
      });
      assert.ok(adr.includes('# ADR-001: Use Hybrid Anti-Slop Engine'));
      assert.ok(adr.includes('## Decision'));
    });

    it('formats clean action microcopy', () => {
      const label = DeliveryMethods.composeActionLabel('Export', 'CSV Report');
      assert.strictEqual(label, 'Export CSV Report');
    });

    it('formats artifact metadata with UserFacing flag', () => {
      const meta = DeliveryMethods.formatArtifactMetadata({
        summary: 'Audit of core engine',
        userFacing: true,
        requestFeedback: false
      });
      assert.strictEqual(meta.UserFacing, true);
      assert.strictEqual(meta.RequestFeedback, false);
    });
  });

});
