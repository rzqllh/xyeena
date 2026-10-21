import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setupSelection, previewSetup, applySetup, guidedSetup, setupRuntimeHints } from '../src/setup.mjs';

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-easy-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  return cwd;
}
const bin=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
const call=(cwd,args)=>spawnSync(process.execPath,[bin,...args],{cwd,encoding:'utf8',timeout:10000});

test('quick setup preview chooses only packaged orchestrator and mandatory dependencies',t=>{
  const cwd=fixture(t);
  const plan=previewSetup({cwd,runtime:'hermes',preset:'essential'});
  assert.deepEqual(plan.runtimes,['hermes']);
  assert.deepEqual(plan.skills,['xyeena-orchestrate']);
  assert.ok(plan.filesToWrite>0);
  assert.ok(plan.autoDependencies.includes('xyeena-core'));
  assert.equal(fs.readdirSync(cwd).length,0);
  assert.equal(plan.noProviderCalls,true);
});
test('balanced and complete presets stay explicit and include no Harness by default',t=>{
  const cwd=fixture(t);
  const balanced=setupSelection({runtime:'gemini,hermes',preset:'balanced'});
  assert.deepEqual(balanced.runtimes,['gemini','hermes']);
  assert.ok(balanced.skills.includes('xyeena-verify'));
  assert.deepEqual(balanced.guards,[]);
  const complete=setupSelection({runtime:'all-supported',preset:'complete',harness:'full'});
  assert.equal(complete.runtimes.length,5);
  assert.equal(complete.skills.length,19);
  assert.equal(complete.guards.length,11);
  assert.throws(()=>previewSetup({cwd,preset:'essential'}),/Choose the AI runtime/);
  assert.throws(()=>setupSelection({runtime:'unknown'}),/Unknown selection/);
  assert.throws(()=>setupSelection({runtime:'codex',preset:'something'}),/Unknown setup preset/);
});
test('guided beginner flow cancels without touching project',async t=>{
  const cwd=fixture(t),out=[];
  const replies=['1','1','1','n'];let i=0;
  const result=await guidedSetup({cwd,ask:async()=>replies[i++],
    output:{write:text=>out.push(text)}});
  assert.equal(result.cancelled,true);
  assert.deepEqual(fs.readdirSync(cwd),[]);
  assert.match(out.join(''),/No files written/);
});
test('guided setup installs only user-selected Hermes and Gemini skills',async t=>{
  const cwd=fixture(t),out=[];
  const replies=['1,2','1','2','yes'];let i=0;
  const result=await guidedSetup({cwd,ask:async()=>replies[i++],
    output:{write:text=>out.push(text)}});
  assert.equal(result.installed,true);
  assert.deepEqual(result.runtimes,['hermes','gemini']);
  assert.ok(fs.existsSync(path.join(cwd,'.hermes/skills/xyeena-orchestrate/SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd,'.gemini/skills/xyeena-orchestrate/SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd,'.xyeena/harness/guides/60-security/README.md')));
  assert.equal(fs.existsSync(path.join(cwd,'.claude')),false);
  assert.equal(fs.existsSync(path.join(cwd,'AGENTS.md')),false);
  assert.match(out.join(''),/No API keys/);
});
test('repeated setup preserves inventory, custom files, and safely backs up before replacement',t=>{
  const cwd=fixture(t);
  const options={cwd,runtime:'codex',preset:'essential',harness:'none'};
  applySetup({...options,yes:true});
  assert.equal(previewSetup(options).filesToWrite,0);
  const file=path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
  const original=fs.readFileSync(file,'utf8');
  fs.appendFileSync(file,'\n# own custom instructions\n');
  const custom=fs.readFileSync(file,'utf8');
  const preview=previewSetup(options);
  assert.ok(preview.conflicts.includes('.agents/skills/xyeena-orchestrate/SKILL.md'));
  assert.equal(preview.conflictPolicy,'keep');
  const keep=applySetup({...options,yes:true});
  assert.equal(keep.conflictsPreserved.length,1);
  assert.equal(fs.readFileSync(file,'utf8'),custom);
  const newPlan=previewSetup({...options,update:true});
  assert.equal(newPlan.conflictPolicy,'backup-replace');
  const updated=applySetup({...options,update:true,yes:true,expectedFingerprint:newPlan.fingerprint});
  assert.equal(updated.conflictsReplaced.length,1);
  assert.equal(fs.readFileSync(file,'utf8'),original);
  assert.ok(updated.backupDirectory);
  const copy=path.join(cwd,updated.backupDirectory,'.agents/skills/xyeena-orchestrate/SKILL.md');
  assert.equal(fs.readFileSync(copy,'utf8'),custom);
  assert.equal(fs.readFileSync(path.join(cwd,updated.backupDirectory,'.gitignore'),'utf8'),'*'+'\n'+'!.gitignore'+'\n');
  assert.throws(()=>applySetup({...options,yes:false}),/explicit --yes/);
});

test('interactive conflict resolution reaches review and can preserve or back up custom skills',async t=>{
  const cwd=fixture(t);
  applySetup({cwd,runtime:'antigravity',preset:'essential',yes:true});
  const file=path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
  const original=fs.readFileSync(file,'utf8');
  fs.appendFileSync(file,'\n# hand-edited before update\n');
  const custom=fs.readFileSync(file,'utf8');
  const out=[];
  const replies=['3','1','1','1','y'];let i=0;
  const kept=await guidedSetup({cwd,ask:async()=>replies[i++],output:{write:t=>out.push(t)}});
  assert.equal(kept.installed,true);
  assert.equal(kept.conflictsPreserved.length,1);
  assert.equal(fs.readFileSync(file,'utf8'),custom);
  assert.match(out.join(''),/Existing skill\/Harness files differ/);
  assert.match(out.join(''),/Review before installation/);
  const replaceReplies=['3','1','1','2','y'];let j=0;
  const updated=await guidedSetup({cwd,ask:async()=>replaceReplies[j++],output:{write:()=>{}}});
  assert.equal(updated.conflictsReplaced.length,1);
  assert.equal(fs.readFileSync(file,'utf8'),original);
  assert.equal(fs.readFileSync(path.join(cwd,updated.backupDirectory,'.agents/skills/xyeena-orchestrate/SKILL.md'),'utf8'),custom);
});

test('stale preview fingerprint blocks update before a single project write',t=>{
  const cwd=fixture(t),options={cwd,runtime:'codex',preset:'essential'};
  applySetup({...options,yes:true});
  const file=path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
  const plan=previewSetup({...options,update:true});
  fs.appendFileSync(file,'\nnew local change\n');
  assert.throws(()=>applySetup({...options,yes:true,update:true,expectedFingerprint:plan.fingerprint}),/changed since the review/);
  assert.match(fs.readFileSync(file,'utf8'),/new local change/);
});

test('custom third-party skill is untouched across complete setup and update',t=>{
  const cwd=fixture(t);
  const third=path.join(cwd,'.agents/skills/external-special/SKILL.md');
  fs.mkdirSync(path.dirname(third),{recursive:true});
  fs.writeFileSync(third,'# Custom third-party skill\n');
  const opts={cwd,runtime:'antigravity',preset:'complete',harness:'full'};
  applySetup({...opts,yes:true});
  applySetup({...opts,update:true,yes:true});
  assert.equal(fs.readFileSync(third,'utf8'),'# Custom third-party skill\n');
});
test('setup detects hints but never assumes Ambiguous .agents folder is a chosen host',t=>{
  const cwd=fixture(t);
  fs.mkdirSync(path.join(cwd,'.agents'));
  const hints=setupRuntimeHints(cwd);
  assert.ok(hints.includes('codex')&&hints.includes('antigravity'));
  assert.equal(previewSetup({cwd,runtime:'gemini'}).runtimes[0],'gemini');
});
test('CLI setup dry-run and explicit consent work from packed-compatible entry point',t=>{
  const cwd=fixture(t);
  const dry=call(cwd,['setup','--runtime','hermes','--preset','balanced','--harness','essential','--dry-run']);
  assert.equal(dry.status,0,dry.stderr);
  const plan=JSON.parse(dry.stdout);
  assert.equal(plan.filesToWrite>0,true);
  assert.equal(fs.readdirSync(cwd).length,0);
  const refused=call(cwd,['setup','--runtime','hermes','--preset','essential']);
  assert.notEqual(refused.status,0);
  assert.equal(fs.readdirSync(cwd).length,0);
  const result=call(cwd,['setup','--runtime','hermes','--preset','essential','--yes']);
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.installed,true);
  assert.equal(report.diagnostics[0].host,'hermes');
});

test('PowerShell-style split runtime arguments fail closed instead of installing partial selection',t=>{
  const cwd=fixture(t);
  const result=call(cwd,['setup','--runtime','hermes','gemini','--preset','essential','--yes']);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/quote comma-separated runtimes/);
  assert.deepEqual(fs.readdirSync(cwd),[]);
});

test('setup explicitly rejects unknown or blind --force flags without project mutations',t=>{
  const cwd=fixture(t);
  const a=call(cwd,['setup','--runtime','antigravity','--froce','--yes']);
  assert.notEqual(a.status,0);
  assert.match(a.stderr,/Unrecognized setup option/);
  const b=call(cwd,['setup','--runtime','antigravity','--force','--yes']);
  assert.notEqual(b.status,0);
  assert.match(b.stderr,/Use --update/);
  assert.deepEqual(fs.readdirSync(cwd),[]);
});
test('CLI --update preserves backups of custom files and reports them',t=>{
  const cwd=fixture(t),file=path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
  assert.equal(call(cwd,['setup','--runtime','antigravity','--yes']).status,0);
  const original=fs.readFileSync(file,'utf8');
  fs.appendFileSync(file,'\nCUSTOM MARKER\n');
  const dry=call(cwd,['setup','--runtime','antigravity','--update','--dry-run']);
  assert.equal(dry.status,0,dry.stderr);
  const preview=JSON.parse(dry.stdout);
  assert.ok(preview.conflicts.length>0);
  assert.ok(preview.filesToWrite>0);
  assert.equal(preview.conflictPolicy,'backup-replace');
  const run=call(cwd,['setup','--runtime','antigravity','--update','--yes']);
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.ok(report.conflictsReplaced.length>0);
  assert.ok(report.backupDirectory);
  assert.equal(fs.readFileSync(file,'utf8'),original);
  assert.match(fs.readFileSync(path.join(cwd,report.backupDirectory,'.agents/skills/xyeena-orchestrate/SKILL.md'),'utf8'),/CUSTOM MARKER/);
});
test('public beginner runtime choices never mention Xyn or a personal bot identity',async t=>{
  const cwd=fixture(t),writes=[];
  const replies=['0','1','1','n'];let i=0;
  await guidedSetup({cwd,ask:async()=>replies[i++],output:{write:v=>writes.push(v)}}).catch(()=>{});
  assert.doesNotMatch(writes.join(''),/\bXyn\b|Telegram gateway/i);
});
