/**
 * Veyra Review Engine — veyra-review
 * Dual-axis architectural depth and surgical safety code review.
 * Zero external dependencies.
 */

export function evaluateDualAxisReview(reviewInput = {}) {
  const { diffLines = [], architecturalRules = [], scopeLimit = [] } = reviewInput;
  const findings = [];

  for (const rule of architecturalRules) {
    if (rule.violated) {
      findings.push({
        axis: 'ARCHITECTURAL_DEPTH',
        severity: rule.severity || 'HIGH',
        message: rule.message
      });
    }
  }

  for (const line of diffLines) {
    if (line.startsWith('+') && line.includes('TODO:') && line.includes('FIXME')) {
      findings.push({
        axis: 'SURGICAL_SAFETY',
        severity: 'MEDIUM',
        message: 'Unfinished placeholder left in diff'
      });
    }
  }

  const blockerCount = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
  let verdict = 'APPROVED';
  if (blockerCount > 0) verdict = 'BLOCKED';
  else if (findings.length > 0) verdict = 'CHANGES_REQUESTED';

  return {
    verdict,
    findingCount: findings.length,
    blockerCount,
    findings
  };
}

export function calculateComplexityEstimate(codeText = '') {
  const branchCount = (codeText.match(/\b(?:if|else if|for|while|case|catch)\b/gi) || []).length;
  const funcCount = (codeText.match(/\b(?:function|=>)\b/gi) || []).length;
  return { estimatedCyclomaticComplexity: branchCount + 1, functionCount: funcCount, isHighComplexity: branchCount > 15 };
}
