/**
 * Xyeena Core - Adaptive Token & Effort Budget Governor
 * Enforces token ceilings, effort limits, and recursion circuit breakers.
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';

export const BUDGET_LIMITS = Object.freeze({
  L0_KERNEL_MAX_TOKENS: 1500,
  MICRO_TASK_MAX_TOKENS: 800,
  STANDARD_TASK_MAX_TOKENS: 3000,
  COMPLEX_TASK_MAX_TOKENS: 8000,
  MAX_RETRY_COUNT: 3
});

/**
 * Estimate token count using empirical character/word subword BPE ratios.
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  const chars = text.length;
  // BPE average ratio for English/code is approximately 3.8 chars per token.
  return Math.ceil(chars / 3.8);
}

export class EffortBudgetGovernor {
  /**
   * @param {object} [options={}]
   * @param {number} [options.maxTokens=3000]
   * @param {number} [options.maxRetries=3]
   */
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || BUDGET_LIMITS.STANDARD_TASK_MAX_TOKENS;
    this.maxRetries = options.maxRetries || BUDGET_LIMITS.MAX_RETRY_COUNT;
    this.consumedTokens = 0;
    this.retryCount = 0;
    this.tripped = false;
  }

  /**
   * Track token consumption and assert ceiling.
   * @param {number} tokens
   */
  consume(tokens) {
    if (this.tripped) {
      throw new XyeenaError(ERROR_CODES.BREAKER_TRIPPED, 'Effort budget circuit breaker is tripped; execution halted.');
    }
    this.consumedTokens += tokens;
    if (this.consumedTokens > this.maxTokens) {
      this.tripped = true;
      throw new XyeenaError(
        ERROR_CODES.BUDGET_EXCEEDED,
        `Token budget exceeded: consumed ${this.consumedTokens} > limit ${this.maxTokens}`,
        { consumed: this.consumedTokens, limit: this.maxTokens }
      );
    }
  }

  /**
   * Record a retry attempt and trip breaker if threshold exceeded.
   * @param {string} reason
   */
  recordRetry(reason = '') {
    this.retryCount += 1;
    if (this.retryCount > this.maxRetries) {
      this.tripped = true;
      throw new XyeenaError(
        ERROR_CODES.BREAKER_TRIPPED,
        `Circuit breaker tripped after ${this.retryCount} consecutive retries. Reason: ${reason}`,
        { retries: this.retryCount, limit: this.maxRetries, reason }
      );
    }
  }

  reset() {
    this.consumedTokens = 0;
    this.retryCount = 0;
    this.tripped = false;
  }
}
