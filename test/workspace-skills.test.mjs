import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverWorkspaceSkills, routeWorkspaceSkills } from '../src/workspace-skills.mjs';

function workspace(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-discovery-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}
function add(cwd, folder, name, description) {
  const dir = path.join(cwd, folder, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n# Test\n`);
}

test('discovers third-party skills without installing or executing them', t => {
  const cwd = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug errors and fix regressions');
  add(cwd, '.agents/skills', 'xyeena-core', 'Core practices');
  const result = discoverWorkspaceSkills({ cwd });
  assert.deepEqual(result.map(skill => skill.name), ['systematic-debugging', 'xyeena-core']);
  assert.equal(result[0].source, 'workspace');
});

test('routes external skills by name and existing Xyeena capabilities through their contracts', t => {
  const cwd = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug errors and fix regressions');
  add(cwd, '.agents/skills', 'xyeena-debug', 'Debug issues');
  add(cwd, '.agents/skills', 'xyeena-core', 'Core practices');
  const result = routeWorkspaceSkills({ cwd, prompt: 'systematic debugging for a regression', state: 'DEBUG' });
  assert.equal(result.primary.name, 'systematic-debugging');
  assert.equal(result.executed, false);
  assert.equal(result.mode, 'preview-only');
  assert.ok(result.supporting.length <= 2);
});

test('does not recommend uninstalled Xyeena capabilities', t => {
  const cwd = workspace(t);
  add(cwd, '.agents/skills', 'antislop', 'Reduce generic writing and design filler');
  const result = routeWorkspaceSkills({ cwd, prompt: 'review auth security code', state: 'REVIEW' });
  assert.equal(result.primary, null);
  assert.equal(result.installedCount, 1);
});

test('respects runtime isolation and avoids duplicate shared Agent Skills', t => {
  const cwd = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug regressions');
  add(cwd, '.claude/skills', 'claude-review', 'Review code changes');
  assert.equal(discoverWorkspaceSkills({ cwd, runtime: 'claude' }).length, 1);
  assert.equal(discoverWorkspaceSkills({ cwd, runtime: 'all' }).length, 2);
});

test('rejects symlinked skills and invalid supporting budgets', t => {
  const cwd = workspace(t);
  add(cwd, '.agents/skills', 'good-skill', 'Review the relevant changes');
  try { fs.symlinkSync(path.join(cwd, '.agents/skills/good-skill'), path.join(cwd, '.agents/skills/bad-skill'), 'dir'); }
  catch { return; } // some Windows hosts disallow symlinks
  assert.equal(discoverWorkspaceSkills({ cwd }).length, 1);
  assert.throws(() => routeWorkspaceSkills({ cwd, prompt: 'review', maxSupporting: -1 }), /budget/);
});

test('discovers global Antigravity skill locations with workspace precedence', t => {
  const cwd = workspace(t), home = path.join(cwd, 'home');
  add(home, '.gemini/config/skills', 'antislop', 'Remove generic filler');
  add(home, '.gemini/antigravity/skills', 'legacy-skill', 'Legacy skill');
  add(cwd, '.agents/skills', 'antislop', 'Workspace override');
  const result = discoverWorkspaceSkills({ cwd, home });
  assert.equal(result.length, 2);
  assert.equal(result.find(s => s.name === 'antislop').scope, 'workspace');
  assert.equal(result.find(s => s.name === 'legacy-skill').scope, 'global');
  assert.equal(discoverWorkspaceSkills({ cwd, home, includeGlobal: false }).length, 1);
});
