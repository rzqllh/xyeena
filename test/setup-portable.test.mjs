import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { previewSetup, applySetup, guidedSetup } from '../src/setup.mjs';
import { portableSkillTarget } from '../src/setup-portable.mjs';
import { discoverWorkspaceSkills } from '../src/workspace-skills.mjs';
import { VERSION } from '../src/paths.mjs';

function sandbox(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-portable-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const home=path.join(dir,'home'),cwd=path.join(dir,'project');
  fs.mkdirSync(home);fs.mkdirSync(cwd);
  return {home,cwd};
}
test('global destinations are explicitly isolated per host; Hermes profile supported',t=>{
  const {cwd,home}=sandbox(t);
  const dirs={antigravity:'.gemini/config/skills',gemini:'.gemini/skills',
    codex:'.agents/skills',claude:'.claude/skills',hermes:'.hermes/skills'};
  for(const [host,folder] of Object.entries(dirs))
    assert.equal(portableSkillTarget(host,{home}),path.join(home,folder));
  const env={HERMES_HOME:path.join(home,'profiles','personal')};
  assert.equal(portableSkillTarget('hermes',{home,env}),path.join(home,'profiles','personal','skills'));
  assert.throws(()=>portableSkillTarget('hermes',{home,env:{HERMES_HOME:path.join(cwd,'not-home')}}),/outside home/);
});
test('global copy installs into selected user home without touching workspace',t=>{
  const {cwd,home}=sandbox(t);
  const opts={cwd,home,scope:'global',mode:'copy',runtime:'gemini,codex',preset:'essential',harness:'none'};
  const preview=previewSetup(opts);
  assert.ok(preview.filesToWrite>0);
  assert.equal(preview.scope,'global');
  assert.equal(preview.noModelCalls,true);
  assert.deepEqual(fs.readdirSync(cwd),[]);
  const result=applySetup({...opts,yes:true,expectedFingerprint:preview.fingerprint});
  assert.equal(result.installed,true);
  assert.equal(result.mode,'copy');
  assert.deepEqual(result.diagnostics.map(x=>x.host),['gemini','codex']);
  for(const host of result.diagnostics){
    assert.equal(host.filesystemVerified,true);
    assert.equal(host.availability,'detected');
    assert.equal(host.verifiedSkills,host.expectedSkills);
    assert.equal(host.hostActivationVerified,false);
    assert.ok(host.skillDirectory.startsWith(fs.realpathSync(home)));
  }
  assert.ok(fs.existsSync(path.join(home,'.gemini/skills/xyeena-orchestrate/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home,'.agents/skills/xyeena-orchestrate/SKILL.md')));
  assert.deepEqual(fs.readdirSync(cwd),[]);
  assert.equal(previewSetup(opts).filesToWrite,0);
});
test('global symlink uses durable home store instead of npm cache and is discovered by routing',t=>{
  const {cwd,home}=sandbox(t);
  const opts={cwd,home,scope:'global',mode:'symlink',runtime:'antigravity,gemini,claude',preset:'balanced'};
  const plan=previewSetup(opts);
  assert.match(plan.durableStore,/[.]xyeena[/\\]skill-store/);
  assert.equal(fs.readdirSync(cwd).length,0);
  const result=applySetup({...opts,yes:true,expectedFingerprint:plan.fingerprint});
  assert.equal(result.installed,true);
  assert.ok(result.linked.length>0);
  for(const host of ['antigravity','gemini','claude']){
    const target=portableSkillTarget(host,{home});
    const item=path.join(target,'xyeena-orchestrate');
    assert.equal(fs.lstatSync(item).isSymbolicLink(),true);
    assert.ok(fs.realpathSync(item).startsWith(path.join(fs.realpathSync(home),'.xyeena','skill-store')));
    const found=discoverWorkspaceSkills({cwd,home,runtime:host});
    assert.equal(found.find(x=>x.name==='xyeena-orchestrate')?.availability,'detected');
  }
  assert.equal(previewSetup(opts).filesToWrite,0);
  assert.deepEqual(fs.readdirSync(cwd),[]);
});
test('workspace symlink is selected explicitly and does not follow npm cache eviction',t=>{
  const {cwd,home}=sandbox(t);
  const opts={cwd,home,scope:'workspace',mode:'symlink',runtime:'antigravity',preset:'essential',harness:'essential'};
  const preview=previewSetup(opts);
  const result=applySetup({...opts,yes:true,expectedFingerprint:preview.fingerprint});
  const skill=path.join(cwd,'.agents/skills/xyeena-orchestrate');
  assert.equal(fs.lstatSync(skill).isSymbolicLink(),true);
  assert.equal(result.nativeActivationVerified,false);
  assert.ok(fs.existsSync(path.join(cwd,'.xyeena/harness/guides/60-security')));
  assert.equal(discoverWorkspaceSkills({cwd,home,runtime:'antigravity',includeGlobal:false})
    .find(x=>x.name==='xyeena-orchestrate')?.availability,'detected');
});
test('global copy preserves unrelated existing skill by default and backs it up only with --update',t=>{
  const {cwd,home}=sandbox(t);
  const skill=path.join(fs.realpathSync(home),'.gemini/skills/xyeena-orchestrate');
  fs.mkdirSync(skill,{recursive:true});
  fs.writeFileSync(path.join(skill,'SKILL.md'),'---\nname: xyeena-orchestrate\n---\nCUSTOM\n');
  const opts={cwd,home,scope:'global',mode:'copy',runtime:'gemini',preset:'essential'};
  const plan=previewSetup(opts);
  assert.ok(plan.conflicts.includes(skill));
  const keep=applySetup({...opts,yes:true});
  assert.ok(keep.conflictsPreserved.includes(skill));
  assert.equal(keep.diagnostics.find(x=>x.host==='gemini').filesystemVerified,false);
  assert.equal(keep.diagnostics.find(x=>x.host==='gemini').availability,'partial');
  assert.match(fs.readFileSync(path.join(skill,'SKILL.md'),'utf8'),/CUSTOM/);
  const repl=applySetup({...opts,update:true,yes:true});
  assert.ok(repl.backupDirectory);
  const copies=fs.readdirSync(repl.backupDirectory,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>path.join(repl.backupDirectory,x.name,'SKILL.md')).filter(x=>fs.existsSync(x));
  assert.ok(copies.some(x=>fs.readFileSync(x,'utf8').includes('CUSTOM')));
  assert.doesNotMatch(fs.readFileSync(path.join(skill,'SKILL.md'),'utf8'),/CUSTOM/);
});
test('foreign symlinks and modified immutable store are refused',t=>{
  const {cwd,home}=sandbox(t);
  const malicious=path.join(fs.realpathSync(home),'.gemini/skills/xyeena-core');
  const elsewhere=path.join(home,'elsewhere');
  fs.mkdirSync(path.dirname(malicious),{recursive:true});fs.mkdirSync(elsewhere);
  fs.symlinkSync(elsewhere,malicious,process.platform==='win32'?'junction':'dir');
  const opts={cwd,home,scope:'global',mode:'symlink',runtime:'gemini',preset:'essential'};
  const preview=previewSetup(opts);
  assert.ok(preview.blocked.includes(malicious));
  assert.throws(()=>applySetup({...opts,yes:true,update:true}),/Unsafe global\/linked paths/);
  assert.equal(fs.lstatSync(malicious).isSymbolicLink(),true);
});
test('beginner wizard defaults global to copy and reports actual per-host verification',async t=>{
  const {cwd,home}=sandbox(t);
  const answers=['1','1,3,4','1','y'];let idx=0;const out=[];
  const result=await guidedSetup({cwd,home,selectLocation:true,ask:async()=>answers[idx++],output:{write:v=>out.push(v)}});
  assert.equal(result.installed,true);
  assert.equal(result.scope,'global');
  assert.equal(result.mode,'copy');
  assert.deepEqual(result.diagnostics.map(x=>x.host),['hermes','antigravity','codex']);
  assert.ok(result.diagnostics.every(x=>x.filesystemVerified && x.verifiedSkills===x.expectedSkills));
  assert.ok(result.diagnostics.every(x=>!x.hostActivationVerified));
  assert.deepEqual(fs.readdirSync(cwd),[]);
  assert.match(out.join(''),/Global/);
  assert.match(out.join(''),/packaged skills verified on disk/);
  assert.doesNotMatch(out.join(''),/filesystem-not-verified/);
  assert.doesNotMatch(out.join(''),/Installation method:/);
});
test('beginner wizard offers symlink for workspace only',async t=>{
  const {cwd,home}=sandbox(t);
  const answers=['2','3','1','2','1','y'];let idx=0;const out=[];
  const result=await guidedSetup({cwd,home,selectLocation:true,ask:async()=>answers[idx++],output:{write:v=>out.push(v)}});
  assert.equal(result.installed,true);
  assert.equal(result.scope,'workspace');
  assert.equal(result.mode,'symlink');
  assert.equal(fs.lstatSync(path.join(cwd,'.agents/skills/xyeena-orchestrate')).isSymbolicLink(),true);
  assert.match(out.join(''),/Installation method:/);
  assert.match(out.join(''),/Symlink/);
});
test('global Harness must stay project-scoped instead of silently faking host guards',t=>{
  const {cwd,home}=sandbox(t);
  assert.throws(()=>previewSetup({cwd,home,runtime:'gemini',scope:'global',mode:'copy',harness:'full'}),/workspace-only/);
});

test('upgrades an earlier Xyeena-managed global junction without replacing foreign links',t=>{
  const {cwd,home}=sandbox(t);
  const canonicalHome=fs.realpathSync(home);
  const old=path.join(canonicalHome,'.xyeena/skill-store/v0.3.0/xyeena-core-0123456789abcdef');
  fs.mkdirSync(old,{recursive:true});
  fs.writeFileSync(path.join(old,'SKILL.md'),'---\nname: xyeena-core\ndescription: Earlier version\n---\n');
  const destination=path.join(canonicalHome,'.gemini/skills/xyeena-core');
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.symlinkSync(old,destination,process.platform==='win32'?'junction':'dir');
  const opts={cwd,home,scope:'global',mode:'symlink',runtime:'gemini',preset:'essential'};
  const preview=previewSetup(opts);
  assert.ok(preview.conflicts.includes(destination));
  const keep=applySetup({...opts,yes:true});
  assert.ok(keep.conflictsPreserved.includes(destination));
  assert.equal(fs.realpathSync(destination),fs.realpathSync(old));
  const updated=applySetup({...opts,yes:true,update:true});
  assert.notEqual(fs.realpathSync(destination),fs.realpathSync(old));
  assert.ok(fs.realpathSync(destination).includes('v'+VERSION));
  assert.ok(updated.backupDirectory);
  const backupNames=fs.readdirSync(updated.backupDirectory).filter(x=>x.endsWith('.link-target'));
  assert.ok(backupNames.length>0);
  assert.equal(fs.readFileSync(path.join(updated.backupDirectory,backupNames[0]),'utf8'),fs.realpathSync(old));
});
