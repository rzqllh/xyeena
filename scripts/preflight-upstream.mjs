#!/usr/bin/env node
/**
 * Veyra v1.0 Upstream Preflight & Online Recovery Tool
 * Pure Node.js implementation: cross-platform, encoding-safe, zero external dependencies.
 * Implements strict verification without false-positive shortcut PASS.
 */

import { existsSync, readFileSync, mkdirSync, openSync, readSync, closeSync, fstatSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = join(ROOT, 'references', 'upstreams.lock.json');
const MANIFEST_FILE = join(ROOT, 'references', 'manifest.json');
const CANONICAL_ARCHIVE_SHA256 = 'b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f';
const ZIP_CANDIDATE_PATHS = [
  join(ROOT, 'veyra-v1.0-upstream-latest.zip'),
  join(ROOT, '..', 'dist', 'veyra-v1.0-upstream-latest.zip'),
  join(ROOT, '..', 'veyra-v1.0-upstream-latest.zip'),
  join(ROOT, 'references', 'veyra-v1.0-upstream-latest.zip'),
  join(process.env.USERPROFILE || '', 'Downloads', 'veyra-v1.0-upstream-latest.zip')
];

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

/** Pure Node.js central directory reader for ZIP32 archives */
function readZipEntries(zipPath) {
  const fd = openSync(zipPath, 'r');
  const stat = fstatSync(fd);
  const eocd = Buffer.alloc(22);
  readSync(fd, eocd, 0, 22, stat.size - 22);

  if (eocd.readUInt32LE(0) !== 0x06054b50) {
    closeSync(fd);
    throw new Error('Invalid ZIP: EOCD signature not found');
  }

  const totalEntries = eocd.readUInt16LE(10);
  const cdOffset = eocd.readUInt32LE(16);

  let offset = cdOffset;
  const entries = [];
  const header = Buffer.alloc(46);

  for (let i = 0; i < totalEntries; i++) {
    readSync(fd, header, 0, 46, offset);
    if (header.readUInt32LE(0) !== 0x02014b50) {
      closeSync(fd);
      throw new Error(`Corrupted central directory entry at index ${i}`);
    }
    const nameLen = header.readUInt16LE(28);
    const extraLen = header.readUInt16LE(30);
    const commentLen = header.readUInt16LE(32);
    const nameBuf = Buffer.alloc(nameLen);
    readSync(fd, nameBuf, 0, nameLen, offset + 46);
    entries.push(nameBuf.toString('utf8'));
    offset += 46 + nameLen + extraLen + commentLen;
  }

  closeSync(fd);
  return entries;
}

async function main() {
  const args = process.argv.slice(2);
  const recoverOnline = args.includes('--recover-online');
  const metadataOnly = args.includes('--metadata-only');

  console.log('=== Veyra v1.0 Upstream Preflight Verification ===\n');

  if (!existsSync(LOCK_FILE)) {
    console.error(`[FAIL] Lockfile not found at ${LOCK_FILE}`);
    process.exit(1);
  }

  const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
  console.log(`[OK] Loaded lockfile: ${lock.snapshotType} (observed: ${lock.observedDate})`);
  console.log(`[OK] Declared upstream repositories: ${lock.upstreams.length}/21`);
  if (metadataOnly) {
    const repos = Array.isArray(lock.upstreams) ? lock.upstreams : [];
    const ids = new Set(repos.map(u => u.id));
    if (repos.length !== 21 || ids.size !== 21 || !repos.every(u =>
      typeof u.id === 'string' && /^[a-z0-9-]+$/.test(u.id) &&
      typeof u.repo === 'string' && /^[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+$/.test(u.repo) &&
      typeof u.sha === 'string' && /^[a-f0-9]{40}$/i.test(u.sha))) {
      console.error('[FAIL] Invalid frozen upstream lockfile metadata.');
      process.exit(1);
    }
    console.log('[PASS] Pinned lockfile metadata schema verified: 21 unique upstreams.');
    console.log('[UNVERIFIED] Physical upstream archive and pinned source contents NOT CHECKED in metadata-only mode.');
    return;
  }

  let zipPath = ZIP_CANDIDATE_PATHS.find(p => existsSync(p));

  // Mode 1: Local ZIP Archive Verification (no shortcuts - verify SHA-256 and central directory)
  if (zipPath) {
    console.log(`[OK] Found upstream archive candidate: ${zipPath}`);
    const hash = sha256File(zipPath);
    console.log(`[OK] Computed Archive SHA-256: ${hash}`);

    if (hash !== CANONICAL_ARCHIVE_SHA256) {
      console.error(`[FAIL] Archive checksum mismatch!\n  Expected: ${CANONICAL_ARCHIVE_SHA256}\n  Observed: ${hash}`);
      process.exit(1);
    }

    try {
      const entries = readZipEntries(zipPath);
      console.log(`[OK] Central directory verified: ${entries.length} entries.`);

      let missingRepos = [];
      for (const u of lock.upstreams) {
        const repoPrefix = `references/sources/${u.id}/`;
        const found = entries.some(e => e.startsWith(repoPrefix));
        if (found) {
          console.log(`  ✓ ${u.id.padEnd(26)} [PRESENT in archive] (pinned: ${u.sha.slice(0, 10)})`);
        } else {
          console.log(`  ✗ ${u.id.padEnd(26)} [MISSING from archive]`);
          missingRepos.push(u.id);
        }
      }

      if (missingRepos.length === 0) {
        console.log('\n[PASS] All 21/21 upstreams verified in archive. Upstream baseline is intact.');
        return;
      } else {
        console.error(`\n[FAIL] Corrupt archive: ${missingRepos.length} repositories missing.`);
        process.exit(1);
      }
    } catch (e) {
      console.error(`[FAIL] Corrupt ZIP archive: ${e.message}`);
      process.exit(1);
    }
  }

  // Mode 2: Unpacked Local Sources Verification (verify commit SHAs, no blind pass)
  const sourcesDir = join(ROOT, 'references', 'sources');
  if (existsSync(sourcesDir)) {
    let allVerified = true;
    let checkedCount = 0;
    for (const u of lock.upstreams) {
      const repoDir = join(sourcesDir, u.id);
      if (existsSync(repoDir)) {
        try {
          const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
          if (headSha.startsWith(u.sha.slice(0, 10))) {
            console.log(`  ✓ ${u.id.padEnd(26)} [VERIFIED pinned SHA: ${u.sha.slice(0, 10)}]`);
            checkedCount++;
          } else {
            console.warn(`  ✗ ${u.id.padEnd(26)} [SHA mismatch: expected ${u.sha.slice(0, 10)}, got ${headSha.slice(0, 10)}]`);
            allVerified = false;
          }
        } catch {
          allVerified = false;
        }
      } else {
        allVerified = false;
      }
    }
    if (allVerified && checkedCount === lock.upstreams.length) {
      console.log('\n[PASS] Local unpacked upstream sources verified against pinned SHAs.');
      return;
    }
  }

  // Mode 3: Online Recovery (with clean rollback of partial failures)
  if (recoverOnline) {
    console.log('\n[ONLINE RECOVERY] Fetching missing pinned sources over verified TLS...');
    const targetDir = join(ROOT, 'references', 'sources');
    mkdirSync(targetDir, { recursive: true });

    let recoveryFailed = false;
    for (const u of lock.upstreams) {
      const repoDir = join(targetDir, u.id);
      if (existsSync(repoDir)) {
        try {
          const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
          if (headSha.startsWith(u.sha.slice(0, 10))) {
            console.log(`  ✓ ${u.id} already verified locally.`);
            continue;
          }
        } catch {
          // Re-fetch if git corrupt
        }
      }
      console.log(`  -> Fetching ${u.repo}@${u.sha.slice(0, 10)}...`);
      try {
        mkdirSync(repoDir, { recursive: true });
        execFileSync('git', ['init', '-q'], { cwd: repoDir });
        execFileSync('git', ['remote', 'add', 'origin', `https://github.com/${u.repo}.git`], { cwd: repoDir });
        execFileSync('git', ['fetch', '-q', '--depth=1', 'origin', u.sha], {
          cwd: repoDir,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
        execFileSync('git', ['checkout', '-q', '--detach', 'FETCH_HEAD'], { cwd: repoDir });
        const fetchedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
        if (!fetchedSha.startsWith(u.sha.slice(0, 10))) {
          throw new Error(`Fetched SHA ${fetchedSha} does not match pinned SHA ${u.sha}`);
        }
        console.log(`  ✓ ${u.id} recovered and verified successfully.`);
      } catch (err) {
        console.error(`  ✗ Failed to recover ${u.id}: ${err.message}`);
        // Clean up partial directory to avoid corrupt state
        if (existsSync(repoDir)) rmSync(repoDir, { recursive: true, force: true });
        recoveryFailed = true;
        break;
      }
    }
    if (recoveryFailed) {
      console.error('\n[FAIL] Upstream recovery failed. Partial directories cleaned up.');
      process.exit(1);
    }
    console.log('\n[PASS] All 21 upstreams recovered and verified online.');
    return;
  }

  // Mode 4: Standalone / CI Environment without local archives
  // Transparently report UNVERIFIED for unpacked sources, without inventing a false PASS.
  if (existsSync(MANIFEST_FILE)) {
    const manifestStat = fstatSync(openSync(MANIFEST_FILE, 'r'));
    console.log(`[INFO] Upstream cryptographic ledger references/manifest.json is present (${(manifestStat.size / (1024 * 1024)).toFixed(1)} MB).`);
    console.log('[UNVERIFIED] Local upstream archive and unpacked sources are not present in this checkout.');
    console.log('[NOTE] Ledger file presence alone is NOT a source integrity verification. Recover and verify via:');
    console.log('       node scripts/preflight-upstream.mjs --recover-online\n');
    // No environment-variable shortcut: full preflight must fail without actual source material.
  }

  console.error('\n[FAIL] Upstream archive and local sources are missing.');
  console.error('[RECOVERY PATH] Run: node scripts/preflight-upstream.mjs --recover-online');
  process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
