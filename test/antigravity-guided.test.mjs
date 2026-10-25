import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { hookPlan, applyHookPlan, guidedCommand } from '../src/antigravity-guided.mjs';
import { sessionStart, resumeCapsule, preToolUse } from '../src/antigravity-guided-hook.mjs';

const fixture = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rig-guided-'));
const cleanup = cwd => fs.rmSync(cwd, { recursive: true, force: true });
const config = cwd => path.join(cwd, '.agents', 'hooks.json');
const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
function run(cwd, id) {
  const dir = path.join(cwd, '.xyeena', 'runs', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'snapshot.json'), JSON.stringify({
    run_id: id, cwd, goal: 'Investigate slow build', workflow_state: 'VERIFY',
    tasks: { a: { title: 'Test build', state: 'READY' } }, git_head: 'deadbeef' }));
}
test('preview is read-only; install and uninstall preserve unrelated hooks', () => {
  const cwd = fixture();
  try {
    fs.mkdirSync(path.dirname(config(cwd)), { recursive: true });
    const original = { 'other-tool': { Stop: [{ type: 'command', command: 'echo original' }] } };
    fs.writeFileSync(config(cwd), JSON.stringify(original));
    const plan = hookPlan({ cwd });
    assert.equal(plan.changed, true);
    assert.equal(plan.preview.backup, true);
    assert.equal(fs.existsSync(path.join(cwd, '.xyeena')), false);
    assert.throws(() => applyHookPlan(plan), /--yes/);
    applyHookPlan(plan, { yes: true });
    assert.deepEqual(read(config(cwd))['other-tool'], original['other-tool']);
    assert.equal(hookPlan({ cwd }).changed, false);
    assert.equal(guidedCommand('status', { cwd }).installed, true);
    assert.equal(fs.readdirSync(path.join(cwd, '.xyeena', 'backups', 'antigravity')).length, 1);
    guidedCommand('uninstall', { cwd, yes: true });
    assert.deepEqual(read(config(cwd)), original);
  } finally { cleanup(cwd); }
});
test('conflicting or manually changed managed groups are not overwritten', () => {
  const cwd = fixture();
  try {
    fs.mkdirSync(path.dirname(config(cwd)), { recursive: true });
    fs.writeFileSync(config(cwd), '{"xyeena-rig-guided":{"enabled":false}}');
    assert.throws(() => hookPlan({ cwd }), /unowned/);
    fs.writeFileSync(config(cwd), '{}');
    guidedCommand('install', { cwd, yes: true });
    const modified = read(config(cwd));
    modified['xyeena-rig-guided'].Stop[0].command = 'echo modified';
    fs.writeFileSync(config(cwd), JSON.stringify(modified));
    assert.throws(() => guidedCommand('uninstall', { cwd, yes: true }), /changed/);
  } finally { cleanup(cwd); }
});
test('malformed configuration cannot be replaced', () => {
  const cwd = fixture();
  try {
    fs.mkdirSync(path.dirname(config(cwd)), { recursive: true });
    fs.writeFileSync(config(cwd), '{ not json');
    assert.throws(() => hookPlan({ cwd }), /Invalid hooks.json/);
  } finally { cleanup(cwd); }
});
test('recovery suggestion is relevant and never starts work automatically', () => {
  const cwd = fixture(), other = fixture();
  try {
    run(cwd, 'run-1');
    assert.deepEqual(sessionStart(cwd, { workspacePaths: [other] }), {});
    const response = sessionStart(cwd, { workspacePaths: [cwd] });
    assert.match(response.injectSteps[0].ephemeralMessage, /Ask the user whether to resume/);
    assert.equal(resumeCapsule(cwd, 'run-1').tasks[0].title, 'Test build');
    run(cwd, 'run-2');
    assert.deepEqual(sessionStart(cwd, { workspacePaths: [cwd] }), {});
    assert.throws(() => resumeCapsule(cwd, '../bad'), /Invalid run ID/);
  } finally { cleanup(cwd); cleanup(other); }
});
test('installed runner emits stop, not force-continue or auto-approve', () => {
  const cwd = fixture();
  try {
    guidedCommand('install', { cwd, yes: true });
    const script = path.join(cwd, '.xyeena', 'hooks', 'antigravity-guided.mjs');
    const result = spawnSync(process.execPath, [script, 'Stop'], {
      input: '{"fullyIdle":true}', encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { decision: 'stop' });
  } finally { cleanup(cwd); }
});

test('native IDE enabled toggle is honored and does not block safe uninstall', () => {
  const cwd = fixture();
  try {
    guidedCommand('install', { cwd, yes: true });
    const changed = read(config(cwd));
    changed['xyeena-rig-guided'].enabled = false;
    fs.writeFileSync(config(cwd), JSON.stringify(changed));
    assert.equal(guidedCommand('status', { cwd }).enabled, false);
    assert.equal(hookPlan({ cwd }).changed, false);
    assert.equal(guidedCommand('install', { cwd, yes: true }).result.changed, false);
    assert.equal(read(config(cwd))['xyeena-rig-guided'].enabled, false);
    guidedCommand('uninstall', { cwd, yes: true });
    assert.equal(fs.existsSync(config(cwd)), false);
  } finally { cleanup(cwd); }
});

test('PreToolUse host hook requests fresh user approval without auto-approval',()=>{
  const cwd=fixture();
  try{
    const root=fs.realpathSync(cwd);
    const payload=(name,args)=>({workspacePaths:[cwd],toolCall:{name,args}});
    assert.deepEqual(preToolUse(root,payload('view_file',{AbsolutePath:path.join(root,'README.md')})),{decision:'allow'});
    assert.equal(preToolUse(root,payload('write_to_file',{TargetFile:path.join(root,'good.txt')})).decision,'force_ask');
    assert.equal(preToolUse(root,payload('replace_file_content',{TargetFile:path.join(root,'edited.txt')})).decision,'force_ask');
    assert.equal(preToolUse(root,payload('write_to_file',{TargetFile:path.resolve(root,'../out.txt')})).decision,'deny');
    assert.equal(preToolUse(root,payload('write_to_file',{})).decision,'deny');
    assert.equal(preToolUse(root,payload('run_command',{Cwd:root,CommandLine:'npm test'})).decision,'force_ask');
    assert.equal(preToolUse(root,payload('run_command',{Cwd:path.resolve(root,'..'),CommandLine:'npm test'})).decision,'deny');
    assert.equal(preToolUse(root,payload('run_command',{CommandLine:'  '})).decision,'deny');
    assert.equal(preToolUse(root,payload('search_web',{query:'current'})).decision,'force_ask');
    assert.equal(preToolUse(root,{workspacePaths:[],toolCall:{name:'write_to_file',args:{TargetFile:'a'}}}).decision,'deny');
    const linked=path.join(root,'linked');
    try{fs.symlinkSync(path.dirname(root),linked,'dir');assert.equal(preToolUse(root,payload('write_to_file',{TargetFile:path.join(linked,'no.txt')})).decision,'deny');}
    catch(e){if(!['EPERM','EACCES'].includes(e.code))throw e;}
  }finally{cleanup(cwd);}
});
test('installed Antigravity PreToolUse runner follows host JSON contract and fails closed',()=>{
  const cwd=fixture();
  try{
    guidedCommand('install',{cwd,yes:true});
    const group=read(config(cwd))['xyeena-rig-guided'];
    assert.equal(group.PreToolUse[0].matcher,'*');
    const script=path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs');
    const payload={workspacePaths:[cwd],toolCall:{name:'run_command',args:{CommandLine:'npm test',Cwd:cwd}}};
    const result=spawnSync(process.execPath,[script,'PreToolUse'],{input:JSON.stringify(payload),encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const d=JSON.parse(result.stdout);
    assert.equal(d.decision,'force_ask');
    assert.equal(d.permissionOverrides,undefined);
    const invalid=spawnSync(process.execPath,[script,'PreToolUse'],{input:'not-json',encoding:'utf8'});
    assert.equal(JSON.parse(invalid.stdout).decision,'deny');
    const oversized=spawnSync(process.execPath,[script,'PreToolUse'],{input:' '.repeat(66000),encoding:'utf8'});
    assert.equal(JSON.parse(oversized.stdout).decision,'deny');
  }finally{cleanup(cwd);}
});
