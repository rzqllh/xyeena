import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverWorkspaceSkills, routeWorkspaceSkills } from '../src/workspace-skills.mjs';
import { SkillInventoryCache } from '../src/skill-cache.mjs';

function workspace(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-discovery-'));
  const home = path.join(cwd, '.mock-home');
  fs.mkdirSync(home, { recursive: true });
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return { cwd, home };
}
function add(cwd, folder, name, description, extra = '') {
  const dir = path.join(cwd, folder, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n${extra}---\n# Test\n`);
}
function addPlugin(base, pluginName, manifest = {}, skills = []) {
  const dir = path.join(base, pluginName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify({ name: pluginName, ...manifest }));
  for (const s of skills) {
    const sDir = path.join(dir, 'skills', s.name);
    fs.mkdirSync(sDir, { recursive: true });
    fs.writeFileSync(path.join(sDir, 'SKILL.md'), `---\nname: ${s.name}\ndescription: ${s.description}\n${s.extra || ''}---\n# Plugin Skill\n`);
  }
}

test('discovers third-party skills without installing or executing them', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug errors and fix regressions');
  add(cwd, '.agents/skills', 'xyeena-core', 'Core practices');
  const result = discoverWorkspaceSkills({ cwd, home });
  assert.deepEqual(result.map(skill => skill.name), ['systematic-debugging', 'xyeena-core']);
  assert.equal(result[0].source, 'workspace');
  assert.equal(result[0].installed, true);
  assert.equal(result[0].eligible, true);
  assert.equal(result[0].executable, true);
});

test('routes external skills by name and existing Xyeena capabilities through their contracts', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug errors and fix regressions');
  add(cwd, '.agents/skills', 'xyeena-debug', 'Debug issues');
  add(cwd, '.agents/skills', 'xyeena-core', 'Core practices');
  const result = routeWorkspaceSkills({ cwd, home, prompt: 'systematic debugging for a regression', state: 'DEBUG' });
  assert.equal(result.primary.name, 'systematic-debugging');
  assert.equal(result.executed, false);
  assert.equal(result.mode, 'preview-only');
  assert.ok(result.supporting.length <= 2);
});

test('does not recommend uninstalled Xyeena capabilities', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'antislop', 'Reduce generic writing and design filler');
  const result = routeWorkspaceSkills({ cwd, home, prompt: 'review auth security code', state: 'REVIEW' });
  assert.equal(result.primary, null);
  assert.equal(result.installedCount, 1);
});

test('respects runtime isolation and avoids duplicate shared Agent Skills', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'systematic-debugging', 'Debug regressions');
  add(cwd, '.claude/skills', 'claude-review', 'Review code changes');
  assert.equal(discoverWorkspaceSkills({ cwd, home, runtime: 'claude' }).length, 1);
  assert.equal(discoverWorkspaceSkills({ cwd, home, runtime: 'all' }).length, 2);
});

test('rejects symlinked skills and invalid supporting budgets', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'good-skill', 'Review the relevant changes');
  try { fs.symlinkSync(path.join(cwd, '.agents/skills/good-skill'), path.join(cwd, '.agents/skills/bad-skill'), 'dir'); }
  catch { return; } // some Windows hosts disallow symlinks
  const skills = discoverWorkspaceSkills({ cwd, home });
  assert.equal(skills.find(s => s.name === 'good-skill')?.availability, 'detected');
  const bad = skills.find(s => s.name === 'bad-skill');
  if (bad) {
    assert.equal(bad.availability, 'blocked-symlink');
    assert.equal(bad.executable, false);
  }
  assert.throws(() => routeWorkspaceSkills({ cwd, home, prompt: 'review', maxSupporting: -1 }), /budget/);
});

test('discovers global Antigravity skill locations with workspace precedence', t => {
  const { cwd, home } = workspace(t);
  add(home, '.gemini/config/skills', 'antislop', 'Remove generic filler');
  add(home, '.gemini/antigravity/skills', 'legacy-skill', 'Legacy skill');
  add(cwd, '.agents/skills', 'antislop', 'Workspace override');
  const result = discoverWorkspaceSkills({ cwd, home });
  assert.equal(result.length, 2);
  assert.equal(result.find(s => s.name === 'antislop').scope, 'workspace');
  assert.equal(result.find(s => s.name === 'legacy-skill').scope, 'global');
  assert.equal(discoverWorkspaceSkills({ cwd, home, includeGlobal: false }).length, 1);
});

test('discovers native plugins with provenance and executable status', t => {
  const { cwd, home } = workspace(t);
  addPlugin(path.join(home, '.gemini/config/plugins'), 'superpowers', { version: '1.2.0' }, [
    { name: 'systematic-debugging', description: 'Systematic debugging workflow' },
    { name: 'writing-plans', description: 'Plan complex software implementation' }
  ]);
  const result = discoverWorkspaceSkills({ cwd, home });
  assert.equal(result.length, 2);
  const debugSkill = result.find(s => s.name === 'systematic-debugging');
  assert.ok(debugSkill);
  assert.equal(debugSkill.source, 'plugin');
  assert.equal(debugSkill.pluginName, 'superpowers');
  assert.equal(debugSkill.pluginVersion, '1.2.0');
  assert.equal(debugSkill.scope, 'global');
  assert.equal(debugSkill.enabled, true);
  assert.equal(debugSkill.trusted, true);
  assert.equal(debugSkill.eligible, true);
  assert.equal(debugSkill.executable, true);
  assert.equal(debugSkill.availability, 'detected');
});

test('handles disabled plugins without exposing them as eligible or executable', t => {
  const { cwd, home } = workspace(t);
  addPlugin(path.join(home, '.gemini/config/plugins'), 'disabled-plugin', { disabled: true }, [
    { name: 'inactive-skill', description: 'Skill inside disabled plugin' }
  ]);
  const result = discoverWorkspaceSkills({ cwd, home });
  const inactive = result.find(s => s.name === 'inactive-skill');
  assert.ok(inactive);
  assert.equal(inactive.enabled, false);
  assert.equal(inactive.eligible, false);
  assert.equal(inactive.executable, false);
  assert.equal(inactive.availability, 'disabled');
});

test('resolves duplicate collisions with workspace precedence over plugin and global', t => {
  const { cwd, home } = workspace(t);
  // Global plugin
  addPlugin(path.join(home, '.gemini/config/plugins'), 'test-plugin', { version: '1.0.0' }, [
    { name: 'shared-skill', description: 'Plugin version' }
  ]);
  // Global standalone
  add(home, '.gemini/config/skills', 'shared-skill', 'Global standalone version');
  // Workspace standalone
  add(cwd, '.agents/skills', 'shared-skill', 'Workspace standalone version');

  const result = discoverWorkspaceSkills({ cwd, home });
  assert.equal(result.length, 1);
  const winner = result[0];
  assert.equal(winner.name, 'shared-skill');
  assert.equal(winner.scope, 'workspace');
  assert.equal(winner.source, 'workspace');
  assert.equal(winner.description, 'Workspace standalone version');
  assert.ok(result.shadowed.length >= 2);
  assert.ok(result.shadowed.every(s => s.availability === 'collision-shadowed'));
});

test('blocked project skill does not shadow an eligible profile-level skill', t => {
  const { cwd, home } = workspace(t);
  const otherOs = process.platform === 'win32' ? 'linux' : 'windows';
  // Trusted global skill
  add(home, '.gemini/config/skills', 'safe-tool', 'Eligible global skill');
  // Incompatible platform workspace skill
  add(cwd, '.agents/skills', 'safe-tool', 'Incompatible platform', `platforms: [${otherOs}]\n`);

  const result = discoverWorkspaceSkills({ cwd, home });
  const selected = result.find(s => s.name === 'safe-tool');
  assert.ok(selected);
  assert.equal(selected.scope, 'global');
  assert.equal(selected.availability, 'detected');
  assert.equal(selected.eligible, true);
  assert.ok(result.shadowed.some(s => s.scope === 'workspace' && s.availability === 'collision-shadowed'));
});

test('resolves skill dependencies and marks missing dependencies', t => {
  const { cwd, home } = workspace(t);
  add(cwd, '.agents/skills', 'skill-b', 'Supporting skill');
  add(cwd, '.agents/skills', 'skill-a', 'Primary skill', 'dependencies: [skill-b]\n');
  add(cwd, '.agents/skills', 'skill-orphan', 'Orphan skill', 'dependencies: [missing-skill]\n');

  const result = discoverWorkspaceSkills({ cwd, home });
  const skillA = result.find(s => s.name === 'skill-a');
  assert.ok(skillA);
  assert.equal(skillA.executable, true);
  assert.deepEqual(skillA.dependencies, ['skill-b']);
  assert.deepEqual(skillA.missingDependencies, []);

  const orphan = result.find(s => s.name === 'skill-orphan');
  assert.ok(orphan);
  assert.equal(orphan.executable, false);
  assert.equal(orphan.availability, 'missing-dependency');
  assert.deepEqual(orphan.missingDependencies, ['missing-skill']);

  // Test routing auto-includes dependencies in supporting
  const routed = routeWorkspaceSkills({ cwd, home, prompt: 'skill-a', state: 'TRIAGE' });
  assert.equal(routed.primary.name, 'skill-a');
  assert.ok(routed.supporting.some(s => s.name === 'skill-b'));
});

test('inventory cache invalidates when plugin or skill files change', t => {
  const { cwd, home } = workspace(t);
  const cache = new SkillInventoryCache();
  addPlugin(path.join(home, '.gemini/config/plugins'), 'demo-plugin', { version: '1.0.0' }, [
    { name: 'cached-skill', description: 'Original description' }
  ]);
  const initial = cache.get({ cwd, home });
  assert.equal(initial.length, 1);
  assert.equal(initial[0].description, 'Original description');

  // Modify the plugin manifest
  fs.writeFileSync(path.join(home, '.gemini/config/plugins/demo-plugin/plugin.json'),
    JSON.stringify({ name: 'demo-plugin', version: '2.0.0', disabled: true }));
  const updated = cache.get({ cwd, home });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].enabled, false);
  assert.equal(updated[0].availability, 'disabled');
});
