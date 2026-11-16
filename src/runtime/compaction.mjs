/**
 * Xyeena Runtime - Context Compaction & Continuity Engine
 * Compresses long conversation histories into high-density state summaries
 * while strictly preserving locked decisions, active branches, and file states.
 */

export class ContextCompactor {
  /**
   * Compact conversation state into a structured context summary.
   * @param {object} state
   * @param {string} state.activeProject
   * @param {string} state.activeBranch
   * @param {string} state.gitHead
   * @param {Array<{ id: string, title: string, status: string }>} state.lockedDecisions
   * @param {string[]} state.modifiedFiles
   * @param {Array<{ id: string, title: string, status: string }>} state.pendingTasks
   * @returns {string} High-density markdown CONTEXT_SUMMARY
   */
  static compactState({
    activeProject,
    activeBranch,
    gitHead,
    lockedDecisions = [],
    modifiedFiles = [],
    pendingTasks = []
  }) {
    const lines = [
      `# CONTEXT SUMMARY — ${activeProject}`,
      `**Generated:** ${new Date().toISOString()}  `,
      `**Active Branch:** \`${activeBranch}\` @ \`${gitHead}\`  `,
      '',
      '## 1. Locked Decisions & Invariants'
    ];

    if (lockedDecisions.length === 0) {
      lines.push('*No custom decisions locked.*');
    } else {
      for (const d of lockedDecisions) {
        lines.push(`- **${d.id}**: ${d.title} (${d.status})`);
      }
    }

    lines.push('', '## 2. Modified & Verified Files');
    if (modifiedFiles.length === 0) {
      lines.push('*No workspace files currently modified.*');
    } else {
      for (const f of modifiedFiles) {
        lines.push(`- \`${f}\``);
      }
    }

    lines.push('', '## 3. Pending & Executable Tasks');
    if (pendingTasks.length === 0) {
      lines.push('*All tasks verified and completed.*');
    } else {
      for (const t of pendingTasks) {
        lines.push(`- **${t.id}**: ${t.title} [${t.status}]`);
      }
    }

    return lines.join('\n');
  }
}
