import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SKILL_HOSTS, hermesSkillSettings, skillLocations, supportedSkillHosts } from '../src/skill-hosts.mjs';
import { discoverWorkspaceSkills, routeWorkspaceSkills } from '../src/workspace-skills.mjs';
import { explicitSelection } from '../src/selection.mjs';
import { installSelective } from '../src/install.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-hosts-'));
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));
  const project = path.join(root, 'repo'), home = path.join(root, 'user');
  fs.mkdirSync(project, {recursive:true});
  fs.mkdirSync(home, {recursive:true});
  return {root,project,home};
}
function skill(root, relative, name, description='Review errors in source') {
  const dir = path.join(root, relative, name);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'SKILL.md'),
    '---\nname: '+name+'\ndescription: '+description+'\n---\n# '+name+'\n');
  return dir;
}
function hermesConfig(home, body) {
  fs.mkdirSync(path.join(home, '.hermes'), {recursive:true});
  fs.writeFileSync(path.join(home, '.hermes', 'config.yaml'), body);
}
test('all five host descriptors are available without changing existing ones', () => {
  assert.deepEqual(supportedSkillHosts(), ['antigravity','gemini','codex','claude','hermes']);
  assert.equal(SKILL_HOSTS.codex.workspace[0], '.agents/skills');
  assert.equal(SKILL_HOSTS.hermes.global[0], '.hermes/skills');
  assert.throws(() => skillLocations({runtime:'imaginary'}), /Unknown skill runtime/);
});
test('Gemini CLI sees native, shared alias and global skill directories', t => {
  const {project,home} = fixture(t);
  skill(project, '.gemini/skills', 'native-gemini');
  skill(project, '.agents/skills', 'shared-skill');
  skill(home, '.gemini/skills', 'global-skill');
  const result = discoverWorkspaceSkills({cwd:project,home,runtime:'gemini'});
  assert.deepEqual(result.map(x=>x.name).sort(), ['global-skill','native-gemini','shared-skill']);
  assert.equal(result.find(x=>x.name==='global-skill').scope,'global');
  assert.equal(discoverWorkspaceSkills({cwd:project,home,runtime:'gemini',includeGlobal:false}).length,2);
});
test('Gemini CLI shared alias takes precedence over host-specific folder for duplicates', t => {
  const {project,home} = fixture(t);
  skill(project,'.agents/skills','sample','Shared skill override');
  skill(project,'.gemini/skills','sample','Native skill override');
  const result=discoverWorkspaceSkills({cwd:project,home,runtime:'gemini'});
  assert.equal(result.length,1);
  assert.equal(result[0].description,'Shared skill override');
});
test('Hermes discovers category-nested local and configured external skills', t => {
  const {root,project,home}=fixture(t), external=path.join(root,'shared');
  skill(home,'.hermes/skills/devops','kubernetes-check');
  skill(external,'group/subgroup','audit-special'); // nested category from configured external root
  hermesConfig(home, 'skills:\n  external_dirs:\n    - '+external+'\n');
  const found=discoverWorkspaceSkills({cwd:project,home,runtime:'hermes'});
  assert.deepEqual(found.map(x=>x.name).sort(),['audit-special','kubernetes-check']);
  assert.equal(found.find(x=>x.name==='audit-special').scope,'external');
});
test('Hermes repo-local skills require host trust before selection', t => {
  const {project,home}=fixture(t);
  fs.mkdirSync(path.join(project,'.git'));
  skill(project,'.hermes/skills','repair-workflow','Repair a failing regression');
  const found=discoverWorkspaceSkills({cwd:project,home,runtime:'hermes'});
  assert.equal(found[0].availability,'requires-host-trust');
  const blocked=routeWorkspaceSkills({cwd:project,home,runtime:'hermes',prompt:'repair workflow regression'});
  assert.equal(blocked.primary,null);
  assert.equal(blocked.unavailable.length,1);
  hermesConfig(home,'skills:\n  trusted_project_dirs:\n    - '+project+'\n');
  const available=routeWorkspaceSkills({cwd:project,home,runtime:'hermes',prompt:'repair workflow regression'});
  assert.equal(available.primary.name,'repair-workflow');
});
test('Hermes can explicitly disable all repo-local discovery', t => {
  const {project,home}=fixture(t);
  fs.mkdirSync(path.join(project,'.git'));
  skill(project,'.hermes/skills','disabled-test');
  hermesConfig(home,'skills:\n  project_discovery: false\n');
  assert.equal(discoverWorkspaceSkills({cwd:project,home,runtime:'hermes'}).length,0);
  assert.equal(hermesSkillSettings(home).projectDiscovery,false);
});
test('external dirs parser limits scope and does not execute YAML directives', t => {
  const {root,home}=fixture(t);
  const allowed=path.join(root,'allowed');
  hermesConfig(home,'unrelated:\n  external_dirs:\n    - /wrong\nskills:\n  external_dirs:\n    - '+allowed+'\n    - !evil\n  trusted_project_dirs:\n    - ~/trusted\n');
  const config=hermesSkillSettings(home);
  assert.deepEqual(config.externalDirs,[allowed]);
  assert.deepEqual(config.trustedProjectDirs,[path.join(home,'trusted')]);
});
test('installer requires explicit Gemini or Hermes selection and preserves historical all', t => {
  const {project}=fixture(t);
  assert.deepEqual(explicitSelection({components:'skills',runtime:'all',skills:'xyeena-core'}).runtimes,
    ['antigravity','claude','codex']);
  assert.deepEqual(explicitSelection({components:'skills',runtime:'all-supported',skills:'xyeena-core'}).runtimes,
    ['antigravity','claude','codex','gemini','hermes']);
  const selected=explicitSelection({components:'skills',runtime:'gemini,hermes',skills:'xyeena-orchestrate'});
  const result=installSelective({cwd:project,...selected});
  assert.ok(result.skills.includes('xyeena-core'));
  assert.ok(fs.existsSync(path.join(project,'.gemini/skills/xyeena-orchestrate/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project,'.hermes/skills/xyeena-orchestrate/SKILL.md')));
  assert.equal(fs.existsSync(path.join(project,'AGENTS.md')),false);
  assert.equal(fs.existsSync(path.join(project,'.xyeena/harness')),false);
});
test('host-specific route rejects cross-host all and never fabricates absent skills', t => {
  const {project,home}=fixture(t);
  skill(project,'.gemini/skills','gemini-only','Investigate a bug in Gemini CLI');
  assert.throws(() => routeWorkspaceSkills({cwd:project,home,runtime:'all',prompt:'bug'}), /Select one host/);
  const codex=routeWorkspaceSkills({cwd:project,home,runtime:'codex',prompt:'investigate bug'});
  assert.equal(codex.primary,null);
  const gemini=routeWorkspaceSkills({cwd:project,home,runtime:'gemini',prompt:'gemini only investigate bug'});
  assert.equal(gemini.primary.name,'gemini-only');
});
