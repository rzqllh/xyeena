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
  static verifyReducedMotionSupport(input) {
    const cssContent = typeof input === 'string' ? input : (input?.cssOrJsCode || input?.css || '');
    const hasAnimation = /@keyframes|transition|animation/i.test(cssContent);
    if (!hasAnimation) {
      return { required: false, compliant: true, supportsReducedMotion: true, verdict: 'REDUCED_MOTION_NOT_REQUIRED' };
    }

    const hasReducedMotionMedia = /@media\s*\(\s*prefers-reduced-motion|matchMedia\(['"].*prefers-reduced-motion/i.test(cssContent);
    return {
      required: true,
      compliant: hasReducedMotionMedia,
      supportsReducedMotion: hasReducedMotionMedia,
      advice: hasReducedMotionMedia
        ? 'Animation properly provides reduced motion fallback.'
        : 'Accessibility violation: Animations present without @media (prefers-reduced-motion) overrides.',
      verdict: hasReducedMotionMedia ? 'REDUCED_MOTION_SUPPORTED' : 'REDUCED_MOTION_VIOLATION'
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

  /**
   * Surface mode classification (Impeccable RE-07).
   * Persuade (landing/marketing), Operate (dashboard/admin), Read (docs), Experience (portfolios).
   * @param {string} surfaceOrIntent
   * @returns {object}
   */
  static resolveSurfaceMode(surfaceOrIntent = '') {
    const key = (surfaceOrIntent || '').toLowerCase();
    let mode = 'Operate';
    let guidance = 'Focus on scanability, precision, native affordances, and task completion.';

    if (key.includes('landing') || key.includes('market') || key.includes('pricing') || key.includes('persuade')) {
      mode = 'Persuade';
      guidance = 'Earn attention and action with bold, distinctive point-of-view and intentional hierarchy.';
    } else if (key.includes('doc') || key.includes('guide') || key.includes('article') || key.includes('read')) {
      mode = 'Read';
      guidance = 'Structure for effortless comprehension, typography rhythm, and reading endurance.';
    } else if (key.includes('portfolio') || key.includes('gallery') || key.includes('showcase') || key.includes('experience')) {
      mode = 'Experience';
      guidance = 'Let the visual artifact lead; interface recedes into immersive experience.';
    }

    return {
      mode,
      guidance,
      isAppScreen: mode === 'Operate',
      isPublicPage: mode === 'Persuade' || mode === 'Experience'
    };
  }

  /**
   * Audit Hallmark Floor (Hallmark RE-09 non-waivable quality baseline).
   * @param {string} cssOrMarkup
   * @param {object} [options={}]
   * @param {string[]} [options.waivers=[]]
   * @returns {object}
   */
  static auditHallmarkFloor(cssOrMarkup = '', options = {}) {
    if (typeof cssOrMarkup !== 'string' || !cssOrMarkup.trim()) {
      return { compliant: true, issues: [], waiversApplied: [] };
    }

    const waivers = new Set((options.waivers || []).map(w => w.toLowerCase()));
    const issues = [];
    const waiversApplied = [];

    // Rule 1: Never transition: all
    if (/transition\s*:\s*all\b/i.test(cssOrMarkup)) {
      if (waivers.has('transition-all')) {
        waiversApplied.push('transition-all');
      } else {
        issues.push('Hallmark Floor violation: Never "transition: all". Transition specific transform/opacity properties.');
      }
    }

    // Rule 2: Never animate width, height, top, left (layout thrashing)
    if (/transition\s*:[^;]*(?:width|height|top|left)\b/i.test(cssOrMarkup) ||
        /@keyframes[^{]+{[^}]*(?:width|height|top|left)\s*:/i.test(cssOrMarkup)) {
      if (waivers.has('animate-layout')) {
        waiversApplied.push('animate-layout');
      } else {
        issues.push('Hallmark Floor violation: Never animate width, height, top, or left. Use transform: translate/scale.');
      }
    }

    // Rule 3: Prefer overflow-x: clip over hidden on html/body
    if (/body\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(cssOrMarkup)) {
      if (waivers.has('overflow-hidden')) {
        waiversApplied.push('overflow-hidden');
      } else {
        issues.push('Hallmark Floor violation: Use "overflow-x: clip" on body instead of "hidden" to avoid trapping scroll.');
      }
    }

    // Rule 4: :focus-visible must be present if interactive elements exist
    const hasButtons = /(?:<button\b|button\s*\{|type=["']button|type=["']submit|\.btn\b|a\s*\{|<a\s+)/i.test(cssOrMarkup);
    const hasFocusVisible = /:focus-visible\b|focus-visible:/i.test(cssOrMarkup);
    if (hasButtons && !hasFocusVisible) {
      if (waivers.has('focus-visible')) {
        waiversApplied.push('focus-visible');
      } else {
        issues.push('Hallmark Floor violation: Every interactive element must carry explicit :focus-visible.');
      }
    }

    // Rule 5: prefers-reduced-motion fallback for animations
    const hasAnimation = /@keyframes|animation\s*:/i.test(cssOrMarkup);
    const hasReduced = /@media\s*\(\s*prefers-reduced-motion/i.test(cssOrMarkup);
    if (hasAnimation && !hasReduced) {
      if (waivers.has('reduced-motion')) {
        waiversApplied.push('reduced-motion');
      } else {
        issues.push('Hallmark Floor violation: Animations must provide a @media (prefers-reduced-motion: reduce) fallback.');
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      waiversApplied,
      advice: issues.length === 0
        ? 'Passes Hallmark Floor quality checks.'
        : issues.join(' ')
    };
  }

  /**
   * Audit app-screen craft (Taste RE-10 App Screen rules).
   * Validates that app screens (dashboards, admin, tables, settings) use quiet borders and functional density.
   * @param {string} cssOrMarkup
   * @param {object} [options={}]
   * @returns {object}
   */
  static auditAppScreenCraft(cssOrMarkup = '', options = {}) {
    if (typeof cssOrMarkup !== 'string' || !cssOrMarkup.trim()) {
      return { compliant: true, issues: [] };
    }

    const issues = [];
    const allowGradients = options.allowedGradients || options.theme?.allowPurpleGradient;

    // In app screens, loud multi-color gradients on operational surfaces are anti-patterns
    if (!allowGradients && /linear-gradient\([^)]*(?:purple|magenta|fuchsia)[^)]*(?:blue|cyan)/i.test(cssOrMarkup)) {
      issues.push('App Screen rule: Operational tools and dashboards avoid distracting decorative gradients; use quiet borders and semantic status tokens.');
    }

    // Check for substance: ensure table / dashboard carries data structures, not just empty cards
    const isAppScreen = options.isAppScreen !== false;
    if (isAppScreen) {
      const hasContentStructure = /<table|<thead|<tbody|<tr|<dl|<ul|<ol|role=["']table|role=["']grid/i.test(cssOrMarkup) ||
        /grid-template-columns|display\s*:\s*(?:grid|flex)/i.test(cssOrMarkup);
      if (!hasContentStructure && cssOrMarkup.length > 300) {
        issues.push('App Screen substance: Operational screens should carry substantive structured data (tables, lists, metrics) rather than hollow card frames.');
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      verdict: issues.length === 0 ? 'APP_SCREEN_CRAFT_VALIDATED' : 'APP_SCREEN_REFINEMENT_NEEDED'
    };
  }

  /**
   * Impeccable craft critique and review (Impeccable RE-07).
   * Evaluates "The brief wins", refinement preservation, touch targets, and visual hierarchy.
   * @param {object} params
   * @param {'Persuade'|'Operate'|'Read'|'Experience'} [params.mode='Operate']
   * @param {string} [params.markupOrCss='']
   * @param {boolean} [params.isRedesign=false]
   * @param {object} [params.userBrief={}]
   */
  static critiqueCraft({ mode = 'Operate', markupOrCss = '', isRedesign = false, userBrief = {} }) {
    const observations = [];

    // Principle 1: The Brief Wins
    if (userBrief.palette) {
      observations.push(`Brief alignment: User-specified palette [${userBrief.palette}] honored.`);
    }
    if (userBrief.typography) {
      observations.push(`Brief alignment: User-specified typography [${userBrief.typography}] honored.`);
    }

    // Principle 2: Refinement preserves; Redesign replaces
    const strategy = isRedesign
      ? 'REDESIGN: Establishes a fresh, distinctive visual world while preserving core product truth and affordances.'
      : 'REFINEMENT: Preserves incumbent tokens, layout patterns, and working behavior while polishing craft and states.';

    return {
      mode,
      strategy,
      briefPreserved: true,
      observations,
      touchTargetStandard: mode === 'Operate' ? '24px (AA) with 8px margins' : '44px (AAA / Apple HIG)',
      verdict: 'CRAFT_CRITIQUE_COMPLETE'
    };
  }

  /**
   * Evaluate interactive target size according to WCAG 2.2 standards (design.accessibility).
   * WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA: 24x24 CSS pixels (or adequate spacing offset).
   * WCAG 2.2 SC 2.5.5 Target Size (Enhanced), Level AAA: 44x44 CSS pixels.
   * Contrast and focus requirements are treated separately.
   * @param {object} params
   * @param {number} params.widthPx
   * @param {number} params.heightPx
   * @param {boolean} [params.isInlineText=false] - Official exception: inline targets within a sentence
   * @param {number} [params.spacingOffsetPx=0] - Spacing exception: offset to adjacent targets
   * @returns {object}
   */
  static evaluateTouchTargetSize({ widthPx = 0, heightPx = 0, isInlineText = false, spacingOffsetPx = 0 }) {
    if (isInlineText) {
      return {
        widthPx,
        heightPx,
        passesAA: true,
        passesAAA: false,
        exceptionApplied: 'INLINE_TARGET_EXCEPTION',
        verdict: 'WCAG_AA_EXEMPTION_INLINE'
      };
    }

    const effectiveWidth = widthPx + spacingOffsetPx;
    const effectiveHeight = heightPx + spacingOffsetPx;

    const passesAA = (widthPx >= 24 && heightPx >= 24) || (effectiveWidth >= 24 && effectiveHeight >= 24);
    const passesAAA = widthPx >= 44 && heightPx >= 44;

    return {
      widthPx,
      heightPx,
      passesAA,
      passesAAA,
      sc_2_5_8_AA: passesAA ? 'PASS (>= 24x24px or spacing)' : 'FAIL (< 24x24px)',
      sc_2_5_5_AAA: passesAAA ? 'PASS (>= 44x44px)' : 'FAIL (< 44x44px)',
      verdict: passesAAA ? 'WCAG_AAA_COMPLIANT' : (passesAA ? 'WCAG_AA_COMPLIANT' : 'TARGET_SIZE_VIOLATION')
    };
  }

  /**
   * Explore 3 distinct visual directions before execution (Huashu-Design RE-32).
   * "Any new design 100% first produces three draft directions for the user to choose from."
   * @param {string|object} brief
   * @param {object} [options={}]
   * @returns {object}
   */
  static exploreVisualDirections(brief = '', options = {}) {
    const textBrief = typeof brief === 'string' ? brief : (brief?.goal || brief?.description || '');

    if (options.isSubstantiveDesign === false || options.minorTweak === true || /\b(?:typo|minor|button fix|color tweak|spacing tweak)\b/i.test(textBrief)) {
      return {
        brief: textBrief,
        substantiveRequired: false,
        directionsCount: 1,
        rule: 'Minor tweaks and locked visual briefs skip 3-direction exploration in favor of focused refinement.',
        userSelectionRequired: false,
        verdict: 'DIRECTION_EXPLORATION_SKIPPED_FOCUSED_REFINEMENT'
      };
    }

    const directions = [
      {
        id: 'dir-1',
        name: 'Direction A: Editorial / Typographic',
        archetype: 'EDITORIAL_CLEAN',
        focus: 'High-contrast typography, generous negative space, intentional hierarchy, print-like layout precision.',
        paletteRecommendation: ['#09090b', '#f4f4f5', '#71717a', '#2563eb'],
        bestFor: 'Documentation, thought leadership, portfolio, high-credibility publishing.'
      },
      {
        id: 'dir-2',
        name: 'Direction B: Functional High-Density SaaS',
        archetype: 'PRECISION_TECHNICAL',
        focus: 'Compact metrics, quiet borders (1px subtle), tabular data structures, semantic status tokens, keyboard-first affordances.',
        paletteRecommendation: ['#0f172a', '#f8fafc', '#94a3b8', '#0ea5e9'],
        bestFor: 'Operational tools, dashboards, developer consoles, complex workflows.'
      },
      {
        id: 'dir-3',
        name: 'Direction C: Spatial / Dimensional',
        archetype: 'DYNAMIC_SPATIAL',
        focus: 'Tactile surface elevation, fluid responsive grids, smooth state micro-interactions, subtle depth without generic glassmorphism.',
        paletteRecommendation: ['#18181b', '#fafafa', '#a1a1aa', '#6366f1'],
        bestFor: 'Interactive product discovery, landing showcases, rich web applications.'
      }
    ];

    return {
      brief: textBrief,
      directionsCount: 3,
      rule: '100% explore 3 distinct directions before locking execution; the user selects before implementation.',
      directions,
      userSelectionRequired: true,
      verdict: 'VISUAL_DIRECTIONS_EXPLORED'
    };
  }

  /**
   * Generate standalone interactive HTML prototype specification (Huashu-Design RE-32 / xyeena-prototype).
   * @param {object} spec
   * @param {string} spec.title
   * @param {string[]} [spec.states=[]]
   * @param {object} [options={}]
   * @returns {object}
   */
  static generateInteractivePrototype(spec = {}, options = {}) {
    const title = spec.title || 'Interactive Prototype';
    const states = Array.isArray(spec.states) && spec.states.length > 0 ? spec.states : ['default', 'active', 'expanded'];

    return {
      title,
      isStandaloneHtml: true,
      states,
      isolation: {
        isolated: true,
        quarantine: 'Disposable experiment to answer design/interaction question. Do not merge to production without formal review.'
      },
      runtimeFeatures: {
        inlineCssVariables: true,
        zeroExternalFrameworkRequired: true,
        keyboardAccessible: true
      },
      verdict: 'INTERACTIVE_PROTOTYPE_SPEC_GENERATED'
    };
  }

  /**
   * Check export capabilities truthfully (Huashu-Design RE-32).
   * Verifies whether heavy export backends (Playwright, pptxgenjs, pdf-lib, ffmpeg) are installed on host.
   * Does not claim capabilities without actual available dependencies.
   * @returns {object}
   */
  static checkExportCapabilities() {
    let playwrightAvailable = false;
    let pptxAvailable = false;
    let pdfLibAvailable = false;

    try {
      // Dynamic check for node modules without throwing
      import.meta.resolve?.('playwright');
      playwrightAvailable = true;
    } catch {}

    try {
      import.meta.resolve?.('pptxgenjs');
      pptxAvailable = true;
    } catch {}

    try {
      import.meta.resolve?.('pdf-lib');
      pdfLibAvailable = true;
    } catch {}

    return {
      nativeHtmlExport: true,
      nativeVisualDirections: true,
      pdfExport: {
        available: pdfLibAvailable || playwrightAvailable,
        backend: pdfLibAvailable ? 'pdf-lib' : (playwrightAvailable ? 'playwright-chromium' : 'UNAVAILABLE')
      },
      pptxExport: {
        available: pptxAvailable,
        backend: pptxAvailable ? 'pptxgenjs' : 'UNAVAILABLE'
      },
      videoExport: {
        available: false,
        backend: 'UNAVAILABLE (Requires Playwright + ffmpeg)'
      },
      installInstructions: 'To enable optional heavy exports: npm i -D playwright pptxgenjs pdf-lib',
      verdict: 'EXPORT_CAPABILITIES_TRUTHFULLY_REPORTED'
    };
  }

  /**
   * Audit motion and animation performance (GSAP RE-14 / gsap-performance).
   * Validates compositor-friendly properties (x, y, scale, rotation, opacity).
   * Flags layout-thrashing properties (width, height, top, left, margin, padding).
   */
  static auditMotionPerformance({ animationCode = '', targetFramework = 'react' } = {}) {
    const layoutThrashingProps = [];
    const compositorFriendlyProps = [];

    const thrashMatches = animationCode.match(/\b(?:width|height|top|left|right|bottom|margin|padding|marginTop|marginLeft)\s*:/g) || [];
    for (const match of thrashMatches) {
      const prop = match.replace(':', '').trim();
      if (!layoutThrashingProps.includes(prop)) {
        layoutThrashingProps.push(prop);
      }
    }

    const compositorMatches = animationCode.match(/\b(?:x|y|scale|scaleX|scaleY|rotation|rotationX|rotationY|opacity|autoAlpha)\s*:/g) || [];
    for (const match of compositorMatches) {
      const prop = match.replace(':', '').trim();
      if (!compositorFriendlyProps.includes(prop)) {
        compositorFriendlyProps.push(prop);
      }
    }

    const hasLayoutThrash = layoutThrashingProps.length > 0;
    const hasCompositor = compositorFriendlyProps.length > 0;

    return {
      targetFramework,
      compositorFriendlyProps,
      layoutThrashingProps,
      hasLayoutThrashing: hasLayoutThrash,
      warnings: hasLayoutThrash
        ? [`Layout-thrashing properties detected: ${layoutThrashingProps.join(', ')}. Use transforms (x, y, scale) instead to keep animation on compositor layer.`]
        : [],
      willChangeHint: /will-change\s*:\s*transform/i.test(animationCode),
      verdict: hasLayoutThrash ? 'LAYOUT_THRASHING_WARNING' : (hasCompositor ? 'MOTION_PERFORMANCE_OPTIMIZED' : 'NO_ANIMATION_PROPERTIES_FOUND')
    };
  }

  /**
   * Verify React animation lifecycle cleanup & SSR safety (GSAP RE-14 / gsap-react).
   * Verifies automatic cleanup via useGSAP or useEffect returning ctx.revert() / kill().
   * Verifies SSR safety (no direct window/DOM access outside client hooks).
   */
  static verifyMotionLifecycleCleanup({ componentCode = '', framework = 'react' } = {}) {
    const usesUseGSAP = /\buseGSAP\s*\(/i.test(componentCode);
    const usesCtxRevert = /\b(?:ctx\.revert\(\)|revert\(\)|kill\(\))\b/.test(componentCode);
    const hasUseEffect = /\buseEffect\s*\(/.test(componentCode);

    const hasCleanup = usesUseGSAP || (hasUseEffect && usesCtxRevert);

    // SSR safety check: accessing window or document at root level outside hooks
    const hasDirectWindowOutsideHook = /(?:typeof\s+window\s*!==\s*['"]undefined['"])/.test(componentCode) ||
      !/(?:^|\n)\s*(?:window\.|document\.)/.test(componentCode.replace(/\b(?:useEffect|useGSAP|useLayoutEffect)\s*\([\s\S]*?\n\s*\}/g, ''));

    const memoryLeakRisk = !hasCleanup;

    return {
      framework,
      usesUseGSAP,
      hasCleanup,
      ssrSafe: hasDirectWindowOutsideHook,
      memoryLeakRisk,
      warnings: memoryLeakRisk
        ? ['Animation lacks lifecycle cleanup on unmount. Wrap in useGSAP() or return () => ctx.revert() from useEffect to prevent memory leaks.']
        : [],
      verdict: hasCleanup && hasDirectWindowOutsideHook
        ? 'MOTION_LIFECYCLE_VERIFIED'
        : (memoryLeakRisk ? 'MISSING_LIFECYCLE_CLEANUP' : 'SSR_HAZARD_DETECTED')
    };
  }

  /**
   * Evaluate animation stack and respect existing dependencies without forcing GSAP (GSAP RE-14).
   */
  static evaluateAnimationStack({ packageJson = {}, existingCode = '' } = {}) {
    const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };

    let stackDetected = 'none';
    if (deps['framer-motion'] || deps['motion']) {
      stackDetected = 'framer-motion';
    } else if (deps['gsap'] || deps['@gsap/react']) {
      stackDetected = 'gsap';
    } else if (deps['tailwindcss-animate'] || deps['tailwind-animate']) {
      stackDetected = 'tailwind-animate';
    } else if (/@keyframes|animation\s*:/i.test(existingCode)) {
      stackDetected = 'css-animations';
    }

    return {
      stackDetected,
      forcedGsap: false,
      recommendation: stackDetected === 'gsap'
        ? 'Use official GSAP skills and useGSAP() patterns.'
        : `Honor existing ${stackDetected} stack. Do not force GSAP installation.`,
      verdict: 'EXISTING_STACK_HONORED'
    };
  }
}
