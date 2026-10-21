import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SkillInventoryCache, inventoryFingerprint } from '../src/skill-cache.mjs';

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-cache-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  return cwd;
}
function writeSkill(cwd,name,description='Review safe changes') {
  const folder=path.join(cwd,'.agents','skills',name);
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'SKILL.md'),'---\nname: '+name+'\ndescription: '+description+'\n---\n');
  return folder;
}
test('cache returns isolated copies, invalidates automatically on added or modified skill',t=>{
  const cwd=fixture(t);
  writeSkill(cwd,'first-skill');
  const options={cwd,runtime:'codex',includeGlobal:false};
  const cache=new SkillInventoryCache();
  const before=inventoryFingerprint(options);
  const first=cache.get(options);
  first[0].name='tampered';
  assert.equal(cache.get(options)[0].name,'first-skill');
  writeSkill(cwd,'second-skill');
  const second=cache.get(options);
  assert.equal(second.length,2);
  assert.notEqual(inventoryFingerprint(options),before);
  writeSkill(cwd,'first-skill','Debug workspace tests safely');
  assert.equal(cache.get(options).find(x=>x.name==='first-skill').description,'Debug workspace tests safely');
});
test('Hermes config changes invalidate trust status and host root selection',t=>{
  const cwd=fixture(t),home=path.join(cwd,'user'),repo=path.join(cwd,'repo');
  fs.mkdirSync(home,{recursive:true});
  fs.mkdirSync(repo,{recursive:true});
  fs.mkdirSync(path.join(repo,'.git'));
  const folder=path.join(repo,'.hermes','skills','workflow');
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'SKILL.md'),'---\nname: workflow\ndescription: Review regression\n---\n');
  const cache=new SkillInventoryCache();
  const opts={cwd:repo,home,runtime:'hermes',includeGlobal:false};
  assert.equal(cache.get(opts)[0].availability,'requires-host-trust');
  const cfg=path.join(home,'.hermes','config.yaml');
  fs.mkdirSync(path.dirname(cfg),{recursive:true});
  fs.writeFileSync(cfg,'skills:\n  trusted_project_dirs:\n    - '+repo+'\n');
  assert.equal(cache.get(opts)[0].availability,'detected');
});
test('invalid cache options fail safely and explicit invalidation clears all entries',t=>{
  const cwd=fixture(t);
  assert.throws(()=>new SkillInventoryCache({maxEntries:0}),/Invalid cache size/);
  const cache=new SkillInventoryCache({maxEntries:1});
  writeSkill(cwd,'simple');
  cache.get({cwd,runtime:'codex',includeGlobal:false});
  assert.equal(cache.entries.size,1);
  cache.invalidate();
  assert.equal(cache.entries.size,0);
});
