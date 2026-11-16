/**
 * Xyeena Core - Host Capability Negotiator
 * Discovers and inspects active host facilities (Antigravity, Claude Code, Codex, Hermes)
 * and honestly negotiates feature support levels.
 */

export const HOST_NAMES = Object.freeze({
  ANTIGRAVITY: 'antigravity',
  CLAUDE_CODE: 'claude_code',
  CODEX: 'codex',
  HERMES: 'hermes',
  GENERIC: 'generic'
});

export const SUPPORT_LEVELS = Object.freeze({
  SUPPORTED: 'SUPPORTED',
  DEGRADED: 'DEGRADED',
  UNAVAILABLE: 'UNAVAILABLE'
});

export class HostNegotiator {
  /**
   * @param {object} [env=process.env]
   * @param {Record<string, unknown>} [declaredTools={}]
   */
  constructor(env = process.env, declaredTools = {}) {
    this.env = env;
    this.declaredTools = declaredTools;
  }

  /**
   * Identify current active agent host.
   * @returns {string} Member of HOST_NAMES
   */
  detectHost() {
    if (this.env.ANTIGRAVITY_APP_DIR || this.env.GEMINI_CLI || this.declaredTools.run_command) {
      return HOST_NAMES.ANTIGRAVITY;
    }
    if (this.env.CLAUDE_CODE_ENTRY || this.declaredTools.Bash) {
      return HOST_NAMES.CLAUDE_CODE;
    }
    if (this.env.CODEX_THREAD_ID || this.env.CODEX_SESSION) {
      return HOST_NAMES.CODEX;
    }
    if (this.env.HERMES_HOME || this.env.HERMES_SESSION) {
      return HOST_NAMES.HERMES;
    }
    return HOST_NAMES.GENERIC;
  }

  /**
   * Inspect host feature matrix.
   * @returns {Record<string, string>} Map of feature to SUPPORT_LEVELS
   */
  negotiateFeatureMatrix() {
    const hasTerminal = Boolean(
      this.declaredTools.run_command ||
      this.declaredTools.Bash ||
      this.declaredTools.terminal
    );
    const hasFsWrite = Boolean(
      this.declaredTools.write_file ||
      this.declaredTools.edit_file ||
      this.declaredTools.FileEdit
    );
    const hasSubagents = Boolean(
      this.declaredTools.invoke_subagent ||
      this.declaredTools.Agent ||
      this.declaredTools.subagent
    );

    return {
      terminal_execution: hasTerminal ? SUPPORT_LEVELS.SUPPORTED : SUPPORT_LEVELS.UNAVAILABLE,
      filesystem_write: hasFsWrite ? SUPPORT_LEVELS.SUPPORTED : SUPPORT_LEVELS.UNAVAILABLE,
      subagent_delegation: hasSubagents ? SUPPORT_LEVELS.SUPPORTED : SUPPORT_LEVELS.DEGRADED,
      ephemeral_memory: SUPPORT_LEVELS.SUPPORTED,
      persistent_sqlite: SUPPORT_LEVELS.SUPPORTED
    };
  }

  /**
   * Assert whether an essential host feature is available.
   * @param {string} featureName
   */
  assertFeature(featureName) {
    const matrix = this.negotiateFeatureMatrix();
    const level = matrix[featureName];
    if (level === SUPPORT_LEVELS.UNAVAILABLE) {
      return { ok: false, level, reason: `Host facility for "${featureName}" is unavailable in current runtime.` };
    }
    return { ok: true, level };
  }
}
