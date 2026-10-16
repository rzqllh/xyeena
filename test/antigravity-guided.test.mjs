import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectGuidedHooks, installGuidedHooks, removeGuidedHooks, GROUP } from '../src/antigravity-guided.mjs';
import { handleAntigravityHook, bindConversation, checkpoint, discoverTasks } from '../src/antigravity-hook.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const make = () => fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-guided-'));
const clean = p => fs.rmSync(p, { recursive: true, force: true });
const config = d => path.join(d, '.agents', 'hooks.json');
const runId = 'run-test-1234';
function unfinished(d, { state='READY', cwd=d }={}) {
  const folder = path.join(d,'.xyeena','runs',runId);
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'snapshot.json'),JSON.stringify({
    run_id:runId,cwd,goal:'Fix regression',workflow_state:'EXECUTE',
    claims:{},decisions:{},tasks:{task1:{id:'task1',title:'Fix failing test',state}}
  }));
}
test('core rule has documented Antigravity activation frontmatter',()=>{
  const content=fs.readFileSync(path.join(root,'rules','xyeena-core.md'),'utf8');
  assert.match(content,/^---\r?\ntrigger: always_on\r?\n/);
});
test('preview is read-only and installing requires explicit approval',()=>{
  const d=make();
  try{
    const p=inspectGuidedHooks({cwd:d});
    assert.equal(p.installed,false);
    assert.equal(fs.existsSync(config(d)),false);
    assert.equal(fs.existsSync(path.join(d,'.xyeena')),false);
    assert.throws(()=>installGuidedHooks({cwd:d}),/approval/);
    assert.equal(fs.existsSync(config(d)),false);
  }finally{clean(d)}
});
test('install preserves other hooks, supports idempotence, and removes only owned entry',()=>{
  const d=make();
  try{
    fs.mkdirSync(path.dirname(config(d)),{recursive:true});
    fs.writeFileSync(config(d),JSON.stringify({other:{enabled:false,Stop:[]}}));
    const first=installGuidedHooks({cwd:d,approved:true});
    assert.equal(first.changed,true);
    assert.ok(fs.existsSync(first.backup));
    const content=JSON.parse(fs.readFileSync(config(d),'utf8'));
    assert.deepEqual(content.other,{enabled:false,Stop:[]});
    assert.ok(content[GROUP]?.SessionStart);
    assert.deepEqual(content[GROUP].PreToolUse[0].matcher,'*');
    assert.equal(installGuidedHooks({cwd:d,approved:true}).changed,false);
    const result=removeGuidedHooks({cwd:d,approved:true});
    assert.equal(result.changed,true);
    assert.deepEqual(JSON.parse(fs.readFileSync(config(d),'utf8')),{other:{enabled:false,Stop:[]}});
    assert.equal(removeGuidedHooks({cwd:d,approved:true}).changed,false);
  }finally{clean(d)}
});
test('owned group edits fail closed; existing unknown group is untouched',()=>{
  const d=make();
  try{
    fs.mkdirSync(path.dirname(config(d)),{recursive:true});
    fs.writeFileSync(config(d),JSON.stringify({[GROUP]:{enabled:false}}));
    assert.throws(()=>installGuidedHooks({cwd:d,approved:true}),/not owned/);
    assert.deepEqual(JSON.parse(fs.readFileSync(config(d),'utf8')),{[GROUP]:{enabled:false}});
    fs.writeFileSync(config(d),'{}');
    installGuidedHooks({cwd:d,approved:true});
    const edited=JSON.parse(fs.readFileSync(config(d),'utf8'));
    edited[GROUP].enabled=false;
    fs.writeFileSync(config(d),JSON.stringify(edited));
    assert.throws(()=>removeGuidedHooks({cwd:d,approved:true}),/modified/);
  }finally{clean(d)}
});
test('explicit global scope does not touch workspace hooks',()=>{
  const d=make(),home=make();
  try{
    const r=installGuidedHooks({cwd:d,scope:'global',home,approved:true});
    assert.ok(r.config.startsWith(home));
    assert.equal(fs.existsSync(config(d)),false);
    assert.equal(removeGuidedHooks({cwd:d,scope:'global',home,approved:true}).changed,true);
  }finally{clean(d);clean(home)}
});
test('smart resume suggests but never binds task implicitly',()=>{
  const d=make();
  try{
    unfinished(d);
    const payload={workspacePaths:[d],conversationId:'conversation-1234'};
    const result=handleAntigravityHook('SessionStart',payload);
    assert.equal(result.injectSteps.length,1);
    assert.match(result.injectSteps[0].ephemeralMessage,/Offer resume only/);
    assert.equal(fs.existsSync(path.join(d,'.xyeena','rig','bindings')),false);
    const binding=bindConversation(d,'conversation-1234',runId);
    assert.equal(binding.runId,runId);
    const first=handleAntigravityHook('PreInvocation',payload);
    assert.match(first.injectSteps[0].ephemeralMessage,/Fix regression/);
    assert.deepEqual(handleAntigravityHook('PreInvocation',payload),{});
    assert.deepEqual(handleAntigravityHook('Stop',payload),{decision:'stop'});
    const checkpointFile=path.join(d,'.xyeena','runs',runId,'checkpoint.json');
    assert.ok(fs.existsSync(checkpointFile));
  }finally{clean(d)}
});
test('a closed or foreign-workspace task cannot be resumed',()=>{
  const d=make(),other=make();
  try{
    unfinished(d,{state:'VERIFIED'});
    assert.deepEqual(discoverTasks(d),[]);
    assert.throws(()=>bindConversation(d,'conversation-1234',runId),/not resumable/);
    unfinished(d,{state:'READY',cwd:other});
    assert.deepEqual(discoverTasks(d),[]);
    assert.throws(()=>checkpoint(d,runId),/another workspace/);
  }finally{clean(d);clean(other)}
});
test('three repeated tool failures produce one nudge, no auto-continue',()=>{
  const d=make();
  try{
    fs.mkdirSync(path.join(d,'.xyeena'),{recursive:true});
    const payload={workspacePaths:[d],conversationId:'conversation-1234',
      toolCall:{name:'run_command',args:{CommandLine:'exit 1'}},error:'failed'};
    for(let i=0;i<3;i++)assert.deepEqual(handleAntigravityHook('PostToolUse',payload),{});
    const a=handleAntigravityHook('PreInvocation',payload);
    assert.match(a.injectSteps[0].ephemeralMessage,/failed repeatedly/);
    assert.deepEqual(handleAntigravityHook('PreInvocation',payload),{});
    assert.deepEqual(handleAntigravityHook('PreToolUse',payload),{decision:'allow'});
    assert.deepEqual(handleAntigravityHook('Stop',payload),{decision:'stop'});
    assert.equal(JSON.stringify(a).includes('exit 1'),false);
  }finally{clean(d)}
});
test('installed launcher handles documented PreToolUse and Stop schemas',()=>{
  const d=make();
  try{
    installGuidedHooks({cwd:d,approved:true});
    const launcher=path.join(d,'.xyeena','rig','antigravity-hook.mjs');
    for(const [event,expected] of [['PreToolUse','allow'],['Stop','stop']]){
      const p=spawnSync(process.execPath,[launcher,event],{
        input:JSON.stringify({workspacePaths:[d],conversationId:'conversation-1234'}),
        encoding:'utf8',timeout:5000
      });
      assert.equal(p.status,0,p.stderr);
      assert.equal(JSON.parse(p.stdout).decision,expected);
    }
  }finally{clean(d)}
});
test('CLI preview does not modify a fresh workspace',()=>{
  const d=make();
  try{
    const r=spawnSync(process.execPath,[path.join(root,'bin','xyeena.mjs'),'antigravity','hooks','preview','--dir',d],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    assert.match(r.stdout,/xyeena-rig-guided/);
    assert.equal(fs.existsSync(path.join(d,'.xyeena')),false);
  }finally{clean(d)}
});
