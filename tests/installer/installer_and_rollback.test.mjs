import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { installVeyra, verifyInstallation, rollbackInstallation, uninstallVeyra, auditLicenses } from '../../bin/veyra.mjs';

const TEMP_TARGET = join(process.cwd(), 'scratch_test_target_' + Date.now());

describe('Veyra v1.0 — Installer, Verification & Rollback (DEC-18, DEC-19, DEC-20)', () => {
  test('1. Clean Installation: installs skills and writes cryptographic ledger', () => {
    if (existsSync(TEMP_TARGET)) rmSync(TEMP_TARGET, { recursive: true, force: true });
    mkdirSync(TEMP_TARGET, { recursive: true });

    const installResult = installVeyra({
      targetDir: TEMP_TARGET,
      selectedSkills: ['veyra-core', 'veyra-interface', 'veyra-security']
    });

    assert.equal(installResult.success, true);
    assert.equal(installResult.installedSkills.length, 3);
    assert.ok(installResult.installedCount > 0);
    assert.ok(existsSync(join(TEMP_TARGET, '.veyra-manifest.json')));
    assert.ok(existsSync(join(TEMP_TARGET, 'skills', 'veyra-core', 'SKILL.md')));
    assert.ok(existsSync(join(TEMP_TARGET, '.agents', 'skills', 'veyra-interface', 'SKILL.md')));
  });

  test('2. Verification: validates intact files against cryptographic hashes', () => {
    const verifyResult = verifyInstallation(TEMP_TARGET);
    assert.equal(verifyResult.valid, true);
    assert.equal(verifyResult.missing.length, 0);
    assert.equal(verifyResult.modified.length, 0);
    assert.ok(verifyResult.intact.length > 0);
  });

  test('3. Tamper Detection: catches modified files', () => {
    const targetFile = join(TEMP_TARGET, 'skills', 'veyra-core', 'SKILL.md');
    writeFileSync(targetFile, 'Tampered content', 'utf8');

    const verifyResult = verifyInstallation(TEMP_TARGET);
    assert.equal(verifyResult.valid, false);
    assert.equal(verifyResult.modified.length, 1);
    assert.equal(verifyResult.modified[0].path, 'skills/veyra-core/SKILL.md');
  });

  test('4. Safe Uninstall & Destructive Edge Cases: preserves user files & modified Veyra files', () => {
    // 1. Root user file
    const userFile = join(TEMP_TARGET, 'custom-user-script.js');
    writeFileSync(userFile, 'console.log("Important user logic");', 'utf8');

    // 2. Extra user file inside an installed skill directory
    const userSkillNote = join(TEMP_TARGET, 'skills', 'veyra-interface', 'custom-notes.md');
    writeFileSync(userSkillNote, '# User custom notes inside skill dir', 'utf8');

    // 3. User-modified Veyra file (from Test 3, skills/veyra-core/SKILL.md was modified)
    const modifiedCoreFile = join(TEMP_TARGET, 'skills', 'veyra-core', 'SKILL.md');

    // 4. File outside target that an adversarial manifest might try to delete
    const outsideTarget = join(TEMP_TARGET, '..', 'scratch_outside_victim_' + Date.now() + '.txt');
    writeFileSync(outsideTarget, 'CRITICAL HOST DATA', 'utf8');

    // Inject path traversal into manifest to test defense
    const manifestPath = join(TEMP_TARGET, '.veyra-manifest.json');
    const manifestData = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifestData.files.push({
      path: '../../' + outsideTarget.split(/[\\/]/).pop(),
      sha256: 'deadbeef'
    });
    writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');

    // Run uninstall
    const blocked = uninstallVeyra(TEMP_TARGET);
    assert.equal(blocked.success, false, 'Malformed manifest must fail closed before changing any files');
    const safeManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    safeManifest.files = safeManifest.files.filter(x => !x.path.includes('..'));
    writeFileSync(manifestPath, JSON.stringify(safeManifest, null, 2), 'utf8');
    const uninstallResult = uninstallVeyra(TEMP_TARGET);
    assert.equal(uninstallResult.success, true);
    assert.ok(uninstallResult.deletedFiles > 0);

    // Assertions for preservation:
    // a. Root user file MUST be preserved
    assert.ok(existsSync(userFile), 'User-created files must never be removed on uninstall');
    // b. User file inside skill directory MUST be preserved
    assert.ok(existsSync(userSkillNote), 'User files inside skill directories must never be removed');
    // c. Skill directory containing user file must NOT be removed
    assert.ok(existsSync(join(TEMP_TARGET, 'skills', 'veyra-interface')), 'Skill directory containing user files must be preserved');
    // d. User-modified Veyra file MUST be preserved
    assert.ok(existsSync(modifiedCoreFile), 'User-modified Veyra files must never be deleted on uninstall');
    assert.equal(readFileSync(modifiedCoreFile, 'utf8'), 'Tampered content');
    // e. Adversarial path traversal target MUST NOT be touched
    assert.ok(existsSync(outsideTarget), 'Adversarial path traversal in manifest must be blocked');

    // Clean up outside victim
    if (existsSync(outsideTarget)) rmSync(outsideTarget, { force: true });
    // Clean up temp
    rmSync(TEMP_TARGET, { recursive: true, force: true });
  });

  test('5. License inventory must not claim legal compliance without provenance', () => {
    const licenseAudit = auditLicenses();
    assert.equal(licenseAudit.compliant, null);
    assert.equal(licenseAudit.auditedCount, 0);
    assert.equal(licenseAudit.status, 'DECLARATIONS_ONLY_LEGAL_REVIEW_REQUIRED');
    assert.ok(licenseAudit.registry.length >= 21);
    for (const item of licenseAudit.registry) {
      assert.equal(item.verified, false);
    }
  });

  test('6. Pre-existing Collision & Explicit Restoration: blocks implicit overwrite and restores approved collision', () => {
    const COLLISION_TARGET = join(process.cwd(), 'scratch_collision_target_' + Date.now());
    mkdirSync(join(COLLISION_TARGET, 'skills', 'veyra-core'), { recursive: true });

    // User already had this file before Veyra was installed
    const userOriginalFile = join(COLLISION_TARGET, 'skills', 'veyra-core', 'SKILL.md');
    const originalContent = '--- ORIGINAL USER CUSTOM DOCUMENTATION ---';
    writeFileSync(userOriginalFile, originalContent, 'utf8');

    // Default must not overwrite an existing user file or create a manifest.
    assert.throws(() => installVeyra({ targetDir: COLLISION_TARGET, selectedSkills: ['veyra-core'] }), /INSTALL_COLLISION_REQUIRES_EXPLICIT_APPROVAL/);
    assert.equal(readFileSync(userOriginalFile, 'utf8'), originalContent);
    assert.equal(existsSync(join(COLLISION_TARGET, '.veyra-manifest.json')), false);
    // Simulate the user's explicit approval of a scoped replacement.
    const installResult = installVeyra({
      targetDir: COLLISION_TARGET,
      selectedSkills: ['veyra-core'],
      allowOverwrite: true
    });
    assert.equal(installResult.success, true);

    // Manifest should record preExisting: true and backup
    const manifestPath = join(COLLISION_TARGET, '.veyra-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const preExistingEntry = manifest.files.find(f => f.path === 'skills/veyra-core/SKILL.md');
    assert.ok(preExistingEntry);
    assert.equal(preExistingEntry.preExisting, true);
    assert.ok(preExistingEntry.backupPath);
    assert.ok(existsSync(join(COLLISION_TARGET, preExistingEntry.backupPath)));

    // Uninstall Veyra
    const uninstallResult = uninstallVeyra(COLLISION_TARGET);
    assert.equal(uninstallResult.success, true);

    // Original user content MUST be restored byte-for-byte
    assert.ok(existsSync(userOriginalFile));
    assert.equal(readFileSync(userOriginalFile, 'utf8'), originalContent);

    // Clean up
    rmSync(COLLISION_TARGET, { recursive: true, force: true });
  });

  test('8. Collision updates after installation remain untouched; backup retained for manual resolution', () => {
    const root = join(process.cwd(), 'scratch_collision_modified_' + Date.now());
    const path = join(root, 'skills', 'veyra-core', 'SKILL.md');
    mkdirSync(join(root, 'skills', 'veyra-core'), { recursive: true });
    writeFileSync(path, 'MY_ORIGINAL', 'utf8');
    installVeyra({ targetDir: root, selectedSkills: ['veyra-core'], allowOverwrite: true });
    writeFileSync(path, 'MY_NEWER_WORK', 'utf8');
    const result = uninstallVeyra(root);
    assert.equal(result.success, false);
    assert.equal(result.needsManualResolution, true);
    assert.equal(readFileSync(path, 'utf8'), 'MY_NEWER_WORK');
    assert.ok(existsSync(join(root, '.veyra-manifest.json')));
    assert.ok(result.preservedUserFiles.some(x => x.reason === 'EDITED_AFTER_INSTALL'));
    const original = join(root, '.veyra-backup');
    assert.ok(existsSync(original));
    rmSync(root, { recursive: true, force: true });
  });

  test('7. Adversarial Manifest Paths: blocks traversal, null bytes, and URL encodings', () => {
    const ADV_TARGET = join(process.cwd(), 'scratch_adv_target_' + Date.now());
    mkdirSync(ADV_TARGET, { recursive: true });

    installVeyra({ targetDir: ADV_TARGET, selectedSkills: ['veyra-core'] });
    const manifestPath = join(ADV_TARGET, '.veyra-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    // Inject malicious targets into manifest
    manifest.files.push(
      { path: '../evil.txt', sha256: 'dead' },
      { path: 'skills/%2e%2e/evil2.txt', sha256: 'beef' },
      { path: 'skills/test\0file.txt', sha256: 'cafe' }
    );
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const verifyResult = verifyInstallation(ADV_TARGET);
    assert.ok(verifyResult);

    const uninstallResult = uninstallVeyra(ADV_TARGET);
    assert.equal(uninstallResult.success, false, 'Adversarial manifest must fail closed');
    assert.ok(existsSync(join(ADV_TARGET, 'skills', 'veyra-core', 'SKILL.md')));

    rmSync(ADV_TARGET, { recursive: true, force: true });
  });
  test('9. Forged manifest cannot claim and remove a user file inside a skill directory', () => {
    const root = join(process.cwd(), 'scratch_manifest_ownership_' + Date.now());
    installVeyra({ targetDir: root, selectedSkills: ['veyra-core'] });
    const victim = join(root, 'skills', 'veyra-core', 'my-user-work.txt');
    writeFileSync(victim, 'OWNER_DATA', 'utf8');
    const manifestFile = join(root, '.veyra-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    manifest.files.push({
      path: 'skills/veyra-core/my-user-work.txt',
      sha256: createHash('sha256').update('OWNER_DATA').digest('hex'),
      preExisting: false
    });
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    const result = uninstallVeyra(root);
    assert.equal(result.success, false);
    assert.equal(result.error, 'UNTRUSTED_MANIFEST_OWNERSHIP');
    assert.equal(readFileSync(victim, 'utf8'), 'OWNER_DATA');
    rmSync(root, { recursive: true, force: true });
  });

  test('10. Missing Veyra replacement restores original pre-existing user file', () => {
    const root = join(process.cwd(), 'scratch_missing_replacement_' + Date.now());
    const originalFile = join(root, 'skills', 'veyra-core', 'SKILL.md');
    mkdirSync(join(root, 'skills', 'veyra-core'), { recursive: true });
    writeFileSync(originalFile, 'ORIGINAL_USER_CONTENT', 'utf8');
    installVeyra({ targetDir: root, selectedSkills: ['veyra-core'], allowOverwrite: true });
    rmSync(originalFile, { force: true });
    const result = uninstallVeyra(root);
    assert.equal(result.success, true);
    assert.equal(readFileSync(originalFile, 'utf8'), 'ORIGINAL_USER_CONTENT');
    rmSync(root, { recursive: true, force: true });
  });

});
