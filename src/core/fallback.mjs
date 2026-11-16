/**
 * Xyeena Core - Graceful Fallback & Degradation Handler
 * Formulates reliable fallback execution routes when advanced host facilities are missing.
 */

import { SUPPORT_LEVELS } from './negotiator.mjs';

export class FallbackHandler {
  /**
   * Determine safe fallback action when a facility is degraded or unavailable.
   * @param {string} facilityName
   * @param {string} supportLevel
   * @param {Record<string, unknown>} [context={}]
   * @returns {object} Actionable fallback strategy
   */
  resolveFallback(facilityName, supportLevel, context = {}) {
    if (supportLevel === SUPPORT_LEVELS.SUPPORTED) {
      return { action: 'PROCEED_NATIVE', description: `Use native ${facilityName}` };
    }

    switch (facilityName) {
      case 'subagent_delegation':
        return {
          action: 'FALLBACK_SINGLE_AGENT',
          description: 'Execute subtasks sequentially in single-agent session context without subagent spawning.',
          preserveState: true
        };

      case 'terminal_execution':
        return {
          action: 'HALT_MANUAL_BOUNDARY',
          status: 'BLOCKED: TERMINAL UNAVAILABLE',
          description: 'Halt terminal-dependent tasks; generate explicit shell commands for human operator verification.'
        };

      case 'persistent_sqlite':
        return {
          action: 'FALLBACK_EPHEMERAL_MEMORY',
          description: 'Persist learnings in session memory and write markdown summaries in workspace artifact directory.'
        };

      case 'network_read_opt_in':
        return {
          action: 'FALLBACK_LOCAL_ONLY',
          description: 'Decline external network lookup; restrict skill routing strictly to local filesystem inventory.'
        };

      default:
        return {
          action: 'REPORT_DEGRADED',
          description: `Feature ${facilityName} is degraded (${supportLevel}); proceeding with best-effort inline logic.`
        };
    }
  }
}
