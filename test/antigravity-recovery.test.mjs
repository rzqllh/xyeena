import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { guidedCommand } from '../src/antigravity-guided.mjs';
import { bindConversation, beforeInvocation, afterTool, stopCheckpoint, resumeCapsule } from '../src/antigravity-guided-hook.mjs';

const ID1 = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';
const fresh = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rig-recovery-'));
const clean = dir => fs.rmSync(dir, { recursive: true, force: true });
const stateFile = (dir, id) => path.join(dir, '.xyeena', 'guided', 'sessions', id + '.json');
const checkpointFile = (dir, id) => path.join(dir, '.xyeena', 'runs', id, 'checkpoint.json');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function run(dir, id, goal = 'Investigate build regression') {
  const folder = path.join(dir, '.xyeena', 'runs', id);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'snapshot.json'), JSON.stringify({
    run_id: id, cwd: dir, goal, workflow_state: 'VERIFY', git_head: 'none',
    tasks: { a: { title: 'Check failing build', state: 'READY' } },
  }));
}
function call(dir, event, payload) {
  const script = path.join(dir, '.xyeena', 'hooks', 'antigravity-guided.mjs');
  const out = spawnSync(process.execPath, [script, event], {
    input: JSON.stringify(payload), encoding: 'utf8', timeout: 3000,
  });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout);
}
test('binding requires explicit authority and cannot steal a conversation', () => {
  const dir = fresh();
  try {
    run(dir, 'run-a');
    run(dir, 'run-b');
    assert.throws(() => bindConversation(dir, 'run-a', ID1), /--yes/);
    assert.throws(() => bindConversation(dir, 'run-a', '../bad', { yes: true }), /Invalid/);
    assert.deepEqual(bindConversation(dir, 'run-a', ID1, { yes: true }).bound, true);
    assert.equal(bindConversation(dir, 'run-a', ID1, { yes: true }).changed, false);
    assert.throws(() => bindConversation(dir, 'run-b', ID1, { yes: true }), /another task/);
    assert.equal(guidedCommand('bind', { cwd: dir, id: 'run-b', conversationId: ID2, yes: true }).bound, true);
    assert.notEqual(read(stateFile(dir, ID1)).runId, read(stateFile(dir, ID2)).runId);
  } finally { clean(dir); }
});
test('one-time capsule only reaches explicitly bound conversation in matching workspace', () => {
  const dir = fresh(), different = fresh();
  try {
    run(dir, 'run-a');
    guidedCommand('install', { cwd: dir, yes: true });
    const payload = { conversationId: ID1, workspacePaths: [dir], invocationNum: 0 };
    assert.deepEqual(call(dir, 'PreInvocation', payload), {});
    assert.equal(fs.existsSync(stateFile(dir, ID1)), false);
    guidedCommand('bind', { cwd: dir, id: 'run-a', conversationId: ID1, yes: true });
    assert.deepEqual(call(dir, 'PreInvocation', { ...payload, workspacePaths: [different] }), {});
    const first = call(dir, 'PreInvocation', payload);
    assert.match(first.injectSteps[0].ephemeralMessage, /user-selected task context/);
    assert.match(first.injectSteps[0].ephemeralMessage, /run-a/);
    assert.deepEqual(call(dir, 'PreInvocation', payload), {});
    assert.deepEqual(call(dir, 'PreInvocation', { ...payload, conversationId: ID2 }), {});
    assert.equal(read(stateFile(dir, ID1)).capsuleDelivered, true);
  } finally { clean(dir); clean(different); }
});
test('three matching failures yield one nudge without persisting tool inputs', () => {
  const dir = fresh();
  try {
    run(dir, 'run-a');
    bindConversation(dir, 'run-a', ID1, { yes: true });
    const payload = { conversationId: ID1, workspacePaths: [dir] };
    beforeInvocation(dir, payload);
    const failure = {
      ...payload, toolCall: { name: 'run_command', args: { CommandLine: 'echo confidential-input' } },
      error: 'confidential-error',
    };
    for (let i = 0; i < 3; i++) assert.deepEqual(afterTool(dir, failure), {});
    const stateText = fs.readFileSync(stateFile(dir, ID1), 'utf8');
    assert.equal(stateText.includes('confidential-input'), false);
    assert.equal(stateText.includes('confidential-error'), false);
    const nudge = beforeInvocation(dir, payload);
    assert.match(nudge.injectSteps[0].ephemeralMessage, /same tool call failed repeatedly/);
    assert.deepEqual(beforeInvocation(dir, payload), {});
    assert.deepEqual(afterTool(dir, { ...failure, error: '' }), {});
    assert.deepEqual(beforeInvocation(dir, payload), {});
  } finally { clean(dir); }
});
test('Stop writes incomplete checkpoint for bound tasks only', () => {
  const dir = fresh(), different = fresh();
  try {
    run(dir, 'run-a');
    guidedCommand('install', { cwd: dir, yes: true });
    let payload = { conversationId: ID1, workspacePaths: [dir], fullyIdle: true, terminationReason: 'model_stop' };
    assert.deepEqual(call(dir, 'Stop', payload), { decision: 'stop' });
    assert.equal(fs.existsSync(checkpointFile(dir, 'run-a')), false);
    bindConversation(dir, 'run-a', ID1, { yes: true });
    assert.deepEqual(call(dir, 'Stop', { ...payload, workspacePaths: [different] }), { decision: 'stop' });
    assert.equal(fs.existsSync(checkpointFile(dir, 'run-a')), false);
    assert.deepEqual(call(dir, 'Stop', payload), { decision: 'stop' });
    const checkpoint = read(checkpointFile(dir, 'run-a'));
    assert.equal(checkpoint.status, 'INCOMPLETE');
    assert.equal(checkpoint.runId, 'run-a');
    assert.equal(checkpoint.fullyIdle, true);
    assert.equal(checkpoint.conversationId, ID1);
    assert.equal(checkpoint.revision.evidence, 'UNKNOWN');
    assert.equal(typeof resumeCapsule(dir, 'run-a').goal, 'string');
  } finally { clean(dir); clean(different); }
});
test('installer describes valid PostToolUse matcher and includes both handlers', () => {
  const dir = fresh();
  try {
    const result = guidedCommand('install', { cwd: dir, yes: true });
    assert.equal(result.changed, true);
    const config = read(path.join(dir, '.agents', 'hooks.json'));
    const hooks = config['xyeena-rig-guided'];
    assert.equal(hooks.PostToolUse[0].matcher,
      'run_command|write_to_file|replace_file_content|multi_replace_file_content');
    assert.equal(hooks.PostToolUse[0].hooks[0].type, 'command');
    assert.ok(hooks.PreInvocation[0].command.includes('PreInvocation'));
    assert.deepEqual(call(dir, 'PostToolUse', { workspacePaths: [], toolCall: { name: 'run_command' } }), {});
    guidedCommand('uninstall', { cwd: dir, yes: true });
    assert.equal(fs.existsSync(path.join(dir, '.agents', 'hooks.json')), false);
  } finally { clean(dir); }
});
