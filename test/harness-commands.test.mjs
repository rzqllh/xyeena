import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runHarness } from '../src/harness.mjs';

test('harness reports incomplete rather than success when no checks run',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-harness-'));
  const prior=process.cwd();
  try {
    for(const args of [['init','-q'],['config','user.email','test@example.com'],['config','user.name','Test']]){
      const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});
      assert.equal(r.status,0, r.stderr);
    }
    fs.writeFileSync(path.join(root,'README.md'),'Example\n');
    spawnSync('git',['add','README.md'],{cwd:root});
    const commit=spawnSync('git',['commit','-m','initial'],{cwd:root,encoding:'utf8'});
    assert.equal(commit.status,0,commit.stderr);
    assert.equal(runHarness('verify',{cwd:root}),3);
    assert.equal(fs.existsSync(path.join(root,'.harness')),false);
    assert.equal(runHarness('doctor',{cwd:root}),0);
    assert.equal(runHarness('audit',{cwd:root}),0);
    assert.equal(runHarness('scan',{cwd:root}),0);
    assert.equal(runHarness('changed',{cwd:root,base:'not-a-branch',explicitBase:true}),2);
  } finally {process.chdir(prior);fs.rmSync(root,{recursive:true,force:true})}
});


test('unified harness bridge cannot bypass selective installer',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-bypass-'));
  try {
    assert.equal(runHarness('init',{cwd:root}),2);
    assert.equal(runHarness('install-hook',{cwd:root}),2);
    assert.equal(fs.existsSync(path.join(root,'AGENTS.md')),false);
    assert.equal(fs.existsSync(path.join(root,'.xyeena')),false);
    assert.equal(fs.existsSync(path.join(root,'.git')),false);
  } finally {fs.rmSync(root,{recursive:true,force:true})}
});
