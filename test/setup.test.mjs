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
test('repeated setup preserves inventory; modified skill conflict fails before changes',t=>{
  const cwd=fixture(t);
  const options={cwd,runtime:'codex',preset:'essential',harness:'none'};
  applySetup({...options,yes:true});
  assert.equal(previewSetup(options).filesToWrite,0);
  const file=path.join(cwd,'.agents/skills/xyeena-orchestrate/SKILL.md');
  fs.appendFileSync(file,'\n# own custom instructions\n');
  const before=fs.readFileSync(file,'utf8');
  assert.throws(()=>applySetup({...options,yes:true}),/overwrite modified|overwrite/);
  assert.equal(fs.readFileSync(file,'utf8'),before);
  assert.throws(()=>applySetup({...options,yes:false}),/explicit --yes/);
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
