/**
 * Xyeena Core - Intent & Scope Router
 * Maps raw incoming user requests to execution modes and candidate capability sets.
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';
import { EXECUTION_MODES } from './policy.mjs';

export const TASK_TIERS = Object.freeze({
  TIER_0_MICRO: 'TIER_0_MICRO',             // Trivial questions, single line answers
  TIER_1_STANDARD: 'TIER_1_STANDARD',       // Scoped implementation, single-file edits
  TIER_2_COMPLEX: 'TIER_2_COMPLEX',         // Multi-file, cross-component, test-driven
  TIER_3_ARCHITECTURAL: 'TIER_3_ARCHITECTURAL' // Greenfield, full audits, multi-agent
});

export class IntentRouter {
  /**
   * Determine execution mode from user input text.
   * @param {string} prompt
   * @returns {string} Member of EXECUTION_MODES
   */
  classifyIntent(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return EXECUTION_MODES.DISCUSSION;
    }

    const lower = prompt.toLowerCase();

    // 1. Explicit Risk Gates (Strict highest priority check)
    if (
      lower.includes('full security audit') ||
      lower.includes('audit seluruh keamanan') ||
      lower.includes('run security audit protocol')
    ) {
      return EXECUTION_MODES.EXPLICIT_RISK_GATE;
    }
    if (
      lower.includes('deploy production') ||
      lower.includes('publish package') ||
      lower.includes('buat release tag')
    ) {
      return EXECUTION_MODES.EXPLICIT_RISK_GATE;
    }

    // 2. Explicit Execution Intent
    const executionPhrases = [
      'implement',
      'eksekusi',
      'kerjakan',
      'apply',
      'fix sekarang',
      'ubah kodenya',
      'lanjut coding',
      'gas implement',
      'buat file',
      'buat ',
      'patch ini',
      'write code',
      'mulai eksekusi'
    ];
    for (const phrase of executionPhrases) {
      if (lower.includes(phrase)) {
        return EXECUTION_MODES.EXECUTION;
      }
    }

    // 3. Diagnose Mode
    if (
      lower.includes('diagnose') ||
      lower.includes('debug') ||
      lower.includes('crash') ||
      lower.includes('investigate') ||
      lower.includes('investigasi') ||
      lower.includes('kenapa error') ||
      lower.includes('test gagal') ||
      lower.includes('investigate failure')
    ) {
      return EXECUTION_MODES.DIAGNOSE;
    }

    // 4. Default: Discussion Mode (Rule 4)
    return EXECUTION_MODES.DISCUSSION;
  }

  /**
   * Classify complexity tier.
   * @param {string} prompt
   * @param {string} mode
   * @returns {string} Member of TASK_TIERS
   */
  classifyTier(prompt, mode) {
    const lower = (prompt || '').toLowerCase();
    if (mode === EXECUTION_MODES.EXPLICIT_RISK_GATE) {
      return TASK_TIERS.TIER_3_ARCHITECTURAL;
    }

    // Domain keywords that elevate a task beyond TIER_0_MICRO
    const domainIndicators = [
      'test', 'tdd', 'komponen', 'component', 'modal', 'css', 'layout', 'ui',
      'database', 'api', 'auth', 'security', 'bug', 'error', 'fix', 'implement', 'buat',
      'crash', 'diagnose', 'investigate', 'investigasi', 'failure', 'perf', 'performance',
      'slow', 'review', 'diff', 'refactor', 'migration', 'audit', 'jwt', 'token',
      'authorization', 'otorisasi', 'vulnerability', 'sanitize', 'endpoint', 'validasi', 'register'
    ];
    const hasDomainIndicator = domainIndicators.some(k => lower.includes(k));

    if (lower.length < 80 && mode === EXECUTION_MODES.DISCUSSION && !hasDomainIndicator) {
      return TASK_TIERS.TIER_0_MICRO;
    }

    if (
      lower.includes('multi-step') ||
      lower.includes('refactor architecture') ||
      lower.includes('multi-agent') ||
      lower.includes('end-to-end')
    ) {
      return TASK_TIERS.TIER_3_ARCHITECTURAL;
    }
    if (mode === EXECUTION_MODES.EXECUTION) {
      return TASK_TIERS.TIER_2_COMPLEX;
    }
    return TASK_TIERS.TIER_1_STANDARD;
  }

  /**
   * Check strict negative triggers to forbid illicit capability activation.
   * @param {string} capabilityId
   * @param {string} prompt
   * @param {string} mode
   */
  assertNegativeTriggerSafe(capabilityId, prompt, mode) {
    const lower = (prompt || '').toLowerCase();

    // Negative trigger for security.full-audit: strictly forbidden without explicit instruction
    if (capabilityId === 'security.full-audit') {
      const explicit = lower.includes('full security audit') || lower.includes('audit seluruh keamanan');
      if (!explicit) {
        throw new XyeenaError(
          ERROR_CODES.NEGATIVE_TRIGGER_MATCH,
          'Full Security Audit capability blocked by negative trigger: explicit user command required.',
          { capabilityId, prompt }
        );
      }
    }

    // Negative trigger for coordination.external-discovery: forbidden without opt-in
    if (capabilityId === 'coordination.external-discovery') {
      const optIn = lower.includes('external registry') || lower.includes('search smithery') || lower.includes('browse marketplace');
      if (!optIn) {
        throw new XyeenaError(
          ERROR_CODES.NEGATIVE_TRIGGER_MATCH,
          'External Discovery capability blocked by negative trigger: explicit operator opt-in required.',
          { capabilityId }
        );
      }
    }
  }
}
