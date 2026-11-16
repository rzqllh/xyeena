/**
 * Xyeena Core - Structured Error Taxonomy
 * Ensures deterministic error classification across all layers.
 */

export const ERROR_CODES = Object.freeze({
  SCOPE_VIOLATION: 'XYEENA_SCOPE_VIOLATION',
  PERMISSION_DENIED: 'XYEENA_PERMISSION_DENIED',
  MISSING_EVIDENCE: 'XYEENA_MISSING_EVIDENCE',
  CIRCULAR_DEPENDENCY: 'XYEENA_CIRCULAR_DEPENDENCY',
  BUDGET_EXCEEDED: 'XYEENA_BUDGET_EXCEEDED',
  UNSUPPORTED_HOST: 'XYEENA_UNSUPPORTED_HOST',
  BLOCKED_MANUAL_ACTION: 'XYEENA_BLOCKED_MANUAL_ACTION',
  BREAKER_TRIPPED: 'XYEENA_BREAKER_TRIPPED',
  INVALID_CONTRACT: 'XYEENA_INVALID_CONTRACT',
  CAPABILITY_NOT_FOUND: 'XYEENA_CAPABILITY_NOT_FOUND',
  NEGATIVE_TRIGGER_MATCH: 'XYEENA_NEGATIVE_TRIGGER_MATCH'
});

export class XyeenaError extends Error {
  /**
   * @param {string} code - Member of ERROR_CODES
   * @param {string} message - Human-readable explanation
   * @param {Record<string, unknown>} [details={}] - Structured context metadata
   */
  constructor(code, message, details = {}) {
    super(`[${code}] ${message}`);
    this.name = 'XyeenaError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, XyeenaError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}
