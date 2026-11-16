/**
 * Xyeena Conditional Installer (P10 / DEC-26 / DEC-28 / DEC-29)
 * Unified exports for state detection, asset ownership, and transactional installation.
 */

export {
  INSTALL_STATES,
  compareSemver,
  resolveTargetDir,
  resolveStateDir,
  resolvePortableHome,
  detectInstallationState,
  readInstallManifest
} from './decision-flow.mjs';

export {
  BRAND_METADATA,
  isXyeenaOwned,
  isProtectedUserData,
  scanDirectoryOwnership,
  getOfficialSkillNames,
  listFilesRecursive
} from './ownership.mjs';

export {
  computePackageBaseline,
  generateUnifiedDiff,
  computeDiffFingerprint,
  hashBuffer,
  hashString
} from './baseline-hashes.mjs';

export { InstallationTransaction, safeChild } from './transaction.mjs';

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
  return tx.execute({
    force: options.force,
    diffApprovedFingerprint: options.diffApprovedFingerprint,
    interactiveSelections: options.interactiveSelections
  });
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
