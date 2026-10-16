import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bindConversation } from '../src/antigravity-guided-hook.mjs';
import { guidedCommand } from '../src/antigravity-guided.mjs';

const uuid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-ignore-'));
  const folder = path.join(root, '.xyeena', 'runs', 'run-one');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'snapshot.json'), JSON.stringify({
    run_id: 'run-one', cwd: root, goal: 'Fix test',
    workflow_state: 'VERIFY', tasks: {}, git_head: null
  }));
  return root;
}
test('conversation state receives a project-local Git ignore rule', () => {
  const root = fixture();
  try {
    const result = bindConversation(root, 'run-one', uuid, { yes: true });
    assert.equal(result.changed, true);
    const ignore = path.join(root, '.xyeena', 'guided', '.gitignore');
    assert.equal(fs.readFileSync(ignore, 'utf8'), 'sessions/\n');
    assert.ok(fs.existsSync(path.join(root, '.xyeena', 'guided', 'sessions', uuid + '.json')));
    assert.equal(bindConversation(root, 'run-one', uuid, { yes: true }).changed, false);
    assert.throws(() => guidedCommand('unbind', { cwd: root, conversationId: uuid }), /--yes/);
    const unbound = guidedCommand('unbind', { cwd: root, conversationId: uuid, yes: true });
    assert.equal(unbound.changed, true);
    assert.equal(fs.existsSync(path.join(root, '.xyeena', 'guided', 'sessions', uuid + '.json')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('existing ignore configuration is preserved instead of overwritten', () => {
  const root = fixture();
  try {
    const ignore = path.join(root, '.xyeena', 'guided', '.gitignore');
    fs.mkdirSync(path.dirname(ignore), { recursive: true });
    fs.writeFileSync(ignore, 'artifacts/\n');
    assert.throws(() => bindConversation(root, 'run-one', uuid, { yes: true }), /must be ignored by Git/);
    assert.equal(fs.readFileSync(ignore, 'utf8'), 'artifacts/\n');
    assert.equal(fs.existsSync(path.join(root, '.xyeena', 'guided', 'sessions', uuid + '.json')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
