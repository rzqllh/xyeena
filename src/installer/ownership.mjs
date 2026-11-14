/**
 * Xyeena Installer - Ownership & Asset Classification (P10 / DEC-26)
 * Distinguishes Xyeena-owned artifacts from third-party skills,
 * user personas, memory files, custom user skills, and arbitrary project assets.
 * Guarantees zero unintentional modification or deletion of unowned files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SKILLS_DIR } from '../paths.mjs';

export const BRAND_METADATA = Object.freeze({
  brand: 'xyeena',
  product: 'Xyeena Rig',
  engine: 'Cortex',
  tagline: 'Intelligence, with discipline.',
  cliCompat: ['xyeena', 'xyeena-agent'],
  legacyBrand: 'xyeena'
});

/**
 * Standard known official skill names packaged in Xyeena Rig.
 */
export function getOfficialSkillNames() {
  if (fs.existsSync(SKILLS_DIR)) {
    return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')))
      .map(e => e.name);
  }
  return [
    'xyeena-architecture', 'xyeena-context', 'xyeena-core', 'xyeena-debug',
    'xyeena-execute', 'xyeena-grill', 'xyeena-handoff', 'xyeena-interface',
    'xyeena-orchestrate', 'xyeena-plan', 'xyeena-prototype', 'xyeena-release',
    'xyeena-research', 'xyeena-review', 'xyeena-security', 'xyeena-skillcraft',
    'xyeena-test', 'xyeena-verify', 'xyeena-writing'
  ];
}

const OWNED_PREFIXES = ['xyeena-'];
const OWNED_DIRS = ['.xyeena'];

/**
 * Checks whether a given path or relative entry name is owned by Xyeena.
 * Requires verification against explicit manifest or official skill catalog.
 * Arbitrary folders starting with "xyeena-" are NOT owned if unlisted.
 * @param {string} relPath - Relative path or entry name (e.g. 'xyeena-core', '.xyeena/install.json')
 * @param {object|null} [manifest] - Optional manifest containing explicit owned file list
 * @returns {boolean}
 */
export function isXyeenaOwned(relPath, manifest = null) {
  if (!relPath || typeof relPath !== 'string') return false;
  const normalized = relPath.replace(/\\/g, '/').replace(/^\.\//, '');

  // 1. Check against explicit manifest record if available
  if (manifest && Array.isArray(manifest.files)) {
    if (manifest.files.includes(normalized)) return true;
  }
  if (manifest && Array.isArray(manifest.skills)) {
    const baseSeg = normalized.split('/')[0];
    const skillSeg = normalized.split('/').length > 1 ? normalized.split('/')[1] : baseSeg;
    if (manifest.skills.includes(baseSeg) || manifest.skills.includes(skillSeg)) return true;
  }

  // 2. Check internal managed directories (.xyeena)
  for (const dir of OWNED_DIRS) {
    if (normalized === dir || normalized.startsWith(dir + '/')) return true;
  }

  // 3. If manifest is present, anything not listed above is NOT owned
  if (manifest) {
    return false;
  }

  // 4. If legacy (no manifest): strictly check against known official packaged skills
  const officialSkills = getOfficialSkillNames();
  const baseSeg = normalized.split('/')[0];
  if (officialSkills.includes(baseSeg)) {
    return true;
  }

  // Antigravity rules file
  if (normalized === '.agents/rules/xyeena-core.md' || normalized === 'rules/xyeena-core.md') {
    return true;
  }

  return false;
}

/**
 * Check if a file or directory is considered protected user data (never touched by installer).
 * @param {string} relPath
 * @returns {boolean}
 */
export function isProtectedUserData(relPath) {
  if (!relPath || typeof relPath !== 'string') return false;
  const normalized = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
  const lower = normalized.toLowerCase();

  // User memory, personas, environment files, git config, custom project files
  if (lower === 'memory.md' || lower.endsWith('/memory.md')) return true;
  if (lower.startsWith('.agents/personas/') || lower.includes('/personas/')) return true;
  if (lower.startsWith('.env') || lower.includes('/.env')) return true;
  if (lower === '.gitignore' || lower.endsWith('/.gitignore')) {
    // Note: backup .gitignore is internal, but project .gitignore is user data
    if (!lower.startsWith('.xyeena/backups/')) return true;
  }
  return false;
}

/**
 * Scan a target skills/runtime directory and classify entries into owned vs unowned.
 * @param {object} params
 * @param {string} params.targetDir - Path to target skills directory
 * @param {object|null} [params.manifest] - Active installation manifest if present
 * @returns {{ owned: string[], unowned: string[], collisions: string[] }}
 */
export function scanDirectoryOwnership({ targetDir, manifest = null }) {
  if (!fs.existsSync(targetDir)) {
    return { owned: [], unowned: [], collisions: [] };
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const owned = [];
  const unowned = [];

  for (const entry of entries) {
    const name = entry.name;
    const rel = name;

    if (isXyeenaOwned(rel, manifest)) {
      owned.push(name);
    } else {
      unowned.push(name);
    }
  }

  return {
    owned: owned.sort(),
    unowned: unowned.sort(),
    collisions: []
  };
}

/**
 * Recursively list all files under a directory, relative to that directory.
 * @param {string} dir
 * @param {string} [base='']
 * @returns {string[]}
 */
export function listFilesRecursive(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? path.join(base, entry.name) : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full, rel));
    } else {
      results.push(rel.replace(/\\/g, '/'));
    }
  }
  return results;
}
