/**
 * Xyeena Native Methods - Quality & Anti-Slop Suite
 * Enforces comprehensive anti-slop rules across code comment hygiene,
 * human-first copywriting, accessibility touch targets, focus indicators,
 * mobile responsive boundaries, and lean change limits.
 */

export class QualityMethods {
  /**
   * Banned generic AI buzzwords and robotic transitions in product & UX copy.
   */
  static BANNED_AI_CLICHES = Object.freeze([
    // Empty hype & marketing buzzwords
    'delve',
    'delve into',
    'unleash',
    'seamlessly',
    'elevate',
    'cutting-edge',
    'game-changer',
    'game changing',
    'tapestry',
    'testament to',
    'beacon of',
    'realm of',
    'powerhouse',
    'revolutionize',
    'transformative',
    'plethora',
    'paramount',
    'pivotal',
    'dive into',
    'supercharge',
    'next-gen',
    'robust and scalable',
    // Robotic AI conversational transitions
    'moreover',
    'furthermore',
    'in conclusion',
    'it is worth noting',
    'in the realm of',
    'without further ado'
  ]);

  /**
   * Filter redundant AI code comments that merely narrate what code visibly does.
   * Strictly preserves comments with 'WHY:', 'NOTE:', 'TODO:', 'FIXME:', 'PERF:', issue links, or architectural invariants.
   * @param {string} code
   * @returns {{ cleanedCode: string, removedCommentsCount: number }}
   */
  static sanitizeCodeComments(code = '') {
    const lines = code.split('\n');
    let removedCount = 0;

    const preservedIndicators = [
      /\b(why|note|todo|fixme|perf|hack|bug|workaround|invariant|safety)\b/i,
      /https?:\/\//i,
      /issue\s*#?[0-9]+/i
    ];

    const redundantNarrations = [
      /^\s*\/\/\s*import\s+/i,
      /^\s*\/\/\s*increment\s+/i,
      /^\s*\/\/\s*return\s+the\s+result/i,
      /^\s*\/\/\s*initialize\s+/i,
      /^\s*\/\/\s*declare\s+/i,
      /^\s*\/\/\s*this\s+function\s+/i,
      /^\s*\/\/\s*constructor\s*$/i,
      /^\s*\/\/\s*export\s+/i,
      /^\s*\/\/\s*set\s+state\s+/i,
      /^\s*\/\/\s*call\s+helper\s+/i,
      /^\s*\/\/\s*define\s+class\s+/i,
      /^\s*\/\/\s*assign\s+value\s+/i
    ];

    const cleanedLines = lines.filter(line => {
      // If it contains a preserve indicator, keep it!
      if (preservedIndicators.some(pat => pat.test(line))) {
        return true;
      }
      // Check if line matches a purely redundant comment pattern
      const isRedundant = redundantNarrations.some(pat => pat.test(line));
      if (isRedundant) {
        removedCount += 1;
        return false;
      }
      return true;
    });

    return {
      cleanedCode: cleanedLines.join('\n'),
      removedCommentsCount: removedCount
    };
  }

  /**
   * Detect AI copywriting clichés in product/landing/documentation copy.
   * @param {string} text
   * @returns {object} Anti-slop audit result
   */
  static auditCopywriting(text = '') {
    const lower = text.toLowerCase();
    const detectedCliches = [];

    for (const cliche of QualityMethods.BANNED_AI_CLICHES) {
      const regex = new RegExp(`\\b${cliche.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(lower)) {
        detectedCliches.push(cliche);
      }
    }

    return {
      hasSlop: detectedCliches.length > 0,
      detectedCliches,
      count: detectedCliches.length,
      recommendation: detectedCliches.length > 0
        ? `Replace generic AI buzzwords (${detectedCliches.join(', ')}) with specific, human, actionable descriptions.`
        : 'Copywriting is crisp and free of obvious AI clichés.'
    };
  }

  /**
   * Audit touch targets for interactive elements:
   * - WCAG 2.2 Level AA (SC 2.5.8): Minimum 24x24 CSS px (with inline/spacing exceptions).
   * - WCAG Level AAA (SC 2.5.5 / Apple HIG): Enhanced 44x44 CSS px target size.
   * @param {string} cssOrMarkup
   * @param {object} [options={}]
   * @param {'AA' | 'AAA'} [options.targetLevel='AA']
   * @returns {object}
   */
  static auditTouchTargets(cssOrMarkup = '', options = {}) {
    const targetLevel = options.targetLevel || 'AA';
    const isInline = /<a\s+[^>]*href|display\s*:\s*inline|class=["'][^"']*inline/i.test(cssOrMarkup);

    // Regex to capture explicit pixel dimensions
    const pxMatches = Array.from(cssOrMarkup.matchAll(/(?:width|height|size|min-width|min-height)\s*:\s*([0-9]+)px/gi));
    // Tailwind classes
    const twMatches = Array.from(cssOrMarkup.matchAll(/(?:^|\s)(?:w|h|size)-([0-9]+)\b/gi));

    const dimensions = [];
    for (const m of pxMatches) {
      dimensions.push(parseInt(m[1], 10));
    }
    for (const m of twMatches) {
      // Tailwind scale: 1 unit = 4px (e.g. w-6 = 24px, w-4 = 16px, w-11 = 44px)
      dimensions.push(parseInt(m[1], 10) * 4);
    }

    const sub24px = dimensions.filter(d => d < 24);
    const sub44px = dimensions.filter(d => d < 44);

    const passesAA = isInline || sub24px.length === 0;
    const passesAAA = sub44px.length === 0;
    const compliant = targetLevel === 'AAA' ? passesAAA : passesAA;

    return {
      compliant,
      passesAA,
      passesAAA,
      targetLevel,
      isInlineException: isInline,
      dimensionsDetected: dimensions,
      sub24Count: sub24px.length,
      sub44Count: sub44px.length,
      advice: !passesAA
        ? `WCAG 2.2 Level AA (SC 2.5.8) violation: target dimensions < 24px detected (${sub24px.join('px, ')}px). Interactive targets must be at least 24x24px unless inline.`
        : (!passesAAA
          ? 'Passes WCAG 2.2 Level AA (>= 24x24px). Recommendation for Level AAA (SC 2.5.5 / Apple HIG): increase touch bounding box to at least 44x44px.'
          : 'Interactive elements satisfy enhanced 44x44px target bounds (WCAG AAA & Apple HIG compliant).')
    };
  }

  /**
   * Audit focus indicators to ensure keyboard accessibility.
   * Flags `outline: none` or `outline: 0` without matching focus-visible / ring replacement.
   * @param {string} cssContent
   */
  static auditFocusIndicators(cssContent = '') {
    const suppressesOutline = /outline\s*:\s*(?:none|0)\b|outline-none\b/i.test(cssContent);
    const hasFocusVisibleOrRing = /:focus-visible\b|ring-[a-zA-Z0-9_-]+|box-shadow\s*:/i.test(cssContent);

    const isViolation = suppressesOutline && !hasFocusVisibleOrRing;
    return {
      compliant: !isViolation,
      suppressesOutline,
      hasFocusVisible: hasFocusVisibleOrRing,
      advice: isViolation
        ? 'Accessibility violation: outline suppressed without providing a :focus-visible or custom focus ring replacement.'
        : 'Focus indicators comply with keyboard navigation accessibility.'
    };
  }

  /**
   * Audit mobile layout boundaries for horizontal overflow risks.
   * @param {string} cssContent
   */
  static auditMobileLayout(cssContent = '') {
    // Rigid large fixed widths without max-width
    const rigidWidths = /(?:^|[^-])width\s*:\s*[4-9][0-9]{2,}px/gi.test(cssContent);
    const bodyOverflowHidden = /body\s*\{[^}]*overflow(?:-x)?\s*:\s*hidden/i.test(cssContent);

    const risks = [];
    if (rigidWidths) risks.push('Fixed pixel widths >= 400px risk viewport clipping on mobile screens.');
    if (bodyOverflowHidden) risks.push('Body overflow-x: hidden masks layout bugs instead of fixing underlying grid/flex overflow.');

    return {
      compliant: risks.length === 0,
      risks,
      advice: risks.length === 0
        ? 'Layout adheres to fluid mobile-responsive bounds.'
        : risks.join(' ')
    };
  }

  /**
   * Enforce lean scope: flags speculative unused helper additions.
   * @param {string} diff
   * @returns {object}
   */
  static auditLeanDiff(diff = '') {
    const addsHelper = /\+export function [a-zA-Z0-9]+Helper/i.test(diff);
    const addsSpeculativeUtil = /\+export const [a-zA-Z0-9]+Utils/i.test(diff);

    const isSpeculative = addsHelper || addsSpeculativeUtil;
    return {
      leanCompliant: !isSpeculative,
      warning: isSpeculative
        ? 'Possible speculative abstraction detected. Ensure newly created utilities are strictly required by current scope.'
        : 'Diff adheres to lean change boundaries.'
    };
  }
}
