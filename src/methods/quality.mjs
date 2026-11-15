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
   * Filter redundant AI code comments that merely narrate what code visibly does (antislop-code RE-03).
   * Strips decorative separators, workflow narration, empty labels, and vague placeholders.
   * Strictly preserves comments with 'WHY:', 'NOTE:', specific 'TODO: <context>', 'FIXME:', 'PERF:', issue links, or architectural invariants.
   * @param {string} code
   * @returns {{ cleanedCode: string, removedCommentsCount: number }}
   */
  static sanitizeCodeComments(code = '') {
    const lines = code.split('\n');
    let removedCount = 0;

    const preservedIndicators = [
      /\b(why|note|fixme|perf|hack|bug|workaround|invariant|safety)\b/i,
      /https?:\/\//i,
      /issue\s*#?[0-9]+/i
    ];

    const vaguePlaceholders = [
      /^\s*\/\/\s*todo:?\s*(?:improve|optimize|fix|refactor|add\s+more|better)\s*$/i,
      /^\s*\/\/\s*(?:future\s+improvements?|additional\s+optimization\s+can\s+be\s+added)\s*$/i
    ];

    const redundantNarrations = [
      // Direct visible statement narration
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
      /^\s*\/\/\s*assign\s+value\s+/i,
      // Decorative separators & banner borders (antislop-code R-31)
      /^\s*\/\/\s*[=\-_*~#]{3,}\s*$/i,
      /^\s*\/\/\s*[=\-_*~#]{3,}.*[=\-_*~#]{3,}\s*$/i,
      /^\s*\/\*\s*[=\-_*~#]{3,}.*[=\-_*~#]{3,}\s*\*\/\s*$/i,
      // Workflow narration (antislop-code)
      /^\s*\/\/\s*(?:step\s*\d+|phase\s*\d+|first\b|next\b|finally\b)\s*:/i,
      /^\s*\/\/\s*step\s*\d+\s*[-:]/i,
      // Empty category labels
      /^\s*\/\/\s*(?:main|core|business)\s+logic\s*$/i,
      /^\s*\/\/\s*(?:helper\s+functions?|entry\s+point|error\s+handling)\s*$/i
    ];

    const cleanedLines = lines.filter(line => {
      const normalized = line.replace(/^\s*\+\s*/, '');

      // 1. Explicit vague placeholder check (never preserve vague TODOs)
      if (vaguePlaceholders.some(pat => pat.test(normalized))) {
        removedCount += 1;
        return false;
      }

      // 2. Preserve comments that carry specific architectural rationale / issue citations
      if (preservedIndicators.some(pat => pat.test(normalized)) || (/todo\b/i.test(normalized) && normalized.trim().length > 25)) {
        return true;
      }

      // 3. Check if line matches a redundant comment pattern
      const isRedundant = redundantNarrations.some(pat => pat.test(normalized));
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
   * Detect AI copywriting clichés in product/landing/documentation copy (context-aware).
   * Distinguishes intentional style, legitimate technical usage, quotes, and linguistic analysis
   * from ungrounded marketing hype and robotic filler (P14 DEC-32 Anti-Slop overblocking prevention).
   *
   * @param {string} text
   * @param {object} [options={}]
   * @param {string[]} [options.allowedCliches=[]]
   * @param {boolean} [options.allowQuotedUsage=true]
   * @returns {object} Anti-slop audit result
   */
  static auditCopywriting(text = '', options = {}) {
    if (typeof text !== 'string' || !text.trim()) {
      return {
        hasSlop: false,
        detectedCliches: [],
        count: 0,
        recommendation: 'No copy provided for review.'
      };
    }

    const allowQuoted = options.allowQuotedUsage !== false;
    const isFormal = options.formality === 'formal' || options.allowFormalTransitions === true;
    const allowed = new Set((options.allowedCliches || []).map(c => c.toLowerCase()));

    if (isFormal) {
      // In formal academic/legal prose, standard analytical transitions are legitimate
      allowed.add('moreover');
      allowed.add('furthermore');
      allowed.add('in conclusion');
      allowed.add('it is worth noting');
    }

    // 1. Strip fenced code blocks (``` ... ```) and inline code (` ... `)
    let sanitizedText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ');

    // 2. Strip blockquotes (> ...) and direct quotes ("...", '...', “...”, ‘...’)
    if (allowQuoted) {
      sanitizedText = sanitizedText
        .replace(/^>.*$/gm, ' ')
        .replace(/["“][^"“”\n]+["”]/g, ' ')
        .replace(/['‘][^'‘’\n]+['’]/g, ' ');
    }

    // 3. Strip linguistic discussion / meta lines (e.g. "Banned clichés include...", "The word X means...")
    sanitizedText = sanitizedText.replace(/(?:banned\s+clich[eé]s?|anti-slop\s+rule|linguistic\s+example|etymology\s+of|prohibited\s+words?)[^\n.]*[.\n]?/gi, ' ');

    const lower = sanitizedText.toLowerCase();
    const detectedCliches = [];

    for (const cliche of QualityMethods.BANNED_AI_CLICHES) {
      if (allowed.has(cliche.toLowerCase())) continue;
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
        : 'Copywriting is crisp, contextual, and free of unquoted AI clichés.'
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

  /**
   * Audit CSS or markup for generic AI UI clichés (antislop-ui RE-03).
   * Detects blue-purple/neon gradient defaults, glassmorphism overuse, uniform pill-shaped elements, and glow overdose.
   * @param {string} cssOrMarkup
   * @param {object} [options={}]
   * @returns {object}
   */
  static auditVisualAntiSlop(cssOrMarkup = '', options = {}) {
    if (typeof cssOrMarkup !== 'string' || !cssOrMarkup.trim()) {
      return {
        compliant: true,
        issues: [],
        advice: 'No CSS/markup supplied.'
      };
    }

    const issues = [];
    const allowGradients = Boolean(options.allowedGradients || options.allowGradients || options.theme?.allowPurpleGradient);
    const allowGlass = Boolean(options.allowedGlassmorphism || options.allowGlassmorphism || options.theme?.allowGlassmorphism);
    const allowPills = Boolean(options.allowedPills || options.allowPills || options.theme?.allowPills);
    const allowGlow = Boolean(options.allowedGlow || options.allowGlow || options.theme?.allowGlow);

    // 1. Generic AI blue-to-purple / purple-to-pink gradient defaults (antislop-ui R-01)
    const hasGenericGradient = /linear-gradient\([^)]*(?:purple|#8b5cf6|#a855f7|violet|indigo|fuchsia|magenta)[^)]*(?:blue|cyan|#06b6d4|#3b82f6|pink)/i.test(cssOrMarkup) ||
      /\b(?:from-purple-\d+\s+to-blue-\d+|from-indigo-\d+\s+to-purple-\d+|from-purple-\d+\s+to-pink-\d+)\b/i.test(cssOrMarkup);
    if (hasGenericGradient && !allowGradients) {
      issues.push('Generic blue-purple/neon gradient detected. Use product palette instead of AI default gradient.');
    }

    // 2. Glassmorphism overuse: blur/backdrop-filter across 3+ surfaces simultaneously (antislop-ui R-10)
    const glassMatches = (cssOrMarkup.match(/backdrop-filter\s*:\s*blur|backdrop-blur/gi) || []).length;
    if (glassMatches >= 3 && !allowGlass) {
      issues.push(`Excessive glassmorphism: ${glassMatches} blurred surfaces detected. Limit glass effect to at most 1-2 accent elements.`);
    }

    // 3. Excessive uniform pill shapes: rounded-full / border-radius: 9999px across 4+ elements (antislop-ui R-11)
    const pillMatches = (cssOrMarkup.match(/border-radius\s*:\s*(?:9999px|50px)|rounded-full/gi) || []).length;
    if (pillMatches >= 4 && !allowPills) {
      issues.push(`Excessive pill radius: ${pillMatches} pill elements detected. Differentiate buttons, inputs, and cards using systematic radius tokens.`);
    }

    // 4. Glow overdose: glow on 3+ elements simultaneously (antislop-ui R-13)
    const glowMatches = (cssOrMarkup.match(/box-shadow\s*:\s*0\s+0\s+[1-9][0-9]*px|drop-shadow-glow/gi) || []).length;
    if (glowMatches >= 3 && !allowGlow) {
      issues.push(`Glow overdose: ${glowMatches} glowing elements detected. Reserve glow for at most 1-2 focus accents.`);
    }

    return {
      compliant: issues.length === 0,
      issues,
      userOverrides: {
        gradients: allowGradients,
        glassmorphism: allowGlass,
        pills: allowPills,
        glow: allowGlow
      },
      glassSurfacesCount: glassMatches,
      pillElementsCount: pillMatches,
      glowElementsCount: glowMatches,
      advice: issues.length === 0
        ? 'Visual styling is free of generic AI gradient, glass, pill, and glow clichés.'
        : issues.join(' ')
    };
  }

  /**
   * DEC-32: Universal Contextual Anti-Slop Evaluator across all domains:
   * - Code: redundant comment hygiene (preserves WHY/invariants, removes narration)
   * - Prose/Copywriting: robotic AI transitions and hype buzzwords
   * - UI/UX/Styling: touch target sizes (WCAG 24px/44px), focus indicators, mobile overflow, and visual slop
   * - Diff/Scope: lean diff abstractions
   * - Research/Reasoning: empty reasoning filler
   *
   * @param {string|object} payload - Code, prose, diff, CSS, or structured payload
   * @param {object} [options={}]
   * @returns {object} Contextual anti-slop audit result
   */
  static auditUniversalAntiSlop(payload = '', options = {}) {
    let content = '';
    let domain = options.domain || 'auto';

    if (typeof payload === 'string') {
      content = payload;
    } else if (payload && typeof payload === 'object') {
      content = payload.content || payload.text || payload.code || payload.diff || payload.css || '';
      domain = payload.domain || domain;
    }

    if (!content) {
      return {
        compliant: true,
        domain,
        checksPerformed: [],
        summary: 'No content supplied for anti-slop audit.'
      };
    }

    const results = {
      compliant: true,
      domain,
      checksPerformed: []
    };

    const isCode = domain === 'code' ||
      /\b(?:function|const|let|var|import|export|class|return|=>)\b/.test(content) ||
      content.includes('//') || content.includes('/*');

    const isDiff = domain === 'diff' ||
      content.startsWith('diff --git') ||
      /^(?:\+\+\+|---|\+|-)/m.test(content);

    const isCssOrUi = domain === 'design' || domain === 'ui' ||
      /(?:px|rem|em|vh|vw|display\s*:|margin|padding|@media|className=|<[a-z]+)/i.test(content);

    // 1. Code comments hygiene check
    if (isCode) {
      const codeRes = QualityMethods.sanitizeCodeComments(content);
      results.code = codeRes;
      results.checksPerformed.push('code-comment-hygiene');
      if (codeRes.removedCommentsCount > 0) {
        results.compliant = false;
      }
    }

    // 2. Diff lean check
    if (isDiff) {
      const diffRes = QualityMethods.auditLeanDiff(content);
      results.diff = diffRes;
      results.checksPerformed.push('lean-diff-audit');
      if (!diffRes.leanCompliant) {
        results.compliant = false;
      }
    }

    // 3. UI and accessibility check
    if (isCssOrUi) {
      const touchRes = QualityMethods.auditTouchTargets(content, options);
      const focusRes = QualityMethods.auditFocusIndicators(content);
      const mobileRes = QualityMethods.auditMobileLayout(content);
      const visualRes = QualityMethods.auditVisualAntiSlop(content, options);
      results.ui = {
        touchTargets: touchRes,
        focusIndicators: focusRes,
        mobileLayout: mobileRes,
        visualSlop: visualRes
      };
      results.checksPerformed.push('ui-accessibility-and-layout');
      if (!touchRes.compliant || !focusRes.compliant || !mobileRes.compliant || !visualRes.compliant) {
        results.compliant = false;
      }
    }

    // 4. Prose / Copywriting clichés check (runs for text/markdown or alongside code docs)
    const copyRes = QualityMethods.auditCopywriting(content, options);
    results.copywriting = copyRes;
    results.checksPerformed.push('copywriting-cliche-audit');
    if (copyRes.hasSlop) {
      results.compliant = false;
    }

    results.summary = results.compliant
      ? 'Content passes universal contextual anti-slop checks across evaluated domains.'
      : 'Anti-slop issues detected. See check details for actionable recommendations.';

    return results;
  }
}
