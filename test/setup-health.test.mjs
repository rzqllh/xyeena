import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applySetup } from '../src/setup.mjs';
import { setupHealthCheck, inspectSetupHosts } from '../src/setup-health.mjs';
import { VERSION } from '../src/paths.mjs';

const bin=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-health-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
}
test('health check distinguishes a missing orchestrator from native host installation',t=>{
  const cwd=fixture(t);
  const result=setupHealthCheck({cwd,runtime:'antigravity'});
  assert.equal(result.filesystem.orchestratorFound,false);
  assert.equal(result.hostActivationVerified,false);
  assert.equal(result.modelCallPerformed,false);
  assert.throws(()=>setupHealthCheck({cwd,runtime:'not-a-host'}),/supported runtime/);
});
test('shared folder is not proof that Codex or Antigravity is running',t=>{
  const cwd=fixture(t);
  fs.mkdirSync(path.join(cwd,'.agents'),{recursive:true});
  const hints=inspectSetupHosts({cwd,env:{PATH:''},platform:'win32'});
  const codex=hints.find(x=>x.host==='codex');
  assert.equal(codex.level,'undetected');
  fs.mkdirSync(path.join(cwd,'.agents/skills'),{recursive:true});
  const withSkills=inspectSetupHosts({cwd,env:{PATH:''},platform:'win32'});
  assert.equal(withSkills.find(x=>x.host==='codex').level,'shared-folder-only');
  assert.equal(withSkills.find(x=>x.host==='codex').confirmedRunning,false);
});
test('host binary detection reads PATH files without launching executable',t=>{
  const cwd=fixture(t),binDir=path.join(cwd,'tools');
  fs.mkdirSync(binDir,{recursive:true});
  fs.writeFileSync(path.join(binDir,'gemini.cmd'),'@echo off\nexit 123\n');
  const hints=inspectSetupHosts({cwd,env:{Path:binDir},platform:'win32'});
  assert.equal(hints.find(x=>x.host==='gemini').hostCommandAvailable,true);
  assert.equal(hints.find(x=>x.host==='gemini').confirmedRunning,false);
});
test('setup check validates actual installed skill state but does not claim native activation',t=>{
  const cwd=fixture(t);
  applySetup({cwd,runtime:'antigravity',preset:'essential',yes:true});
  const report=setupHealthCheck({cwd,runtime:'antigravity',includeGlobal:false});
  assert.equal(report.filesystem.manifestVersion,VERSION);
  assert.equal(report.filesystem.orchestratorFound,true);
  assert.equal(report.filesystem.orchestratorEligibility,'detected');
  assert.equal(report.hostActivationVerified,false);
  const cmd=spawnSync(process.execPath,[bin,'setup','check','--runtime','antigravity','--local-only'],
    {cwd,encoding:'utf8',timeout:10000});
  assert.equal(cmd.status,0,cmd.stderr);
  assert.equal(JSON.parse(cmd.stdout).filesystem.orchestratorFound,true);
});

test('agY host CLI executable is detected without claiming Antigravity IDE or native hook enforcement',t=>{
  const cwd=fixture(t),tools=path.join(cwd,'tools');
  fs.mkdirSync(tools,{recursive:true});
  fs.writeFileSync(path.join(tools,'agy.cmd'),'@echo off\nexit 123\n');
  const rows=inspectSetupHosts({cwd,env:{Path:tools},platform:'win32'});
  const agy=rows.find(x=>x.host==='antigravity');
  assert.equal(agy.hostCommandAvailable,true);
  assert.deepEqual(agy.detectedCommands,['agy']);
  assert.equal(agy.detectedSurface,'antigravity-cli-binary');
  assert.equal(agy.level,'executable-on-PATH');
  assert.equal(agy.confirmedRunning,false);
  assert.equal(rows.find(x=>x.host==='gemini').hostCommandAvailable,false);
  assert.equal(rows.find(x=>x.host==='codex').detectedSurface,'not-detected');
});
test('discovery reports CLI and legacy antigravity binaries separately and never invokes them',t=>{
  const cwd=fixture(t),tools=path.join(cwd,'tools');
  fs.mkdirSync(tools,{recursive:true});
  for(const name of ['agy.exe','antigravity.cmd'])
    fs.writeFileSync(path.join(tools,name),'not a valid executable');
  const rows=inspectSetupHosts({cwd,env:{Path:tools},platform:'win32'});
  const agy=rows.find(x=>x.host==='antigravity');
  assert.deepEqual(agy.detectedCommands,['agy','antigravity']);
  assert.equal(agy.hostCommandAvailable,true);
  assert.equal(agy.confirmedRunning,false);
});
test('PATH directories and links cannot spoof real executables',t=>{
  const cwd=fixture(t),tools=path.join(cwd,'tools');
  fs.mkdirSync(tools,{recursive:true});
  fs.mkdirSync(path.join(tools,'agy.cmd'));
  const report=inspectSetupHosts({cwd,env:{Path:tools},platform:'win32'});
  assert.equal(report.find(x=>x.host==='antigravity').hostCommandAvailable,false);
  assert.equal(report.find(x=>x.host==='antigravity').detectedSurface,'not-detected');
  // Windows file modes cannot accurately simulate POSIX executable bits:
  // on win32 chmodSync does not set Unix mode 0o111. Test the POSIX branch
  // only where the real filesystem supports it.
  if (process.platform !== 'win32') {
    fs.writeFileSync(path.join(tools,'gemini'), '#!/bin/sh\nexit 0\n',{mode:0o600});
    const nonexecutable=inspectSetupHosts({cwd,env:{PATH:tools},platform:'linux'});
    assert.equal(nonexecutable.find(x=>x.host==='gemini').hostCommandAvailable,false);
    fs.chmodSync(path.join(tools,'gemini'),0o700);
    const executable=inspectSetupHosts({cwd,env:{PATH:tools},platform:'linux'});
    assert.equal(executable.find(x=>x.host==='gemini').hostCommandAvailable,true);
  }
});
