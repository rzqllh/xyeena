import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

  test('4. Safe Uninstall: preserves user files while removing owned files', () => {
    const userFile = join(TEMP_TARGET, 'custom-user-script.js');
    writeFileSync(userFile, 'console.log("Important user logic");', 'utf8');

    const uninstallResult = uninstallVeyra(TEMP_TARGET);
    assert.equal(uninstallResult.success, true);
    assert.ok(uninstallResult.deletedFiles > 0);

    // User file MUST be preserved
    assert.ok(existsSync(userFile), 'User-created files must never be removed on uninstall');
    // Installed skill directory must be removed
    assert.equal(existsSync(join(TEMP_TARGET, 'skills', 'veyra-core')), false);

    // Clean up temp
    rmSync(TEMP_TARGET, { recursive: true, force: true });
  });

  test('5. License Compliance: audits 100% permissive licenses', () => {
    const licenseAudit = auditLicenses();
    assert.equal(licenseAudit.compliant, true);
    assert.ok(licenseAudit.registry.length >= 21);
    for (const item of licenseAudit.registry) {
      assert.equal(item.permissible, true, `License for ${item.component} must be permissive`);
    }
  });
});
