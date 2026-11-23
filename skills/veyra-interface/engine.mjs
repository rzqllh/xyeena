/**
 * Veyra Interface Engine — veyra-interface (Canonical, aliased: veyra-ui)
 * WCAG 2.2 contrast ratio, Hallmark Floor craft auditing, 3-tier design tokens, touch targets.
 * Zero external dependencies.
 */

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c+c).join('') : clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function calculateContrastRatio(foregroundHex, backgroundHex) {
  const rgb1 = hexToRgb(foregroundHex);
  const rgb2 = hexToRgb(backgroundHex);

  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));

  return {
    foregroundHex,
    backgroundHex,
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7.0,
    wcagLargeAA: ratio >= 3.0
  };
}

export function auditHallmarkFloor(styleText = '') {
  const issues = [];
  const lower = styleText.toLowerCase();

  if (lower.includes('linear-gradient') && lower.includes('purple') && lower.includes('indigo')) {
    issues.push({ issue: 'GENERIC_AI_PURPLE_GRADIENT', severity: 'HIGH' });
  }

  return {
    passesTheFloor: issues.length === 0,
    issueCount: issues.length,
    issues
  };
}

export function auditDesignTokens(tokenObject = {}) {
  const hasPrimitives = Boolean(tokenObject.primitive && Object.keys(tokenObject.primitive).length > 0);
  const hasSemantics = Boolean(tokenObject.semantic && Object.keys(tokenObject.semantic).length > 0);
  const hasComponents = Boolean(tokenObject.component && Object.keys(tokenObject.component).length > 0);
  const threeTierCompliant = hasPrimitives && hasSemantics && hasComponents;
  return {
    threeTierCompliant,
    hasPrimitives,
    hasSemantics,
    hasComponents,
    verdict: threeTierCompliant ? 'PASS' : 'INCOMPLETE_TOKEN_HIERARCHY'
  };
}

export function auditTouchTargetSize(widthPx, heightPx, minSize = 44) {
  const compliant = widthPx >= minSize && heightPx >= minSize;
  return { compliant, widthPx, heightPx, minSize, reason: compliant ? 'TOUCH_TARGET_COMPLIANT' : 'TOUCH_TARGET_TOO_SMALL' };
}
