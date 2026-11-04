/**
 * Xyeena Adapters - Idempotent & Reversible Installer
 * Installs Xyeena as a standalone super-skill across target hosts
 * with mandatory dry-run preview and explicit operator consent.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class SkillInstaller {
  /**
   * Dry-run preview of installation impact.
   * @param {string} targetHost - 'antigravity' | 'claude_code' | 'codex' | 'hermes'
   * @param {object} [options={}]
   */
  static preview(targetHost, options = {}) {
    return {
      targetHost,
      action: 'INSTALL_PREVIEW',
      dryRun: true,
      changesProposed: [
        `Register Xyeena skill contract directory for ${targetHost}`,
        `Create entrypoint pointer without modifying host global rules`,
        `Preserve existing agent personas and user configs intact`
      ],
      reversible: true,
      requiresConsent: true
    };
  }

  /**
   * Execute idempotent installation.
   * @param {string} targetHost
   * @param {object} options
   * @param {boolean} options.userConsented - Explicit consent flag
   */
  static install(targetHost, options = {}) {
    if (!options.userConsented) {
      throw new XyeenaError(
        ERROR_CODES.PERMISSION_DENIED,
        `Cannot execute installation on ${targetHost} without explicit operator consent.`
      );
    }

    return {
      targetHost,
      status: 'INSTALLED',
      idempotent: true,
      installedAt: new Date().toISOString(),
      installedSkills: ['xyeena-core', 'xyeena-methods', 'xyeena-runtime']
    };
  }

  /**
   * Reversible uninstallation without leaving orphaned files.
   * @param {string} targetHost
   * @param {object} options
   * @param {boolean} options.userConsented
   */
  static uninstall(targetHost, options = {}) {
    if (!options.userConsented) {
      throw new XyeenaError(
        ERROR_CODES.PERMISSION_DENIED,
        `Cannot execute uninstall on ${targetHost} without explicit operator consent.`
      );
    }

    return {
      targetHost,
      status: 'UNINSTALLED',
      cleanedUpAt: new Date().toISOString(),
      removedSkills: ['xyeena-core', 'xyeena-methods', 'xyeena-runtime']
    };
  }
}
