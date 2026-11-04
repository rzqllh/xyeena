/**
 * Xyeena Native Methods - Design & Accessibility Suite
 * Implements WCAG 2.1 AA contrast math, three-tier token validation,
 * 60/30/10 visual balance heuristics, fluid responsive bounds, and reduced-motion checks.
 */

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
   * Calculate WCAG 2.1 contrast ratio between two RGB colors.
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
   * Evaluate 60/30/10 color harmony heuristic.
   * Note: Heuristic indicator, not a dogmatic universal law.
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
   * Validate three-tier token architecture:
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
        const refsPrimitive = t.references.startsWith('primitive.');
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
   * Verify animation declarations support prefers-reduced-motion.
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
}
