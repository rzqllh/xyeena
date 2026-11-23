/**
 * Veyra Test Engine — veyra-test
 * Automated behavioral verification, test category classification, assertion auditing.
 * Zero external dependencies.
 */

export function classifyTestSuites(paths = []) {
  const categories = {
    UNIT: [],
    INTEGRATION: [],
    BEHAVIORAL: [],
    REGRESSION: [],
    CONTRACT: []
  };

  for (const p of paths) {
    const lower = p.toLowerCase();
    if (lower.includes('integration')) categories.INTEGRATION.push(p);
    else if (lower.includes('behavior') || lower.includes('e2e')) categories.BEHAVIORAL.push(p);
    else if (lower.includes('regression')) categories.REGRESSION.push(p);
    else if (lower.includes('contract')) categories.CONTRACT.push(p);
    else categories.UNIT.push(p);
  }

  return {
    totalSuites: paths.length,
    categories,
    hasRegressionProtection: categories.REGRESSION.length > 0 || categories.INTEGRATION.length > 0
  };
}

export function evaluateSuiteResult(summary = {}) {
  const { total = 0, passed = 0, failed = 0, durationMs = 0 } = summary;
  const passRatio = total > 0 ? Number((passed / total).toFixed(4)) : 1.0;
  return {
    pass: failed === 0 && total > 0,
    total,
    passed,
    failed,
    passRatio,
    durationMs,
    fast: durationMs < 5000
  };
}

export function auditAssertionDensity(testContent = '') {
  const assertCount = (testContent.match(/assert\.[a-z]+/gi) || []).length;
  const testCount = (testContent.match(/test\s*\(/gi) || []).length;
  const density = testCount > 0 ? Number((assertCount / testCount).toFixed(2)) : 0;
  return { assertCount, testCount, assertionDensity: density, adequate: density >= 1.5 };
}
