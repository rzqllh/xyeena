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


test('guided status distinguishes installed configuration from unproven native enforcement', () => {
  const cwd=fixture();
  try {
    const before=guidedCommand('status',{cwd});
    assert.equal(before.installed,false);
    assert.equal(before.enabled,false);
    assert.equal(before.hostActivation,'UNVERIFIED');
    assert.equal(before.hostEnforcement,'UNVERIFIED');
    assert.equal(before.securityEnforcementVerified,false);
    guidedCommand('install',{cwd,yes:true});
    const after=guidedCommand('status',{cwd});
    assert.equal(after.installed,true);
    assert.equal(after.enabled,true);
    assert.equal(after.upgradeAvailable,false);
    assert.equal(after.hostEnforcement,'UNVERIFIED');
    assert.equal(after.securityEnforcementVerified,false);
  } finally { cleanup(cwd); }
});
test('guided probe needs explicit consent and a current installed PreToolUse runner', () => {
  const cwd=fixture();
  try {
    assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'start',yes:true}),/Install or upgrade/);
    guidedCommand('install',{cwd,yes:true});
    assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'start'}),/--yes/);
    const configValue=read(config(cwd));
    configValue['xyeena-rig-guided'].enabled=false;
    fs.writeFileSync(config(cwd),JSON.stringify(configValue));
    assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'start',yes:true}),/Install or upgrade/);
    assert.equal(guidedCommand('status',{cwd}).enabled,false);
  } finally { cleanup(cwd); }
});
test('guided native hook probe starts awaiting callback without modifying root ignore or user files', () => {
  const cwd=fixture();
  try {
    guidedCommand('install',{cwd,yes:true});
    const original=fs.readFileSync(config(cwd),'utf8');
    const result=guidedCommand('probe',{cwd,probeAction:'start',yes:true});
    assert.equal(result.state,'AWAITING_CALLBACK');
    assert.equal(result.hostEnforcement,'UNVERIFIED');
    assert.equal(guidedCommand('probe',{cwd,probeAction:'status'}).state,'AWAITING_CALLBACK');
    assert.equal(guidedCommand('status',{cwd}).securityEnforcementVerified,false);
    assert.equal(fs.existsSync(path.join(cwd,'.gitignore')),false);
    const probeDir=path.join(cwd,'.xyeena','guided','probe');
    assert.equal(fs.readFileSync(path.join(probeDir,'.gitignore'),'utf8'),'*\n!.gitignore\n');
    assert.equal(fs.readFileSync(config(cwd),'utf8'),original);
    assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'start',yes:true}),/probe is active/);
    assert.deepEqual(guidedCommand('probe',{cwd,probeAction:'clear',yes:true}),{
      cleared:true,hostEnforcement:'UNVERIFIED'
    });
    assert.equal(guidedCommand('probe',{cwd,probeAction:'status'}).state,'NOT_STARTED');
  } finally { cleanup(cwd); }
});
test('hook runner records private bounded callback receipt without storing tool arguments or certifying enforcement',()=>{
  const cwd=fixture();
  try{
    guidedCommand('install',{cwd,yes:true});
    guidedCommand('probe',{cwd,probeAction:'start',yes:true});
    const runner=path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs');
    const payload={workspacePaths:[cwd],toolCall:{name:'run_command',args:{
      Cwd:cwd,CommandLine:'Write-Output SECRET_NEVER_RECORD_THIS'
    }}};
    const response=spawnSync(process.execPath,[runner,'PreToolUse'],{
      input:JSON.stringify(payload),encoding:'utf8'
    });
    assert.equal(response.status,0,response.stderr);
    assert.equal(JSON.parse(response.stdout).decision,'force_ask');
    const status=guidedCommand('probe',{cwd,probeAction:'status'});
    assert.equal(status.state,'CALLBACK_OBSERVED_UNATTESTED');
    assert.equal(status.observation.decision,'force_ask');
    assert.equal(status.observation.toolName,'run_command');
    assert.equal(status.hostEnforcement,'UNVERIFIED');
    const normal=guidedCommand('status',{cwd});
    assert.equal(normal.hostActivation,'CALLBACK_OBSERVED_UNATTESTED');
    assert.equal(normal.hostEnforcement,'UNVERIFIED');
    assert.equal(normal.securityEnforcementVerified,false);
    const persisted=fs.readFileSync(path.join(cwd,'.xyeena','guided','probe','state.json'),'utf8');
    assert.ok(!persisted.includes('SECRET_NEVER_RECORD_THIS'));
    assert.ok(!persisted.includes(cwd));
    assert.ok(!persisted.includes('CommandLine'));
  }finally{cleanup(cwd);}
});
test('expired, invalid and linked probe state never become native host enforcement proof',()=>{
  const cwd=fixture();
  try {
    guidedCommand('install',{cwd,yes:true});
    guidedCommand('probe',{cwd,probeAction:'start',yes:true});
    const stateFile=path.join(cwd,'.xyeena','guided','probe','state.json');
    const state=read(stateFile);
    state.startedAt=Date.now()-600000;
    state.expiresAt=state.startedAt+300000;
    fs.writeFileSync(stateFile,JSON.stringify(state));
    assert.equal(guidedCommand('probe',{cwd,probeAction:'status'}).state,'EXPIRED');
    fs.writeFileSync(stateFile,'{"schema":1,"probeId":"forged"}');
    assert.equal(guidedCommand('status',{cwd}).probe,'PROBE_STATE_INVALID');
    assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'status'}),/Invalid Xyeena probe state/);
    fs.rmSync(stateFile);
    try {
      fs.symlinkSync(path.join(cwd,'.agents','hooks.json'),stateFile);
      assert.throws(()=>guidedCommand('probe',{cwd,probeAction:'status'}),/Invalid Xyeena probe state/);
    } catch(e) { if(!['EPERM','EACCES'].includes(e.code)) throw e; }
  } finally { cleanup(cwd); }
});


test('Windows Antigravity hooks avoid quoted paths in all managed command entries', () => {
  const cwd=fixture();
  try {
    const plan=hookPlan({cwd});
    const group=plan.next['xyeena-rig-guided'];
    const commands=[
      group.SessionStart[0].command,
      group.PreInvocation[0].command,
      group.PreToolUse[0].hooks[0].command,
      group.PostToolUse[0].hooks[0].command,
      group.Stop[0].command
    ];
    if(process.platform==='win32'){
      for(const command of commands){
        assert.match(command,/^node \.\.\/\.xyeena\/hooks\/antigravity-guided\.mjs (SessionStart|PreInvocation|PreToolUse|PostToolUse|Stop)$/);
        assert.ok(!command.includes('"'), 'Antigravity Windows CLI must not receive quoted executable/argument paths');
        assert.ok(!command.includes(cwd), 'Command must not include a spaced absolute workspace path');
        assert.ok(!command.includes('Program Files'), 'Command must not embed a quoted Program Files executable');
      }
      assert.equal(plan.next['xyeena-rig-guided'].PreToolUse[0].matcher,'*');
    }
    guidedCommand('install',{cwd,yes:true});
    assert.equal(guidedCommand('status',{cwd}).installed,true);
    const active=read(config(cwd))['xyeena-rig-guided'];
    assert.equal(active.PreToolUse[0].hooks[0].command,group.PreToolUse[0].hooks[0].command);
    const actualCommand = active.PreToolUse[0].hooks[0].command;
    // Emulate agy CLI 1.4.7's REAL hook cwd: <workspace>/.agents (not
    // the PowerShell invocation's current workspace directory).
    const runnerCwd=path.join(cwd,'.agents');
    const runnerArgs=actualCommand.split(' ');
    const cmd = process.platform === 'win32' ? runnerArgs[0] : process.execPath;
    const args = process.platform === 'win32'
      ? runnerArgs.slice(1)
      : [path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs'),'PreToolUse'];
    const result=spawnSync(cmd,args,{
      input:JSON.stringify({workspacePaths:[cwd],toolCall:{
        name:'run_command',args:{CommandLine:'Get-Location'}
      }}),encoding:'utf8',cwd:runnerCwd
    });
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(result.stdout).decision,'force_ask');
    if (process.platform === 'win32') {
      assert.equal(args[0], '../.xyeena/hooks/antigravity-guided.mjs');
      assert.equal(path.resolve(runnerCwd,args[0]),path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs'));
    }
  } finally { cleanup(cwd); }
});

test('agy Windows native command runs from .agents even with spaces in workspace path', { skip: process.platform !== 'win32' }, () => {
  const temp=fixture(), cwd=path.join(temp,'Workspace With Spaces');
  fs.mkdirSync(cwd);
  try {
    guidedCommand('install',{cwd,yes:true});
    const command=read(config(cwd))['xyeena-rig-guided'].PreToolUse[0].hooks[0].command;
    assert.equal(command,'node ../.xyeena/hooks/antigravity-guided.mjs PreToolUse');
    const words=command.split(' ');
    const result=spawnSync(words[0],words.slice(1),{
      cwd:path.join(cwd,'.agents'),
      input:JSON.stringify({workspacePaths:[cwd],toolCall:{
        name:'run_command',args:{CommandLine:'git status --short'}
      }}),
      encoding:'utf8',timeout:3000
    });
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(result.stdout).decision,'force_ask');
  } finally { cleanup(temp); }
});
