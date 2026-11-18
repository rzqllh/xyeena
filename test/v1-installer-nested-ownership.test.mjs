import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { InstallationTransaction } from '../src/installer/index.mjs';

describe('v1 nested skill install/uninstall ownership', () => {
  const make = () => mkdtempSync(join(tmpdir(), 'xyeena-v1-installer-'));

  it('removes an unmodified nested-reference installation without orphan folders', () => {
    const root = make();
    try {
      const tx = new InstallationTransaction({ cwd: root, runtime: 'antigravity', scope: 'workspace' });
      const install = tx.execute();
      assert.equal(install.success, true);
      const base = join(root, '.agents', 'skills', 'xyeena-core');
      assert.ok(existsSync(join(base, 'references', 'procedure.md')));
      const uninstall = tx.uninstall();
      assert.equal(uninstall.success, true);
      assert.equal(existsSync(base), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves user custom files inside an official nested directory', () => {
    const root = make();
    try {
      const tx = new InstallationTransaction({ cwd: root, runtime: 'antigravity', scope: 'workspace' });
      tx.execute();
      const base = join(root, '.agents', 'skills', 'xyeena-core');
      const userFile = join(base, 'references', 'personal-reference.md');
      writeFileSync(userFile, '# My private personal reference\n');
      const result = tx.uninstall();
      assert.equal(result.success, true);
      assert.ok(existsSync(userFile), 'Custom nested file must remain untouched');
      assert.equal(existsSync(join(base, 'SKILL.md')), false);
      assert.equal(existsSync(join(base, 'references', 'procedure.md')), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not delete unrelated empty user directories within owned skills', () => {
    const root = make();
    try {
      const tx = new InstallationTransaction({ cwd: root, runtime: 'antigravity', scope: 'workspace' });
      tx.execute();
      const base = join(root, '.agents', 'skills', 'xyeena-core');
      const privateDir = join(base, 'user-folder');
      mkdirSync(privateDir, { recursive: true });
      const result = tx.uninstall();
      assert.equal(result.success, true);
      assert.equal(existsSync(privateDir), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
