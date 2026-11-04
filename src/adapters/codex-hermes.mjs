/**
 * Xyeena Adapters - Codex & Hermes Host Adapters
 */

import path from 'path';

export class CodexAdapter {
  constructor(options = {}) {
    this.env = options.env || process.env;
  }

  detect() {
    return Boolean(this.env.CODEX_THREAD_ID || this.env.CODEX_SESSION);
  }

  getSkillLocations() {
    const userHome = process.env.USERPROFILE || process.env.HOME || '';
    return [
      path.join(userHome, '.codex', 'skills'),
      path.join(process.cwd(), '.codex', 'skills')
    ];
  }
}

export class HermesAdapter {
  constructor(options = {}) {
    this.env = options.env || process.env;
  }

  detect() {
    return Boolean(this.env.HERMES_HOME || this.env.HERMES_SESSION);
  }

  getSkillLocations() {
    const hermesHome = this.env.HERMES_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.hermes');
    return [
      path.join(hermesHome, 'skills'),
      path.join(process.cwd(), '.hermes', 'skills')
    ];
  }
}
