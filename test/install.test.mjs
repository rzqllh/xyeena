import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { install } from '../src/install.mjs';

function temp(prefix = 'xyeena-install-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test('selective Claude smart install does not create universal agent target', () => {
  const root = temp();
  try {
    const r = install({ cwd: root, agents: ['claude'], skills: ['xyeena-debug'], mode: 'smart' });
    const core = path.join(root, '.claude', 'skills', 'xyeena-core');
    const debug = path.join(root, '.claude', 'skills', 'xyeena-debug');
    assert.ok(fs.existsSync(path.join(core, 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(debug, 'SKILL.md')));
    assert.equal(fs.lstatSync(debug).isSymbolicLink(), true);
    assert.equal(fs.existsSync(path.join(root, '.agents', 'skills')), false);
    assert.ok(fs.existsSync(path.join(root, '.claude', 'agents', 'pm.md')));
    assert.deepEqual(r.manifest.added_dependencies, ['xyeena-core']);
  } finally { cleanup(root); }
});

test('Antigravity and Codex share one project skill target', () => {
  const root = temp();
  try {
    const r = install({ cwd: root, agents: ['antigravity', 'codex'], skills: ['xyeena-grill'] });
    assert.deepEqual(r.plan.skillTargets, [path.join(root, '.agents', 'skills')]);
    assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'xyeena-grill', 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(root, '.claude')), false);
  } finally { cleanup(root); }
});

test('copy mode installs physical skill directories', () => {
  const root = temp();
  try {
    install({ cwd: root, agents: ['claude'], skills: ['xyeena-core'], mode: 'copy' });
    const skill = path.join(root, '.claude', 'skills', 'xyeena-core');
    assert.ok(fs.existsSync(path.join(skill, 'SKILL.md')));
    assert.equal(fs.lstatSync(skill).isSymbolicLink(), false);
    assert.equal(fs.existsSync(path.join(root, '.xyeena', 'store', 'skills')), false);
  } finally { cleanup(root); }
});

test('all compatibility install reaches all three runtime targets', () => {
  const root = temp();
  try {
    const r = install({ cwd: root, runtime: 'all' });
    assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(root, '.claude', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(root, '.agents', 'agents', 'pm.md')));
    assert.ok(fs.existsSync(path.join(root, '.claude', 'agents', 'pm.md')));
    assert.equal(r.skills.length, 19);
  } finally { cleanup(root); }
});

test('global install uses agent-native global paths', () => {
  const root = temp();
  const fakeHome = temp('xyeena-home-');
  try {
    install({ cwd: root, home: fakeHome, agents: ['antigravity', 'claude', 'codex'], skills: ['xyeena-core'], scope: 'global' });
    assert.ok(fs.existsSync(path.join(fakeHome, '.gemini', 'antigravity', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(fakeHome, '.claude', 'skills', 'xyeena-core', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(fakeHome, '.codex', 'skills', 'xyeena-core', 'SKILL.md')));
  } finally { cleanup(root); cleanup(fakeHome); }
});

test('dry run does not write', () => {
  const root = temp('xyeena-dry-');
  try {
    install({ cwd: root, agents: ['claude'], skills: ['xyeena-debug'], dryRun: true });
    assert.equal(fs.existsSync(path.join(root, '.claude')), false);
    assert.equal(fs.existsSync(path.join(root, '.xyeena')), false);
  } finally { cleanup(root); }
});
