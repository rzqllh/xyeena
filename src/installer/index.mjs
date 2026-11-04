/**
 * Xyeena / Axioven Conditional Installer (P08)
 * Unified exports for state detection, asset ownership, and transactional installation.
 */

export { INSTALL_STATES, compareSemver, resolveTargetDir, detectInstallationState, readInstallManifest } from './decision-flow.mjs';
export { BRAND_METADATA, isXyeenaOwned, isProtectedUserData, scanDirectoryOwnership, listFilesRecursive } from './ownership.mjs';
export { InstallationTransaction } from './transaction.mjs';

import { InstallationTransaction } from './transaction.mjs';

/**
 * High-level conditional installer API.
 * Automatically decides whether to fresh install, replace legacy, update, repair, or no-op.
 * @param {object} options
 * @returns {object} Transaction receipt or plan
 */
export function runConditionalInstall(options = {}) {
  const tx = new InstallationTransaction(options);
  if (options.dryRun) {
    return tx.plan();
  }
  return tx.execute({ force: options.force });
}

export function runConditionalUninstall(options = {}) {
  const tx = new InstallationTransaction(options);
  return tx.uninstall();
}

export function runConditionalRollback(options = {}) {
  if (!options.backupId) {
    throw new Error('Rollback requires a backupId');
  }
  const tx = new InstallationTransaction(options);
  return tx.rollback(options.backupId);
}
