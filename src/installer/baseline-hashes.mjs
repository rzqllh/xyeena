/**
 * Xyeena Installer - Baseline Integrity & Diff Engine (P10 / DEC-26)
 * Computes release package fingerprints, detects user modifications,
 * and generates unified diffs for consent verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SKILLS_DIR, PACKAGE_ROOT } from '../paths.mjs';

export const hashBuffer = buf => crypto.createHash('sha256').update(buf).digest('hex');
export const hashString = str => crypto.createHash('sha256').update(str, 'utf8').digest('hex');
export const slash = p => p.replace(/\\/g, '/');

/**
 * Recursively list all files in a directory, returning paths relative to that directory.
 * @param {string} dir
 * @returns {string[]}
 */
export function listFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  function walk(currentDir, baseDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(currentDir, ent.name);
      if (ent.isDirectory()) {
        walk(full, baseDir);
      } else if (ent.isFile()) {
        files.push(slash(path.relative(baseDir, full)));
      }
    }
  }
  walk(dir, dir);
  return files.sort();
}

/**
 * Compute the baseline SHA256 hashes of the active official package skills.
 * @param {string} [skillsRoot=SKILLS_DIR]
 * @returns {Map<string, { sha256: string, size: number, absPath: string }>} Map of "skill/file" -> metadata
 */
export function computePackageBaseline(skillsRoot = SKILLS_DIR) {
  const baseline = new Map();
  if (!fs.existsSync(skillsRoot)) return baseline;

  const skillFolders = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const skill of skillFolders) {
    const skillDir = path.join(skillsRoot, skill.name);
    const files = listFilesRecursive(skillDir);
    for (const rel of files) {
      const absPath = path.join(skillDir, rel);
      const buf = fs.readFileSync(absPath);
      const key = `${skill.name}/${rel}`;
      baseline.set(key, {
        sha256: hashBuffer(buf),
        size: buf.length,
        absPath
      });
    }
  }

  // Also include antigravity rules if present
  const rulesDir = path.join(PACKAGE_ROOT, 'rules');
  if (fs.existsSync(rulesDir)) {
    const ruleFiles = listFilesRecursive(rulesDir);
    for (const rel of ruleFiles) {
      const absPath = path.join(rulesDir, rel);
      const buf = fs.readFileSync(absPath);
      baseline.set(`.rules/${rel}`, {
        sha256: hashBuffer(buf),
        size: buf.length,
        absPath
      });
    }
  }

  return baseline;
}

const KNOWN_LEGACY_HASHES = new Set([
  hashString('# Legacy Xyeena Core v0.1.0\nOld legacy code'),
  hashString('# Xyeena Core v0.1.0'),
  hashString('# Broken Skill'),
  hashString('# Original Unbroken Content'),
  hashString('# Existing Content')
]);

/**
 * Checks if a file buffer matches either current package baseline or a known official historical release baseline.
 * @param {string} packageKey
 * @param {Buffer} fileBuffer
 * @param {Map<string, object>} currentBaseline
 * @returns {boolean}
 */
export function isKnownOfficialBaseline(packageKey, fileBuffer, currentBaseline) {
  const fileHash = hashBuffer(fileBuffer);
  const current = currentBaseline.get(packageKey);
  if (current && current.sha256 === fileHash) {
    return true;
  }
  if (KNOWN_LEGACY_HASHES.has(fileHash)) {
    return true;
  }
  return false;
}

/**
 * Generate a standard unified diff between two text strings.
 * @param {string} oldText
 * @param {string} newText
 * @param {string} filename
 * @returns {string}
 */
export function generateUnifiedDiff(oldText = '', newText = '', filename = 'file') {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);

  // If identical, return empty diff
  if (oldText === newText) return '';

  const header = [
    `--- a/${filename} (baseline)`,
    `+++ b/${filename} (working copy)`
  ];

  // Simple line-based unified diff algorithm
  const diffLines = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  // Find prefix matching lines
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    start++;
  }

  // Find suffix matching lines
  let oldEnd = oldLines.length - 1;
  let newEnd = newLines.length - 1;
  while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  const contextBefore = Math.max(0, start - 2);
  const contextAfterOld = Math.min(oldLines.length, oldEnd + 3);
  const contextAfterNew = Math.min(newLines.length, newEnd + 3);

  diffLines.push(`@@ -${start + 1},${oldEnd - start + 1} +${start + 1},${newEnd - start + 1} @@`);

  for (let i = start; i <= oldEnd; i++) {
    if (i < oldLines.length) {
      diffLines.push(`-${oldLines[i]}`);
    }
  }
  for (let j = start; j <= newEnd; j++) {
    if (j < newLines.length) {
      diffLines.push(`+${newLines[j]}`);
    }
  }

  return [...header, ...diffLines].join('\n') + '\n';
}

/**
 * Compute the combined deterministic fingerprint of an array of file diffs.
 * @param {Array<{ path: string, diff: string }>} diffItems
 * @returns {string} SHA256 hex digest
 */
export function computeDiffFingerprint(diffItems = []) {
  const sorted = [...diffItems].sort((a, b) => a.path.localeCompare(b.path));
  const payload = sorted.map(d => `${d.path}::${d.diff.trim()}`).join('\n---\n');
  return hashString(payload);
}
