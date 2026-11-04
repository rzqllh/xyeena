/**
 * Xyeena Native Methods - Quality & Anti-Slop Suite
 * Enforces comment hygiene, human-first copywriting, and lean change boundaries.
 */

export class QualityMethods {
  /**
   * Banned generic AI buzzwords in product & marketing copy.
   */
  static BANNED_AI_CLICHES = Object.freeze([
    'delve',
    'delve into',
    'unleash',
    'seamlessly',
    'elevate',
    'cutting-edge',
    'game-changer',
    'tapestry',
    'testament to',
    'beacon of',
    'realm of',
    'powerhouse',
    'revolutionize'
  ]);

  /**
   * Filter redundant AI code comments that merely narrate what code visibly does.
   * Preserves comments with 'WHY', 'NOTE', 'TODO', 'FIXME', or non-obvious workarounds.
   * @param {string} code
   * @returns {{ cleanedCode: string, removedCommentsCount: number }}
   */
  static sanitizeCodeComments(code = '') {
    const lines = code.split('\n');
    let removedCount = 0;

    const redundantPatterns = [
      /^\s*\/\/\s*import\s+/i,
      /^\s*\/\/\s*increment\s+/i,
      /^\s*\/\/\s*return\s+the\s+result/i,
      /^\s*\/\/\s*initialize\s+variable/i,
      /^\s*\/\/\s*this\s+function\s+/i,
      /^\s*\/\/\s*export\s+/i
    ];

    const cleanedLines = lines.filter(line => {
      // Check if line matches a purely redundant comment pattern
      const isRedundant = redundantPatterns.some(pat => pat.test(line));
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
   * Detect AI copywriting clichés in product/landing copy.
   * @param {string} text
   * @returns {object} Anti-slop audit result
   */
  static auditCopywriting(text = '') {
    const lower = text.toLowerCase();
    const detectedCliches = [];

    for (const cliche of QualityMethods.BANNED_AI_CLICHES) {
      const regex = new RegExp(`\\b${cliche}\\b`, 'i');
      if (regex.test(lower)) {
        detectedCliches.push(cliche);
      }
    }

    return {
      hasSlop: detectedCliches.length > 0,
      detectedCliches,
      recommendation: detectedCliches.length > 0
        ? `Replace generic AI buzzwords (${detectedCliches.join(', ')}) with specific, human, actionable descriptions.`
        : 'Copywriting is crisp and free of obvious AI clichés.'
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
