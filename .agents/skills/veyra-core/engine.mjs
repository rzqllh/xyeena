/**
 * Veyra Core Engine — veyra-core
 * Pragmatic engineering discipline, strict scope locking, universal anti-slop, smallest-change auditing.
 * Zero external dependencies (pure Node.js ES Module).
 */

import { validateCompletionClaims } from '../veyra-verify/engine.mjs';

export const BANNED_AI_WORDS = [
  /\b(?:delve|tapestry|beacon|testament to|testament|seamless|revolutionize|game-changer|cutting-edge|pleased to|happy to help)\b/gi,
  /\b(?:unleash|empower|elevate|streamline|harness the power|unlock the potential)\b/gi
];

export const FORBIDDEN_PUNCTUATION = [/—/g];

export function normalizePath(p) {
  if (typeof p !== 'string') return '';
  return p.replace(/\\/g, '/');
}
export function isPathSafe(p) {
  if (typeof p !== 'string' || !p.trim() || p.includes('\0')) return false;
  let value = normalizePath(p);
  for (let i = 0; i < 4; i++) {
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { return false; }
    if (decoded === value) break;
    value = decoded;
  }
  value = normalizePath(value);
  if (value.startsWith('/') || /^[a-zA-Z]:/.test(value) || value.startsWith('//')) return false;
  return !value.split('/').some(seg => seg === '..' || seg === '.' || seg === '');
}
function matchGlob(file, pattern) {
  if (typeof pattern !== 'string' || !pattern.trim() ||
      !isPathSafe(pattern.replace(/\*\*?/g, 'x').replace(/\?/g, 'x'))) return false;
  const pat = normalizePath(pattern);
  // Legacy folder/* patterns were recursive prefixes; preserve that published contract.
  if (pat.endsWith('/*') && !pat.includes('**')) return file.startsWith(pat.slice(0, -1));
  const escaped = pat.replace(/[.+^$()|[\]{}\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00').replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]').replace(/\x00/g, '.*');
  return new RegExp('^' + escaped + '$').test(file);
}
export function validateScope(options = {}) {
  const { targetFiles = [], allowedPatterns = [], actionType = 'READ', dangerousOperations = [], isDestructive = false } = options;
  if (!Array.isArray(targetFiles)) throw new TypeError('targetFiles must be an array');
  if (!Array.isArray(allowedPatterns)) throw new TypeError('allowedPatterns must be an array');
  const violations = targetFiles.filter(file =>
    !isPathSafe(file) || !allowedPatterns.some(pattern => matchGlob(normalizePath(file), pattern))
  );
  if (dangerousOperations.length > 0 || isDestructive === true) {
    return { verdict: 'NEEDS_OWNER_APPROVAL', allowed: false, actionType, violations, requiresOwnerApproval: true };
  }
  const allowed = violations.length === 0;
  return { verdict: allowed ? 'PROCEED' : 'BLOCKED_SCOPE',
    allowed, actionType, violations, requiresOwnerApproval: !allowed };
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

export function classifyClaim(statement, evidenceReceipt = null, options = {}) {
  if (typeof statement !== 'string' || !statement.trim()) throw new TypeError('statement must be a non-empty string');
  // Only a machine-checkable command-exit claim may be OBSERVED.
  // A real receipt cannot establish semantic assertions like "the bug is fixed".
  if (evidenceReceipt && !Array.isArray(evidenceReceipt) &&
      statement === 'COMMAND_EXIT_ZERO:' + evidenceReceipt.taskName &&
      validateCompletionClaims([evidenceReceipt], [evidenceReceipt.taskName], options).verified) {
    return { category: 'OBSERVED', confidence: 1, statement,
      evidence: { receiptId: evidenceReceipt.receiptId, scope: 'COMMAND_EXIT_ZERO_ONLY' } };
  }
  if (/\b(?:likely|probably|suggests|implies|assumed|estimated)\b/i.test(statement)) {
    return { category: 'INFERENCE', confidence: 0.5, statement, evidence: null };
  }
  return { category: 'UNKNOWN', confidence: 0, statement, evidence: null };
}

export const classifyEvidence = classifyClaim;

export function auditSmallestChange(modifiedFiles = [], agreedTaskScope = []) {
  if (!Array.isArray(modifiedFiles)) throw new TypeError('modifiedFiles must be an array');
  const extraneous = modifiedFiles.filter(f => !isPathSafe(f) || !agreedTaskScope.some(scope => matchGlob(normalizePath(f), scope)));
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
