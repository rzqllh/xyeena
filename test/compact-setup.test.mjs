import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { previewCompactSetup, applyCompactSetup } from '../src/compact-setup.mjs';
import { discoverWorkspaceSkills } from '../src/workspace-skills.mjs';
import { previewOrchestration } from '../src/orchestrator.mjs';

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
