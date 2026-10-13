import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const command=path.resolve('bin/xyeena.mjs');
const run=(dir,args)=>spawnSync(process.execPath,[command,'init',...args,'--dir',dir],
  {cwd:dir,encoding:'utf8',timeout:15000,windowsHide:true});

test('non-interactive npx-style init refuses implicit install-all',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-npx-'));
  try{
    const missing=run(dir,[]);
    assert.notEqual(missing.status,0);
    assert.equal(fs.existsSync(path.join(dir,'.agents')),false);
    assert.equal(fs.existsSync(path.join(dir,'.xyeena')),false);
    const onlyRuntime=run(dir,['--runtime','codex','--yes']);
    assert.notEqual(onlyRuntime.status,0);
    assert.equal(fs.existsSync(path.join(dir,'.agents')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('explicit all requires confirmation; dry-run leaves no files',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-preview-'));
  try{
    const noYes=run(dir,['--components','all','--runtime','all','--skills','all','--guards','all']);
    assert.notEqual(noYes.status,0);
    const preview=run(dir,['--components','all','--runtime','all','--skills','all','--guards','all','--dry-run']);
    assert.equal(preview.status,0,preview.stderr);
    assert.deepEqual(fs.readdirSync(dir),[]);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('explicit selection installs only requested runtime and capabilities',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-codex-'));
  try{
    const result=run(dir,['--components','skills','--runtime','codex','--skills','xyeena-interface','--yes']);
    assert.equal(result.status,0,result.stderr);
    assert.ok(fs.existsSync(path.join(dir,'.agents','skills','xyeena-core','SKILL.md')));
    assert.ok(fs.existsSync(path.join(dir,'.agents','skills','xyeena-interface','SKILL.md')));
    assert.equal(fs.existsSync(path.join(dir,'.claude')),false);
    assert.equal(fs.existsSync(path.join(dir,'.xyeena','harness')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
