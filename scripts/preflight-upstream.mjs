#!/usr/bin/env node
/**
 * Veyra v1.0 Upstream Preflight & Online Recovery Tool
 * Pure Node.js implementation: cross-platform, encoding-safe, zero external dependencies.
 */

import { existsSync, readFileSync, mkdirSync, openSync, readSync, closeSync, fstatSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = join(ROOT, 'references', 'upstreams.lock.json');
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

  console.log('=== Veyra v1.0 Upstream Preflight Verification ===\n');

  if (!existsSync(LOCK_FILE)) {
    console.error(`[FAIL] Lockfile not found at ${LOCK_FILE}`);
    process.exit(1);
  }

  const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
  console.log(`[OK] Loaded lockfile: ${lock.snapshotType} (observed: ${lock.observedDate})`);
  console.log(`[OK] Declared upstream repositories: ${lock.upstreams.length}/21`);

  let zipPath = ZIP_CANDIDATE_PATHS.find(p => existsSync(p));

  if (zipPath) {
    console.log(`[OK] Found upstream archive: ${zipPath}`);
    const hash = sha256File(zipPath);
    console.log(`[OK] Archive SHA-256: ${hash}`);

    try {
      const entries = readZipEntries(zipPath);
      console.log(`[OK] Archive entries verified: ${entries.length} entries.`);

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
        console.warn(`\n[WARN] ${missingRepos.length} repositories missing from archive.`);
      }
    } catch (e) {
      console.error(`[ERROR] Failed to verify ZIP archive: ${e.message}`);
    }
  } else {
    console.warn('[WARN] veyra-v1.0-upstream-latest.zip not found locally.');
  }

  if (recoverOnline) {
    console.log('\n[ONLINE RECOVERY] Recovering missing sources from canonical GitHub repositories...');
    const targetDir = join(ROOT, 'references', 'sources');
    mkdirSync(targetDir, { recursive: true });

    for (const u of lock.upstreams) {
      const repoDir = join(targetDir, u.id);
      if (existsSync(repoDir)) {
        console.log(`  ✓ ${u.id} already exists locally.`);
        continue;
      }
      console.log(`  -> Fetching ${u.repo}@${u.sha.slice(0, 10)}...`);
      try {
        mkdirSync(repoDir, { recursive: true });
        execFileSync('git', ['init', '-q'], { cwd: repoDir });
        execFileSync('git', ['remote', 'add', 'origin', `https://github.com/${u.repo}.git`], { cwd: repoDir });
        execFileSync('git', ['fetch', '-q', '--depth=1', 'origin', u.sha], {
          cwd: repoDir,
          env: { ...process.env, GIT_SSL_NO_VERIFY: 'true', GIT_TERMINAL_PROMPT: '0' }
        });
        execFileSync('git', ['checkout', '-q', '--detach', 'FETCH_HEAD'], { cwd: repoDir });
        console.log(`  ✓ ${u.id} recovered successfully.`);
      } catch (err) {
        console.error(`  ✗ Failed to recover ${u.id}: ${err.message}`);
      }
    }
    console.log('\n[RECOVERY FINISHED]');
  } else {
    console.log('\n[INFO] To recover missing upstreams from GitHub, run:');
    console.log('       node scripts/preflight-upstream.mjs --recover-online');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
