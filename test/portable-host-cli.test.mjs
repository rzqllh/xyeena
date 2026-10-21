import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli=fileURLToPath(new URL('../bin/xyeena.mjs',import.meta.url));
const call=(cwd,args)=>spawnSync(process.execPath,[cli,...args],{
  cwd,encoding:'utf8',timeout:10000,windowsHide:true,
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
