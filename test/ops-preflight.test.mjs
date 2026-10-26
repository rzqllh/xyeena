import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectOpsPreflight} from '../src/ops-preflight.mjs';
import {guidedCommand} from '../src/antigravity-guided.mjs';

const entry=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
const fixture=t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-preflight-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return root;
};
test('preflight inspects command hints without launching anything or leaking paths',t=>{
  const cwd=fixture(t),dir=path.join(cwd,'test-tools');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'agy.cmd'),'@echo off\nexit /b 111\n');
  const before=fs.readdirSync(cwd).sort();
  const report=inspectOpsPreflight({cwd,env:{Path:dir},platform:'win32'});
  assert.equal(report.mode,'read-only-prerequisite-inventory');
  assert.equal(report.project,'xyeena-rig');
  assert.equal(report.acceptanceScope,'rig-native-hosts');
  assert.equal(report.filesModified,false);
  assert.equal(report.configurationChanged,false);
  assert.equal(report.modelCallPerformed,false);
  assert.equal(report.guidedHook.manifest,'MISSING');
  assert.equal(report.guidedHook.hostEnforcement,'UNVERIFIED');
  assert.equal(report.nativeAcceptance.antigravityCli,'NOT_TESTED_BY_PREFLIGHT');
  const agy=report.commands.find(h=>h.host==='antigravity');
  assert.deepEqual(agy.commandNames,['agy']);
  assert.equal(agy.candidateDetected,true);
  assert.equal(agy.confirmedRunning,false);
  assert.equal(agy.nativeActivationVerified,false);
  assert.deepEqual(report.remainingGates.map(g=>g.issue),[34,36,37]);
  assert.equal(Object.hasOwn(report,'simpul'),false);
  assert.ok(!JSON.stringify(report).toLowerCase().includes('simpul'));
  assert.ok(!JSON.stringify(report).toLowerCase().includes('billing controls'));
  assert.deepEqual(fs.readdirSync(cwd).sort(),before);
  assert.ok(!JSON.stringify(report).includes(cwd),'No workspace paths in output');
});
test('preflight summarizes owned hook shape but never reports hook commands, secrets or host enforcement PASS',t=>{
  const cwd=fixture(t);
  fs.mkdirSync(path.join(cwd,'.agents'),{recursive:true});
  fs.mkdirSync(path.join(cwd,'.xyeena','hooks'),{recursive:true});
  fs.writeFileSync(path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs'),'// inert fixture');
  const config={
    'xyeena-rig-guided':{
      PreToolUse:[{matcher:'*',hooks:[{type:'command',
        command:'node ../.xyeena/hooks/antigravity-guided.mjs PreToolUse',timeout:3}]}]
    },
    unrelated:{debugSecret:'Bearer sk-DO-NOT-EXPOSE',file:'C:\\Users\\Private\\token.json'}
  };
  fs.writeFileSync(path.join(cwd,'.agents','hooks.json'),JSON.stringify(config));
  const result=inspectOpsPreflight({cwd,env:{PATH:''},platform:'win32'});
  assert.equal(result.guidedHook.manifest,'PRESENT');
  assert.equal(result.guidedHook.groupPresent,true);
  assert.equal(result.guidedHook.preToolUseRegistered,true);
  assert.equal(result.guidedHook.preToolUseEnabled,true);
  assert.equal(result.guidedHook.runnerPresent,true);
  assert.equal(result.guidedHook.runnerIntegrity,'UNOWNED');
  assert.equal(result.guidedHook.probeEligible,false);
  assert.equal(result.guidedHook.hostEnforcement,'UNVERIFIED');
  const safe=JSON.stringify(result);
  assert.ok(!safe.includes('sk-DO-NOT-EXPOSE'));
  assert.ok(!safe.includes('Private'));
  assert.ok(!safe.includes('antigravity-guided.mjs'));
});
test('preflight does not mistake decoy, extra or disabled Antigravity hooks for valid registration',t=>{
  const cwd=fixture(t);
  fs.mkdirSync(path.join(cwd,'.agents'),{recursive:true});
  fs.mkdirSync(path.join(cwd,'.xyeena','hooks'),{recursive:true});
  fs.writeFileSync(path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs'),'// fixture');
  const file=path.join(cwd,'.agents','hooks.json');
  const canonical='node ../.xyeena/hooks/antigravity-guided.mjs PreToolUse';
  const valid=()=>({'xyeena-rig-guided':{
    PreToolUse:[{matcher:'*',hooks:[{type:'command',command:canonical,timeout:3}]}]
  }});
  const report=()=>inspectOpsPreflight({cwd,env:{PATH:''},platform:'win32'}).guidedHook;
  fs.writeFileSync(file,JSON.stringify(valid()));
  assert.equal(report().preToolUseRegistered,true);
  assert.equal(report().preToolUseEnabled,true);
  const decoy=valid();
  decoy['xyeena-rig-guided'].PreToolUse[0].hooks[0].command=
    'echo antigravity-guided.mjs PreToolUse';
  fs.writeFileSync(file,JSON.stringify(decoy));
  assert.equal(report().preToolUseRegistered,false);
  assert.equal(report().preToolUseEnabled,false);
  const extra=valid();
  extra['xyeena-rig-guided'].PreToolUse[0].hooks.push({
    type:'command',command:'echo bypass',timeout:3
  });
  fs.writeFileSync(file,JSON.stringify(extra));
  assert.equal(report().preToolUseRegistered,false);
  const wrongTimeout=valid();
  wrongTimeout['xyeena-rig-guided'].PreToolUse[0].hooks[0].timeout=999;
  fs.writeFileSync(file,JSON.stringify(wrongTimeout));
  assert.equal(report().preToolUseRegistered,false);
  const disabled=valid();
  disabled['xyeena-rig-guided'].PreToolUse[0].hooks[0].enabled=false;
  fs.writeFileSync(file,JSON.stringify(disabled));
  assert.equal(report().preToolUseRegistered,true);
  assert.equal(report().preToolUseEnabled,false);
  const groupDisabled=valid();
  groupDisabled['xyeena-rig-guided'].enabled=false;
  fs.writeFileSync(file,JSON.stringify(groupDisabled));
  assert.equal(report().preToolUseEnabled,false);
  assert.equal(report().hostEnforcement,'UNVERIFIED');
});
test('preflight recognizes exact POSIX managed PreToolUse command but never host enforcement',t=>{
  const cwd=fixture(t);
  // macOS temp paths can contain /var -> /private/var symlink aliases.
  // The installer and preflight both use the canonical workspace root.
  const root=fs.realpathSync(cwd);
  fs.mkdirSync(path.join(cwd,'.agents'),{recursive:true});
  fs.mkdirSync(path.join(cwd,'.xyeena','hooks'),{recursive:true});
  const runner=path.join(root,'.xyeena','hooks','antigravity-guided.mjs');
  fs.writeFileSync(runner,'// fixture');
  const command=`"${process.execPath}" "${runner}" PreToolUse`;
  fs.writeFileSync(path.join(cwd,'.agents','hooks.json'),JSON.stringify({
    'xyeena-rig-guided':{PreToolUse:[{
      matcher:'*',hooks:[{type:'command',command,timeout:3}]
    }]}
  }));
  const report=inspectOpsPreflight({cwd,env:{PATH:''},platform:'linux'});
  assert.equal(report.guidedHook.preToolUseRegistered,true);
  assert.equal(report.guidedHook.hostEnforcement,'UNVERIFIED');
  assert.equal(report.guidedHook.hostActivationVerified,false);
});
test('preflight reports verified local runner ownership without calling a host',t=>{
  const cwd=fixture(t);
  guidedCommand('install',{cwd,yes:true});
  const report=()=>inspectOpsPreflight({cwd,env:{PATH:''}}).guidedHook;
  const installed=report();
  assert.equal(installed.runnerPresent,true);
  assert.equal(installed.runnerIntegrity,'MATCH');
  assert.equal(installed.preToolUseRegistered,true);
  assert.equal(installed.probeEligible,true);
  assert.equal(installed.hostEnforcement,'UNVERIFIED');
  const runner=path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs');
  const original=fs.readFileSync(runner,'utf8');
  fs.writeFileSync(runner,original+'\n// unexpected drift\n');
  assert.equal(report().runnerIntegrity,'MODIFIED');
  assert.equal(report().probeEligible,false);
  fs.writeFileSync(runner,original);
  const marker=path.join(cwd,'.xyeena','antigravity-guided.json');
  const content=fs.readFileSync(marker,'utf8');
  fs.writeFileSync(marker,'{invalid');
  assert.equal(report().runnerIntegrity,'INVALID_MANIFEST');
  assert.equal(report().probeEligible,false);
  fs.writeFileSync(marker,content);
  fs.rmSync(marker);
  assert.equal(report().runnerIntegrity,'UNOWNED');
  assert.equal(report().probeEligible,false);
  assert.equal(report().preToolUseRegistered,true,
    'Exact local hook command is a syntax hint, not proof of owned runner');
  const safe=JSON.stringify(inspectOpsPreflight({cwd,env:{PATH:''}}));
  assert.ok(!safe.includes(cwd));
  assert.ok(!safe.includes('antigravity-guided.mjs'));
});
test('preflight rejects linked and oversized runner/ownership manifests',t=>{
  const cwd=fixture(t);
  guidedCommand('install',{cwd,yes:true});
  const report=()=>inspectOpsPreflight({cwd,env:{PATH:''}}).guidedHook;
  const marker=path.join(cwd,'.xyeena','antigravity-guided.json');
  const original=fs.readFileSync(marker,'utf8');
  fs.writeFileSync(marker,' '.repeat(65537));
  assert.equal(report().runnerIntegrity,'INVALID_MANIFEST');
  assert.equal(report().probeEligible,false);
  fs.writeFileSync(marker,original);
  const runner=path.join(cwd,'.xyeena','hooks','antigravity-guided.mjs');
  fs.rmSync(runner);
  try {
    fs.symlinkSync(path.join(cwd,'.agents','hooks.json'),runner,'file');
    assert.equal(report().runnerPresent,false);
    assert.equal(report().runnerIntegrity,'MISSING_OR_UNTRUSTED');
    assert.equal(report().probeEligible,false);
  } catch(e) {
    if(!['EPERM','EACCES'].includes(e.code)) throw e;
  }
});
test('preflight fails safely on invalid or oversized hook configurations',t=>{
  const cwd=fixture(t),folder=path.join(cwd,'.agents');
  fs.mkdirSync(folder,{recursive:true});
  const file=path.join(folder,'hooks.json');
  fs.writeFileSync(file,'{invalid json');
  const invalid=inspectOpsPreflight({cwd,env:{PATH:''}});
  assert.equal(invalid.guidedHook.manifest,'INVALID_JSON');
  assert.equal(invalid.guidedHook.preToolUseRegistered,false);
  fs.writeFileSync(file,' '.repeat(65537));
  const oversized=inspectOpsPreflight({cwd,env:{PATH:''}});
  assert.equal(oversized.guidedHook.manifest,'UNTRUSTED_OR_OVERSIZE');
  assert.equal(oversized.guidedHook.hostEnforcement,'UNVERIFIED');
});
test('source ops preflight CLI is read-only with strict usage and no remote processes',t=>{
  const cwd=fixture(t);
  const before=fs.readdirSync(cwd);
  const args=[entry,'ops','preflight','--dir',cwd];
  const run=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:10000});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.equal(report.modelCallPerformed,false);
  assert.equal(report.nativeAcceptance.hermes,'NOT_TESTED_BY_PREFLIGHT');
  assert.equal(report.acceptanceScope,'rig-native-hosts');
  assert.equal(Object.hasOwn(report,'simpul'),false);
  assert.equal(fs.readdirSync(cwd).join(),before.join());
  assert.ok(!run.stdout.includes(cwd));
  const unsupported=spawnSync(process.execPath,[entry,'ops','preflight','--yes'],
    {cwd,encoding:'utf8',timeout:10000});
  assert.notEqual(unsupported.status,0);
  assert.match(unsupported.stderr,/Usage: xyeena ops preflight/);
});
