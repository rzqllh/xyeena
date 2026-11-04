/**
 * Xyeena Native Methods - Design & Accessibility Suite
 * Implements WCAG 2.1 AA/AAA contrast math, three-tier token architecture,
 * 60/30/10 visual balance heuristics, UX flow validation, visual hierarchy critique,
 * color theory palette formulation, platform guidelines (Apple HIG / Material 3), and motion design.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class DesignMethods {
  /**
   * Convert sRGB channel (0-255) to relative luminance component.
   * @param {number} c
   * @returns {number}
   */
  static srgbToLinear(c) {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  /**
   * Calculate exact WCAG 2.1 relative luminance for an RGB tuple.
   * @param {[number, number, number]} rgb - [r, g, b] 0-255
   * @returns {number} Relative luminance (0 to 1)
   */
  static relativeLuminance([r, g, b]) {
    const lr = DesignMethods.srgbToLinear(r);
    const lg = DesignMethods.srgbToLinear(g);
    const lb = DesignMethods.srgbToLinear(b);
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  }

  /**
   * Calculate WCAG 2.1 contrast ratio between two RGB colors (design.accessibility).
   * Ratio formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter.
   * @param {[number, number, number]} rgb1
   * @param {[number, number, number]} rgb2
   * @param {boolean} [isLargeText=false]
   * @returns {object} Contrast evaluation result
   */
  static calculateWcagContrast(rgb1, rgb2, isLargeText = false) {
    const l1 = DesignMethods.relativeLuminance(rgb1);
    const l2 = DesignMethods.relativeLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const requiredRatio = isLargeText ? 3.0 : 4.5;
    const passesAA = ratio >= requiredRatio;
    const passesAAA = ratio >= (isLargeText ? 4.5 : 7.0);

    return {
      ratio: Math.round(ratio * 100) / 100,
      requiredRatio,
      passesAA,
      passesAAA,
      complianceNote: passesAA
        ? 'Compliant with WCAG 2.1 AA contrast requirements.'
        : `Non-compliant: ratio ${ratio.toFixed(2)}:1 is below the required ${requiredRatio}:1.`
    };
  }

  /**
   * Evaluate 60/30/10 color harmony heuristic (design.color-theory).
   * @param {number} dominantPercent
   * @param {number} secondaryPercent
   * @param {number} accentPercent
   */
  static evaluate603010Heuristic(dominantPercent, secondaryPercent, accentPercent) {
    const total = dominantPercent + secondaryPercent + accentPercent;
    const isBalanced =
      dominantPercent >= 50 && dominantPercent <= 70 &&
      secondaryPercent >= 20 && secondaryPercent <= 40 &&
      accentPercent >= 5 && accentPercent <= 15;

    return {
      distribution: { dominant: dominantPercent, secondary: secondaryPercent, accent: accentPercent },
      totalPercentage: total,
      balanced: isBalanced,
      advice: isBalanced
        ? 'Palette follows the 60/30/10 harmony heuristic.'
        : 'Palette deviates significantly from 60/30/10; ensure high visual hierarchy remains clear.'
    };
  }

  /**
   * Validate three-tier token architecture (design.system / design.interface):
   * Tier 1: Primitives (raw hex)
   * Tier 2: Semantic (functional roles: surface, text-primary, border)
   * Tier 3: Component (button-bg, card-border)
   * Components must NEVER directly reference primitives.
   * @param {Array<{ name: string, tier: 'primitive'|'semantic'|'component', references: string }>} tokens
   */
  static validateTokenArchitecture(tokens = []) {
    const violations = [];

    for (const t of tokens) {
      if (t.tier === 'component') {
        const refsPrimitive = t.references && t.references.startsWith('primitive.');
        if (refsPrimitive) {
          violations.push({
            token: t.name,
            error: `Component token "${t.name}" directly references primitive "${t.references}". Must reference a semantic token.`
          });
        }
      }
    }

    return {
      totalTokens: tokens.length,
      violations,
      valid: violations.length === 0
    };
  }

  /**
   * Verify animation declarations support prefers-reduced-motion (design.responsive / design.motion).
   * @param {string} cssContent
   */
  static verifyReducedMotionSupport(cssContent) {
    const hasAnimation = /@keyframes|transition|animation/i.test(cssContent);
    if (!hasAnimation) {
      return { required: false, compliant: true };
    }

    const hasReducedMotionMedia = /@media\s*\(\s*prefers-reduced-motion/i.test(cssContent);
    return {
      required: true,
      compliant: hasReducedMotionMedia,
      advice: hasReducedMotionMedia
        ? 'Animation properly provides reduced motion fallback.'
        : 'Accessibility violation: Animations present without @media (prefers-reduced-motion) overrides.'
    };
  }

  /**
   * Evaluate user experience flow for cognitive load, error recovery, and feedback states (design.experience).
   * @param {object} params
   * @param {string} params.userGoal
   * @param {string[]} params.steps
   * @param {boolean} params.errorStateHandled
   * @param {boolean} params.loadingStatePresent
   */
  static evaluateUserExperienceFlow({ userGoal, steps = [], errorStateHandled = false, loadingStatePresent = false }) {
    if (!userGoal || steps.length === 0) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'UX flow evaluation requires a goal and steps.');
    }

    const issues = [];
    if (steps.length > 5) {
      issues.push(`Flow contains ${steps.length} steps; risk of excessive cognitive friction (> 5 steps). Consider progressive disclosure.`);
    }
    if (!errorStateHandled) {
      issues.push('Missing explicit error recovery state for user failure scenarios.');
    }
    if (!loadingStatePresent) {
      issues.push('Missing feedback or skeleton loading state for asynchronous actions.');
    }

    const compliant = issues.length === 0;
    return {
      userGoal,
      stepCount: steps.length,
      compliant,
      issues,
      verdict: compliant ? 'OPTIMAL_UX_FLOW' : 'FRICTION_POINTS_DETECTED'
    };
  }

  /**
   * Formulate visual direction and typographic hierarchy (design.direction).
   * @param {object} params
   * @param {'PRECISION_TECHNICAL'|'EDITORIAL_CLEAN'|'MINIMALIST_PRODUCT'|'WARM_HUMAN'} params.archetype
   * @param {string} params.primaryTypeface
   * @param {string} params.monoTypeface
   */
  static formulateDesignDirection({ archetype, primaryTypeface, monoTypeface = 'ui-monospace, monospace' }) {
    const scaleRatios = {
      PRECISION_TECHNICAL: 1.25, // Major Third
      EDITORIAL_CLEAN: 1.333,     // Perfect Fourth
      MINIMALIST_PRODUCT: 1.2,    // Minor Third
      WARM_HUMAN: 1.25
    };

    const ratio = scaleRatios[archetype] || 1.25;
    return {
      archetype,
      typography: {
        body: primaryTypeface,
        mono: monoTypeface,
        scaleRatio: ratio
      },
      elevationRamp: ['0 1px 2px rgba(0,0,0,0.05)', '0 4px 6px -1px rgba(0,0,0,0.1)', '0 10px 15px -3px rgba(0,0,0,0.1)'],
      spacingBasePx: 8,
      verdict: 'DESIGN_DIRECTION_LOCKED'
    };
  }

  /**
   * Critique visual hierarchy and typographic scaling (design.visual-critique).
   * @param {object} params
   * @param {number[]} params.fontSizePxRamp - e.g. [12, 14, 16, 20, 24, 32]
   * @param {number} [params.gridUnit=8]
   */
  static critiqueVisualHierarchy({ fontSizePxRamp = [], gridUnit = 8 }) {
    if (fontSizePxRamp.length < 3) {
      return { compliant: false, verdict: 'INSUFFICIENT_HIERARCHY_LEVELS' };
    }

    const isMonotonic = fontSizePxRamp.every((val, i) => i === 0 || val > fontSizePxRamp[i - 1]);
    const adheresToGrid = gridUnit === 4 || gridUnit === 8;

    return {
      fontSizeCount: fontSizePxRamp.length,
      isMonotonic,
      adheresToGrid,
      compliant: isMonotonic && adheresToGrid,
      verdict: isMonotonic && adheresToGrid ? 'RIGOROUS_VISUAL_HIERARCHY' : 'ERRATIC_VISUAL_HIERARCHY'
    };
  }

  /**
   * Audit platform design guidelines compliance (design.platform-guidelines).
   * @param {object} params
   * @param {'APPLE_HIG'|'MATERIAL_3'|'WEB_STANDARDS'} params.platform
   * @param {string[]} params.declaredElements
   */
  static auditPlatformGuidelines({ platform, declaredElements = [] }) {
    const findings = [];

    if (platform === 'APPLE_HIG') {
      const hasDirectCloseButtonOnTab = declaredElements.includes('floating-fab');
      if (hasDirectCloseButtonOnTab) {
        findings.push('Floating Action Buttons (FAB) are non-standard in Apple HIG; use navigation bar actions or toolbar.');
      }
    } else if (platform === 'MATERIAL_3') {
      const hasNonStandardElevation = declaredElements.includes('hard-borders-only');
      if (hasNonStandardElevation) {
        findings.push('Material Design 3 emphasizes tonal elevation surfaces rather than heavy borders.');
      }
    }

    const compliant = findings.length === 0;
    return {
      platform,
      compliant,
      findings,
      verdict: compliant ? 'PLATFORM_COMPLIANT' : 'PLATFORM_PARADIGM_MISMATCH'
    };
  }

  /**
   * Formulate micro-interaction motion curve (design.motion).
   * @param {object} params
   * @param {'ENTER'|'EXIT'|'TRANSITION'} params.motionType
   * @param {number} params.durationMs
   */
  static designMotionCurve({ motionType, durationMs }) {
    const curves = {
      ENTER: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Ease-out (deceleration)
      EXIT: 'cubic-bezier(0.7, 0, 0.84, 0)',       // Ease-in (acceleration)
      TRANSITION: 'cubic-bezier(0.4, 0, 0.2, 1)'  // Standard ease-in-out
    };

    const isDurationSafe = durationMs >= 100 && durationMs <= 400;
    return {
      motionType,
      durationMs,
      easingCurve: curves[motionType] || curves.TRANSITION,
      isDurationSafe,
      reducedMotionRule: '@media (prefers-reduced-motion: reduce) { transition: none !important; animation: none !important; }',
      verdict: isDurationSafe ? 'OPTIMAL_MICRO_MOTION' : 'EXCESSIVE_MOTION_DURATION'
    };
  }
}
