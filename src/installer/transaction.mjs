/**
 * Xyeena Installer - Safe Transaction Engine (P10 / DEC-26 / DEC-28 / DEC-29)
 * Implements deterministic baseline verification, hybrid diff approval,
 * true two-way transactional rollback, global/workspace isolation,
 * symlink boundary safety, and zero data loss of user customizations.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PACKAGE_ROOT, SKILLS_DIR, VERSION } from '../paths.mjs';
import { RUNTIMES } from '../runtime.mjs';
import {
  INSTALL_STATES,
  detectInstallationState,
  resolveTargetDir,
  resolveStateDir,
  compareSemver,
  resolvePortableHome
} from './decision-flow.mjs';
import {
  BRAND_METADATA,
  isXyeenaOwned,
  isProtectedUserData,
  scanDirectoryOwnership,
  getOfficialSkillNames
} from './ownership.mjs';
import {
  computePackageBaseline,
  isKnownOfficialBaseline,
  generateUnifiedDiff,
  computeDiffFingerprint,
  computeUninstallConsentFingerprint,
  hashBuffer,
  slash,
  listFilesRecursive
} from './baseline-hashes.mjs';

/**
 * Validates that targetPath does not escape destination root via path traversal or symlinks/junctions.
 * @param {string} root
 * @param {string} targetPath
 * @returns {string} Fully resolved safe target path
 */
export function safeChild(root, targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Security error: path escapes destination root: ${targetPath}`);
  }

  // Canonicalize root realpath
  let realRoot = resolvedRoot;
  if (fs.existsSync(resolvedRoot)) {
    try {
      realRoot = fs.realpathSync(resolvedRoot);
    } catch {
      realRoot = resolvedRoot;
    }
  }
  const normRealRoot = process.platform === 'win32'
    ? path.normalize(realRoot).toLowerCase()
    : path.normalize(realRoot);

  // Traverse all path segments from root down to target to detect symlinks/junctions escaping root
  const segments = rel.split(/[\\/]/).filter(Boolean);
  let current = resolvedRoot;

  for (const segment of segments) {
    current = path.join(current, segment);
    let lstat = null;
    try {
      lstat = fs.lstatSync(current);
    } catch (e) {
      if (e.code === 'ENOENT') {
        // Path does not exist further down; cannot escape root via non-existent nodes
        break;
      }
      throw e;
    }

    if (lstat) {
      if (lstat.isSymbolicLink()) {
        let realCurrent;
        try {
          realCurrent = fs.realpathSync(current);
        } catch (e) {
          throw new Error(`Security error: dangling symlink detected along path: ${targetPath} at ${current}`);
        }
        const normRealCurrent = process.platform === 'win32'
          ? path.normalize(realCurrent).toLowerCase()
          : path.normalize(realCurrent);
        const realRel = path.relative(normRealRoot, normRealCurrent);
        if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
          throw new Error(`Security error: symlink/junction realpath escapes destination root: ${targetPath}`);
        }
      } else {
        try {
          const realCurrent = fs.realpathSync(current);
          const normRealCurrent = process.platform === 'win32'
            ? path.normalize(realCurrent).toLowerCase()
            : path.normalize(realCurrent);
          const realRel = path.relative(normRealRoot, normRealCurrent);
          if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
            throw new Error(`Security error: symlink/junction realpath escapes destination root: ${targetPath}`);
          }
        } catch (e) {
          if (e.message.includes('escapes destination root')) throw e;
        }
      }
    }
  }

  return resolvedTarget;
}

export class InstallationTransaction {
  /**
   * @param {object} options
   * @param {string} options.cwd - Project root
   * @param {string} [options.runtime='antigravity']
   * @param {'workspace'|'global'} [options.scope='workspace']
   * @param {'copy'|'symlink'} [options.mode] - Default on Windows is 'copy' (DEC-29)
   * @param {string[]} [options.skills] - Optional selective skill subset
   * @param {string} [options.home] - Optional home directory override
   * @param {string} [options.targetVersion=VERSION]
   */
  constructor(options = {}) {
    this.cwd = path.resolve(options.cwd || process.cwd());
    this.runtime = options.runtime || 'antigravity';
    this.scope = options.scope || 'workspace';
    this.home = options.home ? path.resolve(options.home) : null;
    this.targetVersion = options.targetVersion || VERSION;
    this.skills = Array.isArray(options.skills) && options.skills.length > 0 ? options.skills : null;

    // DEC-29: Windows installer default is 'copy'. Symlink only when explicitly requested.
    if (options.mode) {
      this.mode = options.mode;
    } else {
      this.mode = 'copy';
    }

    // Resolve isolated state paths (DEC-28)
    const state = resolveStateDir({
      cwd: this.cwd,
      runtime: this.runtime,
      scope: this.scope,
      home: this.home
    });
    this.stateDir = state.stateDir;
    this.manifestPath = state.manifestPath;
    this.lockPath = state.lockPath;
    this.backupDirBase = state.backupDir;

    this.targetDir = resolveTargetDir(this.cwd, this.runtime, this.scope, this.home);
    this.lockHeld = false;
  }

  /**
   * Acquire exclusive installer lock.
   */
  acquireLock() {
    if (this.lockHeld) {
      throw new Error('Installer lock is actively held by this transaction');
    }
    fs.mkdirSync(path.dirname(this.lockPath), { recursive: true });
    const token = crypto.randomBytes(16).toString('hex');
    const lockData = {
      pid: process.pid,
      timestamp: Date.now(),
      runtime: this.runtime,
      scope: this.scope,
      cwd: this.cwd,
      token
    };
    let fd;
    try {
      // O_EXCL + O_CREAT: atomic across cooperating processes, unlike existsSync() + writeFileSync().
      fd = fs.openSync(this.lockPath, 'wx', 0o600);
      fs.writeFileSync(fd, JSON.stringify(lockData, null, 2) + '\n');
      fs.fsyncSync(fd);
    } catch (err) {
      if (err?.code === 'EEXIST') {
        // Do not automatically steal "stale" locks: age alone cannot establish owner death.
        let owner = 'unknown';
        try {
          const existing = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
          owner = Number.isSafeInteger(existing.pid) ? String(existing.pid) : 'unknown';
        } catch { /* Malformed lock is still held until deliberate recovery. */ }
        throw new Error(`Installer lock is actively held or requires manual recovery (PID ${owner}). Do not delete a lock while an installation may be running.`);
      }
      throw err;
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    this.lockHeld = true;
    this.lockToken = token;
  }

  /**
   * Release only the exact lock owned by this transaction.
   */
  releaseLock() {
    if (!this.lockHeld) return;
    const data = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
    if (!data || data.token !== this.lockToken || data.pid !== process.pid) {
      throw new Error('Installer lock ownership mismatch: refusing to remove another process lock');
    }
    fs.unlinkSync(this.lockPath);
    this.lockHeld = false;
    this.lockToken = null;
  }

  /**
   * Inspect current filesystem, detect user modifications against release baseline,
   * generate unified diffs, and return a dry-run execution plan (DEC-26).
   * @returns {object}
   */
  plan() {
    const detection = detectInstallationState({
      cwd: this.cwd,
      runtime: this.runtime,
      scope: this.scope,
      targetVersion: this.targetVersion,
      home: this.home
    });

    const ownership = scanDirectoryOwnership({
      targetDir: this.targetDir,
      manifest: detection.manifest
    });

    if (Array.isArray(this.skills)) {
      for (const s of this.skills) {
        if (typeof s !== 'string' || s.includes('..') || s.includes('/') || s.includes('\\')) {
          throw new Error(`Security boundary violation: invalid skill name "${s}" escapes directory scope`);
        }
      }
    }

    const availableSkills = getOfficialSkillNames();
    const selectedSkills = Array.isArray(this.skills) && this.skills.length > 0
      ? this.skills.filter(s => availableSkills.includes(s))
      : availableSkills;

    const baseline = computePackageBaseline(SKILLS_DIR);
    const willReplace = [];
    const willPreserve = ownership.unowned.slice();
    const modifiedFiles = [];

    // Scan target directory for files that would be modified or replaced
    if (fs.existsSync(this.targetDir)) {
      for (const skillName of selectedSkills) {
        const skillDest = path.join(this.targetDir, skillName);
        if (fs.existsSync(skillDest) && fs.statSync(skillDest).isDirectory()) {
          const existingFiles = listFilesRecursive(skillDest);
          for (const rel of existingFiles) {
            const absExisting = path.join(skillDest, rel);
            const packageKey = `${skillName}/${rel}`;
            const targetRel = slash(path.relative(this.cwd, absExisting));

            // Never replace protected user data
            if (isProtectedUserData(targetRel)) {
              willPreserve.push(targetRel);
              continue;
            }

            // If file does NOT exist in package baseline:
            // It is an unowned custom user file inside the skill folder! PRESERVE IT!
            if (!baseline.has(packageKey)) {
              willPreserve.push(targetRel);
              continue;
            }

            const existingBuf = fs.readFileSync(absExisting);
            const existingHash = hashBuffer(existingBuf);

            willReplace.push(targetRel);

            // Compare against official release baseline & known legacy releases
            // If file is 0 bytes, it is corrupted and needs repair (not intentional user modification)
            if (existingBuf.length > 0) {
              const isOfficial = isKnownOfficialBaseline(packageKey, existingBuf, baseline);
              if (!isOfficial) {
                // User has modified this file!
                const baselineItem = baseline.get(packageKey);
                const baselineText = baselineItem ? fs.readFileSync(baselineItem.absPath, 'utf8') : '';
                const existingText = existingBuf.toString('utf8');
                const diff = generateUnifiedDiff(baselineText, existingText, targetRel);
                modifiedFiles.push({
                  path: targetRel,
                  skillName,
                  beforeSha256: baselineItem ? baselineItem.sha256 : 'legacy',
                  currentSha256: existingHash,
                  diff
                });
              }
            }
          }
        }
      }
    }

    // Rules for antigravity in workspace scope
    if (this.runtime === 'antigravity' && this.scope === 'workspace') {
      const ruleRel = slash(path.join('.agents', 'rules', 'xyeena-core.md'));
      const absRule = path.join(this.cwd, ruleRel);
      if (fs.existsSync(absRule)) {
        willReplace.push(ruleRel);
        const baselineRule = baseline.get('.rules/xyeena-core.md');
        if (baselineRule) {
          const curBuf = fs.readFileSync(absRule);
          const curHash = hashBuffer(curBuf);
          if (curHash !== baselineRule.sha256) {
            const diff = generateUnifiedDiff(
              fs.readFileSync(baselineRule.absPath, 'utf8'),
              curBuf.toString('utf8'),
              ruleRel
            );
            modifiedFiles.push({
              path: ruleRel,
              skillName: 'rule',
              beforeSha256: baselineRule.sha256,
              currentSha256: curHash,
              diff
            });
          }
        }
      }
    }

    const diffFingerprint = modifiedFiles.length > 0 ? computeDiffFingerprint(modifiedFiles) : null;

    return {
      brand: BRAND_METADATA.brand,
      product: BRAND_METADATA.product,
      engine: BRAND_METADATA.engine,
      state: detection.state,
      modificationState: modifiedFiles.length > 0 ? INSTALL_STATES.USER_MODIFICATIONS_DETECTED : 'CLEAN',
      targetVersion: this.targetVersion,
      installedVersion: detection.manifest ? detection.manifest.version : null,
      runtime: this.runtime,
      scope: this.scope,
      mode: this.mode,
      targetDir: this.targetDir,
      stateDir: this.stateDir,
      availableSkillsCount: availableSkills.length,
      selectedSkills,
      willReplace: [...new Set(willReplace)].sort(),
      willPreserve: [...new Set(willPreserve)].sort(),
      hasUserModifications: modifiedFiles.length > 0,
      modifiedFiles,
      diffFingerprint,
      dryRun: true,
      detectionDetails: detection.details
    };
  }

  /**
   * Execute installation with hybrid diff gate and true two-way transactional rollback.
   * @param {object} [options={}]
   * @param {boolean} [options.force=false]
   * @param {string} [options.diffApprovedFingerprint] - Explicit consent bound to diff fingerprint
   * @param {Map<string, 'keep'|'overwrite'>} [options.interactiveSelections] - Per-file user decisions
   * @returns {object} Execution receipt
   */
  execute(options = {}) {
    const plan = this.plan();
    const baseline = computePackageBaseline(SKILLS_DIR);

    // 1. Check no-op
    if (plan.state === INSTALL_STATES.SAME_VERSION_VALID && !options.force && !plan.hasUserModifications) {
      return {
        success: true,
        action: 'NO_OP',
        noop: true,
        state: INSTALL_STATES.SAME_VERSION_VALID,
        message: 'Xyeena Rig is already installed and up to date at target version.',
        version: this.targetVersion,
        runtime: this.runtime,
        scope: this.scope,
        targetDir: this.targetDir
      };
    }

    // 2. Check downgrade protection
    if (plan.state === INSTALL_STATES.NEWER_VERSION && !options.force) {
      throw new Error(
        `Silent downgrade refused: installed version (${plan.installedVersion}) is newer than package version (${this.targetVersion}). Pass force to override.`
      );
    }

    // 3. HYBRID DIFF APPROVAL GATE (DEC-26)
    if (plan.hasUserModifications) {
      if (options.diffApprovedFingerprint) {
        if (options.diffApprovedFingerprint !== plan.diffFingerprint) {
          throw new Error(
            `Diff approval fingerprint mismatch. Expected ${plan.diffFingerprint}, received ${options.diffApprovedFingerprint}`
          );
        }
      } else if (options.interactiveSelections) {
        // Handled per-file in write phase
      } else {
        // FAIL CLOSED: Report modified files and diff fingerprint
        const err = new Error(
          `Installation halted: ${plan.modifiedFiles.length} user-modified file(s) detected in target directory.\n` +
          `A review of changes is required (DEC-26). To approve, pass --diff-approved-fingerprint=${plan.diffFingerprint}\n\n` +
          plan.modifiedFiles.map(m => m.diff).join('\n')
        );
        err.code = 'USER_MODIFICATIONS_DETECTED';
        err.diffFingerprint = plan.diffFingerprint;
        err.modifiedFiles = plan.modifiedFiles;
        throw err;
      }
    }

    // 4. Acquire Lock
    this.acquireLock();

    let backupId = null;
    let backupDir = null;
    const writtenFiles = [];
    const replacedFiles = [];

    try {
      // 5. POST-CONSENT REVALIDATION
      // Ensure files on disk have not been tampered with between preview and write
      for (const mod of plan.modifiedFiles) {
        const curAbs = path.join(this.cwd, mod.path);
        if (fs.existsSync(curAbs)) {
          const currentHash = hashBuffer(fs.readFileSync(curAbs));
          if (currentHash !== mod.currentSha256) {
            throw new Error(`File modified during transaction preview: ${mod.path}`);
          }
        }
      }

      // 6. PHASE 1: BACKUP & STAGING
      if (plan.willReplace.length > 0 || fs.existsSync(this.manifestPath)) {
        backupId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
        backupDir = path.join(this.backupDirBase, backupId);
        fs.mkdirSync(backupDir, { recursive: true });

        // Protect backup directory
        fs.writeFileSync(path.join(backupDir, '.gitignore'), '*\n!.gitignore\n', { flag: 'wx' });

        const backupJournal = {
          schema: 2,
          cwd: this.cwd,
          createdAt: new Date().toISOString(),
          brand: BRAND_METADATA.brand,
          engine: BRAND_METADATA.engine,
          targetVersion: this.targetVersion,
          runtime: this.runtime,
          scope: this.scope,
          state: plan.state,
          replacedFiles: [],
          writtenFiles: [],
          hadManifest: fs.existsSync(this.manifestPath)
        };

        // Backup existing manifest if present
        if (fs.existsSync(this.manifestPath)) {
          fs.copyFileSync(this.manifestPath, path.join(backupDir, 'previous-manifest.json'));
        }

        // Backup all files to be replaced
        for (const relPath of plan.willReplace) {
          const absSrc = path.join(this.cwd, relPath);
          if (fs.existsSync(absSrc) && fs.statSync(absSrc).isFile()) {
            const absDst = path.join(backupDir, ...relPath.split('/'));
            fs.mkdirSync(path.dirname(absDst), { recursive: true });
            fs.copyFileSync(absSrc, absDst);

            const fileBuf = fs.readFileSync(absSrc);
            const rec = {
              path: relPath,
              sha256: hashBuffer(fileBuf)
            };
            backupJournal.replacedFiles.push(rec);
            replacedFiles.push(rec);
          }
        }

        fs.writeFileSync(
          path.join(backupDir, 'rollback.json'),
          JSON.stringify(backupJournal, null, 2) + '\n'
        );
      }

      // 7. PHASE 2: ATOMIC / SAFE WRITE
      fs.mkdirSync(this.targetDir, { recursive: true });

      for (const skillName of plan.selectedSkills) {
        const skillSrc = path.join(SKILLS_DIR, skillName);
        const skillDst = path.join(this.targetDir, skillName);
        if (!fs.existsSync(skillSrc)) continue;

        safeChild(this.targetDir, skillDst);

        if (this.mode === 'symlink') {
          // DEC-29: Windows symlink validation
          const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
          if (fs.existsSync(skillDst)) {
            const isSym = fs.lstatSync(skillDst).isSymbolicLink();
            if (!isSym && fs.statSync(skillDst).isDirectory()) {
              // DEC-26: Check if directory contains custom user files or user modifications
              const existingSkillFiles = listFilesRecursive(skillDst);
              const customFiles = existingSkillFiles.filter(f => !baseline.has(`${skillName}/${f}`));
              if (customFiles.length > 0) {
                // DEC-26: Unowned/custom files must NEVER be destroyed by symlink replacement, even with --force
                throw new Error(
                  `Cannot replace directory "${skillName}" containing ${customFiles.length} custom user file(s) with symlink (unowned user data cannot be destroyed even with --force). Custom files: ${customFiles.slice(0, 3).join(', ')}${customFiles.length > 3 ? '...' : ''}. Relocate custom files before switching to symlink mode.`
                );
              }
              const modifiedFiles = existingSkillFiles.filter(f => {
                const pKey = `${skillName}/${f}`;
                if (!baseline.has(pKey)) return false;
                const curBuf = fs.readFileSync(path.join(skillDst, f));
                return !isKnownOfficialBaseline(pKey, curBuf, baseline);
              });
              if (modifiedFiles.length > 0) {
                // DEC-26 & P14: Modified official files cannot be destroyed during copy-to-symlink conversion
                // without an exact, verified diff approval fingerprint, even with --force.
                if (!options.diffApprovedFingerprint || options.diffApprovedFingerprint !== plan.diffFingerprint) {
                  throw new Error(
                    `Cannot replace directory "${skillName}" containing ${modifiedFiles.length} modified official file(s) with symlink (modified user files cannot be destroyed without matching --diff-approved-fingerprint, even with --force). Expected fingerprint: ${plan.diffFingerprint}, received: ${options.diffApprovedFingerprint || 'none'}.`
                  );
                }
              }
            }
            fs.rmSync(skillDst, { recursive: true, force: true });
          }
          fs.symlinkSync(path.resolve(skillSrc), skillDst, symlinkType);
          writtenFiles.push(slash(path.relative(this.cwd, skillDst)));
        } else {
          // Copy mode (Default on Windows & Linux)
          fs.mkdirSync(skillDst, { recursive: true });
          const skillFiles = listFilesRecursive(skillSrc);

          for (const sf of skillFiles) {
            const srcFile = path.join(skillSrc, sf);
            const dstFile = path.join(skillDst, sf);
            const targetRel = slash(path.relative(this.cwd, dstFile));

            // Respect interactive per-file keep selection if given
            if (options.interactiveSelections && options.interactiveSelections.get(targetRel) === 'keep') {
              continue;
            }

            safeChild(this.targetDir, dstFile);
            fs.mkdirSync(path.dirname(dstFile), { recursive: true });
            fs.copyFileSync(srcFile, dstFile);
            writtenFiles.push(targetRel);
          }
        }
      }

      // 8. PHASE 3: RULES (Antigravity workspace scope)
      if (this.runtime === 'antigravity' && this.scope === 'workspace') {
        const ruleSrc = path.join(PACKAGE_ROOT, 'rules', 'xyeena-core.md');
        if (fs.existsSync(ruleSrc)) {
          const ruleDst = path.join(this.cwd, '.agents', 'rules', 'xyeena-core.md');
          const ruleRel = slash(path.relative(this.cwd, ruleDst));
          safeChild(this.cwd, ruleDst);
          fs.mkdirSync(path.dirname(ruleDst), { recursive: true });
          fs.copyFileSync(ruleSrc, ruleDst);
          writtenFiles.push(ruleRel);
        }
      }

      // 9. PHASE 4: RECORD WRITTEN FILES & WRITE MANIFEST
      if (backupDir && fs.existsSync(path.join(backupDir, 'rollback.json'))) {
        const journalPath = path.join(backupDir, 'rollback.json');
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
        journal.writtenFiles = [...new Set(writtenFiles)].sort();
        fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2) + '\n');
      }

      fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
      const manifestData = {
        schema: 2,
        version: this.targetVersion,
        brand: BRAND_METADATA.brand,
        engine: BRAND_METADATA.engine,
        runtime: this.runtime,
        scope: this.scope,
        mode: this.mode,
        installedAt: new Date().toISOString(),
        backupId,
        skills: plan.selectedSkills,
        files: [...new Set(writtenFiles)].sort()
      };
      fs.writeFileSync(this.manifestPath, JSON.stringify(manifestData, null, 2) + '\n');

      // 10. COMMIT
      this.releaseLock();

      return {
        success: true,
        action: plan.state === INSTALL_STATES.NOT_INSTALLED ? 'FRESH_INSTALL' : 'UPDATE_SUCCESS',
        brand: BRAND_METADATA.brand,
        engine: BRAND_METADATA.engine,
        version: this.targetVersion,
        backupId,
        runtime: this.runtime,
        scope: this.scope,
        mode: this.mode,
        targetDir: this.targetDir,
        installedSkills: plan.selectedSkills,
        filesCount: writtenFiles.length
      };

    } catch (txErr) {
      // 11. TRUE TWO-WAY ROLLBACK (DEC-26)
      if (backupId) {
        try {
          this.rollback(backupId);
        } catch (rbErr) {
          this.releaseLock();
          txErr.message += ` (Rollback partially failed: ${rbErr.message})`;
          throw txErr;
        }
      }
      this.releaseLock();
      throw txErr;
    }
  }

  /**
   * Rollback an installation using a backup ID journal.
   * Removes newly created files and restores original files (DEC-26).
   * @param {string} backupId
   * @returns {{ success: boolean, backupId: string, restored: string[], removed: string[] }}
   */
  rollback(backupId) {
    const backupDir = path.join(this.backupDirBase, backupId);
    const journalFile = path.join(backupDir, 'rollback.json');

    if (!fs.existsSync(journalFile)) {
      throw new Error(`Rollback failed: backup journal not found at ${journalFile}`);
    }

    const journal = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
    const restored = [];
    const removed = [];

    // 1. Remove all newly written files that did not exist before
    const replacedSet = new Set((journal.replacedFiles || []).map(r => r.path));
    if (Array.isArray(journal.writtenFiles)) {
      for (const relPath of journal.writtenFiles) {
        if (!replacedSet.has(relPath)) {
          const absTarget = path.join(this.cwd, ...relPath.split('/'));
          if (fs.existsSync(absTarget)) {
            fs.rmSync(absTarget, { recursive: true, force: true });
            removed.push(relPath);
          }
        }
      }
    }

    // 2. Restore all replaced or removed files from backup
    const filesToRestore = (journal.replacedFiles || []).concat(journal.removedFiles || []);
    for (const item of filesToRestore) {
      const backupSource = path.join(backupDir, ...item.path.split('/'));
      const targetDest = path.join(this.cwd, ...item.path.split('/'));
      if (fs.existsSync(backupSource)) {
        fs.mkdirSync(path.dirname(targetDest), { recursive: true });
        fs.copyFileSync(backupSource, targetDest);
        restored.push(item.path);
      }
    }

    // 3. Restore previous manifest or delete current manifest
    if (journal.hadManifest) {
      const prevManifest = path.join(backupDir, 'previous-manifest.json');
      if (fs.existsSync(prevManifest)) {
        fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
        fs.copyFileSync(prevManifest, this.manifestPath);
      }
    } else {
      if (fs.existsSync(this.manifestPath)) {
        fs.unlinkSync(this.manifestPath);
      }
    }

    return {
      success: true,
      backupId,
      restored,
      removed
    };
  }

  /**
   * Plan uninstallation: inspects directory ownership, baseline, and user modifications,
   * returning lists of files that will be removed or preserved, and the exact consent fingerprint.
   * @returns {{ runtime: string, scope: string, targetDir: string, hasUserModifications: boolean, modifiedFiles: object[], uninstallConsentFingerprint: string|null, willRemove: string[], willPreserve: string[] }}
   */
  planUninstall() {
    const detection = detectInstallationState({
      cwd: this.cwd,
      runtime: this.runtime,
      scope: this.scope,
      home: this.home
    });

    const ownership = scanDirectoryOwnership({
      targetDir: this.targetDir,
      manifest: detection.manifest
    });

    const baseline = computePackageBaseline(SKILLS_DIR);
    const willRemove = [];
    const willPreserve = ownership.unowned.slice();
    const modifiedFiles = [];

    for (const skillName of ownership.owned) {
      const skillPath = path.join(this.targetDir, skillName);
      if (fs.existsSync(skillPath)) {
        const isSymlink = fs.lstatSync(skillPath).isSymbolicLink();
        if (isSymlink) {
          willRemove.push(slash(path.relative(this.cwd, skillPath)));
          continue;
        }

        const skillFiles = listFilesRecursive(skillPath);
        for (const rel of skillFiles) {
          const absFilePath = path.join(skillPath, rel);
          const packageKey = `${skillName}/${rel}`;
          const targetRel = slash(path.relative(this.cwd, absFilePath));

          const inBaseline = baseline.has(packageKey);
          const inManifest = detection.manifest && Array.isArray(detection.manifest.files) && detection.manifest.files.includes(targetRel);

          if (!inBaseline && !inManifest) {
            willPreserve.push(targetRel);
            continue;
          }

          const curBuf = fs.readFileSync(absFilePath);
          const isOfficial = isKnownOfficialBaseline(packageKey, curBuf, baseline);
          if (!isOfficial) {
            const baselineItem = baseline.get(packageKey);
            const baselineText = baselineItem && fs.existsSync(baselineItem.absPath)
              ? fs.readFileSync(baselineItem.absPath, 'utf8')
              : '';
            const diff = generateUnifiedDiff(baselineText, curBuf.toString('utf8'), targetRel);
            modifiedFiles.push({
              path: targetRel,
              skillName,
              absPath: absFilePath,
              beforeSha256: baselineItem ? baselineItem.sha256 : 'legacy',
              currentSha256: hashBuffer(curBuf),
              diff,
              action: 'REMOVE'
            });
          } else {
            willRemove.push(targetRel);
          }
        }
      }
    }

    if (this.runtime === 'antigravity' && this.scope === 'workspace') {
      const rulePath = path.join(this.cwd, '.agents', 'rules', 'xyeena-core.md');
      if (fs.existsSync(rulePath)) {
        const ruleBuf = fs.readFileSync(rulePath);
        const baselineRule = baseline.get('.rules/xyeena-core.md');
        const isOfficialRule = baselineRule && baselineRule.sha256 === hashBuffer(ruleBuf);
        const ruleRel = slash(path.relative(this.cwd, rulePath));
        if (!isOfficialRule) {
          const baselineText = baselineRule && fs.existsSync(baselineRule.absPath)
            ? fs.readFileSync(baselineRule.absPath, 'utf8')
            : '';
          const diff = generateUnifiedDiff(baselineText, ruleBuf.toString('utf8'), ruleRel);
          modifiedFiles.push({
            path: ruleRel,
            skillName: 'rule',
            absPath: rulePath,
            beforeSha256: baselineRule ? baselineRule.sha256 : 'legacy',
            currentSha256: hashBuffer(ruleBuf),
            diff,
            action: 'REMOVE'
          });
        } else {
          willRemove.push(ruleRel);
        }
      }
    }

    const consentFingerprint = modifiedFiles.length > 0
      ? computeUninstallConsentFingerprint({
          operation: 'UNINSTALL_MODIFIED_REMOVAL',
          runtime: this.runtime,
          scope: this.scope,
          destinationIdentity: this.targetDir,
          files: modifiedFiles
        })
      : null;

    return {
      runtime: this.runtime,
      scope: this.scope,
      targetDir: this.targetDir,
      hasUserModifications: modifiedFiles.length > 0,
      modifiedFiles,
      uninstallConsentFingerprint: consentFingerprint,
      willRemove: [...new Set(willRemove)].sort(),
      willPreserve: [...new Set(willPreserve)].sort()
    };
  }

  /**
   * Safe uninstall: backs up first, and only removes verified owned files (DEC-26).
   * User-modified files are strictly preserved unless explicit, cryptographically binding
   * consent (allowModifiedRemoval=true + matching diffApprovedFingerprint) is provided.
   * @param {object} [options={}]
   * @param {boolean} [options.allowModifiedRemoval=false]
   * @param {string} [options.diffApprovedFingerprint]
   * @param {boolean} [options.force=false]
   * @returns {{ success: boolean, removed: string[], preserved: string[], backupId: string }}
   */
  uninstall(options = {}) {
    const plan = this.planUninstall();

    // FAIL CLOSED HYBRID DIFF GATE FOR UNINSTALL (DEC-26)
    // If user modifications exist and caller explicitly asks to remove them (allowModifiedRemoval === true),
    // they MUST provide the exact matching cryptographic consent fingerprint.
    // --force is NOT consent: passing force: true cannot bypass this contract.
    let consentValid = false;
    const consentedPathSet = new Set();

    if (plan.hasUserModifications) {
      if (options.allowModifiedRemoval === true) {
        if (!options.diffApprovedFingerprint || typeof options.diffApprovedFingerprint !== 'string' || options.diffApprovedFingerprint.trim() === '') {
          const err = new Error(
            `Uninstall halted: ${plan.modifiedFiles.length} user-modified file(s) detected and allowModifiedRemoval was requested, but --diff-approved-fingerprint is missing.\n` +
            `Exact binding consent contract fingerprint required: ${plan.uninstallConsentFingerprint}\n` +
            `Fail-closed: user-modified files have not been touched.`
          );
          err.code = 'UNINSTALL_CONSENT_REQUIRED';
          err.diffFingerprint = plan.uninstallConsentFingerprint;
          err.modifiedFiles = plan.modifiedFiles;
          throw err;
        }

        // 1. Check if matching full consent fingerprint (all modified files)
        if (options.diffApprovedFingerprint === plan.uninstallConsentFingerprint) {
          for (const f of plan.modifiedFiles) {
            consentedPathSet.add(slash(f.path));
          }
          consentValid = true;
        } else {
          // 2. Check selective per-file consent
          let matchedSelective = false;
          if (Array.isArray(options.approvedFiles) && options.approvedFiles.length > 0) {
            const subsetFiles = plan.modifiedFiles.filter(f =>
              options.approvedFiles.includes(f.path) || options.approvedFiles.includes(slash(f.path))
            );
            if (subsetFiles.length > 0) {
              const subsetFp = computeUninstallConsentFingerprint({
                operation: 'UNINSTALL_MODIFIED_REMOVAL',
                runtime: this.runtime,
                scope: this.scope,
                destinationIdentity: this.targetDir,
                files: subsetFiles
              });
              if (options.diffApprovedFingerprint === subsetFp) {
                for (const f of subsetFiles) {
                  consentedPathSet.add(slash(f.path));
                }
                consentValid = true;
                matchedSelective = true;
              }
            }
          }

          if (!matchedSelective) {
            // Check each individual modified file for single-file consent match
            for (const f of plan.modifiedFiles) {
              const singleFp = computeUninstallConsentFingerprint({
                operation: 'UNINSTALL_MODIFIED_REMOVAL',
                runtime: this.runtime,
                scope: this.scope,
                destinationIdentity: this.targetDir,
                files: [f]
              });
              if (options.diffApprovedFingerprint === singleFp) {
                consentedPathSet.add(slash(f.path));
                consentValid = true;
                matchedSelective = true;
                break;
              }
            }
          }

          if (!consentValid) {
            const err = new Error(
              `Uninstall consent fingerprint mismatch. Expected ${plan.uninstallConsentFingerprint}, received ${options.diffApprovedFingerprint}.\n` +
              `Fail-closed: user-modified files will not be touched.`
            );
            err.code = 'UNINSTALL_CONSENT_MISMATCH';
            err.expectedFingerprint = plan.uninstallConsentFingerprint;
            err.receivedFingerprint = options.diffApprovedFingerprint;
            throw err;
          }
        }

        // Pre-mutation revalidation from disk (TOCTOU prevention) for consented files
        for (const item of plan.modifiedFiles) {
          if (consentedPathSet.has(slash(item.path))) {
            if (!fs.existsSync(item.absPath)) {
              throw new Error(`TOCTOU security violation: file disappeared before removal: ${item.path}`);
            }
            const freshBuf = fs.readFileSync(item.absPath);
            const freshHash = hashBuffer(freshBuf);
            if (freshHash !== item.currentSha256) {
              throw new Error(`TOCTOU security violation: file was modified on disk after consent fingerprint was generated: ${item.path}`);
            }
          }
        }
      }
    }

    // Acquire exclusive installer lock before performing any file mutations
    this.acquireLock();

    let backupId = null;
    let backupDir = null;

    try {
      // Create backup before uninstall
      backupId = `${new Date().toISOString().replace(/[:.]/g, '-')}-uninstall-${crypto.randomBytes(4).toString('hex')}`;
      backupDir = path.join(this.backupDirBase, backupId);
      fs.mkdirSync(backupDir, { recursive: true });

      const rollbackJournal = {
        schema: 2,
        type: 'UNINSTALL',
        cwd: this.cwd,
        targetDir: this.targetDir,
        backupId,
        hadManifest: fs.existsSync(this.manifestPath),
        removedFiles: []
      };

      const journalPath = path.join(backupDir, 'rollback.json');
      fs.writeFileSync(journalPath, JSON.stringify(rollbackJournal, null, 2) + '\n');

      if (fs.existsSync(this.manifestPath)) {
        fs.copyFileSync(this.manifestPath, path.join(backupDir, 'previous-manifest.json'));
      }

      const removed = [];
      const preserved = plan.willPreserve.slice();

      const detection = detectInstallationState({
        cwd: this.cwd,
        runtime: this.runtime,
        scope: this.scope,
        home: this.home
      });

      const ownership = scanDirectoryOwnership({
        targetDir: this.targetDir,
        manifest: detection.manifest
      });

      const baseline = computePackageBaseline(SKILLS_DIR);

      // Remove only verified owned, unmodified skill files (or consented modified files)
      for (const skillName of ownership.owned) {
        const skillPath = path.join(this.targetDir, skillName);
        if (fs.existsSync(skillPath)) {
          const isSymlink = fs.lstatSync(skillPath).isSymbolicLink();
          if (isSymlink) {
            fs.unlinkSync(skillPath);
            removed.push(slash(path.relative(this.cwd, skillPath)));
            continue;
          }

          const skillFiles = listFilesRecursive(skillPath);
          for (const rel of skillFiles) {
            const absFilePath = path.join(skillPath, rel);
            const packageKey = `${skillName}/${rel}`;
            const targetRel = slash(path.relative(this.cwd, absFilePath));

            const inBaseline = baseline.has(packageKey);
            const inManifest = detection.manifest && Array.isArray(detection.manifest.files) && detection.manifest.files.includes(targetRel);

            if (!inBaseline && !inManifest) {
              // Unowned custom file inside official skill directory! PRESERVE IT!
              preserved.push(targetRel);
              continue;
            }

            const curBuf = fs.readFileSync(absFilePath);
            const isOfficial = isKnownOfficialBaseline(packageKey, curBuf, baseline);
            if (!isOfficial) {
              if (!consentedPathSet.has(targetRel)) {
                // DEC-26: Preserved without valid consent contract
                preserved.push(targetRel);
                continue;
              }
            }

            // Backup file before removal
            const absBackup = path.join(backupDir, ...targetRel.split('/'));
            fs.mkdirSync(path.dirname(absBackup), { recursive: true });
            fs.copyFileSync(absFilePath, absBackup);
            rollbackJournal.removedFiles.push({ path: targetRel });
            fs.writeFileSync(journalPath, JSON.stringify(rollbackJournal, null, 2) + '\n');

            fs.unlinkSync(absFilePath);
            removed.push(targetRel);
          }

          // Clean directory only if completely empty
          try {
            fs.rmdirSync(skillPath);
          } catch {
            // Directory not empty because user custom/modified files are preserved
          }
        }
      }

      // Remove rules if owned
      if (this.runtime === 'antigravity' && this.scope === 'workspace') {
        const rulePath = path.join(this.cwd, '.agents', 'rules', 'xyeena-core.md');
        if (fs.existsSync(rulePath)) {
          const ruleBuf = fs.readFileSync(rulePath);
          const baselineRule = baseline.get('.rules/xyeena-core.md');
          const isOfficialRule = baselineRule && baselineRule.sha256 === hashBuffer(ruleBuf);
          const ruleRel = slash(path.relative(this.cwd, rulePath));

          let shouldRemoveRule = false;
          if (!isOfficialRule) {
            if (!consentedPathSet.has(ruleRel)) {
              preserved.push(ruleRel);
            } else {
              shouldRemoveRule = true;
            }
          } else {
            shouldRemoveRule = true;
          }

          if (shouldRemoveRule) {
            const absBackupRule = path.join(backupDir, ...ruleRel.split('/'));
            fs.mkdirSync(path.dirname(absBackupRule), { recursive: true });
            fs.copyFileSync(rulePath, absBackupRule);
            rollbackJournal.removedFiles.push({ path: ruleRel });
            fs.writeFileSync(journalPath, JSON.stringify(rollbackJournal, null, 2) + '\n');

            fs.rmSync(rulePath, { force: true });
            removed.push(ruleRel);
          }
        }
      }

      // Remove manifest (already backed up in backupDir)
      if (fs.existsSync(this.manifestPath)) {
        fs.rmSync(this.manifestPath, { force: true });
      }

      // Finalize rollback journal
      fs.writeFileSync(journalPath, JSON.stringify(rollbackJournal, null, 2) + '\n');

      return {
        success: true,
        brand: BRAND_METADATA.brand,
        engine: BRAND_METADATA.engine,
        backupId,
        removed: [...new Set(removed)].sort(),
        preserved: [...new Set(preserved)].sort()
      };
    } catch (txErr) {
      // Automatic rollback on uninstall failure: restore all unlinked files from backupDir
      if (backupId) {
        try {
          this.rollback(backupId);
          txErr.rolledBack = true;
        } catch (rbErr) {
          txErr.message += ` (Rollback partially failed: ${rbErr.message})`;
        }
      }
      throw txErr;
    } finally {
      this.releaseLock();
    }
  }
}
