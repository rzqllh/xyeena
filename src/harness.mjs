import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PACKAGE_ROOT } from './paths.mjs';

const PRIVATE_KEY=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const TOKEN=/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/;
const safeName=f=>!f.includes('\0') && !f.includes('..'+path.sep);
function git(cwd,args) {
  return spawnSync('git',args,{cwd,encoding:'utf8',timeout:12000,windowsHide:true,maxBuffer:1024*1024*8});
}
function lines(s) {return String(s||'').split(/\r?\n/).filter(Boolean);}
function gitValue(cwd,args) {const r=git(cwd,args);return r.status===0?r.stdout.trim():null;}
function jsonFile(file) {
  if(!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
function getDefaults() {return jsonFile(path.join(PACKAGE_ROOT,'harness','default-config.json'));}
function detect(root) {
  const found=[];
  if(fs.existsSync(path.join(root,'package.json')))found.push('node');
  if(fs.existsSync(path.join(root,'next.config.js'))||
     fs.existsSync(path.join(root,'next.config.ts'))||
     fs.existsSync(path.join(root,'next.config.mjs')))found.push('nextjs');
  if(fs.existsSync(path.join(root,'pyproject.toml'))||
     fs.existsSync(path.join(root,'requirements.txt')))found.push('python');
  return found.length?found:['generic-git'];
}
function resolveBase(root,requested,explicit) {
  const valid=x=>git(root,['rev-parse','--verify','--quiet',x+'^{commit}']).status===0;
  if(requested && valid(requested))return {base:requested,warning:null};
  if(explicit)throw new Error('Requested Git base not found: '+requested);
  for(const fallback of ['origin/main','main','origin/master','master','HEAD^','HEAD']) {
    if(valid(fallback))return {base:fallback,
      warning:requested && requested!==fallback?'Base '+requested+' unavailable; using '+fallback+'. Committed change coverage may be incomplete.':null};
  }
  throw new Error('This Git repository has no commit to compare against.');
}
function changedPaths(root,base) {
  const diff=git(root,['diff','--name-only','-z',base,'--']);
  if(diff.status!==0)throw new Error('Could not compute Git diff against '+base);
  const untracked=git(root,['ls-files','--others','--exclude-standard','-z']);
  if(untracked.status!==0)throw new Error('Could not enumerate untracked files.');
  return [...new Set((diff.stdout+'\0'+untracked.stdout).split('\0').filter(Boolean))];
}
function repoFiles(root) {
  const a=git(root,['ls-files','-z']),b=git(root,['ls-files','--others','--exclude-standard','-z']);
  if(a.status!==0||b.status!==0)throw new Error('Cannot enumerate project files.');
  return [...new Set((a.stdout+'\0'+b.stdout).split('\0').filter(Boolean))];
}
function levelFor(paths) {
  if(paths.some(f=>/(^|\/)(auth|security|migrations|infra)(\/|$)|^\.github\/workflows\//i.test(f)))return 'HIGH';
  if(paths.some(f=>/(^|\/)(src|app|pages|lib)(\/|$)|package\.json|lock|pyproject/i.test(f)))return 'MEDIUM';
  return paths.length?'LOW':'LOW';
}
function scan(root,files) {
  const issues=[];
  const ignored=/^(?:node_modules|\.git|\.harness|dist|build|coverage)\//;
  for(const rel of files){
    if(!safeName(rel)||path.isAbsolute(rel)||ignored.test(rel))continue;
    const normalized=rel.replace(/\\/g,'/');
    const base=path.basename(rel);
    if(/^\.env(?:\..*)?$/.test(base)&&!/\.(example|sample|template)$/.test(base))
      issues.push({level:'BLOCK',file:rel,rule:'environment-file',detail:'Environment file detected in project file inventory.'});
    const abs=path.resolve(root,rel);
    if(!abs.startsWith(root+path.sep)||!fs.existsSync(abs))continue;
    const st=fs.lstatSync(abs);
    if(!st.isFile()||st.size>1_000_000)continue;
    const text=fs.readFileSync(abs,'utf8');
    if(PRIVATE_KEY.test(text))issues.push({level:'BLOCK',file:rel,rule:'private-key',detail:'Possible private key material.'});
    if(TOKEN.test(text))issues.push({level:'BLOCK',file:rel,rule:'credential-pattern',detail:'Possible access credential.'});
  }
  return issues;
}
function scriptsToRun(root) {
  const pkg=jsonFile(path.join(root,'package.json'));
  const s=pkg?.scripts||{};
  return ['lint','typecheck','test','build'].filter(x=>typeof s[x]==='string'&&s[x].trim());
}
function verify(root,writeEvidence=false) {
  const checks=scriptsToRun(root);
  if(!checks.length)return {status:'INCOMPLETE',reason:'No project-native checks available',checks:[]};
  const results=[];
  for(const name of checks) {
    const p=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',name],{
      cwd:root,encoding:'utf8',timeout:120_000,windowsHide:true,maxBuffer:1024*1024*2});
    results.push({name,status:p.status===0?'PASS':'FAIL',exitCode:p.status,summary:lines((p.stdout||'')+'\n'+(p.stderr||'')).slice(-5).join(' | ').slice(0,700)});
  }
  const status=results.every(x=>x.status==='PASS')?'PASS':'FAIL';
  const payload={schemaVersion:1,status,checks:results,generatedAt:new Date().toISOString()};
  if(writeEvidence) {
    const dir=path.join(root,'.harness','evidence');
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'latest.json'),JSON.stringify(payload,null,2)+'\n');
    console.log('Evidence saved to .harness/evidence/latest.json; ensure this path is Git-ignored.');
  }
  return payload;
}

export function runHarness(command,{cwd=process.cwd(),base=null,explicitBase=false,evidence=false}={}) {
  const root=path.resolve(cwd);
  const repo=gitValue(root,['rev-parse','--show-toplevel']);
  if(!repo){console.error('Harness requires a Git repository.');return 2;}
  const configFile=path.join(root,'.xyeena','config.json');
  let cfg;try{cfg=jsonFile(configFile)||getDefaults();}catch(e){console.error('Invalid harness configuration: '+e.message);return 2;}
  if(!cfg || cfg.schemaVersion!==3){console.error('Unsupported harness configuration schema.');return 2;}
  const requested=base||'origin/'+(cfg.targetBranch||'main');
  let baseInfo;
  try{baseInfo=resolveBase(repo,requested,explicitBase);}catch(e){console.error(e.message);return 2;}
  if(baseInfo.warning)console.warn('WARN: '+baseInfo.warning);
  let paths;
  try{paths=changedPaths(repo,baseInfo.base);}catch(e){console.error(e.message);return 2;}
  const info={root:repo,config:fs.existsSync(configFile)?'.xyeena/config.json':'embedded defaults',
    adapters:detect(repo),base:baseInfo.base,changed:paths.length,risk:levelFor(paths)};
  if(command==='doctor'){console.log(JSON.stringify(info,null,2));return 0;}
  if(command==='changed'){console.log(JSON.stringify({base:info.base,files:paths},null,2));return 0;}
  if(command==='risk'){console.log(JSON.stringify({risk:info.risk,files:paths},null,2));return 0;}
  if(command==='adapters'){console.log(JSON.stringify(info.adapters));return 0;}
  let issues;
  try{issues=scan(repo,repoFiles(repo));}catch(e){console.error(e.message);return 2;}
  if(command==='audit'||command==='scan'){
    console.log(JSON.stringify({ ...info,blockers:issues.length,issues },null,2));
    return command==='scan'&&issues.length?2:0;
  }
  if(command==='verify'){
    if(issues.length){console.error('BLOCKED: '+issues.length+' scanner blocker(s).');return 2;}
    const result=verify(repo,evidence);
    console.log(JSON.stringify({risk:info.risk,...result},null,2));
    return result.status==='PASS'?0:result.status==='INCOMPLETE'?3:2;
  }
  console.error('Unknown harness command: '+command);
  return 2;
}
