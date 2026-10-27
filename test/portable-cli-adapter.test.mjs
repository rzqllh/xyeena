import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { previewPortableHost, createPortableHostAdapter } from '../src/portable-cli-adapter.mjs';
import { runTaskGraph } from '../src/task-runner.mjs';

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-headless-'));
  t.after(() => fs.rmSync(cwd,{recursive:true,force:true}));
  return cwd;
}
function addSkill(cwd, relative, name) {
  const folder=path.join(cwd,relative,name);
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'SKILL.md'),
    '---\nname: '+name+'\ndescription: Debug and review code changes\n---\n# Demo\n');
}
function mockProcess(output, { exitCode=0, expectedCommand=null, argsCheck=null, capture=null, stderrOutput='' }={}) {
  return (command,args,options) => {
    if(expectedCommand)assert.ok(command===expectedCommand || path.basename(command, path.extname(command))===expectedCommand);
    if(argsCheck)argsCheck(args);
    assert.equal(options.shell,false);
    const child=new EventEmitter();
    child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();
    child.kill=()=>{child.emit('close',130);};
    if(capture)child.stdin.on('data',chunk=>capture.push(chunk.toString('utf8')));
    process.nextTick(()=>{
      if(stderrOutput)child.stderr.write(stderrOutput);
      child.stderr.end();
      child.stdout.write(output);
      child.stdout.end();
      child.emit('close',exitCode);
    });
    return child;
  };
}

function heldChild() {
  const child=new EventEmitter();
  child.stdin=new PassThrough();
  child.stdout=new PassThrough();
  child.stderr=new PassThrough();
  child.killCount=0;
  child.kill=()=>{child.killCount++;child.emit('close',130);return true;};
  return child;
}

const makeTask=(safe=true)=>({id:'T',title:'Review tests for regression',state:'READY',depends_on:[],
  scope:{readOnly:safe,operationClass:'safe'}});

test('portable preview refuses absent orchestrator and makes no changes',t=>{
  const cwd=fixture(t);addSkill(cwd,'.gemini/skills','systematic-debugging');
  const preview=previewPortableHost({cwd,runtime:'gemini',goal:'systematic debugging',includeGlobal:false});
  assert.equal(preview.ready,false);
  assert.equal(preview.executed,false);
  assert.equal(preview.reason.includes('Install'),true);
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena')),false);
});
test('portable preview selects only available Xyeena and third-party skills',t=>{
  const cwd=fixture(t);
  addSkill(cwd,'.gemini/skills','xyeena-orchestrate');
  addSkill(cwd,'.gemini/skills','systematic-debugging');
  const preview=previewPortableHost({cwd,runtime:'gemini',goal:'systematic debugging regression',includeGlobal:false});
  assert.equal(preview.ready,true);
  assert.deepEqual(preview.requestedSkills.slice(0,2),['xyeena-orchestrate','systematic-debugging']);
  assert.equal(preview.mode,'headless-one-shot');
});
test('Hermes safe one-shot runs native preloaded installed skills, never YOLO',async t=>{
  const cwd=fixture(t);
  const captured=[];
  const adapter=createPortableHostAdapter({cwd,runtime:'hermes',selectedSkills:['xyeena-orchestrate','systematic-debugging'],
    spawnImpl:mockProcess(JSON.stringify({type:'system',subtype:'init'})+'\n'+
      JSON.stringify({type:'result',exit_code:0,text:'Observed review results',tokens:{total:38}})+'\n',
      {expectedCommand:'hermes',capture:captured,argsCheck(args){
        assert.deepEqual(args.slice(0,4),['chat','--query-file','-','--oneshot']);
        assert.ok(args.includes('safe'));
        assert.ok(args.includes('stream-json'));
        assert.ok(args.includes('xyeena-orchestrate,systematic-debugging'));
        assert.ok(!args.includes('--yolo'));
      }})});
  const result=await adapter.executeTask(makeTask());
  assert.equal(result.executed,true);
  assert.equal(result.verified,false);
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.usageTokens,38);
  assert.match(captured.join(''),/Review tests/);
  const graph=await runTaskGraph({tasks:{T:makeTask()},adapter});
  assert.equal(graph.complete,false);
});
test('Gemini headless uses plan mode, JSON and stdin rather than prompt args',async t=>{
  const cwd=fixture(t);const captured=[];
  const adapter=createPortableHostAdapter({cwd,runtime:'gemini',selectedSkills:['xyeena-orchestrate'],
    spawnImpl:mockProcess(JSON.stringify({response:'Plan reviewed',stats:{models:{'flash':{tokens:{total:15}}}}}),
      {expectedCommand:'gemini',capture:captured,argsCheck(args){
        assert.deepEqual(args,['--output-format','json','--approval-mode','plan']);
        assert.ok(!args.includes('--yolo'));
        assert.ok(!args.includes('Plan reviewed'));
      }})});
  const result=await adapter.executeTask(makeTask());
  assert.equal(result.report,'Plan reviewed');
  assert.equal(result.usageTokens,15);
  assert.equal(result.verified,false);
  assert.match(captured.join(''),/read-only/);
});
test('Gemini response accounting rejects invalid totals instead of silently settling partial usage',async t=>{
  const cwd=fixture(t);
  for(const stats of [
    {models:{alpha:{tokens:{total:10}},beta:{tokens:{total:-5}}}},
    {models:{alpha:{tokens:{total:10}},beta:{tokens:{total:'20'}}}},
    {models:{alpha:{tokens:{total:Number.MAX_SAFE_INTEGER}},beta:{tokens:{total:1}}}},
    {models:{}},
  ]) {
    const adapter=createPortableHostAdapter({cwd,runtime:'gemini',
      spawnImpl:mockProcess(JSON.stringify({response:'Review complete',stats}))});
    const result=await adapter.executeTask(makeTask());
    assert.equal(result.report,'Review complete');
    assert.equal(result.usageTokens,null);
  }
  for(const response of [
    {response:' ',stats:{}},
    {response:'fake success',error:{type:'FatalAuthenticationError',message:'private credentials'}},
    {response:'fake success',error:false}
  ]) {
    const adapter=createPortableHostAdapter({cwd,runtime:'gemini',
      spawnImpl:mockProcess(JSON.stringify(response))});
    await assert.rejects(adapter.executeTask(makeTask()),e=>
      /Gemini CLI reported/.test(e.message)&&!e.message.includes('credentials'));
  }
});
test('Claude read-only adapter requires successful terminal JSON, no denied tool and safe accounting',async t=>{
  const cwd=fixture(t);
  const good={type:'result',subtype:'success',is_error:false,result:'Reviewed tests'};
  for(const change of [
    {type:'system'}, {subtype:'error_max_turns'}, {subtype:'error_during_execution'},
    {is_error:true}, {is_error:null}, {result:' '},
    {permission_denials:[{tool_name:'Write',tool_use_id:'bad'}]}
  ]) {
    const adapter=createPortableHostAdapter({cwd,runtime:'claude',
      spawnImpl:mockProcess(JSON.stringify({...good,...change}))});
    await assert.rejects(adapter.executeTask(makeTask()),/successful result/);
  }
  for(const usage of [
    {input_tokens:-1,output_tokens:4},
    {input_tokens:3,output_tokens:'5'},
    {input_tokens:Number.MAX_SAFE_INTEGER,output_tokens:1},
  ]) {
    const adapter=createPortableHostAdapter({cwd,runtime:'claude',
      spawnImpl:mockProcess(JSON.stringify({...good,usage}))});
    const result=await adapter.executeTask(makeTask());
    assert.equal(result.report,'Reviewed tests');
    assert.equal(result.usageTokens,null);
  }
  const positive=createPortableHostAdapter({cwd,runtime:'claude',
    spawnImpl:mockProcess(JSON.stringify({...good,usage:{input_tokens:8,output_tokens:3}}))});
  assert.equal((await positive.executeTask(makeTask())).usageTokens,11);
});
test('host adapter refuses workspace mutations and external operations',async t=>{
  const cwd=fixture(t);
  const adapter=createPortableHostAdapter({cwd,runtime:'hermes',spawnImpl:()=>{throw Error('must not spawn')}});
  await assert.rejects(adapter.executeTask(makeTask(false)),/safe read-only/);
  await assert.rejects(adapter.executeTask({...makeTask(),scope:{readOnly:true,operationClass:'external'}}),/safe read-only/);
  await assert.rejects(adapter.executeTask({...makeTask(),title:' '}),/Invalid task title/);
  assert.throws(()=>createPortableHostAdapter({cwd,runtime:'imaginary'}),/Unsupported portable/);
  assert.throws(()=>createPortableHostAdapter({cwd,runtime:'hermes',selectedSkills:['does not/exists']}),/Invalid selected/);
  assert.throws(()=>createPortableHostAdapter({cwd,runtime:'gemini',timeoutMs:0}),/timeout/);
});
test('nonzero status, invalid JSON, and reported errors cannot be verified',async t=>{
  const cwd=fixture(t);
  const bad1=createPortableHostAdapter({cwd,runtime:'gemini',
    spawnImpl:mockProcess('{"error":{"message":"something"}}')});
  await assert.rejects(bad1.executeTask(makeTask()),/reported an error/);
  const bad2=createPortableHostAdapter({cwd,runtime:'hermes',
    spawnImpl:mockProcess('{"type":"result","exit_code":1,"text":"failed"}')});
  await assert.rejects(bad2.executeTask(makeTask()),/successful final/);
  const bad3=createPortableHostAdapter({cwd,runtime:'gemini',
    spawnImpl:mockProcess('bad', {exitCode:1})});
  await assert.rejects(bad3.executeTask(makeTask()),/nonzero status/);
});

test('Windows CMD launcher uses only safe static arguments, never task text',async t=>{
  const cwd=fixture(t);
  const { portableLaunchPlan }=await import('../src/portable-cli-adapter.mjs');
  const shim=path.join(cwd,'gemini.cmd');
  const plan=portableLaunchPlan({runtime:'gemini',executable:shim,platform:'win32',
    env:{ComSpec:'cmd.exe'},
    args:['--output-format','json','--approval-mode','plan','--extensions','none']});
  assert.equal(plan.command,'cmd.exe');
  assert.deepEqual(plan.args.slice(0,3),['/d','/s','/c']);
  assert.match(plan.args[3],/gemini\.cmd/);
  assert.ok(!plan.args[3].includes('Review tests for regression'));
  assert.throws(()=>portableLaunchPlan({runtime:'hermes',executable:path.join(cwd,'bad&.cmd'),
    platform:'win32',args:['chat']}),/Unsafe Windows shim path/);
  assert.throws(()=>portableLaunchPlan({runtime:'gemini',executable:shim,
    platform:'win32',args:['--model','hello&del']}),/Unsafe portable host arguments/);
});
test('Windows can actually execute a local CMD shim without embedding model prompt in argv',
  {skip:process.platform!=='win32'}, async t=>{
    const cwd=fixture(t), shim=path.join(cwd,'fake-gemini.cmd');
    fs.writeFileSync(shim,'@echo off\r\nmore > NUL\r\necho {"response":"shim success"}\r\n');
    const adapter=createPortableHostAdapter({cwd,runtime:'gemini',command:shim,timeoutMs:10000});
    const result=await adapter.executeTask(makeTask());
    assert.equal(result.report,'shim success');
    assert.equal(result.verified,false);
  });

test('Codex exec uses native read-only sandbox, stdin and structured events',async t=>{
  const cwd=fixture(t), captured=[];
  const events=[
    {type:'thread.started',thread_id:'th'},
    {type:'item.completed',item:{type:'agent_message',text:'Reviewed code'}},
    {type:'turn.completed',usage:{input_tokens:11,output_tokens:5}}
  ].map(x=>JSON.stringify(x)).join('\n')+'\n';
  const adapter=createPortableHostAdapter({cwd,runtime:'codex',
    selectedSkills:['xyeena-orchestrate'],spawnImpl:mockProcess(events,{
      expectedCommand:'codex',capture:captured,argsCheck(args){
        assert.deepEqual(args,['exec','--json','--sandbox','read-only','-']);
        assert.ok(!args.includes('--full-auto'));
      }})});
  const result=await adapter.executeTask(makeTask());
  assert.equal(result.report,'Reviewed code');
  assert.equal(result.usageTokens,16);
  assert.equal(result.verified,false);
  assert.match(captured.join(''),/\$xyeena-orchestrate/);
});
test('Codex cannot report executed result from a partial or reordered JSONL turn',async t=>{
  const cwd=fixture(t);
  const msg={type:'item.completed',item:{type:'agent_message',text:'Unfinished output'}};
  const done={type:'turn.completed',usage:{input_tokens:2,output_tokens:1}};
  const started={type:'turn.started'};
  const encode=events=>events.map(e=>JSON.stringify(e)).join('\n')+'\n';
  const invalidStreams=[
    [started,msg],                          // clean process exit, no completion
    [done,msg],                             // terminal event before result
    [msg,done,started],                     // a new unfinished turn after completion
    [started,msg,done,{type:'error',message:'secret-token'}],
    [started,msg,{type:'turn.failed'}],
    [msg,done,{type:'item.completed',item:{type:'agent_message',text:'Late output'}}],
    [msg,{type:'turn.completed'},started,msg],
    [{type:'thread.started'},null]
  ];
  for(const events of invalidStreams){
    const adapter=createPortableHostAdapter({cwd,runtime:'codex',
      spawnImpl:mockProcess(encode(events))});
    await assert.rejects(adapter.executeTask(makeTask()),
      e=>/Codex/.test(e.message)&&!e.message.includes('secret-token'));
  }
  const valid=createPortableHostAdapter({cwd,runtime:'codex',
    spawnImpl:mockProcess(encode([
      {type:'thread.started'},started,msg,done
    ]))});
  const result=await valid.executeTask(makeTask());
  assert.equal(result.report,'Unfinished output');
  assert.equal(result.usageTokens,3);
  assert.equal(result.verified,false);
  assert.equal(result.status,'REVIEW_REQUIRED');
});
test('Codex accounting ignores invalid or overflowing token totals',async t=>{
  const cwd=fixture(t);
  const payload=usage=>[
    {type:'item.completed',item:{type:'agent_message',text:'Review complete'}},
    {type:'turn.completed',usage}
  ].map(x=>JSON.stringify(x)).join('\n')+'\n';
  for(const u of [
    {input_tokens:-1,output_tokens:1},
    {input_tokens:Number.MAX_SAFE_INTEGER,output_tokens:1},
    {input_tokens:'4',output_tokens:1},
    {input_tokens:4.25,output_tokens:1}
  ]) {
    const adapter=createPortableHostAdapter({cwd,runtime:'codex',
      spawnImpl:mockProcess(payload(u))});
    const out=await adapter.executeTask(makeTask());
    assert.equal(out.report,'Review complete');
    assert.equal(out.usageTokens,null);
    assert.equal(out.verified,false);
  }
});
test('Claude Code launches in bare plan mode without project hooks and parses JSON',async t=>{
  const cwd=fixture(t), captured=[];
  const output=JSON.stringify({type:'result',subtype:'success',is_error:false,result:'Reviewed tests',
    usage:{input_tokens:8,output_tokens:3}});
  const adapter=createPortableHostAdapter({cwd,runtime:'claude',
    selectedSkills:['xyeena-orchestrate'],spawnImpl:mockProcess(output,{
      expectedCommand:'claude',capture:captured,argsCheck(args){
        assert.deepEqual(args,['--bare','--add-dir','.','--permission-mode','plan',
          '--output-format','json','--no-session-persistence','-p','stdin']);
        assert.ok(!args.includes('--dangerously-skip-permissions'));
      }})});
  const result=await adapter.executeTask(makeTask());
  assert.equal(result.report,'Reviewed tests');
  assert.equal(result.usageTokens,11);
  assert.equal(result.verified,false);
  assert.match(captured.join(''),/xyeena-orchestrate/);
});
test('Codex/Claude malformed or failed response is not a verified result',async t=>{
  const cwd=fixture(t);
  const codex=createPortableHostAdapter({cwd,runtime:'codex',
    spawnImpl:mockProcess('{"type":"turn.failed"}\n')});
  await assert.rejects(codex.executeTask(makeTask()),/successful completed turn/);
  const claude=createPortableHostAdapter({cwd,runtime:'claude',
    spawnImpl:mockProcess('{"is_error":true,"result":"bad"}')});
  await assert.rejects(claude.executeTask(makeTask()),/missing successful result/);
});

test('headless preview does not select platform-incompatible orchestrator or supporting skills', t => {
  const cwd = fixture(t);
  const unsupported = process.platform === 'win32' ? 'linux' : 'windows';
  const root = path.join(cwd, '.gemini/skills/xyeena-orchestrate');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: xyeena-orchestrate\ndescription: Orchestrate skills\nplatforms: [' + unsupported + ']\n---\n');
  const blocked = previewPortableHost({ cwd, runtime: 'gemini', goal: 'review code', includeGlobal: false });
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.incompatibleSkills, ['xyeena-orchestrate']);
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: xyeena-orchestrate\ndescription: Orchestrate skills\n---\n');
  const other = path.join(cwd, '.gemini/skills/systematic-debugging');
  fs.mkdirSync(other, { recursive: true });
  fs.writeFileSync(path.join(other, 'SKILL.md'), '---\nname: systematic-debugging\ndescription: Debug failing regression\nplatforms: [' + unsupported + ']\n---\n');
  const ready = previewPortableHost({ cwd, runtime: 'gemini', goal: 'systematic debugging regression', includeGlobal: false });
  assert.equal(ready.ready, true);
  assert.deepEqual(ready.requestedSkills, ['xyeena-orchestrate']);
  assert.deepEqual(ready.incompatibleSkills, ['systematic-debugging']);
});

test('Hermes stream-json parser tolerates trailing non-JSON session telemetry lines', async t => {
  const cwd = fixture(t);
  const streamOutput = [
    '{"type":"system","subtype":"init","model":"Hermes"}',
    '{"type":"text","text":"Observed "}',
    '{"type":"text","text":"evidence"}',
    '{"type":"result","session_id":"20261025_test","exit_code":0,"text":"Observed evidence","tokens":{"total":42}}',
    'session_id: 20261025_test'
  ].join('\n') + '\n';
  const adapter = createPortableHostAdapter({
    cwd,
    runtime: 'hermes',
    selectedSkills: ['xyeena-orchestrate'],
    spawnImpl: mockProcess(streamOutput)
  });
  const result = await adapter.executeTask(makeTask());
  assert.equal(result.executed, true);
  assert.equal(result.report, 'Observed evidence');
  assert.equal(result.usageTokens, 42);
  assert.equal(result.status, 'REVIEW_REQUIRED');
});

test('portableLaunchPlan sets windowsVerbatimArguments false for native exe paths with spaces', async t => {
  const { portableLaunchPlan } = await import('../src/portable-cli-adapter.mjs');
  const plan = portableLaunchPlan({
    runtime: 'hermes',
    executable: 'C:\\Users\\User With Spaces\\hermes.exe',
    platform: 'win32',
    args: ['chat', '--oneshot']
  });
  assert.equal(plan.command, 'C:\\Users\\User With Spaces\\hermes.exe');
  assert.equal(plan.windowsVerbatimArguments, false);
});

test('Hermes parser fails closed on unexpected non-JSON output', async t => {
  const cwd = fixture(t);
  const streamOutput = [
    '{"type":"system","subtype":"init"}',
    'Unexpected host warning or raw output',
    '{"type":"result","session_id":"t1","exit_code":0,"text":"done"}'
  ].join('\n') + '\n';
  const adapter = createPortableHostAdapter({
    cwd, runtime: 'hermes', spawnImpl: mockProcess(streamOutput)
  });
  await assert.rejects(adapter.executeTask(makeTask()), /unexpected non-JSON output/);
});

test('Hermes parser fails closed on structured error event before result', async t => {
  const cwd = fixture(t);
  const streamOutput = [
    '{"type":"system","subtype":"init"}',
    '{"type":"error","error":"model context exceeded"}',
    '{"type":"result","session_id":"t2","exit_code":0,"text":"synthetic success"}'
  ].join('\n') + '\n';
  const adapter = createPortableHostAdapter({
    cwd, runtime: 'hermes', spawnImpl: mockProcess(streamOutput)
  });
  await assert.rejects(adapter.executeTask(makeTask()), /error event/);
});

test('Hermes parser fails closed on turn.failed event', async t => {
  const cwd = fixture(t);
  const streamOutput = [
    '{"type":"system","subtype":"init"}',
    '{"type":"turn.failed","message":"provider quota reached"}',
    '{"type":"result","session_id":"t3","exit_code":0,"text":"partial output"}'
  ].join('\n') + '\n';
  const adapter = createPortableHostAdapter({
    cwd, runtime: 'hermes', spawnImpl: mockProcess(streamOutput)
  });
  await assert.rejects(adapter.executeTask(makeTask()), /error event/);
});

test('Hermes adapter never leaks raw credentials or private paths from child stderr', async t => {
  const cwd = fixture(t);
  const sensitiveStderr = [
    'Error: failed to connect to API',
    'Authorization: Bearer sk-ant-api03-SECRETTOKEN1234567890abcdef',
    'password=super_secret_password_value',
    'File "C:\\Users\\ConfidentialAdmin\\AppData\\Local\\hermes\\auth.json", line 42',
    'not a hermes command'
  ].join('\n');
  const adapter = createPortableHostAdapter({
    cwd, runtime: 'hermes', spawnImpl: mockProcess('', { exitCode: 1, stderrOutput: sensitiveStderr })
  });
  let thrownError = null;
  try {
    await adapter.executeTask(makeTask());
  } catch (err) {
    thrownError = err;
  }
  assert.ok(thrownError, 'Must throw error on nonzero status');
  assert.match(thrownError.message, /hermes CLI returned a nonzero status/);
  assert.ok(!thrownError.message.includes('sk-ant-api03'), 'Must not leak API key');
  assert.ok(!thrownError.message.includes('SECRETTOKEN'), 'Must not leak token');
  assert.ok(!thrownError.message.includes('super_secret_password_value'), 'Must not leak password');
  assert.ok(!thrownError.message.includes('ConfidentialAdmin'), 'Must not leak user profile path');
  assert.ok(!thrownError.message.includes('auth.json'), 'Must not leak internal auth file path');
});




test('Hermes one-shot bounds tool turns and reports settled usage against configured limit', async t => {
  const cwd = fixture(t);
  const output = JSON.stringify({type:'result',exit_code:0,text:'checked',tokens:{total:1200}})+'\n';
  const adapter = createPortableHostAdapter({cwd,runtime:'hermes',maxTurns:1,tokenLimit:2000,
    spawnImpl:mockProcess(output,{argsCheck(args){
      assert.deepEqual(args.slice(args.indexOf('--max-turns'),args.indexOf('--max-turns')+2),['--max-turns','1']);
      assert.ok(!args.includes('--yolo'));
    }})});
  const result=await adapter.executeTask(makeTask());
  assert.equal(result.budget.usedTokens,1200);
  assert.equal(result.budget.tokenLimit,2000);
  assert.equal(result.budget.enforcement,'reported-usage-settlement');
});
test('Hermes rejects reported token overage and missing accounting rather than claiming completion', async t=>{
  const cwd=fixture(t);
  const tooMany=createPortableHostAdapter({cwd,runtime:'hermes',tokenLimit:2000,
    spawnImpl:mockProcess(JSON.stringify({type:'result',exit_code:0,text:'ok',tokens:{total:2001}})+'\n')});
  await assert.rejects(tooMany.executeTask(makeTask()),e=>e.code==='ERR_PORTABLE_BUDGET_EXCEEDED');
  const missing=createPortableHostAdapter({cwd,runtime:'hermes',
    spawnImpl:mockProcess(JSON.stringify({type:'result',exit_code:0,text:'ok'})+'\n')});
  await assert.rejects(missing.executeTask(makeTask()),e=>e.code==='ERR_PORTABLE_USAGE_UNAVAILABLE');
});
test('Hermes rejects invalid limits and preserves read-only execution restrictions',async t=>{
  const cwd=fixture(t);
  for(const options of [{tokenLimit:0},{tokenLimit:Infinity},{maxTurns:0},{maxTurns:11},{maxTurns:1.5}]){
    assert.throws(()=>createPortableHostAdapter({cwd,runtime:'hermes',...options}),/Invalid portable/);
  }
  const a=createPortableHostAdapter({cwd,runtime:'hermes',maxTurns:1,tokenLimit:1000,
    spawnImpl:()=>{throw Error('must not start')}});
  await assert.rejects(a.executeTask({...makeTask(),scope:{readOnly:false,operationClass:'safe'}}),/read-only/);
});


test('portable host supports preflight and in-flight AbortSignal cancellation without success',async t=>{
  const cwd=fixture(t);
  let spawned=0,child=null;
  const abort=new AbortController();
  abort.abort();
  const adapter=createPortableHostAdapter({cwd,runtime:'hermes',spawnImpl:()=>{
    spawned++;child=heldChild();return child;
  }});
  await assert.rejects(adapter.executeTask(makeTask(),{signal:abort.signal}),e=>e.code==='ERR_PORTABLE_CANCELED');
  assert.equal(spawned,0);
  const controller=new AbortController();
  const pending=adapter.executeTask(makeTask(),{signal:controller.signal});
  assert.equal(spawned,1);
  controller.abort();
  await assert.rejects(pending,e=>e.code==='ERR_PORTABLE_CANCELED');
  assert.equal(child.killCount,1);
  child.stdout.write('{"type":"result","exit_code":0,"text":"fake","tokens":{"total":1}}\n');
  child.emit('close',0);
  await assert.rejects(adapter.executeTask(makeTask(),{signal:{aborted:false}}),/Invalid host cancellation signal/);
});
test('portable Windows abort requests owned CLI process-tree termination',async t=>{
  const cwd=fixture(t);
  const controller=new AbortController();
  let captured=null;
  const child=heldChild();
  child.pid=5191;
  const adapter=createPortableHostAdapter({
    cwd,runtime:'hermes',platform:'win32',
    spawnImpl:()=>child,
    terminateSpawnImpl:(exe,args,options)=>{
      captured={exe,args,options};
      const killer=new EventEmitter();
      killer.unref=()=>{};
      process.nextTick(()=>killer.emit('close',0));
      return killer;
    }
  });
  const pending=adapter.executeTask(makeTask(),{signal:controller.signal});
  controller.abort();
  await assert.rejects(pending,e=>e.code==='ERR_PORTABLE_CANCELED');
  assert.deepEqual(captured.args,['/PID','5191','/T','/F']);
  assert.equal(captured.options.shell,false);
  assert.equal(child.killCount,0);
});
test('portable host stdout/stderr byte budgets stop the child and prevent fabricated output',async t=>{
  const cwd=fixture(t);
  for(const stream of ['stdout','stderr']){
    const child=heldChild();
    const adapter=createPortableHostAdapter({cwd,runtime:'hermes',spawnImpl:()=>child});
    const pending=adapter.executeTask(makeTask());
    child[stream].write(Buffer.alloc(256*1024+1,65));
    await assert.rejects(pending,stream==='stdout'?/Host output exceeded limit/:/Host diagnostic output exceeded limit/);
    assert.equal(child.killCount,1);
  }
});
