/**
 * Veyra Execute Engine — veyra-execute
 * Scoped implementation, TDD phase tracking, smallest-change enforcement.
 * Zero external dependencies.
 */

import { normalizePath, isPathSafe, validateScope } from '../veyra-core/engine.mjs';
export { normalizePath, isPathSafe };

export function validateExecutionScope(allowedFiles = [], filesToModify = []) {
  const result = validateScope({ targetFiles: filesToModify, allowedPatterns: allowedFiles, actionType: 'WRITE' });
  return { valid: result.allowed, allowedCount: filesToModify.length - result.violations.length, disallowed: result.violations };
}

export function trackTddPhase(history = []) {
  if (!Array.isArray(history) || history.length === 0) return { currentPhase: 'INITIAL', validSequence: true };

  const validTransitions = {
    INITIAL: ['RED'],
    RED: ['GREEN'],
    GREEN: ['REFACTOR', 'RED'],
    REFACTOR: ['RED', 'GREEN']
  };

  let current = 'INITIAL';
  let validSequence = true;

  for (const step of history) {
    const allowedNext = validTransitions[current] || [];
    if (!allowedNext.includes(step)) {
      validSequence = false;
      break;
    }
    current = step;
  }

  return {
    currentPhase: current,
    validSequence,
    stepCount: history.length
  };
}

export function auditSmallestChange(originalLines = 0, addedLines = 0, deletedLines = 0) {
  const churn = addedLines + deletedLines;
  const ratio = originalLines > 0 ? Number((churn / originalLines).toFixed(3)) : churn;
  const isMinimal = churn <= 50 || ratio <= 0.3;

  return {
    originalLines,
    addedLines,
    deletedLines,
    totalChurn: churn,
    churnRatio: ratio,
    isMinimal
  };
}

export function validatePatchIntegrity(originalCode, patchHunks = []) {
  if (typeof originalCode !== 'string') return { valid: false, reason: 'INVALID_ORIGINAL_CODE' };
  let testCode = originalCode;
  for (const hunk of patchHunks) {
    if (!testCode.includes(hunk.find)) {
      return { valid: false, reason: `HUNK_NOT_FOUND: ${hunk.find.slice(0, 30)}...` };
    }
    testCode = testCode.replace(hunk.find, hunk.replace);
  }
  return { valid: true, patchedCode: testCode };
}
