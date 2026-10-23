import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  previewCompactSetup,
  applyCompactSetup,
  resolveSkillAlias,
  verifySkillOwnership,
  previewLegacyMigration,
  applyLegacyMigration,
  rollbackLegacyMigration,
  uninstallCompactSetup
} from '../src/compact-setup.mjs';
import { discoverWorkspaceSkills } from '../src/workspace-skills.mjs';
import { previewOrchestration } from '../src/orchestrator.mjs';
import { previewPortableHost } from '../src/portable-cli-adapter.mjs';
import { previewAntigravitySdkTask } from '../src/antigravity-sdk-adapter.mjs';

function temp(t) {
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-compact-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  return cwd;
}
test('compact preview is read-only and creates one host-visible root', t => {
  const cwd=temp(t);
  const preview=previewCompactSetup({cwd,runtime:'codex,antigravity',preset:'complete'});
  assert.equal(preview.entrySkill,'xyeena-rig');
  assert.equal(preview.targets.length,1);
  assert.equal(preview.targets[0].status,'create');
  assert.equal(fs.readdirSync(cwd).length,0);
  assert.ok(preview.selectedSkills.includes('xyeena-orchestrate'));
  assert.ok(preview.selectedSkills.includes('xyeena-security'));
  const result=applyCompactSetup({cwd,runtime:'codex,antigravity',preset:'complete',yes:true});
  assert.equal(result.modified.length,1);
  const base=path.join(cwd,'.agents','skills','xyeena-rig');
  assert.ok(fs.existsSync(path.join(base,'SKILL.md')));
  assert.ok(fs.existsSync(path.join(base,'references','skills','xyeena-orchestrate','SKILL.md')));
  assert.equal(fs.existsSync(path.join(cwd,'.agents','skills','xyeena-orchestrate')),false);
  const seen=discoverWorkspaceSkills({cwd,runtime:'codex',includeGlobal:false});
  assert.deepEqual(seen.map(s=>s.name),['xyeena-rig']);
  const orchestration=previewOrchestration({cwd,runtime:'codex',goal:'Debug a regression',includeGlobal:false});
  assert.equal(orchestration.ready,true);
  assert.equal(orchestration.entrypoint,'/xyeena-rig');
  assert.deepEqual(orchestration.selectedSkills,['xyeena-rig']);
  assert.equal(orchestration.enterprise.nativeFallbackAvailable,true);
});
test('repeat compact setup is idempotent and preserves third-party skills',t=>{
  const cwd=temp(t);
  const other=path.join(cwd,'.agents','skills','superior-ux');
  fs.mkdirSync(other,{recursive:true});
  fs.writeFileSync(path.join(other,'SKILL.md'),'---\nname: superior-ux\ndescription: UI guidance\n---\n');
  applyCompactSetup({cwd,runtime:'codex',preset:'essential',yes:true});
  const again=applyCompactSetup({cwd,runtime:'codex',preset:'essential',yes:true});
  assert.deepEqual(again.modified,[]);
  assert.equal(fs.readFileSync(path.join(other,'SKILL.md'),'utf8').includes('UI guidance'),true);
});
test('managed update needs consent, backs up unchanged old bundle, and protects edits',t=>{
  const cwd=temp(t);
  applyCompactSetup({cwd,runtime:'codex',preset:'essential',yes:true});
  const upgraded=previewCompactSetup({cwd,runtime:'codex',preset:'balanced'});
  assert.equal(upgraded.targets[0].status,'managed-update');
  assert.throws(()=>applyCompactSetup({cwd,runtime:'codex',preset:'balanced',yes:true}),/pass --update/);
  const result=applyCompactSetup({cwd,runtime:'codex',preset:'balanced',yes:true,update:true});
  assert.equal(result.modified[0].action,'managed-update');
  assert.ok(fs.existsSync(result.modified[0].backup));
  assert.ok(fs.existsSync(path.join(cwd,'.agents','skills','xyeena-rig','references','skills','xyeena-debug','SKILL.md')));
  fs.appendFileSync(path.join(cwd,'.agents','skills','xyeena-rig','SKILL.md'),'local changes\n');
  const tampered=previewCompactSetup({cwd,runtime:'codex',preset:'balanced'});
  assert.equal(tampered.targets[0].status,'conflict');
  assert.throws(()=>applyCompactSetup({cwd,runtime:'codex',preset:'balanced',yes:true,update:true}),/no files changed/);
});
test('existing unowned compact folder refuses takeover',t=>{
  const cwd=temp(t), target=path.join(cwd,'.agents','skills','xyeena-rig');
  fs.mkdirSync(target,{recursive:true});
  fs.writeFileSync(path.join(target,'SKILL.md'),'user data');
  const plan=previewCompactSetup({cwd,runtime:'codex'});
  assert.equal(plan.conflicts.length,1);
  assert.throws(()=>applyCompactSetup({cwd,runtime:'codex',yes:true}),/Unowned/);
  assert.equal(fs.readFileSync(path.join(target,'SKILL.md'),'utf8'),'user data');
});
test('global compact setup goes into the selected user home only',t=>{
  const cwd=temp(t),home=path.join(cwd,'home');
  fs.mkdirSync(home);
  const p=previewCompactSetup({cwd,home,scope:'global',runtime:'claude',preset:'essential'});
  assert.equal(p.targets.length,1);
  assert.ok(p.targets[0].directory.startsWith(path.join(fs.realpathSync(home),'.claude','skills')));
  applyCompactSetup({cwd,home,scope:'global',runtime:'claude',preset:'essential',yes:true});
  assert.ok(fs.existsSync(path.join(home,'.claude','skills','xyeena-rig','SKILL.md')));
  assert.equal(fs.existsSync(path.join(cwd,'.claude')),false);
});

test('compact governor also works in standalone portable host and Antigravity SDK previews',t=>{
  const cwd=temp(t);
  applyCompactSetup({cwd,runtime:'codex,antigravity',preset:'essential',yes:true});
  const portable=previewPortableHost({cwd,runtime:'codex',goal:'Review tests',includeGlobal:false});
  assert.equal(portable.ready,true);
  assert.ok(portable.requestedSkills.includes('xyeena-rig'));
  const sdk=previewAntigravitySdkTask({cwd,goal:'Review tests',includeGlobal:false});
  assert.ok(sdk.selectedSkills.includes('xyeena-rig'));
  assert.equal(sdk.skillPaths.length,1);
});

test('resolveSkillAlias correctly maps legacy commands and skill names', () => {
  assert.equal(resolveSkillAlias('/xyeena-rig'), 'SKILL.md');
  assert.equal(resolveSkillAlias('xyeena-rig'), 'SKILL.md');
  assert.equal(resolveSkillAlias('/xyeena-orchestrate'), 'references/skills/xyeena-orchestrate/SKILL.md');
  assert.equal(resolveSkillAlias('xyeena-debug'), 'references/skills/xyeena-debug/SKILL.md');
  assert.equal(resolveSkillAlias('unknown-skill'), null);
  assert.equal(resolveSkillAlias(''), null);
  assert.equal(resolveSkillAlias(null), null);
});

test('verifySkillOwnership detects managed markers and source matches', t => {
  const cwd = temp(t);
  const skillDir = path.join(cwd, 'xyeena-custom');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'custom');
  assert.equal(verifySkillOwnership(skillDir, 'xyeena-custom'), false);

  fs.writeFileSync(path.join(skillDir, '.xyeena-managed.json'), JSON.stringify({ managedBy: 'xyeena-agent' }));
  assert.equal(verifySkillOwnership(skillDir, 'xyeena-custom'), true);
});

test('legacy migration previews, backs up, migrates owned skills, preserves user edits, and rolls back cleanly', t => {
  const cwd = temp(t);
  const skillsBase = path.join(cwd, '.agents', 'skills');
  const ownedSkill = path.join(skillsBase, 'xyeena-orchestrate');
  const userSkill = path.join(skillsBase, 'xyeena-custom-notes');
  const thirdPartySkill = path.join(skillsBase, 'superior-ux');

  fs.mkdirSync(ownedSkill, { recursive: true });
  fs.writeFileSync(path.join(ownedSkill, 'SKILL.md'), '---\nname: xyeena-orchestrate\n---');
  fs.writeFileSync(path.join(ownedSkill, '.xyeena-managed.json'), JSON.stringify({ managedBy: 'xyeena-agent' }));

  fs.mkdirSync(userSkill, { recursive: true });
  fs.writeFileSync(path.join(userSkill, 'SKILL.md'), 'my personal notes');

  fs.mkdirSync(thirdPartySkill, { recursive: true });
  fs.writeFileSync(path.join(thirdPartySkill, 'SKILL.md'), 'third party skill');

  const preview = previewLegacyMigration({ cwd, runtime: 'codex' });
  assert.equal(preview.migratable.length, 1);
  assert.equal(preview.migratable[0].name, 'xyeena-orchestrate');
  assert.ok(preview.preservedUserSkills.some(s => s.name === 'xyeena-custom-notes'));
  assert.ok(preview.preservedUserSkills.some(s => s.name === 'superior-ux'));

  const migrated = applyLegacyMigration({ cwd, runtime: 'codex', yes: true });
  assert.equal(migrated.migrated, true);
  assert.deepEqual(migrated.migratedSkills, ['xyeena-orchestrate']);
  assert.equal(fs.existsSync(ownedSkill), false);
  assert.equal(fs.existsSync(userSkill), true);
  assert.equal(fs.existsSync(thirdPartySkill), true);
  assert.equal(fs.existsSync(path.join(skillsBase, 'xyeena-rig', 'SKILL.md')), true);

  const rollback = rollbackLegacyMigration({ cwd, migrationId: migrated.migrationId, yes: true });
  assert.equal(rollback.rolledBack, true);
  assert.deepEqual(rollback.restoredSkills, ['xyeena-orchestrate']);
  assert.equal(fs.existsSync(ownedSkill), true);
  assert.equal(fs.readFileSync(path.join(ownedSkill, 'SKILL.md'), 'utf8'), '---\nname: xyeena-orchestrate\n---');
});

test('uninstallCompactSetup fails on unowned targets and safely uninstalls owned installations with backup', t => {
  const cwd = temp(t);
  const targetDir = path.join(cwd, '.agents', 'skills', 'xyeena-rig');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), 'unowned content');

  assert.throws(() => uninstallCompactSetup({ cwd, runtime: 'codex', yes: true }), /Refusing to uninstall unowned/);

  fs.rmSync(targetDir, { recursive: true, force: true });
  applyCompactSetup({ cwd, runtime: 'codex', preset: 'essential', yes: true });
  assert.equal(fs.existsSync(targetDir), true);

  const uninstalled = uninstallCompactSetup({ cwd, runtime: 'codex', yes: true });
  assert.equal(uninstalled.uninstalled, true);
  assert.equal(fs.existsSync(targetDir), false);
  assert.ok(fs.existsSync(uninstalled.removedTargets[0].backup));
});

