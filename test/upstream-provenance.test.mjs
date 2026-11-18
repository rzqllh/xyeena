import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_LOCKFILE,
  loadLockfile,
  validateLockfile,
  calculateFileChecksum,
  verifySourceSnapshot,
  fetchUpstream
} from '../scripts/fetch-upstream-sources.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('R7A Upstream Provenance: Lockfile integrity & schema adherence', () => {
  assert.ok(fs.existsSync(DEFAULT_LOCKFILE), 'upstreams.lock.json must exist');

  const lockfile = loadLockfile(DEFAULT_LOCKFILE);
  const validation = validateLockfile(lockfile);

  assert.equal(validation.valid, true, `Lockfile must be valid: ${validation.errors.join(', ')}`);
  assert.equal(lockfile.version, 1);
  assert.equal(lockfile.governance.policy, 'R7A');
  assert.equal(lockfile.governance.codexIndependentReviewGate, 'G1');

  // Verify all 19 official skills are accounted for in the lockfile mapping
  const skillsDir = path.join(REPO_ROOT, 'skills');
  const officialSkills = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );
  assert.equal(officialSkills.length, 19, 'Must have exactly 19 official skills');

  const mappedSkillsSet = new Set();
  for (const entry of Object.values(lockfile.upstreams)) {
    for (const skill of entry.mappedSkills) {
      mappedSkillsSet.add(skill);
    }
  }

  for (const skill of officialSkills) {
    assert.ok(
      mappedSkillsSet.has(skill),
      `Official skill "${skill}" must have at least one mapped upstream in upstreams.lock.json`
    );
  }
});

test('R7A Upstream Provenance: Commit SHA format & unpinned provenance tracking', () => {
  const lockfile = loadLockfile(DEFAULT_LOCKFILE);

  for (const [id, entry] of Object.entries(lockfile.upstreams)) {
    assert.ok(entry.canonicalUrl.startsWith('https://github.com/'), `${id} must have canonical GitHub URL`);
    if (entry.verificationStatus === 'SOURCE_INSPECTED') {
      // Pinned commit SHA must be 40-character hex string unless tagged release reference
      assert.ok(
        /^[a-f0-9]{40}$/i.test(entry.commitSha) || entry.commitSha === 'PROVENANCE_PENDING',
        `${id} commitSha must be 40-char hex SHA or explicitly PROVENANCE_PENDING, got "${entry.commitSha}"`
      );
    }
    if (entry.commitSha === 'PROVENANCE_PENDING') {
      assert.equal(entry.verificationStatus, 'PROVENANCE_PENDING', `${id} with unpinned SHA must be marked PROVENANCE_PENDING`);
    }
  }
});

test('R7A Upstream Provenance: references/sources/ exclusion from Git and npm packaging', () => {
  // 1. Check .gitignore
  const gitignore = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8');
  assert.ok(
    gitignore.includes('references/sources/'),
    '.gitignore must explicitly ignore references/sources/'
  );

  // 2. Check package.json "files" whitelist
  const pkgJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.ok(Array.isArray(pkgJson.files), 'package.json must contain files whitelist');
  assert.ok(
    !pkgJson.files.includes('references') && !pkgJson.files.includes('references/'),
    'package.json must exclude references/ directory from publishing'
  );
  assert.ok(
    !pkgJson.files.some(f => f.startsWith('references/sources')),
    'package.json must strictly exclude references/sources/ from publishing'
  );
});

test('R7A Upstream Provenance: Fetch and verification script methods', () => {
  // Test validateLockfile with corrupt input
  const invalid = validateLockfile({ version: 2 });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(e => e.includes('version')));

  // Test calculateFileChecksum on package.json
  const pkgHash = calculateFileChecksum(path.join(REPO_ROOT, 'package.json'));
  assert.ok(/^[a-f0-9]{64}$/.test(pkgHash), 'Checksum must be 64-char hex SHA-256');

  // Test verifySourceSnapshot with temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-r7a-test-'));
  try {
    const testEntry = {
      id: 'TEST-01',
      name: 'test-upstream',
      commitSha: '0123456789abcdef0123456789abcdef01234567',
      relevantSourcePaths: ['skills/test/SKILL.md'],
      checksums: {}
    };

    // Missing paths verification
    const missingRes = verifySourceSnapshot(tempDir, testEntry);
    assert.equal(missingRes.verified, false);
    assert.ok(missingRes.missingPaths.includes('skills/test/SKILL.md'));

    // Create required path and verify success
    const skillPath = path.join(tempDir, 'skills', 'test');
    fs.mkdirSync(skillPath, { recursive: true });
    const skillFile = path.join(skillPath, 'SKILL.md');
    fs.writeFileSync(skillFile, '# Test Skill Content', 'utf8');

    const createdRes = verifySourceSnapshot(tempDir, testEntry);
    assert.equal(createdRes.verified, true);
    assert.equal(createdRes.missingPaths.length, 0);

    // Test checksum mismatch detection
    testEntry.checksums['skills/test/SKILL.md'] = '0000000000000000000000000000000000000000000000000000000000000000';
    const mismatchRes = verifySourceSnapshot(tempDir, testEntry);
    assert.equal(mismatchRes.verified, false);
    assert.equal(mismatchRes.checksumMismatches.length, 1);

    // Test fetchUpstream fails closed on PROVENANCE_PENDING
    const pendingEntry = { id: 'TEST-02', name: 'pending', commitSha: 'PROVENANCE_PENDING' };
    const pendingRes = fetchUpstream(pendingEntry, tempDir);
    assert.equal(pendingRes.success, false);
    assert.ok(pendingRes.error.includes('unpinned'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('R7A Upstream Provenance: docs/internal/PROVENANCE.md documentation completeness', () => {
  const provPath = path.join(REPO_ROOT, 'docs', 'internal', 'PROVENANCE.md');
  assert.ok(fs.existsSync(provPath), 'docs/internal/PROVENANCE.md must exist');

  const content = fs.readFileSync(provPath, 'utf8');
  assert.ok(content.includes('R7A — Reproducible Upstream Source Library'));
  assert.ok(content.includes('references/upstreams.lock.json'));
  assert.ok(content.includes('references/sources/'));
  assert.ok(content.includes('Codex independently verifies'));
  assert.ok(content.includes('Gate 1 (G1)'));
  assert.ok(content.includes('No Silent Vendoring'));

  // Ensure all 19 skills are mentioned in PROVENANCE.md
  const skillsDir = path.join(REPO_ROOT, 'skills');
  const officialSkills = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );

  for (const skill of officialSkills) {
    assert.ok(
      content.includes(skill),
      `docs/internal/PROVENANCE.md must document mapping for "${skill}"`
    );
  }
});
