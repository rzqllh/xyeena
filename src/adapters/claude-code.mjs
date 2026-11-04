/**
 * Xyeena Adapters - Claude Code Host Adapter
 * Native bridge for Claude Code CLI and toolset.
 */

import path from 'path';

export class ClaudeCodeAdapter {
  constructor(options = {}) {
    this.env = options.env || process.env;
  }

  detect() {
    return Boolean(
      this.env.CLAUDE_CODE_ENTRY ||
      this.env.CLAUDE_PROJECT_DIR ||
      this.env.CLAUDE_SESSION_ID
    );
  }

  getSkillLocations() {
    const userHome = process.env.USERPROFILE || process.env.HOME || '';
    return [
      path.join(userHome, '.claude', 'skills'),
      path.join(process.cwd(), '.claude', 'skills')
    ];
  }

  inspectCapabilities(declaredTools = {}) {
    return {
      host: 'claude_code',
      hasTerminalTool: Boolean(declaredTools.Bash),
      hasFileTools: Boolean(declaredTools.FileEdit || declaredTools.WriteFile),
      hasSubagentTools: Boolean(declaredTools.Agent),
      supportsMcp: false
    };
  }
}
