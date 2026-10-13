import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseChoice, explicitSelection } from '../src/selection.mjs';
import { installSelective } from '../src/install.mjs';

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-choice-'));
const done = p => fs.rmSync(p,{recursive:true,force:true});

test('selection never implicitly chooses all',()=>{
  assert.throws(()=>parseChoice('', ['skills','harness']),/Select at least one/);
  assert.throws(()=>explicitSelection({}),/requires --components/);
  assert.throws(()=>explicitSelection({components:'skills',runtime:'codex'}),/Select at least one/);
  assert.throws(()=>explicitSelection({components:'harness'}),/Select at least one/);
  assert.deepEqual(explicitSelection({components:'harness',guards:'00-core'}),{components:['harness'],guards:['00-core'],runtimes:[],skills:[],guards:['00-core']});
  assert.deepEqual(parseChoice('all',['skills','harness']),['skills','harness']);
});

test('selective skills pull only required capability dependencies',()=>{
  const root=temp();
  try {
    const result=installSelective({cwd:root,components:['skills'],runtimes:['codex'],skills:['xyeena-interface']});
    assert.ok(result.skills.includes('xyeena-interface'));
    assert.ok(result.skills.includes('xyeena-core'));
    assert.ok(result.autoDependencies.includes('xyeena-core'));
    assert.ok(fs.existsSync(path.join(root,'.agents','skills','xyeena-interface','SKILL.md')));
    assert.ok(fs.existsSync(path.join(root,'.agents','skills','xyeena-core','SKILL.md')));
    assert.equal(fs.existsSync(path.join(root,'.claude')),false);
    assert.equal(fs.existsSync(path.join(root,'.xyeena','harness')),false);
  } finally {done(root)}
});

test('harness-only installs no skills, no agents and no AGENTS.md',()=>{
  const root=temp();
  try {
    const result=installSelective({cwd:root,components:['harness'],guards:['00-core']});
    assert.deepEqual(result.skills,[]);
    assert.ok(fs.existsSync(path.join(root,'.xyeena','config.json')));
    assert.ok(fs.existsSync(path.join(root,'.xyeena','harness','guides','00-core','README.md')));
    assert.equal(fs.existsSync(path.join(root,'.agents')),false);
    assert.equal(fs.existsSync(path.join(root,'AGENTS.md')),false);
    installSelective({cwd:root,components:['harness'],guards:['00-core']});
  } finally {done(root)}
});

test('dry-run never writes and conflicts fail before partial installation',()=>{
  const root=temp();
  try {
    installSelective({cwd:root,components:['skills','harness'],runtimes:['claude'],skills:['xyeena-core'],guards:['00-core'],dryRun:true});
    assert.deepEqual(fs.readdirSync(root),[]);
    fs.mkdirSync(path.join(root,'.xyeena'),{recursive:true});
    fs.writeFileSync(path.join(root,'.xyeena','config.json'),'{"custom":true}\n');
    assert.throws(()=>installSelective({cwd:root,components:['skills','harness'],runtimes:['claude'],skills:['xyeena-core'],guards:['00-core']}),/Refusing to overwrite/);
    assert.equal(fs.existsSync(path.join(root,'.claude')),false);
    assert.equal(fs.readFileSync(path.join(root,'.xyeena','config.json'),'utf8'),'{"custom":true}\n');
  } finally {done(root)}
});
