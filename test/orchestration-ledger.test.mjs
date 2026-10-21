import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { previewOrchestration } from '../src/orchestrator.mjs';
import { recordOrchestrationRun } from '../src/orchestration-ledger.mjs';
import { resumeCapsule } from '../src/antigravity-guided-hook.mjs';

function fixture(t) {
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-ledger-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  const skill=path.join(cwd,'.agents','skills','xyeena-orchestrate');
  fs.mkdirSync(skill,{recursive:true});
  fs.writeFileSync(path.join(skill,'SKILL.md'),
    '---\nname: xyeena-orchestrate\ndescription: Orchestrate read-only tasks\n---\n');
  return cwd;
}
test('recording is opt-in, emits resumable REVIEW_REQUIRED and never saves model answer',async t=>{
  const cwd=fixture(t);
  const plan=previewOrchestration({cwd,runtime:'codex',goal:'Inspect files',includeGlobal:false});
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena')),false);
  const out=await recordOrchestrationRun(plan,async()=>({
    status:'REVIEW_REQUIRED',usageTokens:12,report:'secret-model-output',verified:false
  }));
  assert.equal(out.state,'REVIEW_REQUIRED');
  const dir=path.join(cwd,'.xyeena','runs',out.runId);
  const snapshot=JSON.parse(fs.readFileSync(path.join(dir,'snapshot.json'),'utf8'));
  assert.equal(snapshot.workflow_state,'VERIFY');
  assert.equal(Object.values(snapshot.tasks)[0].state,'REVIEW_REQUIRED');
  assert.equal(snapshot.artifacts['model-result-summary'].usageTokens,12);
  assert.equal(fs.readFileSync(path.join(dir,'journal.jsonl'),'utf8').includes('secret-model-output'),false);
  const capsule=resumeCapsule(cwd,out.runId);
  assert.equal(capsule.goal,'Inspect files');
});
test('failed native execution is recorded without leaking an exception or declaring completion',async t=>{
  const cwd=fixture(t);
  const plan=previewOrchestration({cwd,runtime:'codex',goal:'Audit project',includeGlobal:false});
  await assert.rejects(recordOrchestrationRun(plan,async()=>{
    throw new Error('sensitive-host-error-credential');
  }),/sensitive-host-error/);
  const root=path.join(cwd,'.xyeena','runs');
  const run=fs.readdirSync(root)[0];
  const stored=fs.readFileSync(path.join(root,run,'journal.jsonl'),'utf8');
  assert.equal(stored.includes('sensitive-host-error-credential'),false);
  const snap=JSON.parse(fs.readFileSync(path.join(root,run,'snapshot.json'),'utf8'));
  assert.equal(snap.workflow_state,'DEBUG');
  assert.equal(Object.values(snap.tasks)[0].state,'FAILED');
});
test('run recording refuses linked Xyeena run directories',async t=>{
  const cwd=fixture(t),outside=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-outside-'));
  t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
  try { fs.symlinkSync(outside,path.join(cwd,'.xyeena'),process.platform==='win32'?'junction':'dir'); }
  catch (error) {
    if (['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.skip('Symlinks unavailable');return;}
    throw error;
  }
  const plan={schema:1,executed:false,cwd,goal:'Review',runtime:'codex',selectedSkills:[]};
  await assert.rejects(recordOrchestrationRun(plan,async()=>{}),/Refusing linked/);
  assert.deepEqual(fs.readdirSync(outside),[]);
});
