import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { previewSetup, applySetup, previewSetupDiff, guidedSetup } from '../src/setup.mjs';
import { listSetupBackups, previewSetupRollback, runSetupRollback } from '../src/setup-rollback.mjs';

const bin=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
function workspace(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-rollback-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
const cli=(cwd,args)=>spawnSync(process.execPath,[bin,...args],{cwd,encoding:'utf8',timeout:20000});
const params=cwd=>({cwd,runtime:'antigravity',preset:'essential',harness:'none'});
const orchestrator=cwd=>path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
const rule=cwd=>path.join(cwd,'.agents/rules/xyeena-core.md');

test('diff only reads a listed conflict and never alters destination',t=>{
  const cwd=workspace(t),opts=params(cwd);
  applySetup({...opts,yes:true});
  const file=orchestrator(cwd);
  fs.appendFileSync(file,'\n# CUSTOM EDIT\n');
  const before=fs.readFileSync(file,'utf8');
  const result=previewSetupDiff({...opts,file:'.agents/skills/xyeena-orchestrate/SKILL.md'});
  assert.equal(result.status,'conflict');
  assert.ok(result.diff.some(line=>line.includes('CUSTOM EDIT')));
  assert.equal(fs.readFileSync(file,'utf8'),before);
  assert.throws(()=>previewSetupDiff({...opts,file:'../../secrets.txt'}),/listed conflict/);
  assert.throws(()=>previewSetupDiff({...opts,file:'.agents/skills/xyeena-core/SKILL.md'}),/listed conflict/);
});

test('selected conflict update replaces exactly one specified file, backs it up',t=>{
  const cwd=workspace(t),opts=params(cwd);
  applySetup({...opts,yes:true});
  const skill=orchestrator(cwd),policy=rule(cwd);
  const skillOrig=fs.readFileSync(skill,'utf8'), ruleOrig=fs.readFileSync(policy,'utf8');
  fs.appendFileSync(skill,'\n# owner modification\n');
  fs.appendFileSync(policy,'\n# local policy\n');
  const select=['.agents/skills/xyeena-orchestrate/SKILL.md'];
  const prev=previewSetup({...opts,replaceFiles:select});
  assert.equal(prev.conflictPolicy,'selected');
  assert.equal(prev.conflicts.length,2);
  assert.deepEqual(prev.selectedReplacements,select);
  const result=applySetup({...opts,replaceFiles:select,yes:true,expectedFingerprint:prev.fingerprint});
  assert.deepEqual(result.conflictsReplaced,select);
  assert.deepEqual(result.conflictsPreserved,['.agents/rules/xyeena-core.md']);
  assert.equal(fs.readFileSync(skill,'utf8'),skillOrig);
  assert.match(fs.readFileSync(policy,'utf8'),/local policy/);
  assert.equal(fs.readFileSync(path.join(cwd,result.backupDirectory,select[0]),'utf8'),skillOrig+'\n# owner modification\n');
  assert.throws(()=>previewSetup({...opts,replaceFiles:['.agents/skills/xyeena-core/SKILL.md']}),/listed conflict/);
  assert.throws(()=>previewSetup({...opts,update:true,replaceFiles:select}),/either --update/);
  assert.ok(ruleOrig.length>0);
});
test('wizard can choose specific conflicting file numbers and reaches final confirmation',async t=>{
  const cwd=workspace(t),opts=params(cwd);
  applySetup({...opts,yes:true});
  fs.appendFileSync(orchestrator(cwd),'\n# owner change\n');
  fs.appendFileSync(rule(cwd),'\n# policy change\n');
  const originalRule=fs.readFileSync(rule(cwd),'utf8');
  const outputs=[];
  // 3=Antigravity, 1=essential, 1=without harness, 3=per file, 2=orchestrator, y=install
  const answers=['3','1','1','3','2','y']; let i=0;
  const result=await guidedSetup({cwd,ask:async()=>answers[i++],output:{write:line=>outputs.push(line)}});
  assert.deepEqual(result.conflictsReplaced,['.agents/skills/xyeena-orchestrate/SKILL.md']);
  assert.equal(fs.readFileSync(rule(cwd),'utf8'),originalRule);
  assert.match(outputs.join(''),/Choose specific conflicting files/);
});
test('new installation can be rolled back with journal, removing only created package files',t=>{
  const cwd=workspace(t),opts=params(cwd);
  const installed=applySetup({...opts,yes:true});
  assert.ok(installed.backupDirectory);
  const id=path.basename(installed.backupDirectory);
  const backups=listSetupBackups({cwd});
  assert.equal(backups[0].id,id);
  assert.equal(backups[0].rollbackSupported,true);
  const preview=previewSetupRollback({cwd,id});
  assert.equal(preview.available,true);
  assert.ok(preview.removeCreated.includes('.agents/skills/xyeena-orchestrate/SKILL.md'));
  const third=path.join(cwd,'.agents/skills/third-party/SKILL.md');
  fs.mkdirSync(path.dirname(third),{recursive:true});
  fs.writeFileSync(third,'# third-party stays\n');
  assert.throws(()=>runSetupRollback({cwd,id}),/explicit --yes/);
  const result=runSetupRollback({cwd,id,yes:true,expectedFingerprint:preview.fingerprint});
  assert.equal(result.rolledBack,true);
  assert.ok(!fs.existsSync(orchestrator(cwd)));
  assert.equal(fs.readFileSync(third,'utf8'),'# third-party stays\n');
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena/backups',id,'rollback.json')),true);
  assert.equal(previewSetupRollback({cwd,id}).available,false);
});
test('upgrade can be rolled back to prior custom skill and manifest bytes',t=>{
  const cwd=workspace(t),opts=params(cwd);
  applySetup({...opts,yes:true});
  fs.appendFileSync(orchestrator(cwd),'\n# personalized instructions\n');
  const before=fs.readFileSync(orchestrator(cwd),'utf8');
  const oldManifest=fs.readFileSync(path.join(cwd,'.xyeena/install.json'),'utf8');
  const updated=applySetup({...opts,update:true,yes:true});
  const id=path.basename(updated.backupDirectory);
  const preview=previewSetupRollback({cwd,id});
  assert.equal(preview.available,true);
  const run=runSetupRollback({cwd,id,yes:true,expectedFingerprint:preview.fingerprint});
  assert.equal(run.rolledBack,true);
  assert.equal(fs.readFileSync(orchestrator(cwd),'utf8'),before);
  assert.equal(fs.readFileSync(path.join(cwd,'.xyeena/install.json'),'utf8'),oldManifest);
});
test('later file edits block automatic rollback, including optional CLI --yes',t=>{
  const cwd=workspace(t),opts=params(cwd);
  const installed=applySetup({...opts,yes:true});
  const id=path.basename(installed.backupDirectory);
  fs.appendFileSync(orchestrator(cwd),'\nnew edit AFTER setup\n');
  assert.equal(previewSetupRollback({cwd,id}).available,false);
  assert.throws(()=>runSetupRollback({cwd,id,yes:true}),/changed since install/);
  const x=cli(cwd,['setup','rollback','--id',id,'--yes']);
  assert.notEqual(x.status,0);
  assert.match(fs.readFileSync(orchestrator(cwd),'utf8'),/AFTER setup/);
});
test('older journal-less backups are visible but cannot be automatically rolled back',t=>{
  const cwd=workspace(t);
  const folder=path.join(cwd,'.xyeena/backups/2026-10-21T11-40-15-928Z-5bcaf8fa');
  fs.mkdirSync(path.join(folder,'.agents/skills/xyeena-orchestrate'),{recursive:true});
  fs.writeFileSync(path.join(folder,'.agents/skills/xyeena-orchestrate/SKILL.md'),'legacy\n');
  const id=path.basename(folder);
  assert.equal(previewSetupRollback({cwd,id}).legacy,true);
  assert.equal(previewSetupRollback({cwd,id}).available,false);
  assert.throws(()=>runSetupRollback({cwd,id,yes:true}),/Older backup has no rollback journal/);
});
test('CLI listing, diff and rollback preview are read-only',t=>{
  const cwd=workspace(t);
  const no=cli(cwd,['setup','backups']);
  assert.equal(no.status,0,no.stderr);
  assert.deepEqual(JSON.parse(no.stdout),[]);
  const installed=applySetup({...params(cwd),yes:true});
  const id=path.basename(installed.backupDirectory);
  const list=cli(cwd,['setup','backups']);
  assert.equal(list.status,0,list.stderr);
  assert.equal(JSON.parse(list.stdout)[0].id,id);
  const prev=cli(cwd,['setup','rollback','--id',id,'--dry-run']);
  assert.equal(prev.status,0,prev.stderr);
  assert.equal(JSON.parse(prev.stdout).available,true);
  const refused=cli(cwd,['setup','rollback','--id',id]);
  assert.notEqual(refused.status,0);
  fs.appendFileSync(orchestrator(cwd),'\n# differ\n');
  const diff=cli(cwd,['setup','diff','--runtime','antigravity','--file',
    '.agents/skills/xyeena-orchestrate/SKILL.md']);
  assert.equal(diff.status,0,diff.stderr);
  assert.equal(JSON.parse(diff.stdout).status,'conflict');
});
