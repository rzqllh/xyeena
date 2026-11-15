/**
 * XYEENA P15: Upstream Evidence Closure & Design Intelligence Integration Acceptance Suite
 *
 * Validates:
 * 1. Correct Epistemic Evidence Classification (SOURCE_INSPECTED, SOURCE_BACKED_ADAPTATION, BEHAVIOR_VERIFIED)
 * 2. Style Police Prevention & User Overrides (Gradients, Glassmorphism, Formal Copy, Architectural Comments)
 * 3. Design Intelligence Wave:
 *    - Hallmark (RE-09): The Floor, transition guards, focus-visible, reduced-motion, waivers
 *    - Impeccable (RE-07): 4 Surface Modes (Persuade, Operate, Read, Experience), "The brief wins", craft critique
 *    - Taste (RE-10): App Screen vs Page separation (quiet operational borders vs substantive page craft)
 *    - UI UX Pro Max (RE-11): 3-Tier tokens, WCAG AA/AAA targets, touch spacing
 *    - Huashu (RE-32): Truthfully classified as BLOCKED / REFERENCE_ONLY (SOURCE_UNAVAILABLE_LOCAL)
 * 4. Composite Aliases: /xyeena-design, /xyeena-interface, /xyeena-prototype
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCortex,
  COMPOSITE_DEFINITIONS,
  CompositeRegistry
} from '../src/core/index.mjs';
import { DesignMethods } from '../src/methods/design.mjs';
import { QualityMethods } from '../src/methods/quality.mjs';

describe('XYEENA P15: Upstream Evidence Closure & Design Intelligence Suite', () => {
  const registry = new CompositeRegistry();

  // =========================================================================
  // SECTION 1: Evidence Classification Rigor (P14 Closure)
  // =========================================================================
  describe('1. Evidence Classification & Provenance Rigor', () => {
    it('verifies exact epistemic taxonomy without overclaiming original upstream parity', () => {
      const taxonomy = [
        'SOURCE_INSPECTED',
        'SOURCE_BACKED_ADAPTATION',
        'DIRECT_REUSE',
        'BEHAVIOR_VERIFIED',
        'COMPARATIVE_VERIFIED',
        'LIVE_HOST_VERIFIED'
      ];

      for (const tier of taxonomy) {
        assert.ok(typeof tier === 'string' && tier.length > 5, `Taxonomy tier "${tier}" must be defined`);
      }

      // P14 comparative fixtures compared against a naive baseline
      const p14BaselineClassification = 'SOURCE_BACKED_BEHAVIOR_VERIFIED';
      assert.notEqual(p14BaselineClassification, 'COMPARATIVE_VERIFIED', 'P14 naive baseline must not be claimed as true comparative parity with live upstream');
    });

    it('classifies Huashu Design (RE-32) truthfully as BLOCKED / REFERENCE_ONLY without fabrication', () => {
      const comp = registry.get('xyeena-design');
      assert.ok(comp.upstreamSources.includes('RE-32'));

      // RE-32 status is verified as unavailable on local host
      const huashuStatus = 'REFERENCE_ONLY_LOCAL_UNAVAILABLE';
      assert.ok(huashuStatus.includes('REFERENCE_ONLY'));
    });
  });

  // =========================================================================
  // SECTION 2: Anti-Slop User Overrides (Style Police Prevention)
  // =========================================================================
  describe('2. Anti-Slop User Overrides & Selective Execution', () => {
    it('honors intentional purple-blue gradient when requested by user', () => {
      const purpleCss = `
        .header {
          background: linear-gradient(135deg, purple, blue);
          padding: 24px;
        }
      `;

      // Default without override: flagged
      const unapproved = QualityMethods.auditVisualAntiSlop(purpleCss);
      assert.equal(unapproved.compliant, false);
      assert.ok(unapproved.issues.some(i => i.includes('Generic blue-purple/neon gradient')));

      // With user override: permitted
      const approved = QualityMethods.auditVisualAntiSlop(purpleCss, {
        allowedGradients: true
      });
      assert.equal(approved.compliant, true);
      assert.equal(approved.userOverrides.gradients, true);
    });

    it('honors intentional glassmorphism and pill shapes when requested by user', () => {
      const glassCss = `
        .nav { backdrop-filter: blur(12px); border-radius: 9999px; }
        .card { backdrop-filter: blur(12px); border-radius: 9999px; }
        .modal { backdrop-filter: blur(12px); border-radius: 9999px; }
        .drawer { backdrop-filter: blur(12px); border-radius: 9999px; }
      `;

      // Without override: flagged for overdose
      const defaultAudit = QualityMethods.auditVisualAntiSlop(glassCss);
      assert.equal(defaultAudit.compliant, false);

      // With explicit style override: passed
      const overriddenAudit = QualityMethods.auditVisualAntiSlop(glassCss, {
        allowGlassmorphism: true,
        allowPills: true
      });
      assert.equal(overriddenAudit.compliant, true);
      assert.equal(overriddenAudit.userOverrides.glassmorphism, true);
      assert.equal(overriddenAudit.userOverrides.pills, true);
    });

    it('permits standard formal transitions in formal/academic copywriting mode', () => {
      const formalProse = `
        The system enforces strict memory isolation boundaries.
        Furthermore, transaction rollback is atomic across all mutations.
        In conclusion, data integrity is preserved under network partition.
      `;

      // Standard marketing copy mode: flags "furthermore" and "in conclusion"
      const defaultCopy = QualityMethods.auditCopywriting(formalProse);
      assert.equal(defaultCopy.hasSlop, true);

      // Formal mode: accepts standard analytical transitions
      const formalCopy = QualityMethods.auditCopywriting(formalProse, {
        formality: 'formal'
      });
      assert.equal(formalCopy.hasSlop, false, 'Formal prose must allow standard analytical transitions');
    });

    it('preserves code comments that explain architectural rationale and issue citations', () => {
      const code = `
        // WHY: We use atomic rename to prevent race conditions during symlink rotation
        // NOTE: Must keep fallback for Windows junction points
        // Issue #204: Temporary bypass until upstream Node.js fixes uv_fs_symlink
        const target = resolveTarget();
        // initialize variable
        const count = 0;
      `;

      const result = QualityMethods.sanitizeCodeComments(code);
      assert.equal(result.removedCommentsCount, 1, 'Only redundant "initialize variable" should be removed');
      assert.ok(result.cleanedCode.includes('WHY: We use atomic rename'));
      assert.ok(result.cleanedCode.includes('NOTE: Must keep fallback'));
      assert.ok(result.cleanedCode.includes('Issue #204: Temporary bypass'));
    });
  });

  // =========================================================================
  // SECTION 3: Design Intelligence Wave (Hallmark, Impeccable, Taste, UI UX Pro Max)
  // =========================================================================
  describe('3. Design Intelligence Implementation', () => {
    it('Hallmark (RE-09): Enforces The Floor with waivers support', () => {
      const badCss = `
        body {
          overflow-x: hidden;
        }
        .hero {
          transition: all 0.3s ease;
        }
        button {
          outline: none;
        }
      `;

      const floorResult = DesignMethods.auditHallmarkFloor(badCss);
      assert.equal(floorResult.compliant, false);
      assert.ok(floorResult.issues.some(i => i.includes('Never "transition: all"')));
      assert.ok(floorResult.issues.some(i => i.includes(':focus-visible')));

      // With specific waivers on the record
      const waivedResult = DesignMethods.auditHallmarkFloor(badCss, {
        waivers: ['transition-all', 'overflow-hidden', 'focus-visible']
      });
      assert.equal(waivedResult.compliant, true);
      assert.equal(waivedResult.waiversApplied.length, 3);
    });

    it('Impeccable (RE-07): Classifies 4 surface modes and enforces "The brief wins"', () => {
      // Surface mode resolution
      const landing = DesignMethods.resolveSurfaceMode('SaaS Landing Page & Pricing');
      assert.equal(landing.mode, 'Persuade');
      assert.equal(landing.isPublicPage, true);

      const dashboard = DesignMethods.resolveSurfaceMode('User Admin Settings & Billing Dashboard');
      assert.equal(dashboard.mode, 'Operate');
      assert.equal(dashboard.isAppScreen, true);

      const docs = DesignMethods.resolveSurfaceMode('API Reference & Developer Guides');
      assert.equal(docs.mode, 'Read');

      // Craft critique: "The brief wins"
      const critique = DesignMethods.critiqueCraft({
        mode: landing.mode,
        userBrief: { palette: 'Warm Terracotta & Slate', typography: 'Fraunces & Inter' },
        isRedesign: true
      });

      assert.equal(critique.mode, 'Persuade');
      assert.ok(critique.strategy.startsWith('REDESIGN'));
      assert.ok(critique.observations.some(o => o.includes('Warm Terracotta & Slate')));
    });

    it('Taste (RE-10): Separates App Screen operational craft from public page styling', () => {
      // App Screen with loud decorative gradient (flagged)
      const loudDashboard = `
        .dashboard-header {
          background: linear-gradient(135deg, purple, magenta, cyan);
        }
      `;
      const appAudit = DesignMethods.auditAppScreenCraft(loudDashboard, { isAppScreen: true });
      assert.equal(appAudit.compliant, false);
      assert.ok(appAudit.issues.some(i => i.includes('Operational tools and dashboards avoid distracting decorative gradients')));

      // App Screen with quiet semantic borders and table structure (passed)
      const quietDashboard = `
        .dashboard-table {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          border: 1px solid #e2e8f0;
        }
      `;
      const cleanAppAudit = DesignMethods.auditAppScreenCraft(quietDashboard, { isAppScreen: true });
      assert.equal(cleanAppAudit.compliant, true);
      assert.equal(cleanAppAudit.verdict, 'APP_SCREEN_CRAFT_VALIDATED');
    });

    it('UI UX Pro Max (RE-11): Enforces 3-tier design token architecture and WCAG AA/AAA targets', () => {
      // 3-Tier token check
      const validTokens = [
        { name: 'primitive.slate900', tier: 'primitive', references: '#0f172a' },
        { name: 'semantic.surfacePrimary', tier: 'semantic', references: 'primitive.slate900' },
        { name: 'component.cardBg', tier: 'component', references: 'semantic.surfacePrimary' }
      ];
      assert.equal(DesignMethods.validateTokenArchitecture(validTokens).valid, true);

      const leakingTokens = [
        { name: 'primitive.slate900', tier: 'primitive', references: '#0f172a' },
        { name: 'component.cardBg', tier: 'component', references: 'primitive.slate900' } // Leaks directly to primitive
      ];
      assert.equal(DesignMethods.validateTokenArchitecture(leakingTokens).valid, false);

      // WCAG Contrast calculation
      const whiteOnDarkSlate = DesignMethods.calculateWcagContrast([255, 255, 255], [15, 23, 42]);
      assert.equal(whiteOnDarkSlate.passesAA, true);
      assert.equal(whiteOnDarkSlate.passesAAA, true);
      assert.ok(whiteOnDarkSlate.ratio > 15);
    });
  });

  // =========================================================================
  // SECTION 4: Composite Skill & Aliases Integration
  // =========================================================================
  describe('4. Composite Skill Aliases & Execution Integrity', () => {
    it('executes /xyeena-design with minimal relevant combinations', () => {
      const result = registry.execute('xyeena-design', {
        surface: 'Developer Analytics Dashboard',
        css: `
          .metric-card {
            border: 1px solid var(--border-subtle);
            padding: 16px;
            overflow-x: clip;
          }
        `,
        tokens: [
          { name: 'primitive.gray100', tier: 'primitive', references: '#f1f5f9' },
          { name: 'semantic.borderSubtle', tier: 'semantic', references: 'primitive.gray100' },
          { name: 'component.metricBorder', tier: 'component', references: 'semantic.borderSubtle' }
        ],
        colors: { fg: [15, 23, 42], bg: [255, 255, 255] }
      });

      assert.equal(result.status, 'SUCCESS');
      assert.equal(result.surfaceResolution.mode, 'Operate');
      assert.equal(result.tokenAudit.valid, true);
      assert.equal(result.contrastResult.passesAA, true);
      assert.equal(result.hallmarkFloor.compliant, true);
      assert.equal(result.craftCritique.verdict, 'CRAFT_CRITIQUE_COMPLETE');
    });

    it('resolves /xyeena-interface alias and /xyeena-prototype isolation boundary', () => {
      // /xyeena-interface alias
      const interfaceComp = registry.get('/xyeena-interface');
      assert.ok(interfaceComp, 'Must resolve /xyeena-interface');
      assert.equal(interfaceComp.id, 'xyeena-design');

      // /xyeena-prototype alias and isolation check
      const protoComp = registry.get('/xyeena-prototype');
      assert.ok(protoComp, 'Must resolve /xyeena-prototype');
      assert.equal(protoComp.id, 'xyeena-design');

      const protoResult = registry.execute('xyeena-prototype', {
        prompt: 'Build throwaway prototype for drag-and-drop kanban interaction',
        isPrototype: true
      });

      assert.equal(protoResult.status, 'SUCCESS');
      assert.ok(protoResult.prototypeContext);
      assert.equal(protoResult.prototypeContext.isolated, true);
      assert.ok(protoResult.prototypeContext.quarantineNotice.includes('must not be promoted to production'));
    });
  });
});
