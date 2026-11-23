/**
 * Veyra Core Engine — veyra-core
 * Pragmatic engineering discipline, strict scope locking, universal anti-slop, smallest-change auditing.
 * Zero external dependencies (pure Node.js ES Module).
 */

export const BANNED_AI_WORDS = [
  /\b(?:delve|tapestry|beacon|testament to|testament|seamless|revolutionize|game-changer|crucial|vital|robust|cutting-edge|pleased to|happy to help)\b/gi,
  /\b(?:unleash|empower|elevate|streamline|harness the power|unlock the potential)\b/gi
];

export const FORBIDDEN_PUNCTUATION = [/—/g, /–/g];

export function normalizePath(p) {
  if (typeof p !== 'string') return '';
  return p.replace(/\\/g, '/');
}

export function isPathSafe(p) {
  if (typeof p !== 'string' || !p.trim()) return false;
  if (p.includes('\0')) return false;
  const n = normalizePath(p);
  if (n.startsWith('/') || /^[a-zA-Z]:/.test(n)) return false;
  const parts = n.split('/');
  if (parts.some(seg => seg === '..' || seg === '%2e%2e' || seg === '%2E%2E')) return false;
  return true;
}

export function validateScope(options = {}) {
  const { targetFiles = [], allowedPatterns = [], actionType = 'READ', dangerousOperations = [], isDestructive = false } = options;
  if (!Array.isArray(targetFiles)) throw new TypeError('targetFiles must be an array');
  if (!Array.isArray(allowedPatterns)) throw new TypeError('allowedPatterns must be an array');

  const violations = [];
  for (const file of targetFiles) {
    if (!isPathSafe(file)) {
      violations.push(file);
      continue;
    }
    const normalizedFile = normalizePath(file);
    const isAllowed = allowedPatterns.some(pattern => {
      const normPattern = normalizePath(pattern);
      if (normPattern.endsWith('*')) return normalizedFile.startsWith(normPattern.slice(0, -1));
      return normalizedFile === normPattern;
    });
    if (!isAllowed) violations.push(file);
  }

  const hasDangerous = dangerousOperations.length > 0 || isDestructive === true;
  if (hasDangerous) {
    return {
      verdict: 'NEEDS_OWNER_APPROVAL',
      allowed: false,
      actionType,
      violations,
      requiresOwnerApproval: true
    };
  }

  const isAllowed = violations.length === 0;
  return {
    verdict: isAllowed ? 'PROCEED' : 'BLOCKED_SCOPE',
    allowed: isAllowed,
    actionType,
    violations,
    requiresOwnerApproval: !isAllowed
  };
}

export function evaluateScope(options) {
  return validateScope(options);
}

export function checkAntiSlop(text) {
  if (typeof text !== 'string') return { pass: true, findings: [] };
  const findings = [];
  for (const regex of BANNED_AI_WORDS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        type: 'BANNED_AI_WORD',
        word: match[0],
        matched: match[0],
        index: match.index
      });
    }
  }
  for (const regex of FORBIDDEN_PUNCTUATION) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        type: 'BANNED_PUNCTUATION',
        char: match[0],
        matched: match[0],
        index: match.index
      });
    }
  }
  return { pass: findings.length === 0, findings };
}

export function evaluateAntiSlop(text) {
  return checkAntiSlop(text);
}

export function classifyClaim(statement, evidenceReceipt = null) {
  if (!statement || typeof statement !== 'string') throw new TypeError('statement must be a non-empty string');
  if (Array.isArray(evidenceReceipt)) {
    if (evidenceReceipt.length > 0) {
      return { category: 'OBSERVED', confidence: 1.0, statement, evidence: evidenceReceipt };
    } else {
      return { category: 'UNKNOWN', confidence: 0.0, statement, evidence: null };
    }
  }
  if (evidenceReceipt && evidenceReceipt.verified === true) {
    return { category: 'OBSERVED', confidence: 1.0, statement, evidence: evidenceReceipt };
  }
  if (evidenceReceipt && evidenceReceipt.verified === false) {
    return { category: 'PROPOSAL', confidence: 0.5, statement, evidence: evidenceReceipt };
  }
  const inferenceMarkers = [/\b(?:likely|probably|suggests|implies|assumed|estimated)\b/i];
  const isLikelyInference = inferenceMarkers.some(re => re.test(statement));
  if (isLikelyInference) {
    return { category: 'INFERENCE', confidence: 0.7, statement, evidence: null };
  }
  return { category: 'UNKNOWN', confidence: 0.0, statement, evidence: null };
}

export const classifyEvidence = classifyClaim;

export function auditSmallestChange(modifiedFiles = [], agreedTaskScope = []) {
  if (!Array.isArray(modifiedFiles)) throw new TypeError('modifiedFiles must be an array');
  const extraneous = modifiedFiles.filter(f => !agreedTaskScope.some(scope => f.startsWith(scope.replace(/\*$/, ''))));
  const isMinimal = extraneous.length === 0;
  return {
    isMinimal,
    compliant: isMinimal,
    extraneousFiles: extraneous,
    totalModified: modifiedFiles.length,
    agreedScopeCount: agreedTaskScope.length
  };
}

export function evaluatePragmaticTradeoff(options = {}) {
  const { proposedLines = 0, existingLines = 0, externalDepsCount = 0, maintenanceCostEst = 'LOW' } = options;
  const lineDelta = proposedLines - existingLines;
  const isOverengineered = externalDepsCount > 0 || lineDelta > 200 || maintenanceCostEst === 'HIGH';
  return {
    recommended: !isOverengineered,
    tradeoffSummary: isOverengineered ? 'REJECT: adds unneeded complexity or external dependencies' : 'ACCEPT: clean native implementation',
    lineDelta,
    externalDepsCount
  };
}
