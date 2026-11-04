/**
 * Xyeena Core - Adaptive Token & Effort Budget Governor
 * Enforces token ceilings, effort limits, metric differentiation,
 * and recursion circuit breakers.
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';

export const BUDGET_LIMITS = Object.freeze({
  L0_KERNEL_MAX_TOKENS: 1500,
  MICRO_TASK_MAX_TOKENS: 800,
  STANDARD_TASK_MAX_TOKENS: 3000,
  COMPLEX_TASK_MAX_TOKENS: 8000,
  MAX_RETRY_COUNT: 3
});

export const METRIC_TYPES = Object.freeze({
  ESTIMATED_BPE_SUBWORD: 'ESTIMATED_BPE_SUBWORD',
  EXACT_CHARACTER_COUNT: 'EXACT_CHARACTER_COUNT',
  RUNTIME_CONTEXT_OVERHEAD: 'RUNTIME_CONTEXT_OVERHEAD'
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

/**
 * Measure comprehensive prompt metrics, separating character count, estimated BPE tokens,
 * and context overhead without conflating estimates with native tokenizer measurements.
 * @param {string} promptText
 * @param {object} [options={}]
 * @param {number} [options.budgetCeiling=BUDGET_LIMITS.STANDARD_TASK_MAX_TOKENS]
 */
export function measurePromptMetrics(promptText = '', options = {}) {
  const chars = promptText ? promptText.length : 0;
  const estimatedTokens = estimateTokens(promptText);
  const ceiling = options.budgetCeiling || BUDGET_LIMITS.STANDARD_TASK_MAX_TOKENS;
  const headroom = ceiling - estimatedTokens;

  return {
    characterCount: chars,
    estimatedTokens,
    metricType: METRIC_TYPES.ESTIMATED_BPE_SUBWORD,
    targetTokenizer: 'cl100k_base / gemini_bpe_subword_estimate (~3.8 char/token)',
    isExactModelTokenizer: false, // Transparent: explicitly distinguishes estimates from true tokenizer API counts
    budgetCeiling: ceiling,
    headroomTokens: headroom,
    headroomPercent: ceiling > 0 ? Math.round((headroom / ceiling) * 100) : 0,
    withinBudget: estimatedTokens <= ceiling
  };
}

/**
 * Reconcile prompt token metrics across kernel, domain overhead, full prompt payload,
 * and actual host model usage without conflating empirical character counts, BPE estimates,
 * and external tokenizer measurements.
 * @param {object} params
 * @param {string} [params.kernelText='']
 * @param {string} [params.domainText='']
 * @param {string} [params.taskInputText='']
 * @param {object|null} [params.actualModelUsage=null]
 * @returns {object}
 */
export function reconcileTokenMetrics({
  kernelText = '',
  domainText = '',
  taskInputText = '',
  actualModelUsage = null
} = {}) {
  const kernelChars = kernelText ? kernelText.length : 0;
  const domainChars = domainText ? domainText.length : 0;
  const taskChars = taskInputText ? taskInputText.length : 0;
  const fullPayloadChars = kernelChars + domainChars + taskChars;

  const kernelEstTokens = estimateTokens(kernelText);
  const domainEstTokens = estimateTokens(domainText);
  const taskEstTokens = estimateTokens(taskInputText);
  const fullPayloadEstTokens = kernelEstTokens + domainEstTokens + taskEstTokens;

  return {
    empirical: {
      kernelChars,
      domainChars,
      taskChars,
      fullPayloadChars
    },
    subwordEstimate: {
      metricType: METRIC_TYPES.ESTIMATED_BPE_SUBWORD,
      ratio: '~3.8 char/token (cl100k/gemini heuristic)',
      isExactModelTokenizer: false,
      kernelTokens: kernelEstTokens,
      domainTokens: domainEstTokens,
      taskTokens: taskEstTokens,
      fullPayloadTokens: fullPayloadEstTokens
    },
    actualUsage: actualModelUsage !== null ? {
      available: true,
      promptTokens: actualModelUsage.promptTokens,
      completionTokens: actualModelUsage.completionTokens,
      totalTokens: actualModelUsage.totalTokens
    } : {
      available: false,
      status: 'NOT_MEASURED_WITHOUT_HOST_API',
      reason: 'Host native tokenizer API is not accessible in local offline Node test runner'
    }
  };
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
