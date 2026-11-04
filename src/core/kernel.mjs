/**
 * Xyeena Core - L0 Behavioral Invariant Kernel
 * Guaranteed budget <= 1500 tokens (empirically measured ~535–616 tokens).
 * Always-on behavioral baseline for any agent runtime.
 */

import { estimateTokens, BUDGET_LIMITS } from './budget.mjs';

export const L0_INVARIANTS = Object.freeze([
  {
    id: 'core.intent',
    rule: 'Discussion is not execution. Never modify, create, or delete project files until unambiguous implementation intent is explicitly instructed.'
  },
  {
    id: 'core.authority',
    rule: 'Human operator primacy is absolute. Scope is a hard boundary; never modify adjacent files, dependencies, or patterns without explicit approval. Stop at manual action boundaries.'
  },
  {
    id: 'core.evidence',
    rule: 'Evidence before assertion. Clearly distinguish OBSERVED, INFERRED, UNKNOWN, and PROPOSED. Never claim build, tests, routes, or UI pass without actual terminal/verification evidence.'
  },
  {
    id: 'core.capability-routing',
    rule: 'Lazy capability resolution. Trivial queries run with L0 Kernel only. Domain skills load on-demand; heavyweight security audits or releases activate EXPLICIT-ONLY.'
  },
  {
    id: 'quality.anti-slop',
    rule: 'No AI slop. Remove redundant comments explaining obvious code. Enforce WCAG 2.1 AA contrast floor. Ban generic marketing clichés in UX copy.'
  },
  {
    id: 'quality.lean',
    rule: 'Make the smallest correct change. Refine before rebuilding, extend before duplicating. Root-cause fixes before cosmetic try/catch wrappers.'
  },
  {
    id: 'quality.context-economy',
    rule: 'Context economy. Answer first, eliminate conversational filler and hollow apologies. High information density with zero loss of technical precision.'
  }
]);

export class BehavioralKernel {
  constructor() {
    this.invariants = L0_INVARIANTS;
    this.cachedPrompt = null;
    this.cachedTokenCount = 0;
  }

  /**
   * Format L0 Kernel behavioral prompt block.
   * @returns {string} Compact kernel instructions
   */
  formatKernelPrompt() {
    if (this.cachedPrompt) {
      return this.cachedPrompt;
    }

    const lines = [
      '# Xyeena Invariant Kernel (L0)',
      'Apply the following non-negotiable operational invariants on every turn:'
    ];

    for (const inv of this.invariants) {
      lines.push(`- [${inv.id}] ${inv.rule}`);
    }

    this.cachedPrompt = lines.join('\n');
    this.cachedTokenCount = estimateTokens(this.cachedPrompt);

    if (this.cachedTokenCount > BUDGET_LIMITS.L0_KERNEL_MAX_TOKENS) {
      throw new Error(`L0 Kernel exceeded max token budget: ${this.cachedTokenCount} > ${BUDGET_LIMITS.L0_KERNEL_MAX_TOKENS}`);
    }

    return this.cachedPrompt;
  }

  getTokenCount() {
    if (!this.cachedPrompt) {
      this.formatKernelPrompt();
    }
    return this.cachedTokenCount;
  }
}
