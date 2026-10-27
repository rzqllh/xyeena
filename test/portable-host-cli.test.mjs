import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
const call=(cwd,args,envOverrides={})=>spawnSync(process.execPath,[cli,...args],{
  cwd,encoding:'utf8',timeout:10000,windowsHide:true,
  env:{...process.env,...envOverrides},
});
function workspace(t) {
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-host-cli-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  return cwd;
}
function skill(cwd,root='hermes') {
  const relative=root==='hermes'?'.hermes/skills':'.gemini/skills';
  const dir=path.join(cwd,relative,'xyeena-orchestrate');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'SKILL.md'),
    '---\nname: xyeena-orchestrate\ndescription: Delegate and orchestrate agents\n---\n# Orchestrate\n');
}
test('portable host preview works offline without installing agent runtime',t=>{
  const cwd=workspace(t);
  skill(cwd,'gemini');
  const result=call(cwd,['host','preview','--runtime','gemini','--goal','Review a bug','--local-only']);
  assert.equal(result.status,0,result.stderr);
  const plan=JSON.parse(result.stdout);
  assert.equal(plan.ready,true);
  assert.equal(plan.executed,false);
  assert.deepEqual(plan.requestedSkills,['xyeena-orchestrate']);
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena')),false);
});
test('portable host run refuses missing orchestrator',t=>{
  const cwd=workspace(t);
  const result=call(cwd,['host','run','--runtime','gemini','--goal','Review a bug','--yes','--local-only']);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Install and enable xyeena-orchestrate/);
});
test('portable host run refuses execution without explicit --yes',t=>{
  const cwd=workspace(t);skill(cwd,'gemini');
  const result=call(cwd,['host','run','--runtime','gemini','--goal','Review a bug',
    '--command','nonexistent-xyeena-test-executable','--local-only']);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/pass --yes/);
});
test('portable host parser rejects unsupported hosts and empty goals',t=>{
  const cwd=workspace(t);
  assert.notEqual(call(cwd,['host','preview','--runtime','unsupported','--goal','Review']).status,0);
  assert.notEqual(call(cwd,['host','preview','--runtime','gemini']).status,0);
});


// These are real OS subprocesses that emulate a provider's narrow JSON
// protocol. They use no AI account, model call, network or host permissions.
function mockHostExecutable(cwd, response, {exitCode=0}={}) {
  const script=path.join(cwd,process.platform==='win32'?'mock-provider.cmd':'mock-provider.sh');
  const json=JSON.stringify(response);
  if(process.platform==='win32') {
    fs.writeFileSync(script,'@echo off\r\nmore > NUL\r\n'+
      (json?'echo '+json+'\r\n':'')+'exit /b '+exitCode+'\r\n');
  } else {
    fs.writeFileSync(script,'#!/bin/sh\ncat >/dev/null\n'+
      (json?"printf '%s\\n' '"+json+"'\n":'')+'exit '+exitCode+'\n',{mode:0o700});
  }
  return script;
}
test('real subprocess CLI smoke: Gemini read-only host run consumes stdin and parses JSON',t=>{
  const cwd=workspace(t);
  skill(cwd,'gemini');
  const executable=mockHostExecutable(cwd,{response:'Fake provider reviewed test list',
    stats:{models:{mock:{tokens:{total:13}}}}});
  const out=call(cwd,['host','run','--runtime','gemini','--goal','Review local test list',
    '--command',executable,'--yes','--local-only']);
  assert.equal(out.status,0,out.stderr);
  const result=JSON.parse(out.stdout);
  assert.equal(result.executed,true);
  assert.equal(result.verified,false);
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.usageTokens,13);
  assert.equal(result.report,'Fake provider reviewed test list');
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena')),false);
});
test('real subprocess CLI smoke: Hermes requires settled token accounting and respects configured limit',t=>{
  const cwd=workspace(t);
  // The profile directory is a genuine Hermes global-skill source; do not
  // bypass the product's project trust gate merely to make a mock pass.
  skill(cwd,'hermes');
  const isolatedHermesHome=path.join(cwd,'.hermes');
  const env={HERMES_HOME:isolatedHermesHome};
  const executable=mockHostExecutable(cwd,{type:'result',exit_code:0,
    text:'Fake Hermes status',tokens:{total:1250}});
  const good=call(cwd,['host','run','--runtime','hermes','--goal','Review source only',
    '--command',executable,'--yes','--token-limit','2000','--max-turns','1'],env);
  assert.equal(good.status,0,good.stderr);
  const result=JSON.parse(good.stdout);
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.verified,false);
  assert.equal(result.budget.usedTokens,1250);
  assert.equal(result.budget.maxTurns,1);
  const denied=call(cwd,['host','run','--runtime','hermes','--goal','Review source only',
    '--command',executable,'--yes','--token-limit','1000'],env);
  assert.notEqual(denied.status,0);
  assert.match(denied.stderr,/one-shot token budget exceeded/);
  assert.match(denied.stderr,/Hermes-reported tokens=1250/);
  assert.match(denied.stderr,/post-run acceptance limit=1000/);
  assert.match(denied.stderr,/provider execution already completed/);
  assert.doesNotMatch(denied.stderr,/Fake Hermes status|session_id|HERMES_HOME/);
  assert.equal(denied.stdout.trim(),'');
});
test('real subprocess CLI smoke: orchestrate run remains unverified and never records without opt-in',t=>{
  const cwd=workspace(t);
  skill(cwd,'gemini');
  const executable=mockHostExecutable(cwd,{response:'Fake read-only result'});
  const out=call(cwd,['orchestrate','run','--runtime','gemini','--goal','Review local readme',
    '--command',executable,'--yes','--local-only']);
  assert.equal(out.status,0,out.stderr);
  const result=JSON.parse(out.stdout);
  assert.equal(result.executed,true);
  assert.equal(result.verified,false);
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(fs.existsSync(path.join(cwd,'.xyeena','runs')),false);
});
test('real subprocess CLI smoke: nonzero provider exit never emits successful report',t=>{
  const cwd=workspace(t);
  skill(cwd,'gemini');
  const executable=mockHostExecutable(cwd,{response:'Pretend pass'},{exitCode:42});
  const out=call(cwd,['host','run','--runtime','gemini','--goal','Review source',
    '--command',executable,'--yes','--local-only']);
  assert.notEqual(out.status,0);
  assert.match(out.stderr,/returned a nonzero status/);
  assert.equal(out.stdout.trim(),'');
});
