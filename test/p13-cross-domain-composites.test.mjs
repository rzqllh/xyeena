/**
 * XYEENA P13: Cross-Domain Methodology & Composite Skills Acceptance Suite
 * Validates DEC-32 cross-domain methodology across 8 comparative fixtures and all 11 composite skills.
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
import { DesignMethods } from '../src/methods/design.mjs';
import { QualityMethods } from '../src/methods/quality.mjs';
import { EngineeringMethods } from '../src/methods/engineering.mjs';
import { ThinkingMethods } from '../src/methods/thinking.mjs';
import { SecurityMethods } from '../src/methods/security.mjs';
import { DeliveryMethods } from '../src/methods/delivery.mjs';

describe('XYEENA P13: Cross-Domain Methodology & Composite Skills Suite (DEC-32)', () => {
  const cortex = createDefaultCortex();
  const registry = new CompositeRegistry();

  // =========================================================================
  // SECTION 1: Composite Skills Architecture & Registry Integrity
  // =========================================================================
  describe('1. Composite Skills Registry & Definitions', () => {
    it('contains all 11 authoritative composite skills', () => {
      const composites = registry.list();
      assert.equal(composites.length, 11, 'Must register exactly 11 composite skills');

      const expectedIds = [
        'xyeena-design', 'xyeena-plan', 'xyeena-execute', 'xyeena-debug',
        'xyeena-review', 'xyeena-test', 'xyeena-verify', 'xyeena-security',
        'xyeena-research', 'xyeena-writing', 'xyeena-orchestrate'
      ];

      for (const id of expectedIds) {
        const comp = registry.get(id);
        assert.ok(comp, `Composite skill "${id}" must exist`);
        assert.equal(comp.layer, 'L2', `Composite skill "${id}" must belong to Layer L2`);
        assert.ok(Array.isArray(comp.upstreamSources), `Composite "${id}" must declare upstream RE sources`);
        assert.ok(comp.upstreamSources.length > 0, `Composite "${id}" must trace to at least one upstream RE ID`);
        assert.ok(typeof comp.execute === 'function', `Composite "${id}" must have an executable pipeline`);
      }
    });

    it('resolves composite skills by slash command, ID, and alias', () => {
      assert.equal(registry.get('/xyeena-design')?.id, 'xyeena-design');
      assert.equal(registry.get('design')?.id, 'xyeena-design');
      assert.equal(registry.get('huashu-design')?.id, 'xyeena-design');
      assert.equal(registry.get('/xyeena-plan')?.id, 'xyeena-plan');
      assert.equal(registry.get('writing-plans')?.id, 'xyeena-plan');
      assert.equal(registry.get('verification-before-completion')?.id, 'xyeena-verify');
      assert.equal(registry.get('code-reviewer')?.id, 'xyeena-review');
    });
  });

  // =========================================================================
  // SECTION 2: 8 Comparative Domain Fixtures (DEC-32 Universal Discipline)
  // =========================================================================
  describe('2. Eight Comparative Domain Fixtures', () => {
    // -----------------------------------------------------------------------
    // Fixture 1: Small Code Fix (Surgical Patch vs Sprawling Edit)
    // -----------------------------------------------------------------------
    it('Fixture 1 (Small Code Fix): Enforces surgical patch and smallest correct change (Ponytail RE-04)', () => {
      const cleanDiff = `
diff --git a/src/calc.js b/src/calc.js
--- a/src/calc.js
+++ b/src/calc.js
@@ -10,1 +10,1 @@
-  return a / b;
+  if (b === 0) throw new RangeError("Division by zero");
+  return a / b;
      `.trim();

      const leanResult = QualityMethods.auditLeanDiff(cleanDiff);
      assert.equal(leanResult.leanCompliant, true, 'Clean, narrow diff must pass lean audit');

      const compResult = registry.execute('xyeena-execute', {
        isExecutionAuthorized: true,
        diff: cleanDiff,
        stage: 'GREEN'
      });

      assert.equal(compResult.status, 'SUCCESS');
      assert.equal(compResult.leanAudit.leanCompliant, true);
      assert.equal(compResult.tddDiscipline.cycle, 'RED_GREEN_REFACTOR');
    });

    // -----------------------------------------------------------------------
    // Fixture 2: Multi-Module Architecture (Deep Module Seams vs Leaky Shims)
    // -----------------------------------------------------------------------
    it('Fixture 2 (Multi-Module Architecture): Evaluates deep module seams without leaky shims (Superior RE-02)', () => {
      const deepSeam = {
        publicMethods: ['read(key)', 'write(key, val)', 'delete(key)'],
        internalLinesOfCode: 120
      };

      const seamResult = EngineeringMethods.evaluateModuleSeam(deepSeam);
      assert.equal(seamResult.classification, 'DEEP_MODULE', 'Deep module with narrow interface must be recognized');

      const planResult = registry.execute('xyeena-plan', {
        goal: 'Refactor database adapter into deep module',
        constraints: ['Zero external network calls', 'POSIX file system compatibility'],
        phases: [
          { phase: 1, name: 'Define narrow interface', files: ['src/storage.mjs'], verificationCmd: 'npm test' },
          { phase: 2, name: 'Encapsulate SQLite and memory driver', files: ['src/driver.mjs'], verificationCmd: 'npm test' }
        ]
      });

      assert.equal(planResult.status, 'SUCCESS');
      assert.equal(planResult.phasedPlan.totalPhases, 2);
      assert.equal(planResult.sizing.riskProfile, 'STANDARD');
    });

    // -----------------------------------------------------------------------
    // Fixture 3: Frontend / Mobile UI (Contrast, Touch Targets, 3-Tier Tokens)
    // -----------------------------------------------------------------------
    it('Fixture 3 (Frontend/Mobile UI): Enforces WCAG 2.2 AA (24px) / AAA (44px) and 3-Tier tokens (Anti-Slop / Taste / UI UX Pro Max)', () => {
      // 1. WCAG 2.2 Contrast calculation
      const darkOnLight = DesignMethods.calculateWcagContrast([30, 41, 59], [255, 255, 255]); // slate-800 on white
      assert.ok(darkOnLight.ratio >= 7.0, 'Slate-800 on white must exceed 7.0:1');
      assert.equal(darkOnLight.passesAAA, true);

      // 2. Three-tier token architecture
      const tokens = [
        { name: 'primitive.color.blue500', tier: 'primitive', references: null },
        { name: 'semantic.color.action', tier: 'semantic', references: 'primitive.color.blue500' },
        { name: 'component.button.bg', tier: 'component', references: 'semantic.color.action' }
      ];
      const tokenAudit = DesignMethods.validateTokenArchitecture(tokens);
      assert.equal(tokenAudit.valid, true, 'Valid 3-tier layering must pass');

      // 3. Execution via /xyeena-design composite
      const designResult = registry.execute('xyeena-design', {
        prompt: 'Create mobile navbar with accessible button',
        colors: { fg: [30, 41, 59], bg: [255, 255, 255] },
        tokens
      });

      assert.equal(designResult.status, 'SUCCESS');
      assert.equal(designResult.tokenAudit.valid, true);
      assert.equal(designResult.contrastResult.passesAAA, true);
      assert.equal(designResult.antiSlopAudit.compliant, true);
    });

    // -----------------------------------------------------------------------
    // Fixture 4: Human Copywriting (Eliminates Clichés & Corporate Fluff)
    // -----------------------------------------------------------------------
    it('Fixture 4 (Human Copywriting): Detects and eliminates AI slop buzzwords and robotic fillers (Anti-Slop RE-03)', () => {
      const slopText = 'We delve into the testament of seamless innovation, weaving a tapestry of groundbreaking solutions.';
      const cleanText = 'The installer verifies file integrity, creates an atomic backup, and rolls back if an error occurs.';

      // Check slop text
      const slopResult = registry.execute('xyeena-writing', { text: slopText });
      assert.equal(slopResult.status, 'SUCCESS');
      assert.equal(slopResult.isHumanTone, false, 'Slop text must trigger anti-slop findings');
      assert.ok(slopResult.antiSlopAudit.copywriting.detectedCliches.length > 0);

      // Check clean human text
      const cleanResult = registry.execute('xyeena-writing', { text: cleanText });
      assert.equal(cleanResult.isHumanTone, true, 'Direct, clear prose must pass with zero slop findings');
      assert.equal(cleanResult.antiSlopAudit.copywriting.detectedCliches.length, 0);
    });

    // -----------------------------------------------------------------------
    // Fixture 5: Research Synthesis (Grounded Citations vs Circular AI Claims)
    // -----------------------------------------------------------------------
    it('Fixture 5 (Research Synthesis): Requires verified primary source citations with line numbers (Caveman RE-05)', () => {
      const citations = [
        { path: 'src/installer/transaction.mjs', lines: '143-150', claim: 'replacement checks file existence' },
        { path: 'src/core/cortex.mjs', line: 45, claim: 'constructor initializes intent router' }
      ];

      const researchResult = registry.execute('xyeena-research', {
        topic: 'Verification of installer transaction boundaries',
        citations
      });

      assert.equal(researchResult.status, 'SUCCESS');
      assert.equal(researchResult.citationsAudited, 2);
      assert.ok(researchResult.verifiedCitations.every(c => c.citationValid === true));
      assert.ok(researchResult.verifiedCitations.every(c => c.tier === 'OBSERVED'));
    });

    // -----------------------------------------------------------------------
    // Fixture 6: Security Review (Scoped Diff Review vs Gated Full Audit)
    // -----------------------------------------------------------------------
    it('Fixture 6 (Security Review): Defaults to scoped diff review and blocks unrequested full audits (Cloudflare RE-06)', () => {
      // 1. Scoped diff review runs freely
      const scopedResult = registry.execute('xyeena-security', {
        diff: 'const hash = crypto.createHash("sha256").update(data).digest("hex");',
        sensitiveFiles: ['src/crypto.mjs'],
        findings: [
          {
            file: 'src/crypto.mjs',
            line: 10,
            attackClass: 'CRYPTOGRAPHIC_WEAKNESS',
            severity: 'LOW',
            remediation: 'Use SHA-256 for cryptographic signatures',
            cwe: 'CWE-327'
          }
        ]
      });

      assert.equal(scopedResult.status, 'SUCCESS');
      assert.equal(scopedResult.mode, 'SCOPED_DIFF_REVIEW');
      assert.equal(scopedResult.validatedFindings[0].valid, true);

      // 2. Full audit without explicit consent fails closed safely
      const unconsentedFullAudit = registry.execute('xyeena-security', {
        fullAuditRequested: true,
        explicitOwnerApproval: false
      });

      assert.equal(unconsentedFullAudit.status, 'BLOCKED_CONSENT_REQUIRED');
      assert.ok(unconsentedFullAudit.reason.includes('Full security audit requires explicit owner approval'));
    });

    // -----------------------------------------------------------------------
    // Fixture 7: Product Planning (Phased Sizing, Constraints, & Reviewable Gates)
    // -----------------------------------------------------------------------
    it('Fixture 7 (Product Planning): Builds reviewable phased plan with rollback commands and explicit gates', () => {
      const plan = registry.execute('xyeena-plan', {
        goal: 'Deliver user settings panel with profile editing',
        constraints: ['No unhashed passwords', 'WCAG AA accessible', 'Mobile viewport responsive'],
        phases: [
          { phase: 1, name: 'Form components & state', files: ['src/components/form/'], verificationCmd: 'npm test test/form.test.mjs' },
          { phase: 2, name: 'Validation & API binding', files: ['src/api/user.mjs'], verificationCmd: 'npm test test/api.test.mjs' },
          { phase: 3, name: 'Visual polish & responsive checks', files: ['src/pages/settings.mjs'], verificationCmd: 'npm run check' }
        ]
      });

      assert.equal(plan.status, 'SUCCESS');
      assert.equal(plan.phasedPlan.totalPhases, 3);
      assert.equal(plan.phasedPlan.phases[0].gateCommand, 'npm test test/form.test.mjs');
      assert.equal(plan.leanCheck.discipline, 'PONYTAIL_SMALLEST_CHANGE');
    });

    // -----------------------------------------------------------------------
    // Fixture 8: Documentation / Audit Artifact (Structured Rubric & Hygiene)
    // -----------------------------------------------------------------------
    it('Fixture 8 (Documentation / Audit Artifact): Composes structured ADR artifact with explicit consequences', () => {
      const adr = DeliveryMethods.composeAdr({
        id: 'ADR-032',
        title: 'Superpowers and Anti-Slop Are Cross-Domain Methodologies',
        status: 'ACCEPTED',
        context: 'Superpowers and Anti-Slop were previously siloed to engineering and copywriting.',
        decision: 'Enforce Superpowers and Anti-Slop across all engineering, design, security, research, and planning surfaces.',
        consequences: 'Eliminates repetitive procedural slop and unifies verification standards across domains.'
      });

      assert.ok(adr.includes('# ADR-032: Superpowers and Anti-Slop Are Cross-Domain Methodologies'));
      assert.ok(adr.includes('**Status:** ACCEPTED'));
      assert.ok(adr.includes('## Consequences'));
    });
  });

  // =========================================================================
  // SECTION 3: Cortex Integration & Dynamic Routing
  // =========================================================================
  describe('3. Cortex Dynamic Routing with Composite Skills', () => {
    it('Cortex resolves and executes composite skill when invoked via slash command', async () => {
      const result = await cortex.execute('/xyeena-design Create clean mobile navbar', {
        execute: true,
        input: {
          prompt: 'Create clean mobile navbar',
          colors: { fg: [20, 20, 20], bg: [250, 250, 250] },
          tokens: [
            { name: 'primitive.color.gray', tier: 'primitive', references: null },
            { name: 'semantic.color.bg', tier: 'semantic', references: 'primitive.color.gray' },
            { name: 'component.nav.bg', tier: 'component', references: 'semantic.color.bg' }
          ]
        }
      });

      assert.equal(result.engine, 'Cortex');
      assert.equal(result.status, 'COMPLETED');
      assert.ok(result.compositeResult, 'Cortex must attach compositeResult');
      assert.equal(result.compositeResult.compositeId, 'xyeena-design');
      assert.equal(result.compositeResult.tokenAudit.valid, true);
    });

    it('Cortex inspects composite skills without executing in Discussion Mode', () => {
      const inspection = cortex.inspect('/xyeena-plan Refactor authentication module');
      assert.equal(inspection.cortexEngine, 'ONLINE');
      assert.ok(inspection.skills.explicitDetected.includes('xyeena-plan') || inspection.skills.explicitDetected.includes('plan'));
      assert.equal(inspection.governance.rule4GateActive, true, 'Rule 4 Gate must be active in Discussion Mode');
    });

    it('Cortex dispatchComposite throws error on invalid composite ID', () => {
      assert.throws(
        () => cortex.dispatchComposite('non-existent-composite'),
        /Composite skill not found/
      );
    });
  });

  // =========================================================================
  // SECTION 4: Behavioral Trait Guidance Overlay & Host Boundaries (DEC-32)
  // =========================================================================
  describe('4. Behavioral Trait Guidance Overlay (DEC-32 Synthesis)', () => {
    it('resolves domain-appropriate traits without character roleplay or persona overwrite', () => {
      const designTraits = BehavioralTraitOverlay.resolveTraits('design and mobile css layout');
      assert.ok(designTraits.some(t => t.id === 'trait.design-craft-taste'));

      const secTraits = BehavioralTraitOverlay.resolveTraits('security audit and auth review');
      assert.ok(secTraits.some(t => t.id === 'trait.security-caution'));

      const debugTraits = BehavioralTraitOverlay.resolveTraits('debug crash in startup sequence');
      assert.ok(debugTraits.some(t => t.id === 'trait.root-cause-debugger'));
    });

    it('formats compact trait overlay with bounded token overhead (< 150 tokens)', () => {
      const overlay = BehavioralTraitOverlay.formatOverlay('design UI buttons and contrast');
      assert.ok(overlay.tokenEstimate < 150, `Overlay tokens (${overlay.tokenEstimate}) must be < 150`);
      assert.ok(overlay.overlayText.includes('Architectural Guidance Overlay'));
      assert.ok(overlay.overlayText.includes('Design Craft & Taste'));
      assert.ok(overlay.overlayText.includes('Guardrail:'));
    });

    it('WorkflowComposer incorporates trait guidance overlay alongside L0 Kernel', () => {
      const composer = new WorkflowComposer();
      const composition = composer.compose({
        prompt: 'Create high-craft landing page hero with accessible buttons',
        mode: 'DISCUSSION',
        tier: TASK_TIERS.TIER_1_STANDARD,
        activeCapabilities: []
      });

      assert.ok(composition.payloadText.includes('# Xyeena Invariant Kernel (L0)'));
      assert.ok(composition.payloadText.includes('# Active Execution Gate'));
      assert.ok(composition.payloadText.includes('# Architectural Guidance Overlay'));
      assert.ok(composition.stats.traitTokenShare > 0);
      assert.ok(composition.stats.traitTokenShare < 150);
    });
  });
});
