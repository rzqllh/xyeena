#!/usr/bin/env node
// Human-in-the-loop TTY acceptance on a disposable fixture, without extra dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { availableSkills, availableHarnessGroups } from '../src/selection.mjs';
import { VERSION } from '../src/paths.mjs';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const binary=path.join(project,'bin','xyeena.mjs');
if(!process.stdin.isTTY || !process.stdout.isTTY){
  console.error('Run this acceptance script in a real interactive terminal (e.g. Windows PowerShell).');
  process.exit(2);
}
const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-accept-'));
const fixture=name=>path.join(root,name);
const has=(...parts)=>fs.existsSync(path.join(...parts));
const dirs=p=>fs.existsSync(p)?fs.readdirSync(p).sort():[];
const report=[];
function verify(condition,message){
  assert.ok(condition,message);
}
function run(name,subdir,answers,{expected=0,extra=[]}={}){
  console.log('\n'+ '='.repeat(55));
  console.log(name+'\nTarget: '+fixture(subdir));
  console.log('Enter at the wizard prompts: '+answers.join(' → '));
  console.log('='.repeat(55));
  const result=spawnSync(process.execPath,[binary,'init','--dir',fixture(subdir),...extra],
    {cwd:project,stdio:'inherit',windowsHide:false});
  if(result.error)throw result.error;
  if(result.status!==expected){
    throw new Error(name+' returned exit '+result.status+' (expected '+expected+').');
  }
}
function completed(name){
  report.push(name);
  console.log('PASS: '+name);
}
try{
  console.log('Xyeena '+VERSION+' manual installer acceptance (real TTY)');
  console.log('Only temporary fixture paths are used. No Git commands or npm publishing.');
  console.log('Fixture: '+root);
  const ver=spawnSync(process.execPath,[binary,'version'],{cwd:project,encoding:'utf8'});
  assert.equal(ver.status,0);
  assert.equal(ver.stdout.trim(),VERSION);

  run('1. Cancel immediately','cancel',['0']);
  verify(!has(fixture('cancel'),'.xyeena')&&!has(fixture('cancel'),'.agents')&&!has(fixture('cancel'),'.claude'),
    'Cancel created project resources');
  completed('Immediate cancellation');

  run('2. Skills only (Codex, Interface)','skills',['1','codex','xyeena-interface','y']);
  const skillDir=fixture('skills');
  verify(has(skillDir,'.agents','skills','xyeena-core','SKILL.md'),'Mandatory xyeena-core missing');
  verify(has(skillDir,'.agents','skills','xyeena-interface','SKILL.md'),'Selected xyeena-interface missing');
  verify(JSON.stringify(dirs(path.join(skillDir,'.agents','skills')))===
    JSON.stringify(['xyeena-core','xyeena-interface']),'Unselected skill was installed');
  verify(!has(skillDir,'.claude')&&!has(skillDir,'.xyeena','harness'),'Unselected component was installed');
  completed('Skills-only selection with required dependency');

  run('3. Harness only (Core)','harness',['2','00-core','y']);
  const harness=fixture('harness');
  verify(has(harness,'.xyeena','config.json'),'Harness config missing');
  verify(has(harness,'.xyeena','profile.md'),'Harness profile missing');
  verify(JSON.stringify(dirs(path.join(harness,'.xyeena','harness','guides')))===
    JSON.stringify(['00-core']),'Unselected guardrails were installed');
  verify(!has(harness,'.agents')&&!has(harness,'AGENTS.md'),'Harness-only touched other agent files');
  completed('Harness-only guardrail selection');

  run('4. Explicit All (runtimes, skills, guardrails)','all',['3','all','all','all','yes']);
  const all=fixture('all');
  verify(JSON.stringify(dirs(path.join(all,'.agents','skills')))===JSON.stringify(availableSkills()),
    'Missing or extra .agents skills in explicit All');
  verify(JSON.stringify(dirs(path.join(all,'.claude','skills')))===JSON.stringify(availableSkills()),
    'Missing or extra Claude skills in explicit All');
  verify(JSON.stringify(dirs(path.join(all,'.xyeena','harness','guides')))===JSON.stringify(availableHarnessGroups()),
    'Missing or extra guardrail groups in explicit All');
  completed('Explicit All needs human confirmation');

  run('5. Cancel at final confirmation','cancel-late',['2','00-core','n']);
  verify(!has(fixture('cancel-late'),'.xyeena'),'Declining final confirmation wrote a manifest');
  completed('Late cancellation');

  run('6. Repeat existing Skills selection','skills',['1','codex','xyeena-interface','y']);
  completed('Idempotent selective reinstall');

  const protectedFile=path.join(skillDir,'.agents','skills','xyeena-interface','SKILL.md');
  const marker='\nXYEENA_LOCAL_CHANGE_MUST_BE_PRESERVED\n';
  fs.appendFileSync(protectedFile,marker);
  run('7. Modified user file must block reinstall','skills',['1','codex','xyeena-interface','y'],{expected:1});
  verify(fs.readFileSync(protectedFile,'utf8').endsWith(marker),'Installer overwrote modified user file');
  completed('Conflict refusal protects user modification');

  console.log('\n8. Non-interactive flags and dry-run');
  const dry=fixture('dry');
  const dryResult=spawnSync(process.execPath,[binary,'init','--components','all','--runtime','all',
    '--skills','all','--guards','all','--dry-run','--dir',dry],{cwd:project,encoding:'utf8'});
  assert.equal(dryResult.status,0,dryResult.stderr);
  verify(!fs.existsSync(dry),'Dry-run created a project directory');
  const explicit=fixture('explicit');
  const exp=spawnSync(process.execPath,[binary,'init','--components','harness','--guards','00-core',
    '--yes','--dir',explicit],{cwd:project,encoding:'utf8'});
  assert.equal(exp.status,0,exp.stderr);
  verify(JSON.stringify(dirs(path.join(explicit,'.xyeena','harness','guides')))===JSON.stringify(['00-core']),
    'Non-interactive flags installed other guards');
  completed('Explicit CI flags and no-write dry-run');

  console.log('\nPASS: '+report.length+'/'+report.length+' acceptance scenarios verified.');
  console.log('Temporary acceptance fixture retained for optional inspection: '+root);
  console.log('Nothing was committed, pushed or published.');
} catch(error){
  console.error('\nFAIL after '+report.length+' passing scenarios: '+error.message);
  console.error('Fixture retained for debugging: '+root);
  process.exitCode=1;
}
