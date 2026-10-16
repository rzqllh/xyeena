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

test('hook backups are locally ignored and incompatible ignore files are not overwritten', () => {
  const root = fixture();
  try {
    const config = path.join(root, '.agents', 'hooks.json');
    fs.mkdirSync(path.dirname(config), { recursive: true });
    fs.writeFileSync(config, JSON.stringify({ 'other-hook': { SessionStart: [{ command: 'echo private' }] } }));
    guidedCommand('install', { cwd: root, yes: true });
    const ignore = path.join(root, '.xyeena', 'backups', '.gitignore');
    assert.equal(fs.readFileSync(ignore, 'utf8'), 'antigravity/\\n'.replace('\\n', '\n'));
    assert.equal(fs.readdirSync(path.join(root, '.xyeena', 'backups', 'antigravity')).length, 1);
    guidedCommand('uninstall', { cwd: root, yes: true });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  const other = fixture();
  try {
    const config = path.join(other, '.agents', 'hooks.json');
    fs.mkdirSync(path.dirname(config), { recursive: true });
    fs.writeFileSync(config, '{}');
    const ignore = path.join(other, '.xyeena', 'backups', '.gitignore');
    fs.mkdirSync(path.dirname(ignore), { recursive: true });
    fs.writeFileSync(ignore, 'unrelated/\n');
    assert.throws(() => guidedCommand('install', { cwd: other, yes: true }), /must be ignored by Git/);
    assert.equal(fs.readFileSync(ignore, 'utf8'), 'unrelated/\n');
    assert.equal(fs.existsSync(path.join(other, '.agents', 'hooks.json')), true);
  } finally { fs.rmSync(other, { recursive: true, force: true }); }
});
