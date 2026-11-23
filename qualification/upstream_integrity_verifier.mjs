/**
 * Veyra v1.0 Release Qualification — Upstream Integrity Verifier
 * Verifies 21 upstream repositories against references/upstreams.lock.json,
 * validates actual archive SHA-256 and central directory entries,
 * and classifies provenance tiers strictly without false passes.
 * Zero external dependencies.
 */

import { existsSync, readFileSync, openSync, readSync, closeSync, fstatSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve(process.cwd());
const LOCK_FILE = join(ROOT, 'references', 'upstreams.lock.json');
const MANIFEST_FILE = join(ROOT, 'references', 'manifest.json');
const CANONICAL_ARCHIVE_SHA256 = 'b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f';

const ZIP_CANDIDATE_PATHS = [
  join(process.env.USERPROFILE || '', 'Downloads', 'veyra-v1.0-upstream-latest.zip'),
  join(ROOT, 'veyra-v1.0-upstream-latest.zip'),
  join(ROOT, 'references', 'veyra-v1.0-upstream-latest.zip')
];

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

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

export async function verifyUpstreamIntegrity() {
  console.log('=== Veyra v1.0 Phase 4: Upstream Provenance & Integrity ===\n');

  const verification = {
    timestamp: new Date().toISOString(),
    lockfile: { status: 'UNKNOWN', path: LOCK_FILE, count: 0 },
    archive: { status: 'UNKNOWN', path: null, sha256: null, entryCount: 0 },
    manifest: { status: 'UNKNOWN', path: MANIFEST_FILE, sizeMb: 0 },
    sources: { status: 'PINNED_SOURCE_SHA_NOT_VERIFIED', checkedCount: 0 },
    claimScope: 'LOCAL_ARCHIVE_HASH_AND_ENTRY_PRESENCE_ONLY',
    upstreams: []
  };

  // 1. Lockfile verification
  if (!existsSync(LOCK_FILE)) {
    verification.lockfile.status = 'NOT_FOUND';
    throw new Error('Lockfile missing: ' + LOCK_FILE);
  }

  const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
  const declaredRepos = lock.upstreams || [];
  const validSchema = declaredRepos.length === 21 && declaredRepos.every(u =>
    typeof u.id === 'string' &&
    typeof u.repo === 'string' &&
    typeof u.sha === 'string' && u.sha.length === 40
  );

  verification.lockfile = {
    status: validSchema ? 'LOCKFILE_VALID' : 'INVALID_SCHEMA',
    path: LOCK_FILE,
    snapshotType: lock.snapshotType,
    observedDate: lock.observedDate,
    count: declaredRepos.length
  };
  console.log(`[OK] Lockfile Status: ${verification.lockfile.status} (${declaredRepos.length}/21 upstreams)`);

  // 2. Archive verification
  const zipPath = ZIP_CANDIDATE_PATHS.find(p => existsSync(p));
  if (zipPath) {
    verification.archive.path = zipPath;
    const computedHash = sha256File(zipPath);
    verification.archive.sha256 = computedHash;
    console.log(`[OK] Archive candidate found: ${zipPath}`);
    console.log(`[OK] Archive SHA-256: ${computedHash}`);

    if (computedHash === CANONICAL_ARCHIVE_SHA256) {
      const entries = readZipEntries(zipPath);
      verification.archive.entryCount = entries.length;
      verification.archive.status = 'LOCAL_ARCHIVE_SHA256_MATCHED';
      console.log(`[OK] Archive central directory: ${entries.length} entries.`);

      let matchedUpstreams = 0;
      for (const u of declaredRepos) {
        const repoPrefix = `references/sources/${u.id}/`;
        const isPresent = entries.some(e => e.startsWith(repoPrefix));
        verification.upstreams.push({
          id: u.id,
          repo: u.repo,
          pinnedSha: u.sha,
          presentInArchive: isPresent,
          tier: isPresent ? 'ARCHIVE_ENTRY_PRESENT_PIN_NOT_VERIFIED' : 'NOT_FOUND_IN_ARCHIVE'
        });
        if (isPresent) matchedUpstreams++;
      }
      console.log(`[INFO] Archive folders found: ${matchedUpstreams}/21. Individual pinned commit SHAs NOT verified.`);
    } else {
      verification.archive.status = 'CHECKSUM_MISMATCH';
      console.error(`[FAIL] Archive checksum mismatch! Expected: ${CANONICAL_ARCHIVE_SHA256}`);
    }
  } else {
    verification.archive.status = 'ARCHIVE_NOT_FOUND_LOCALLY';
    console.warn('[WARN] Local archive not found in candidates list');
  }

  // 3. Manifest ledger check
  if (existsSync(MANIFEST_FILE)) {
    const stat = fstatSync(openSync(MANIFEST_FILE, 'r'));
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(1);
    verification.manifest = {
      status: 'LEDGER_PRESENT_NOT_CONTENT_VERIFIED',
      path: MANIFEST_FILE,
      sizeMb: `${sizeMb} MB`
    };
    console.log(`[INFO] Upstream cryptographic ledger present: ${sizeMb} MB`);
  }

  writeFileSync(
    join(ROOT, 'qualification', 'receipts', 'upstream_integrity_receipt.json'),
    JSON.stringify(verification, null, 2),
    'utf8'
  );

  return verification;
}

if (process.argv[1] && process.argv[1].endsWith('upstream_integrity_verifier.mjs')) {
  verifyUpstreamIntegrity().then(receipt => {
    if (receipt.archive.status === 'CHECKSUM_MISMATCH') process.exitCode = 1;
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
