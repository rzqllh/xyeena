import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createAntigravitySdkAdapter, previewAntigravitySdkTask } from '../src/antigravity-sdk-adapter.mjs';
import { runTaskGraph } from '../src/task-runner.mjs';

const root = t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-sdk-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};

function heldChild() {
  const child=new EventEmitter();
  child.stdin=new PassThrough();
  child.stdout=new PassThrough();
  child.stderr=new PassThrough();
  child.killCount=0;
  child.kill=()=>{child.killCount++;child.emit('close',130);return true;};
  return child;
}

const task = (readOnly = true) => ({ id: 'A', title: 'Inspect unit test coverage',
  state: 'READY', depends_on: [], scope: { readOnly, operationClass: 'safe' } });
const mockSpawn = (payload, exitCode = 0) => (_python, _argv, options) => {
  assert.equal(options.shell, false);
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => {};
  process.nextTick(() => {
    child.stdout.write(JSON.stringify(payload));
    child.stdout.end();
    child.emit('close', exitCode);
  });
  return child;
};

test('SDK preview is read-only and selects installed skills', t => {
  const cwd = root(t);
  const folder = path.join(cwd, '.agents', 'skills', 'systematic-debugging');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'SKILL.md'),
    '---\nname: systematic-debugging\ndescription: Debug regressions and errors\n---\n# Skill\n');
  const preview = previewAntigravitySdkTask({ cwd, goal: 'systematic debugging for errors', includeGlobal: false });
  assert.equal(preview.executed, false);
  assert.equal(preview.requiresExplicitExecution, true);
  assert.deepEqual(preview.selectedSkills, ['systematic-debugging']);
  assert.deepEqual(preview.skillPaths.map(p => fs.realpathSync(p)), [fs.realpathSync(folder)]);
  assert.equal(fs.existsSync(path.join(cwd, '.xyeena')), false);
});

test('SDK adapter cannot run write, external or malformed tasks', async t => {
  const cwd = root(t);
  const adapter = createAntigravitySdkAdapter({cwd, spawnImpl: () => { throw Error('Should not spawn'); }});
  await assert.rejects(adapter.executeTask(task(false)), /safe read-only/);
  await assert.rejects(adapter.executeTask({...task(), scope:{ readOnly:true, operationClass:'external'}}), /safe read-only/);
  await assert.rejects(adapter.executeTask({...task(), title:''}), /Invalid task title/);
  assert.throws(() => createAntigravitySdkAdapter({cwd, timeoutMs: 0}), /timeout/);
  assert.throws(() => createAntigravitySdkAdapter({cwd, enableSubagents: 'yes'}), /subagent flag/);
});

test('native SDK worker result never automatically counts as verification', async t => {
  const cwd = root(t);
  const adapter = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({
    ok:true, executed:true, verified:true, report:'Inspected files', usageTokens:20
  })});
  const result = await adapter.executeTask(task());
  assert.equal(result.executed,true);
  assert.equal(result.verified,false);
  assert.deepEqual(result.evidenceRefs,[]);
  assert.equal(result.usageTokens,20);
  const graph = await runTaskGraph({tasks:{A:task()}, adapter});
  assert.equal(graph.complete,false);
  assert.equal(graph.tasks.A.state,'REVIEW_REQUIRED');
});

test('SDK worker failures do not become success', async t => {
  const cwd = root(t);
  const adapter = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({ok:false,error:'Missing SDK'},1)});
  await assert.rejects(adapter.executeTask(task()),/SDK worker failed or returned an unsuccessful status/);
  const malformed = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({status:'done'})});
  await assert.rejects(malformed.executeTask(task()), /SDK worker failed/);
  const invalid = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({
    ok:true,executed:false,report:''
  })});
  await assert.rejects(invalid.executeTask(task()),/did not confirm execution/);
});


test('SDK bridge supports preflight and in-flight AbortSignal cancellation with no success',async t=>{
  const cwd=root(t);
  let count=0,child;
  const adapter=createAntigravitySdkAdapter({cwd,spawnImpl:()=>{
    count++;child=heldChild();return child;
  }});
  const aborted=new AbortController();
  aborted.abort();
  await assert.rejects(adapter.executeTask(task(),{signal:aborted.signal}),e=>e.code==='ERR_SDK_CANCELED');
  assert.equal(count,0);
  const controller=new AbortController();
  const pending=adapter.executeTask(task(),{signal:controller.signal});
  controller.abort();
  await assert.rejects(pending,e=>e.code==='ERR_SDK_CANCELED');
  assert.equal(count,1);
  assert.equal(child.killCount,1);
  await assert.rejects(adapter.executeTask(task(),{signal:{aborted:false}}),/Invalid SDK cancellation signal/);
});
test('SDK bridge enforces received stdout and stderr byte caps instead of capped accumulation',async t=>{
  const cwd=root(t);
  for(const stream of ['stdout','stderr']){
    const child=heldChild();
    const adapter=createAntigravitySdkAdapter({cwd,spawnImpl:()=>child});
    const pending=adapter.executeTask(task());
    child[stream].write(Buffer.alloc(stream==='stdout'?100001:20001,65));
    await assert.rejects(pending,stream==='stdout'?/output limit exceeded/:/stderr limit exceeded/);
    assert.equal(child.killCount,1);
  }
});
test('SDK bridge never exposes untrusted worker error text with private paths or credentials',async t=>{
  const cwd=root(t);
  const secret='Bearer sk-SECRETKEY private C:\\Users\\Someone\\AppData\\Local\\secret.json';
  const adapter=createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({ok:false,error:secret},1)});
  await assert.rejects(adapter.executeTask(task()),e=>{
    assert.match(e.message,/SDK worker failed/);
    assert.ok(!e.message.includes('SECRETKEY'));
    assert.ok(!e.message.includes('Someone'));
    return true;
  });
});
