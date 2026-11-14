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

  // If path or any ancestor exists as symlink/junction, verify realpath does not escape root
  if (fs.existsSync(resolvedTarget)) {
    try {
      const realTarget = fs.realpathSync(resolvedTarget);
      const realRoot = fs.existsSync(resolvedRoot) ? fs.realpathSync(resolvedRoot) : resolvedRoot;
      const realRel = path.relative(realRoot, realTarget);
      if (realRel.startsWith('..') || path.isAbsolute(realRel)) {
        throw new Error(`Security error: symlink/junction realpath escapes destination root: ${targetPath}`);
      }
    } catch (e) {
      if (e.message.includes('escapes destination root')) throw e;
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
    fs.mkdirSync(path.dirname(this.lockPath), { recursive: true });
    if (fs.existsSync(this.lockPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.lockPath, 'utf8'));
        const ageMs = Date.now() - (existing.timestamp || 0);
        if (ageMs < 5 * 60 * 1000) {
          throw new Error(`Installer lock is actively held by PID ${existing.pid} (${Math.round(ageMs / 1000)}s old)`);
        }
      } catch (err) {
        if (err.message.includes('actively held')) throw err;
      }
    }

    const lockData = {
      pid: process.pid,
      timestamp: Date.now(),
      runtime: this.runtime,
      scope: this.scope,
      cwd: this.cwd
    };
    fs.writeFileSync(this.lockPath, JSON.stringify(lockData, null, 2) + '\n');
    this.lockHeld = true;
  }

  /**
   * Release installer lock.
   */
  releaseLock() {
    if (fs.existsSync(this.lockPath)) {
      try {
        fs.unlinkSync(this.lockPath);
      } catch { /* ignore */ }
    }
    this.lockHeld = false;
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
              // Check if directory contains custom user files or modifications
              const existingSkillFiles = listFilesRecursive(skillDst);
              const hasCustom = existingSkillFiles.some(f => !baseline.has(`${skillName}/${f}`));
              if (hasCustom && !options.force) {
                throw new Error(`Cannot replace directory "${skillName}" containing custom user files with symlink without force`);
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

    // 2. Restore all replaced files from backup
    if (Array.isArray(journal.replacedFiles)) {
      for (const item of journal.replacedFiles) {
        const backupSource = path.join(backupDir, ...item.path.split('/'));
        const targetDest = path.join(this.cwd, ...item.path.split('/'));
        if (fs.existsSync(backupSource)) {
          fs.mkdirSync(path.dirname(targetDest), { recursive: true });
          fs.copyFileSync(backupSource, targetDest);
          restored.push(item.path);
        }
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
   * Safe uninstall: backs up first, and only removes verified owned files (DEC-26).
   * @returns {{ success: boolean, removed: string[], preserved: string[], backupId: string }}
   */
  uninstall(options = {}) {
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

    // Create backup before uninstall
    const backupId = `${new Date().toISOString().replace(/[:.]/g, '-')}-uninstall-${crypto.randomBytes(4).toString('hex')}`;
    const backupDir = path.join(this.backupDirBase, backupId);
    fs.mkdirSync(backupDir, { recursive: true });

    const removed = [];
    const preserved = ownership.unowned.slice();

    // Remove only verified owned, unmodified skill files
    for (const skillName of ownership.owned) {
      const skillPath = path.join(this.targetDir, skillName);
      if (fs.existsSync(skillPath)) {
        // Backup skill files first
        const absDst = path.join(backupDir, skillName);
        fs.cpSync(skillPath, absDst, { recursive: true });

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
          if (!isOfficial && options.force !== true) {
            // User modified this official file! PRESERVE IT unless forced!
            preserved.push(targetRel);
            continue;
          }

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
        fs.copyFileSync(rulePath, path.join(backupDir, 'xyeena-core.md'));
        const ruleBuf = fs.readFileSync(rulePath);
        const baselineRule = baseline.get('.rules/xyeena-core.md');
        const isOfficialRule = baselineRule && baselineRule.sha256 === hashBuffer(ruleBuf);
        if (!isOfficialRule && options.force !== true) {
          preserved.push(slash(path.relative(this.cwd, rulePath)));
        } else {
          fs.rmSync(rulePath, { force: true });
          removed.push(slash(path.relative(this.cwd, rulePath)));
        }
      }
    }

    // Remove manifest
    if (fs.existsSync(this.manifestPath)) {
      fs.copyFileSync(this.manifestPath, path.join(backupDir, 'install.json'));
      fs.rmSync(this.manifestPath, { force: true });
    }

    return {
      success: true,
      brand: BRAND_METADATA.brand,
      engine: BRAND_METADATA.engine,
      backupId,
      removed: [...new Set(removed)].sort(),
      preserved: [...new Set(preserved)].sort()
    };
  }
}
