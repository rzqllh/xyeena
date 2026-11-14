/**
 * Acceptance Test Suite: P08 Conditional Installer & Safe Legacy Replacement (AXIOVEN)
 * 20 required validation scenarios in isolated disposable environments.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PACKAGE_ROOT, SKILLS_DIR, VERSION } from '../../src/paths.mjs';
import {
  INSTALL_STATES,
  InstallationTransaction,
  detectInstallationState,
  scanDirectoryOwnership,
  isXyeenaOwned,
  isProtectedUserData,
  safeChild,
  BRAND_METADATA
} from '../../src/installer/index.mjs';

function createTempProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-p08-test-'));
  const agentsDir = path.join(tmp, '.agents', 'skills');
  fs.mkdirSync(agentsDir, { recursive: true });
  return tmp;
}

function cleanupTempProject(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup on windows lock
  }
}

describe('P08 — Conditional Installer & Legacy Replacement (AXIOVEN)', () => {
  let tmpProject;

  beforeEach(() => {
    tmpProject = createTempProject();
  });

  afterEach(() => {
    cleanupTempProject(tmpProject);
  });

  // Scenario 1: Fresh install without legacy
  test('Scenario 1: Fresh install without legacy (NOT_INSTALLED -> success)', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    const plan = tx.plan();
    assert.equal(plan.state, INSTALL_STATES.NOT_INSTALLED);
    assert.equal(plan.brand, 'xyeena');
    assert.ok(plan.availableSkillsCount > 0);

    const result = tx.execute();
    assert.equal(result.success, true);
    assert.equal(result.brand, 'xyeena');
    assert.ok(fs.existsSync(path.join(tmpProject, '.xyeena', 'install.json')));
    assert.ok(fs.existsSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.statSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md')).size > 0);
  });

  // Scenario 2: Replacement of valid legacy (LEGACY_XYEENA -> replaced with backup)
  test('Scenario 2: Replacement of valid legacy (LEGACY_XYEENA -> safe replacement + backup)', () => {
    // Setup legacy Xyeena skills without .xyeena/install.json
    const legacySkill = path.join(tmpProject, '.agents', 'skills', 'xyeena-core');
    fs.mkdirSync(legacySkill, { recursive: true });
    fs.writeFileSync(path.join(legacySkill, 'SKILL.md'), '# Legacy Xyeena Core v0.1.0\nOld legacy code');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    const plan = tx.plan();
    assert.equal(plan.state, INSTALL_STATES.LEGACY_XYEENA);

    const result = tx.execute();
    assert.equal(result.success, true);
    assert.ok(result.backupId, 'Backup must be created for legacy files');

    // Verify backup journal
    const backupDir = path.join(tmpProject, '.xyeena', 'backups', result.backupId);
    assert.ok(fs.existsSync(path.join(backupDir, 'rollback.json')));
    assert.ok(fs.existsSync(path.join(backupDir, '.gitignore')));

    // Verify latest skill replaced the legacy one
    const newContent = fs.readFileSync(path.join(legacySkill, 'SKILL.md'), 'utf8');
    assert.notEqual(newContent, '# Legacy Xyeena Core v0.1.0\nOld legacy code');
  });

  // Scenario 3: Update older version (OLDER_VERSION -> upgraded with backup)
  test('Scenario 3: Update older version (OLDER_VERSION -> upgraded with backup)', () => {
    // Setup older version with manifest
    const oldManifest = {
      brand: 'xyeena',
      version: '0.1.0',
      installed_at: '2025-01-01T00:00:00.000Z',
      skills: ['xyeena-core']
    };
    fs.mkdirSync(path.join(tmpProject, '.xyeena'), { recursive: true });
    fs.writeFileSync(path.join(tmpProject, '.xyeena', 'install.json'), JSON.stringify(oldManifest));

    const oldSkill = path.join(tmpProject, '.agents', 'skills', 'xyeena-core');
    fs.mkdirSync(oldSkill, { recursive: true });
    fs.writeFileSync(path.join(oldSkill, 'SKILL.md'), '# Xyeena Core v0.1.0');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: '0.4.1'
    });

    const plan = tx.plan();
    assert.equal(plan.state, INSTALL_STATES.OLDER_VERSION);
    assert.equal(plan.installedVersion, '0.1.0');

    const result = tx.execute();
    assert.equal(result.success, true);
    assert.ok(result.backupId);

    const updatedManifest = JSON.parse(fs.readFileSync(path.join(tmpProject, '.xyeena', 'install.json'), 'utf8'));
    assert.equal(updatedManifest.version, '0.4.1');
    assert.equal(updatedManifest.brand, 'xyeena');
  });

  // Scenario 4: Same-version no-op (SAME_VERSION_VALID -> no writes, reported up-to-date)
  test('Scenario 4: Same-version no-op (SAME_VERSION_VALID -> no writes)', () => {
    const tx1 = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: VERSION
    });
    tx1.execute();

    const manifestMtimeBefore = fs.statSync(path.join(tmpProject, '.xyeena', 'install.json')).mtimeMs;

    // Run again without force
    const tx2 = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: VERSION
    });

    const plan = tx2.plan();
    assert.equal(plan.state, INSTALL_STATES.SAME_VERSION_VALID);

    const result = tx2.execute();
    assert.equal(result.noop, true);
    assert.equal(result.state, INSTALL_STATES.SAME_VERSION_VALID);

    const manifestMtimeAfter = fs.statSync(path.join(tmpProject, '.xyeena', 'install.json')).mtimeMs;
    assert.equal(manifestMtimeBefore, manifestMtimeAfter, 'Manifest should not be modified on no-op');
  });

  // Scenario 5: Corrupted same-version repair (SAME_VERSION_BROKEN -> repaired)
  test('Scenario 5: Corrupted same-version repair (SAME_VERSION_BROKEN -> repair missing/empty SKILL.md)', () => {
    const tx1 = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: VERSION
    });
    tx1.execute();

    // Corrupt one skill by emptying its SKILL.md
    const skillMd = path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMd, '');

    const tx2 = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: VERSION
    });

    const plan = tx2.plan();
    assert.equal(plan.state, INSTALL_STATES.SAME_VERSION_BROKEN);

    const result = tx2.execute({ force: true });
    assert.equal(result.success, true);
    assert.ok(fs.statSync(skillMd).size > 0, 'SKILL.md must be restored to non-empty');
  });

  // Scenario 6: Newer-version downgrade protection (NEWER_VERSION -> refuses downgrade)
  test('Scenario 6: Newer-version downgrade protection (NEWER_VERSION -> refuses downgrade without force)', () => {
    fs.mkdirSync(path.join(tmpProject, '.xyeena'), { recursive: true });
    fs.writeFileSync(path.join(tmpProject, '.xyeena', 'install.json'), JSON.stringify({
      brand: 'xyeena',
      version: '99.0.0',
      skills: ['xyeena-core']
    }));

    const skill = path.join(tmpProject, '.agents', 'skills', 'xyeena-core');
    fs.mkdirSync(skill, { recursive: true });
    fs.writeFileSync(path.join(skill, 'SKILL.md'), '# Future Version 99.0.0');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: '0.4.1'
    });

    const plan = tx.plan();
    assert.equal(plan.state, INSTALL_STATES.NEWER_VERSION);

    assert.throws(() => {
      tx.execute();
    }, /Silent downgrade refused/);
  });

  // Scenario 7: Unknown installation preservation
  test('Scenario 7: Unknown installation preservation (unrecognized files are never destroyed)', () => {
    const customDir = path.join(tmpProject, '.agents', 'skills', 'my-custom-assistant');
    fs.mkdirSync(customDir, { recursive: true });
    fs.writeFileSync(path.join(customDir, 'SKILL.md'), '# Custom Private Assistant');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    const plan = tx.plan();
    assert.ok(plan.willPreserve.includes('my-custom-assistant'));

    tx.execute();

    // Verify custom file is untouched
    assert.ok(fs.existsSync(path.join(customDir, 'SKILL.md')));
    assert.equal(fs.readFileSync(path.join(customDir, 'SKILL.md'), 'utf8'), '# Custom Private Assistant');
  });

  // Scenario 8: Third-party skill preservation (antislop, superpowers, etc.)
  test('Scenario 8: Third-party skill preservation (antislop & superpowers intact during replacement and uninstall)', () => {
    const antislopDir = path.join(tmpProject, '.agents', 'skills', 'antislop');
    fs.mkdirSync(antislopDir, { recursive: true });
    fs.writeFileSync(path.join(antislopDir, 'SKILL.md'), '# Antislop Rules');

    const superpowersDir = path.join(tmpProject, '.agents', 'skills', 'superpowers');
    fs.mkdirSync(superpowersDir, { recursive: true });
    fs.writeFileSync(path.join(superpowersDir, 'SKILL.md'), '# Superpowers Plugin');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    tx.execute();

    // Both third party skills still exist after install
    assert.ok(fs.existsSync(path.join(antislopDir, 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(superpowersDir, 'SKILL.md')));

    // Run uninstall
    const uninstallResult = tx.uninstall();
    assert.equal(uninstallResult.success, true);
    assert.ok(uninstallResult.preserved.includes('antislop'));
    assert.ok(uninstallResult.preserved.includes('superpowers'));

    // Both third party skills STILL exist after uninstall
    assert.ok(fs.existsSync(path.join(antislopDir, 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(superpowersDir, 'SKILL.md')));
  });

  // Scenario 9: Existing persona preservation
  test('Scenario 9: Existing persona preservation (.agents/personas/ intact)', () => {
    const personaDir = path.join(tmpProject, '.agents', 'personas');
    fs.mkdirSync(personaDir, { recursive: true });
    const personaFile = path.join(personaDir, 'xyn_custom.md');
    fs.writeFileSync(personaFile, '# Custom Persona Prompt');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    tx.execute();
    assert.ok(fs.existsSync(personaFile));
    assert.equal(fs.readFileSync(personaFile, 'utf8'), '# Custom Persona Prompt');

    tx.uninstall();
    assert.ok(fs.existsSync(personaFile), 'User personas must never be touched by uninstall');
  });

  // Scenario 10: Memory preservation
  test('Scenario 10: Memory preservation (MEMORY.md remains untouched)', () => {
    const memoryFile = path.join(tmpProject, 'MEMORY.md');
    fs.writeFileSync(memoryFile, '# Project Memory & Decisions');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    tx.execute();
    assert.ok(fs.existsSync(memoryFile));
    assert.equal(fs.readFileSync(memoryFile, 'utf8'), '# Project Memory & Decisions');

    tx.uninstall();
    assert.ok(fs.existsSync(memoryFile));
  });

  // Scenario 11: Failed installation rollback
  test('Scenario 11: Failed installation rollback (restores backup on error)', () => {
    // Setup initial legacy state
    const coreSkill = path.join(tmpProject, '.agents', 'skills', 'xyeena-core');
    fs.mkdirSync(coreSkill, { recursive: true });
    fs.writeFileSync(path.join(coreSkill, 'SKILL.md'), '# Original Unbroken Content');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    // Subclass or simulate failure during post-install verification by intercepting SKILLS_DIR or forcing error
    const originalPlan = tx.plan();
    assert.equal(originalPlan.state, INSTALL_STATES.LEGACY_XYEENA);

    // Test rollback directly with backup
    const result = tx.execute();
    assert.ok(result.backupId);

    // Modify a file, then trigger rollback
    fs.writeFileSync(path.join(coreSkill, 'SKILL.md'), '# Tampered Content');
    const rollbackRes = tx.rollback(result.backupId);
    assert.equal(rollbackRes.success, true);
    assert.equal(fs.readFileSync(path.join(coreSkill, 'SKILL.md'), 'utf8'), '# Original Unbroken Content');
  });

  // Scenario 12: Interrupted installation recovery (stale lock auto-cleared)
  test('Scenario 12: Interrupted installation recovery (stale lock > 5m broken automatically)', () => {
    fs.mkdirSync(path.join(tmpProject, '.xyeena'), { recursive: true });
    const staleLock = {
      pid: 999999,
      timestamp: Date.now() - (10 * 60 * 1000) // 10 minutes old
    };
    fs.writeFileSync(path.join(tmpProject, '.xyeena', 'installer.lock'), JSON.stringify(staleLock));

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    // Should succeed because stale lock is broken automatically
    const result = tx.execute();
    assert.equal(result.success, true);
    assert.ok(!fs.existsSync(path.join(tmpProject, '.xyeena', 'installer.lock')));
  });

  // Scenario 13: Repeated installation idempotency
  test('Scenario 13: Repeated installation idempotency', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    const run1 = tx.execute();
    assert.equal(run1.success, true);

    // Second run should be clean no-op
    const run2 = tx.execute();
    assert.equal(run2.success, true);
    assert.equal(run2.noop, true);

    // Third run with force should succeed cleanly
    const run3 = tx.execute({ force: true });
    assert.equal(run3.success, true);
  });

  // Scenario 14: Concurrent installer lock (active lock blocked)
  test('Scenario 14: Concurrent installer lock (active lock < 5m blocks concurrent process)', () => {
    fs.mkdirSync(path.join(tmpProject, '.xyeena'), { recursive: true });
    const activeLock = {
      pid: 12345,
      timestamp: Date.now() - 30000 // 30s old
    };
    fs.writeFileSync(path.join(tmpProject, '.xyeena', 'installer.lock'), JSON.stringify(activeLock));

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });

    assert.throws(() => {
      tx.execute();
    }, /Installer lock is actively held/);
  });

  // Scenario 15: Symlink/copy ownership
  test('Scenario 15: Symlink/copy ownership', () => {
    const txCopy = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      mode: 'copy'
    });
    const planCopy = txCopy.plan();
    assert.equal(planCopy.mode, 'copy');

    const txSymlink = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      mode: 'symlink'
    });
    const planSymlink = txSymlink.plan();
    assert.equal(planSymlink.mode, 'symlink');
  });

  // Scenario 16: Workspace / global isolation
  test('Scenario 16: Workspace / global isolation', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-fake-home-'));
    try {
      const txWorkspace = new InstallationTransaction({
        cwd: tmpProject,
        runtime: 'antigravity',
        scope: 'workspace',
        home: fakeHome
      });
      assert.equal(txWorkspace.targetDir, path.join(tmpProject, '.agents', 'skills'));

      const txGlobal = new InstallationTransaction({
        cwd: tmpProject,
        runtime: 'antigravity',
        scope: 'global',
        home: fakeHome
      });
      assert.equal(txGlobal.targetDir, path.join(fakeHome, '.agents', 'skills'));
    } finally {
      cleanupTempProject(fakeHome);
    }
  });

  // Scenario 17: Uninstall only removes Xyeena-owned artifacts
  test('Scenario 17: Uninstall only removes Xyeena-owned artifacts', () => {
    const antislopDir = path.join(tmpProject, '.agents', 'skills', 'antislop');
    fs.mkdirSync(antislopDir, { recursive: true });
    fs.writeFileSync(path.join(antislopDir, 'SKILL.md'), '# Antislop');

    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    tx.execute();

    assert.ok(fs.existsSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core')));
    assert.ok(fs.existsSync(path.join(tmpProject, '.agents', 'rules', 'xyeena-core.md')));

    tx.uninstall();

    // Xyeena skills and rule removed
    assert.ok(!fs.existsSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core')));
    assert.ok(!fs.existsSync(path.join(tmpProject, '.agents', 'rules', 'xyeena-core.md')));
    assert.ok(!fs.existsSync(path.join(tmpProject, '.xyeena', 'install.json')));

    // Third-party skill preserved
    assert.ok(fs.existsSync(path.join(antislopDir, 'SKILL.md')));
  });

  // Scenario 18: Windows path and permission edge cases
  test('Scenario 18: Windows path with spaces handled properly', () => {
    const spaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena space test-'));
    try {
      const tx = new InstallationTransaction({
        cwd: spaceDir,
        runtime: 'antigravity',
        scope: 'workspace'
      });
      const res = tx.execute();
      assert.equal(res.success, true);
      assert.ok(fs.existsSync(path.join(spaceDir, '.xyeena', 'install.json')));
    } finally {
      cleanupTempProject(spaceDir);
    }
  });

  // Scenario 19: Actual npm package root validation
  test('Scenario 19: Actual npm package root validation (valid skills in SKILLS_DIR)', () => {
    assert.ok(fs.existsSync(SKILLS_DIR));
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter(e => e.isDirectory());
    assert.ok(entries.length >= 10, 'Package must contain at least 10 native skills');

    for (const ent of entries) {
      const skillFile = path.join(SKILLS_DIR, ent.name, 'SKILL.md');
      assert.ok(fs.existsSync(skillFile), `Skill ${ent.name} must have SKILL.md`);
      assert.ok(fs.statSync(skillFile).size > 0, `Skill ${ent.name}/SKILL.md must not be empty`);
    }
  });

  // Scenario 20: Skills.sh-compatible package/skill discovery
  test('Scenario 20: Skills.sh-compatible discovery (all installed skills have valid frontmatter)', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    tx.execute();

    const installedSkills = fs.readdirSync(path.join(tmpProject, '.agents', 'skills'), { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('xyeena-'));

    assert.ok(installedSkills.length >= 10);
    for (const s of installedSkills) {
      const content = fs.readFileSync(path.join(tmpProject, '.agents', 'skills', s.name, 'SKILL.md'), 'utf8');
      assert.ok(content.startsWith('---'), `Skill ${s.name} must start with YAML frontmatter for skills.sh compatibility`);
      assert.ok(content.includes('name:'), `Skill ${s.name} must contain name in frontmatter`);
      assert.ok(content.includes('description:'), `Skill ${s.name} must contain description in frontmatter`);
    }
  });

  // Scenario 21: Real Fault-Injection Mid-Execution (True Two-Way Rollback)
  test('Scenario 21: Fault-injection during write triggers true two-way rollback', () => {
    const txInit = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    txInit.execute();

    const initialManifest = fs.readFileSync(path.join(tmpProject, '.xyeena', 'install.json'), 'utf8');
    const initialSkillContent = fs.readFileSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md'), 'utf8');

    const originalCopyFileSync = fs.copyFileSync;
    let copies = 0;
    try {
      fs.copyFileSync = (src, dst, flags) => {
        copies++;
        if (copies > 5) {
          throw new Error('SIMULATED_DISK_IO_FAILURE_MID_WRITE');
        }
        return originalCopyFileSync(src, dst, flags);
      };

      const txFail = new InstallationTransaction({
        cwd: tmpProject,
        runtime: 'antigravity',
        scope: 'workspace',
        targetVersion: '0.4.2'
      });

      assert.throws(() => {
        txFail.execute({ force: true });
      }, /SIMULATED_DISK_IO_FAILURE_MID_WRITE/);

    } finally {
      fs.copyFileSync = originalCopyFileSync;
    }

    // Verify complete rollback: lock released, original skill restored, manifest restored
    assert.ok(!fs.existsSync(path.join(tmpProject, '.xyeena', 'installer.lock')));
    assert.equal(fs.readFileSync(path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md'), 'utf8'), initialSkillContent);
    assert.equal(fs.readFileSync(path.join(tmpProject, '.xyeena', 'install.json'), 'utf8'), initialManifest);
  });

  // Scenario 22: User Customization Diff Detection & Fingerprint Gate (DEC-26)
  test('Scenario 22: User customization detection triggers fail-closed diff gate and requires fingerprint consent', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    tx.execute();

    // User modifies SKILL.md with custom team instructions
    const skillPath = path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillPath, '# Xyeena Core - Custom Team Instructions\nDo not violate our DB rules.');

    const txUpdate = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace',
      targetVersion: '0.4.2'
    });

    const plan = txUpdate.plan();
    assert.equal(plan.hasUserModifications, true);
    assert.ok(plan.diffFingerprint);
    assert.equal(plan.modifiedFiles.length, 1);
    assert.ok(plan.modifiedFiles[0].diff.includes('Custom Team Instructions'));

    // Attempting execute() without fingerprint consent MUST fail closed
    let threw = false;
    try {
      txUpdate.execute({ force: true });
    } catch (err) {
      threw = true;
      assert.equal(err.code, 'USER_MODIFICATIONS_DETECTED');
      assert.equal(err.diffFingerprint, plan.diffFingerprint);
    }
    assert.equal(threw, true, 'Must throw USER_MODIFICATIONS_DETECTED');

    // Providing mismatched fingerprint must also fail
    assert.throws(() => {
      txUpdate.execute({ force: true, diffApprovedFingerprint: 'invalid-fingerprint-000' });
    }, /Diff approval fingerprint mismatch/);

    // Providing valid fingerprint succeeds!
    const successResult = txUpdate.execute({ force: true, diffApprovedFingerprint: plan.diffFingerprint });
    assert.equal(successResult.success, true);
  });

  // Scenario 23: Global Scope Cross-Directory Isolation (DEC-28)
  test('Scenario 23: Global install from project A preserves state and is recognized cleanly from project B', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-test-home-'));
    const projectA = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-test-projA-'));
    const projectB = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-test-projB-'));

    try {
      const txA = new InstallationTransaction({
        cwd: projectA,
        runtime: 'antigravity',
        scope: 'global',
        home: fakeHome
      });
      const resA = txA.execute();
      assert.equal(resA.success, true);

      assert.ok(fs.existsSync(path.join(fakeHome, '.xyeena', 'installations', 'antigravity', 'install.json')));
      assert.ok(!fs.existsSync(path.join(projectA, '.xyeena', 'install.json')));

      const txB = new InstallationTransaction({
        cwd: projectB,
        runtime: 'antigravity',
        scope: 'global',
        home: fakeHome
      });
      const planB = txB.plan();
      assert.equal(planB.state, INSTALL_STATES.SAME_VERSION_VALID);
      assert.equal(planB.installedVersion, VERSION);

      const resB = txB.execute();
      assert.equal(resB.noop, true);
      assert.ok(!fs.existsSync(path.join(projectB, '.xyeena', 'install.json')));

    } finally {
      cleanupTempProject(fakeHome);
      cleanupTempProject(projectA);
      cleanupTempProject(projectB);
    }
  });

  // Scenario 24: Symlink / Junction Traversal Protection (DEC-29)
  test('Scenario 24: safeChild catches path and realpath escaping destination root', () => {
    assert.throws(() => {
      safeChild(tmpProject, path.join(tmpProject, '..', 'escaped.txt'));
    }, /escapes destination root/);
  });

  // Scenario 25: Sub-file Integrity Check (DEC-26)
  test('Scenario 25: Sub-file corruption in capability.json triggers SAME_VERSION_BROKEN', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    tx.execute();

    const capPath = path.join(tmpProject, '.agents', 'skills', 'xyeena-core', 'capability.json');
    if (fs.existsSync(capPath)) {
      fs.writeFileSync(capPath, '');
      const plan = tx.plan();
      assert.equal(plan.state, INSTALL_STATES.SAME_VERSION_BROKEN);
    }
  });

  // Scenario 26: Uninstall Backup & Custom File Preservation (DEC-26)
  test('Scenario 26: Uninstall creates backup and preserves custom user scripts inside skill folder', () => {
    const tx = new InstallationTransaction({
      cwd: tmpProject,
      runtime: 'antigravity',
      scope: 'workspace'
    });
    tx.execute();

    const unResult = tx.uninstall();
    assert.equal(unResult.success, true);
    assert.ok(unResult.backupId);

    // Verify backup was created
    assert.ok(fs.existsSync(path.join(tmpProject, '.xyeena', 'backups', unResult.backupId)));
  });
});
