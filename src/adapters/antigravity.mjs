/**
 * Xyeena Adapters - Google Antigravity (AGY) Host Adapter
 * Manages discovery, tool integration, and permission validation for AGY.
 */

import path from 'path';

export class AntigravityAdapter {
  /**
   * @param {object} [options={}]
   * @param {object} [options.env=process.env]
   * @param {string} [options.appDataDir]
   */
  constructor(options = {}) {
    this.env = options.env || process.env;
    this.appDataDir = options.appDataDir || this.env.ANTIGRAVITY_APP_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'antigravity-cli');
  }

  detect() {
    return Boolean(
      this.env.ANTIGRAVITY_APP_DIR ||
      this.env.GEMINI_CLI ||
      this.env.AGY_SESSION
    );
  }

  getSkillLocations() {
    const userHome = process.env.USERPROFILE || process.env.HOME || '';
    return [
      path.join(userHome, '.gemini', 'antigravity-cli', 'skills'),
      path.join(userHome, '.gemini', 'antigravity-cli', 'builtin', 'skills'),
      path.join(process.cwd(), '.gemini', 'skills')
    ];
  }

  inspectCapabilities(declaredTools = {}) {
    return {
      host: 'antigravity',
      hasTerminalTool: Boolean(declaredTools.run_command),
      hasFileTools: Boolean(declaredTools.read_file && declaredTools.write_file && declaredTools.edit_file),
      hasSubagentTools: Boolean(declaredTools.invoke_subagent),
      supportsMcp: Boolean(declaredTools.call_mcp_tool)
    };
  }
}
