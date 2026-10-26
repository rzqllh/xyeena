import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { previewOrchestration, executeOrchestration } from '../src/orchestrator.mjs';

function workspace(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-unified-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
function add(root,folder,name,description='Debug code regression and inspect test failures') {
  const directory=path.join(root,folder,name);
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'SKILL.md'),
    '---\nname: '+name+'\ndescription: '+description+'\n---\n# Test\n');
}
test('unified Codex preview selects installed skills but does not claim CLI execution',t=>{
  const cwd=workspace(t);
  add(cwd,'.agents/skills','xyeena-orchestrate');
  add(cwd,'.agents/skills','systematic-debugging');
  const plan=previewOrchestration({cwd,runtime:'codex',goal:'systematic debugging tests',includeGlobal:false});
  assert.equal(plan.ready,true);
  assert.equal(plan.hostExecutionAvailable,true);
  assert.equal(plan.requiresManualHost,false);
  assert.equal(plan.executed,false);
  assert.equal(plan.entrypoint,'/xyeena-orchestrate');
  assert.ok(plan.selectedSkills.includes('systematic-debugging'));
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena')),false);
});
test('missing or untrusted orchestrator cannot be dispatched',async t=>{
  const cwd=workspace(t);
  const plan=previewOrchestration({cwd,runtime:'gemini',goal:'debug regression',includeGlobal:false});
  assert.equal(plan.ready,false);
  await assert.rejects(executeOrchestration(plan,{yes:true}),/missing or not eligible/);
});
test('Claude headless host needs explicit consent and stays unverified',async t=>{
  const cwd=workspace(t);
  add(cwd,'.claude/skills','xyeena-orchestrate');
  const plan=previewOrchestration({cwd,runtime:'claude',goal:'review PR',includeGlobal:false});
  assert.equal(plan.execution,'cli-one-shot');
  await assert.rejects(executeOrchestration(plan),/explicit --yes/);
  const result=await executeOrchestration(plan,{yes:true,
    portableAdapterFactory:options=>{
      assert.equal(options.runtime,'claude');
      return {async executeTask(){return {executed:true,verified:false,report:'Review'};}};
    }});
  assert.equal(result.status,'REVIEW_REQUIRED');
});
test('host CLI execution needs explicit consent and results remain REVIEW_REQUIRED',async t=>{
  const cwd=workspace(t);
  add(cwd,'.gemini/skills','xyeena-orchestrate');
  const plan=previewOrchestration({cwd,runtime:'gemini',goal:'inspect test coverage',includeGlobal:false});
  let calls=0;
  const factory=({runtime,selectedSkills})=>{
    assert.equal(runtime,'gemini');
    assert.deepEqual(selectedSkills,['xyeena-orchestrate']);
    return { async executeTask(){calls++;return {executed:true,verified:true,evidenceRefs:['untrusted'],report:'Inspected'};} };
  };
  await assert.rejects(executeOrchestration(plan,{portableAdapterFactory:factory}),/explicit --yes/);
  assert.equal(calls,0);
  const result=await executeOrchestration(plan,{yes:true,portableAdapterFactory:factory});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.verified,false);
  assert.deepEqual(result.evidenceRefs,[]);
  assert.equal(calls,1);
});
test('Antigravity read-only SDK is the only supported explicit --delegate path',async t=>{
  const cwd=workspace(t);
  add(cwd,'.agents/skills','xyeena-orchestrate');
  const plan=previewOrchestration({cwd,runtime:'antigravity',goal:'review code',includeGlobal:false});
  const result=await executeOrchestration(plan,{yes:true,delegate:true,
    antigravityAdapterFactory:options=>{
      assert.equal(options.enableSubagents,true);
      assert.equal(options.skillPaths.length,1);
      return {async executeTask(){return {executed:true,verified:false,evidenceRefs:[],report:'Report'};}};
    }});
  assert.equal(result.status,'REVIEW_REQUIRED');
  const gemini=previewOrchestration({cwd,runtime:'gemini',goal:'review code',includeGlobal:false});
  await assert.rejects(executeOrchestration(gemini,{yes:true,delegate:true}),/Subagent delegation/);
});
test('preview validates runtime, state and bounded inputs before side effects',t=>{
  const cwd=workspace(t);
  assert.throws(()=>previewOrchestration({cwd,runtime:'not-a-host',goal:'test'}),/supported AI host/);
  assert.throws(()=>previewOrchestration({cwd,runtime:'codex',goal:''}),/bounded orchestration goal/);
  assert.throws(()=>previewOrchestration({cwd,runtime:'codex',goal:'test',state:'WRONG'}),/workflow state/);
  assert.throws(()=>previewOrchestration({cwd,runtime:'codex',goal:'test',maxSupporting:200}),/supporting-skill/);
});

test('stale selected skill or revoked trust is blocked before launching a host',async t=>{
  const cwd=workspace(t);
  add(cwd,'.gemini/skills','xyeena-orchestrate');
  add(cwd,'.gemini/skills','systematic-debugging');
  const plan=previewOrchestration({cwd,runtime:'gemini',goal:'systematic debugging regression',
    includeGlobal:false});
  assert.ok(plan.selectedSkills.includes('systematic-debugging'));
  fs.rmSync(path.join(cwd,'.gemini/skills/systematic-debugging'),{recursive:true});
  let invoked=false;
  await assert.rejects(executeOrchestration(plan,{yes:true,
    portableAdapterFactory:()=>{invoked=true;return {};} }),/inventory changed/);
  assert.equal(invoked,false);
});

test('manifest content change invalidates preview even when selected skill names stay equal',async t=>{
  const cwd=workspace(t);
  add(cwd,'.gemini/skills','xyeena-orchestrate');
  const plan=previewOrchestration({cwd,runtime:'gemini',goal:'review tests',includeGlobal:false});
  const file=path.join(cwd,'.gemini','skills','xyeena-orchestrate','SKILL.md');
  fs.appendFileSync(file,'\n# Different instructions since approval preview\n');
  let called=false;
  await assert.rejects(executeOrchestration(plan,{yes:true,portableAdapterFactory:()=>{
    called=true;return {executeTask:async()=>({})};
  }}),/inventory changed/);
  assert.equal(called,false);
});

test('regression P02: content change is rejected even when adaptiveFallback is true', async t => {
  const cwd = workspace(t);
  add(cwd, '.gemini/skills', 'xyeena-orchestrate');
  const plan = previewOrchestration({ cwd, runtime: 'gemini', goal: 'review tests', includeGlobal: false });
  const file = path.join(cwd, '.gemini', 'skills', 'xyeena-orchestrate', 'SKILL.md');
  fs.appendFileSync(file, '\n# Altered skill instructions\n');
  let called = false;
  await assert.rejects(executeOrchestration(plan, {
    yes: true,
    adaptiveFallback: true,
    portableAdapterFactory: () => { called = true; return { executeTask: async () => ({}) }; }
  }), /contents were modified/);
  assert.equal(called, false);
});

test('regression P02: adaptive fallback passes effective fallback skills and paths to adapter', async t => {
  const cwd = workspace(t);
  add(cwd, '.gemini/skills', 'xyeena-orchestrate');
  add(cwd, '.gemini/skills', 'systematic-debugging');
  const plan = previewOrchestration({ cwd, runtime: 'gemini', goal: 'debug regression', includeGlobal: false });
  // Remove systematic-debugging to simulate missing external skill
  fs.rmSync(path.join(cwd, '.gemini/skills/systematic-debugging'), { recursive: true });

  let passedSkills = null;
  const result = await executeOrchestration(plan, {
    yes: true,
    adaptiveFallback: true,
    portableAdapterFactory: (opts) => {
      passedSkills = opts.selectedSkills;
      return { executeTask: async () => ({ output: 'ok' }) };
    }
  });

  // Must have passed xyeena-debug (the fallback for systematic-debugging)
  assert.ok(passedSkills.includes('xyeena-debug'));
  assert.ok(!passedSkills.includes('systematic-debugging'));
  assert.deepEqual(result.selectedSkills, passedSkills);
});

test('orchestrator propagates cancellation to the native adapter and rejects pre-aborted tasks',async t=>{
  const cwd=workspace(t);
  add(cwd,'.gemini/skills','xyeena-orchestrate');
  const plan=previewOrchestration({cwd,runtime:'gemini',goal:'Review source',includeGlobal:false});
  const preAborted=new AbortController();
  preAborted.abort();
  let called=false;
  await assert.rejects(executeOrchestration(plan,{
    yes:true,signal:preAborted.signal,
    portableAdapterFactory:()=>{called=true;throw Error('never create worker');}
  }),e=>e.code==='ERR_ORCHESTRATION_CANCELED');
  assert.equal(called,false);
  const controller=new AbortController();
  const report=await executeOrchestration(plan,{
    yes:true,signal:controller.signal,
    portableAdapterFactory:()=>({
      async executeTask(task,{signal}){
        assert.equal(task.scope.readOnly,true);
        assert.equal(signal,controller.signal);
        return {executed:true,verified:false,report:'Observed read-only state'};
      }
    })
  });
  assert.equal(report.status,'REVIEW_REQUIRED');
});
