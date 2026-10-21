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
  await assert.rejects(adapter.executeTask(task()),/Missing SDK/);
  const malformed = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({status:'done'})});
  await assert.rejects(malformed.executeTask(task()), /SDK worker failed/);
  const invalid = createAntigravitySdkAdapter({cwd,spawnImpl:mockSpawn({
    ok:true,executed:false,report:''
  })});
  await assert.rejects(invalid.executeTask(task()),/did not confirm execution/);
});
