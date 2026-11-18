/**
 * Xyeena Rig — Upstream Source Fetch & Verification Script (R7A)
 *
 * Implements R7A protocol:
 * - Acquires and verifies immutable source snapshots at pinned commit SHAs.
 * - Stores snapshots in references/sources/ (excluded from packaging and git).
 * - Verifies file presence and SHA-256 checksums without synthetic fallback.
 * - Records limitations when offline or unable to fetch.
 */

import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

export const DEFAULT_LOCKFILE = join(REPO_ROOT, 'references', 'upstreams.lock.json');
export const DEFAULT_SOURCES_DIR = join(REPO_ROOT, 'references', 'sources');

/**
 * Load and parse the upstreams lockfile.
 * @param {string} [lockPath=DEFAULT_LOCKFILE]
 * @returns {object}
 */
export function loadLockfile(lockPath = DEFAULT_LOCKFILE) {
  if (!existsSync(lockPath)) {
    throw new Error(`Upstream lockfile not found at ${lockPath}`);
  }
  const content = readFileSync(lockPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Validate schema and invariants of the lockfile.
 * @param {object} lockfile
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLockfile(lockfile) {
  const errors = [];
  if (!lockfile || typeof lockfile !== 'object') {
    return { valid: false, errors: ['Lockfile must be an object'] };
  }
  if (lockfile.version !== 1) {
    errors.push(`Unsupported lockfile version: ${lockfile.version}`);
  }
  if (!lockfile.upstreams || typeof lockfile.upstreams !== 'object') {
    errors.push('Lockfile missing upstreams dictionary');
    return { valid: false, errors };
  }

  for (const [id, entry] of Object.entries(lockfile.upstreams)) {
    if (!entry.canonicalUrl) errors.push(`${id}: missing canonicalUrl`);
    if (!entry.commitSha) errors.push(`${id}: missing commitSha`);
    if (!entry.license) errors.push(`${id}: missing license`);
    if (!Array.isArray(entry.relevantSourcePaths) || entry.relevantSourcePaths.length === 0) {
      errors.push(`${id}: relevantSourcePaths must be a non-empty array`);
    }
    if (!Array.isArray(entry.mappedSkills) || entry.mappedSkills.length === 0) {
      errors.push(`${id}: mappedSkills must be a non-empty array`);
    }
    const validStatuses = [
      'SOURCE_INSPECTED',
      'PROVENANCE_PENDING',
      'NOT_MEASURED',
      'FETCHED_AND_VERIFIED',
      'BLOCKED_OFFLINE'
    ];
    if (!validStatuses.includes(entry.verificationStatus)) {
      errors.push(`${id}: invalid verificationStatus "${entry.verificationStatus}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate SHA-256 checksum of a file.
 * @param {string} filePath
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function calculateFileChecksum(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Cannot compute checksum: file not found at ${filePath}`);
  }
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Verify a source snapshot directory against lockfile specifications.
 * @param {string} snapshotDir
 * @param {object} entry
 * @returns {{ verified: boolean, missingPaths: string[], checksumMismatches: string[], details: object }}
 */
export function verifySourceSnapshot(snapshotDir, entry) {
  if (!existsSync(snapshotDir)) {
    return {
      verified: false,
      missingPaths: ['SNAPSHOT_DIR_NOT_FOUND'],
      checksumMismatches: [],
      details: { status: 'NOT_ACQUIRED' }
    };
  }

  const missingPaths = [];
  const checksumMismatches = [];

  for (const relPath of entry.relevantSourcePaths) {
    const fullPath = join(snapshotDir, relPath);
    if (!existsSync(fullPath)) {
      missingPaths.push(relPath);
    }
  }

  // Check file checksums if declared
  if (entry.checksums && typeof entry.checksums === 'object') {
    for (const [relPath, expectedHash] of Object.entries(entry.checksums)) {
      const fullPath = join(snapshotDir, relPath);
      if (existsSync(fullPath)) {
        const actualHash = calculateFileChecksum(fullPath);
        if (actualHash !== expectedHash) {
          checksumMismatches.push(`${relPath} (expected ${expectedHash.slice(0, 8)}..., got ${actualHash.slice(0, 8)}...)`);
        }
      }
    }
  }

  const verified = missingPaths.length === 0 && checksumMismatches.length === 0;
  return {
    verified,
    missingPaths,
    checksumMismatches,
    details: {
      dir: snapshotDir,
      upstream: entry.id,
      commitSha: entry.commitSha
    }
  };
}

/**
 * Acquire/fetch upstream snapshot using git.
 * @param {object} entry
 * @param {string} targetDir
 * @param {object} [options={}]
 * @returns {{ success: boolean, error?: string, path?: string }}
 */
export function fetchUpstream(entry, targetDir, options = {}) {
  if (entry.commitSha === 'PROVENANCE_PENDING') {
    return {
      success: false,
      error: `Cannot fetch ${entry.id}: commitSha is unpinned (PROVENANCE_PENDING)`
    };
  }

  const dest = join(targetDir, `${entry.name}-${entry.commitSha.slice(0, 8)}`);

  if (existsSync(dest)) {
    return {
      success: true,
      path: dest,
      note: 'Snapshot directory already exists'
    };
  }

  if (options.verifyOnly) {
    return {
      success: false,
      error: 'Snapshot not present in verify-only mode',
      path: dest
    };
  }

  if (options.dryRun) {
    return {
      success: true,
      path: dest,
      note: 'Dry-run: would clone and checkout pinned SHA'
    };
  }

  mkdirSync(targetDir, { recursive: true });

  try {
    // Clone with detached HEAD at exact commit SHA
    execFileSync('git', ['clone', '--no-checkout', entry.canonicalUrl, dest], {
      stdio: 'pipe',
      timeout: 120000
    });
    execFileSync('git', ['checkout', entry.commitSha], {
      cwd: dest,
      stdio: 'pipe',
      timeout: 60000
    });
    return { success: true, path: dest };
  } catch (err) {
    return {
      success: false,
      error: `Fetch failed for ${entry.id} (${err.message.trim()})`
    };
  }
}

/**
 * Main CLI runner.
 */
export async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  const dryRun = args.includes('--dry-run');
  const targetUpstream = args.find(a => a.startsWith('--upstream='))?.split('=')[1];

  console.log(`[R7A] Upstream Source Library Manager`);
  console.log(`Lockfile: ${DEFAULT_LOCKFILE}`);
  console.log(`Sources root: ${DEFAULT_SOURCES_DIR}\n`);

  const lockfile = loadLockfile();
  const validation = validateLockfile(lockfile);
  if (!validation.valid) {
    console.error(`[ERROR] Lockfile validation failed:`);
    for (const err of validation.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(`Lockfile validated cleanly: ${Object.keys(lockfile.upstreams).length} upstreams declared.\n`);

  let checkedCount = 0;
  let verifiedCount = 0;
  let skippedCount = 0;

  for (const [id, entry] of Object.entries(lockfile.upstreams)) {
    if (targetUpstream && id !== targetUpstream && entry.name !== targetUpstream) {
      continue;
    }

    checkedCount++;
    const dest = join(DEFAULT_SOURCES_DIR, `${entry.name}-${entry.commitSha.slice(0, 8)}`);

    if (verifyOnly) {
      const res = verifySourceSnapshot(dest, entry);
      if (res.verified) {
        console.log(`[VERIFIED] ${id} (${entry.name}@${entry.commitSha.slice(0, 8)})`);
        verifiedCount++;
      } else {
        console.log(`[UNVERIFIED] ${id}: ${res.missingPaths.join(', ')}`);
      }
    } else {
      const fetchRes = fetchUpstream(entry, DEFAULT_SOURCES_DIR, { dryRun });
      if (fetchRes.success) {
        console.log(`[FETCH_OK] ${id} -> ${fetchRes.path} (${fetchRes.note || 'acquired'})`);
        verifiedCount++;
      } else {
        console.log(`[FETCH_SKIP] ${id}: ${fetchRes.error}`);
        skippedCount++;
      }
    }
  }

  console.log(`\nSummary: ${checkedCount} checked, ${verifiedCount} verified/acquired, ${skippedCount} skipped.`);
}

if (process.argv[1] && process.argv[1].endsWith('fetch-upstream-sources.mjs')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}
