/**
 * Xyeena / Axioven Installer - Decision Flow Engine (P08)
 * Detects host, scope, version, ownership, and installation state
 * to decide whether to fresh install, replace legacy, update, no-op, or repair.
 */

import fs from 'node:fs';
import path from 'node:path';
import { VERSION } from '../paths.mjs';
import { RUNTIMES } from '../runtime.mjs';

export const INSTALL_STATES = Object.freeze({
  NOT_INSTALLED: 'NOT_INSTALLED',
  LEGACY_XYEENA: 'LEGACY_XYEENA',
  OLDER_VERSION: 'OLDER_VERSION',
  SAME_VERSION_VALID: 'SAME_VERSION_VALID',
  SAME_VERSION_BROKEN: 'SAME_VERSION_BROKEN',
  NEWER_VERSION: 'NEWER_VERSION',
  FOREIGN_OR_UNOWNED_FILES: 'FOREIGN_OR_UNOWNED_FILES',
  UNKNOWN_INSTALLATION: 'UNKNOWN_INSTALLATION',
  PARTIAL_INSTALL: 'PARTIAL_INSTALL'
});

/**
 * Compare two semver strings: -1 if a < b, 0 if a === b, 1 if a > b.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareSemver(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  const clean = v => v.replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
  const pa = clean(a);
  const pb = clean(b);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

/**
 * Detect the target skills directory for a given host and scope.
 * @param {string} cwd - Project workspace directory
 * @param {string} runtime - Host runtime ('antigravity', 'claude', 'codex', 'gemini', 'hermes')
 * @param {'workspace' | 'global'} [scope='workspace']
 * @param {string} [home] - User home directory (for global scope)
 * @returns {string} Target skills directory path
 */
export function resolveTargetDir(cwd, runtime, scope = 'workspace', home = process.env.HOME || process.env.USERPROFILE) {
  const descriptor = RUNTIMES[runtime] || RUNTIMES.antigravity;
  if (scope === 'workspace') {
    return path.join(cwd, descriptor.skillDir);
  }
  // Global scope destinations
  const homeDir = home || cwd;
  if (runtime === 'claude') return path.join(homeDir, '.claude', 'skills');
  if (runtime === 'hermes') return path.join(homeDir, '.hermes', 'skills');
  if (runtime === 'gemini') return path.join(homeDir, '.gemini', 'skills');
  // Antigravity & Codex share global .agents
  return path.join(homeDir, '.agents', 'skills');
}

/**
 * Read the installation manifest from project root if present.
 * @param {string} cwd
 * @returns {object|null} Manifest data or null
 */
export function readInstallManifest(cwd) {
  const manifestPath = path.join(cwd, '.xyeena', 'install.json');
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch {
    // corrupted or unreadable manifest
  }
  return null;
}

/**
 * Detect the concrete installation state for a target host and scope.
 * @param {object} params
 * @param {string} params.cwd - Project root
 * @param {string} params.runtime - Target host runtime
 * @param {'workspace'|'global'} [params.scope='workspace']
 * @param {string} [params.targetVersion=VERSION]
 * @param {string} [params.home]
 * @returns {{ state: string, manifest: object|null, details: object }}
 */
export function detectInstallationState({
  cwd,
  runtime,
  scope = 'workspace',
  targetVersion = VERSION,
  home
}) {
  const targetDir = resolveTargetDir(cwd, runtime, scope, home);
  const manifest = readInstallManifest(cwd);
  const lockFile = path.join(cwd, '.xyeena', 'installer.lock');

  // Check for interrupted/partial install lock
  if (fs.existsSync(lockFile)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      const ageMs = Date.now() - (lockData.timestamp || 0);
      // If lock is active within 5 minutes, consider partial or active
      if (ageMs < 5 * 60 * 1000) {
        return {
          state: INSTALL_STATES.PARTIAL_INSTALL,
          manifest,
          targetDir,
          details: { reason: 'Active or interrupted installer lock detected', lockData }
        };
      }
    } catch {
      // Corrupted lock file
      return {
        state: INSTALL_STATES.PARTIAL_INSTALL,
        manifest,
        targetDir,
        details: { reason: 'Corrupted installer lock file detected' }
      };
    }
  }

  // Check if target skills directory exists
  if (!fs.existsSync(targetDir)) {
    return {
      state: INSTALL_STATES.NOT_INSTALLED,
      manifest: null,
      targetDir,
      details: { reason: 'Target directory does not exist' }
    };
  }

  // List existing skill entries
  const skillEntries = fs.readdirSync(targetDir, { withFileTypes: true })
    .filter(e => e.isDirectory() || e.isSymbolicLink())
    .map(e => e.name);

  // Check for Xyeena / Axioven skills
  const xyeenaSkills = skillEntries.filter(name => name.startsWith('xyeena-') || name.startsWith('axioven-'));
  const foreignSkills = skillEntries.filter(name => !name.startsWith('xyeena-') && !name.startsWith('axioven-'));

  // 1. If NO Xyeena skills exist in target dir
  if (xyeenaSkills.length === 0) {
    if (foreignSkills.length > 0) {
      return {
        state: INSTALL_STATES.FOREIGN_OR_UNOWNED_FILES,
        manifest: null,
        targetDir,
        details: { foreignSkills, reason: 'Target directory contains third-party skills but no Xyeena files' }
      };
    }
    return {
      state: INSTALL_STATES.NOT_INSTALLED,
      manifest: null,
      targetDir,
      details: { reason: 'Target directory is empty of Xyeena skills' }
    };
  }

  // 2. If Xyeena skills exist, but no manifest exists -> LEGACY_XYEENA
  if (!manifest) {
    return {
      state: INSTALL_STATES.LEGACY_XYEENA,
      manifest: null,
      targetDir,
      details: {
        xyeenaSkills,
        foreignSkills,
        reason: 'Legacy Xyeena installation detected without unified .xyeena/install.json manifest'
      }
    };
  }

  // 3. Manifest exists: check version
  const installedVersion = manifest.version || '0.0.0';
  const vDiff = compareSemver(installedVersion, targetVersion);

  if (vDiff < 0) {
    // Installed is older than target package
    return {
      state: INSTALL_STATES.OLDER_VERSION,
      manifest,
      targetDir,
      details: { installedVersion, targetVersion, xyeenaSkills, foreignSkills }
    };
  }

  if (vDiff > 0) {
    // Installed is newer than target package (downgrade protection)
    return {
      state: INSTALL_STATES.NEWER_VERSION,
      manifest,
      targetDir,
      details: { installedVersion, targetVersion, reason: 'Silent downgrade refused' }
    };
  }

  // 4. Same version: check if broken or valid
  // Core skills must be present and contain valid SKILL.md
  let broken = false;
  for (const sk of xyeenaSkills) {
    const skillMd = path.join(targetDir, sk, 'SKILL.md');
    if (!fs.existsSync(skillMd) || fs.statSync(skillMd).size === 0) {
      broken = true;
      break;
    }
  }

  if (broken) {
    return {
      state: INSTALL_STATES.SAME_VERSION_BROKEN,
      manifest,
      targetDir,
      details: { installedVersion, reason: 'One or more installed skills are missing SKILL.md or corrupted' }
    };
  }

  return {
    state: INSTALL_STATES.SAME_VERSION_VALID,
    manifest,
    targetDir,
    details: { installedVersion, targetVersion, xyeenaSkills, foreignSkills }
  };
}
