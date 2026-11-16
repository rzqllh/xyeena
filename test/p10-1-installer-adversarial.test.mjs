/**
 * Adversarial Acceptance Suite: Installer Hardening & User Data Safety (P10.1 / DEC-26 / DEC-29)
 * Stress-tests edge cases: custom user files inside official skill folders,
 * prefix collisions, corrupted manifests, post-consent tampering, fault injection rollback,
 * and safe uninstallation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { InstallationTransaction } from '../src/installer/index.mjs';
import { SKILLS_DIR } from '../src/paths.mjs';
import { computeDiffFingerprint } from '../src/installer/baseline-hashes.mjs';

function createDisposableWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-adv-'));
  const home = path.join(root, '.mock-home');
  fs.mkdirSync(home, { recursive: true });
  return { root, home };
}

function cleanupDisposableWorkspace(root) {
  try {
    fs.rmSync(root, { recursive: true, force: true });
  } catch {
    // Windows file lock fallback
  }
}

test('P10.1 Installer Adversarial: Custom user file inside official skill directory is preserved on install and update', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    // 1. Initial clean installation
    const res1 = tx.execute();
    assert.equal(res1.success, true);

    // 2. User adds custom script inside official xyeena-core folder
    const skillDir = path.join(root, '.agents', 'skills', 'xyeena-core');
    const customScriptPath = path.join(skillDir, 'my-custom-helper.py');
    fs.writeFileSync(customScriptPath, 'print("Custom user script!")', 'utf8');

    // 3. Re-run installation (update/repair)
    const tx2 = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    const res2 = tx2.execute({ force: true });
    assert.equal(res2.success, true);

    // 4. Verify custom file still exists untouched!
    assert.ok(fs.existsSync(customScriptPath), 'Custom user script inside official skill folder must NOT be deleted on update!');
    assert.equal(fs.readFileSync(customScriptPath, 'utf8'), 'print("Custom user script!")');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: Custom user file inside official skill directory is preserved on uninstall', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    tx.execute();

    // User adds custom script inside official xyeena-core folder
    const skillDir = path.join(root, '.agents', 'skills', 'xyeena-core');
    const customScriptPath = path.join(skillDir, 'my-custom-helper.py');
    fs.writeFileSync(customScriptPath, 'print("Custom user script!")', 'utf8');

    // Perform uninstall
    const uninstRes = tx.uninstall();
    assert.equal(uninstRes.success, true);

    // Official skill files removed, but custom user file must be preserved!
    assert.ok(fs.existsSync(customScriptPath), 'Uninstall must NEVER delete user custom files inside skill folder');
    assert.ok(uninstRes.preserved.some(p => p.includes('my-custom-helper.py')));
    assert.equal(fs.existsSync(path.join(skillDir, 'SKILL.md')), false, 'Official SKILL.md must be uninstalled');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: User folder with xyeena- prefix is treated as UNOWNED and never touched', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const skillsDir = path.join(root, '.agents', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    // User's own custom skill folder that happens to start with xyeena-
    const userSkill = path.join(skillsDir, 'xyeena-my-private-model');
    fs.mkdirSync(userSkill, { recursive: true });
    fs.writeFileSync(path.join(userSkill, 'SKILL.md'), '# Private Model');

    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    const plan = tx.plan();
    assert.ok(plan.willPreserve.includes('xyeena-my-private-model'), 'User skill with xyeena- prefix must be in willPreserve');
    assert.ok(!plan.willReplace.some(p => p.includes('xyeena-my-private-model')));

    // Execute install
    tx.execute();
    assert.ok(fs.existsSync(path.join(userSkill, 'SKILL.md')), 'User custom skill must survive installation');

    // Execute uninstall
    tx.uninstall();
    assert.ok(fs.existsSync(path.join(userSkill, 'SKILL.md')), 'User custom skill must survive uninstall');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: Tampering between preview and execution triggers post-consent abort', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    // 1. Setup legacy modified skill
    const skillDir = path.join(root, '.agents', 'skills', 'xyeena-core');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Initial modification');

    // 2. Generate plan & diff fingerprint
    const plan = tx.plan();
    assert.equal(plan.hasUserModifications, true);
    const approvedFingerprint = plan.diffFingerprint;

    // 3. TAMPERING: Malicious actor or background process alters the file after preview!
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Tampered modification after preview!');

    // 4. Execute with the fingerprint from step 2
    assert.throws(() => {
      tx.execute({ diffApprovedFingerprint: approvedFingerprint });
    }, /modified during transaction preview|fingerprint mismatch/i, 'Must detect file changed between preview and apply');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: Corrupted manifest falls back to repair without fatal crash', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const manifestDir = path.join(root, '.xyeena');
    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(path.join(manifestDir, 'install.json'), '{ invalid json corrupted! ');

    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    // Plan should not throw; should detect corrupted state
    const plan = tx.plan();
    assert.ok(plan.state.includes('LEGACY') || plan.state.includes('BROKEN') || plan.state.includes('NOT_INSTALLED'));

    // Execute repair
    const res = tx.execute({ force: true });
    assert.equal(res.success, true);
    assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md')));
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: Global install from Project A isolates state in user home, recognized cleanly by Project B', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const projectA = path.join(root, 'project-a');
    const projectB = path.join(root, 'project-b');
    fs.mkdirSync(projectA, { recursive: true });
    fs.mkdirSync(projectB, { recursive: true });

    // Global install from Project A
    const txA = new InstallationTransaction({
      cwd: projectA,
      runtime: 'antigravity',
      scope: 'global',
      mode: 'copy',
      home
    });

    const resA = txA.execute();
    assert.equal(resA.success, true);

    // Project A workspace must have 0 .xyeena directories created
    assert.equal(fs.existsSync(path.join(projectA, '.xyeena')), false, 'Global install must not write .xyeena to Project A');

    // Global state resides under home/.xyeena/installations/antigravity/
    const globalStateDir = path.join(home, '.xyeena', 'installations', 'antigravity');
    assert.ok(fs.existsSync(path.join(globalStateDir, 'install.json')), 'Global manifest must reside in isolated home directory');

    // Now run check from Project B
    const txB = new InstallationTransaction({
      cwd: projectB,
      runtime: 'antigravity',
      scope: 'global',
      mode: 'copy',
      home
    });

    const planB = txB.plan();
    assert.equal(planB.state, 'SAME_VERSION_VALID', 'Project B must recognize the active global installation cleanly');
    assert.equal(fs.existsSync(path.join(projectB, '.xyeena')), false, 'Project B workspace must remain completely untouched');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P10.1 Installer Adversarial: Path traversal in destination root triggers safeChild violation', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const maliciousDir = path.join(root, 'malicious');
    fs.mkdirSync(maliciousDir, { recursive: true });

    assert.throws(() => {
      new InstallationTransaction({
        cwd: maliciousDir,
        runtime: 'antigravity',
        scope: 'workspace',
        mode: 'copy',
        home,
        skills: ['../../../outside-skill']
      }).execute();
    }, /outside|violation|not found|escape/i);
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P13 Hardening Adversarial: Symlink mode with force cannot destroy custom user files (DEC-26)', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    // User adds custom script inside official xyeena-core folder
    const skillDir = path.join(root, '.agents', 'skills', 'xyeena-core');
    const customFilePath = path.join(skillDir, 'my-user-script.py');
    fs.writeFileSync(customFilePath, '# User custom code', 'utf8');

    // Attempt to switch to symlink mode with force: true
    const txSymlink = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'symlink',
      home
    });

    assert.throws(() => {
      txSymlink.execute({ force: true });
    }, /Cannot replace directory .* containing .* custom user file.*with symlink/i);

    // Custom user file MUST still be preserved!
    assert.ok(fs.existsSync(customFilePath), 'Custom user file must not be destroyed even with --force');
    assert.equal(fs.readFileSync(customFilePath, 'utf8'), '# User custom code');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P13 Hardening Adversarial: Uninstall with force preserves user-modified official files without explicit consent contract', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    // User modifies an official skill file
    const skillMdPath = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMdPath, '# Modified Core Skill by User', 'utf8');

    // User modifies official rule
    const rulePath = path.join(root, '.agents', 'rules', 'xyeena-core.md');
    fs.writeFileSync(rulePath, '# Modified User Rule', 'utf8');

    // Run uninstall with force: true (without allowModifiedRemoval consent)
    const uninstallRes = tx.uninstall({ force: true });
    assert.equal(uninstallRes.success, true);

    // Modified official skill file MUST be preserved!
    assert.ok(fs.existsSync(skillMdPath), 'Modified official file must be preserved on uninstall even with --force');
    assert.equal(fs.readFileSync(skillMdPath, 'utf8'), '# Modified Core Skill by User');

    // Modified rule MUST be preserved!
    assert.ok(fs.existsSync(rulePath), 'Modified official rule must be preserved on uninstall even with --force');
    assert.equal(fs.readFileSync(rulePath, 'utf8'), '# Modified User Rule');

    // Both files must be listed in preserved array
    assert.ok(uninstallRes.preserved.some(p => p.includes('SKILL.md')), 'Preserved array must list modified SKILL.md');
    assert.ok(uninstallRes.preserved.some(p => p.includes('xyeena-core.md')), 'Preserved array must list modified rule');
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

test('P13 Hardening Adversarial: Malformed manifest and consent mismatch fail-closed safely', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    // Corrupt install.json
    const manifestPath = path.join(root, '.xyeena', 'install.json');
    fs.writeFileSync(manifestPath, '{ corrupted json: true, ', 'utf8');

    // Plan check must fail-closed or report broken state safely
    const tx2 = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    const plan = tx2.plan();
    assert.equal(plan.state, 'SAME_VERSION_BROKEN', 'Corrupted manifest must be detected as SAME_VERSION_BROKEN');

    // Test fingerprint consent mismatch
    const skillMdPath = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMdPath, '# User Modified Content', 'utf8');

    const planModified = tx2.plan();
    assert.equal(planModified.hasUserModifications, true);

    assert.throws(() => {
      tx2.execute({ diffApprovedFingerprint: 'invalid_hash_12345' });
    }, /Diff approval fingerprint mismatch/i);
  } finally {
    cleanupDisposableWorkspace(root);
  }
});
