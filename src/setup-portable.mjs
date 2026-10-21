import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { PACKAGE_ROOT, SKILLS_DIR, VERSION } from './paths.mjs';
import { skillDependencyClosure } from './selection.mjs';
import { runtimeDescriptor } from './runtime.mjs';
import { hermesSkillSettings } from './skill-hosts.mjs';

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const lstat=p=>{try{return fs.lstatSync(p)}catch(e){if(e.code==='ENOENT')return null;throw e}};
const inRoot=(root,dest)=>{const rel=path.relative(root,path.resolve(dest));return !!rel&&rel!=='..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)};
export function portableSkillTarget(runtime,{home=os.homedir(),env=process.env}={}){
  if(runtime==='hermes'){
    const config=hermesSkillSettings(home,env);
    const dest=config.createDir||path.join(config.profileRoot,'skills');
    if(!inRoot(home,dest))throw new Error('Hermes global skill directory outside home; adjust HERMES_HOME or skills.create_dir.');
    return dest;
  }
  const dirs={antigravity:'.gemini/config/skills',gemini:'.gemini/skills',codex:'.agents/skills',claude:'.claude/skills'};
  if(!Object.hasOwn(dirs,runtime))throw new Error('Unknown global skill runtime: '+runtime);
  return path.join(home,...dirs[runtime].split('/'));
}
function safePath(root,dst,{allowLeafSymlink=false}={}){
  if(!inRoot(root,dst))throw new Error('Install path escapes selected root: '+dst);
  let node=root;const parts=path.relative(root,dst).split(path.sep);
  for(let i=0;i<parts.length;i++){
    node=path.join(node,parts[i]);const stat=lstat(node);
    if(!stat)continue;
    if(stat.isSymbolicLink()&&!(allowLeafSymlink&&i===parts.length-1))
      throw new Error('Refusing symlink/junction in installation path: '+node);
    if(i<parts.length-1&&!stat.isDirectory())throw new Error('Install parent is not a directory: '+node);
  }
}
function entries(root,prefix='',out=[]){
  for(const ent of fs.readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(ent.isSymbolicLink())throw new Error('Refusing a symlink inside a skill bundle: '+ent.name);
    const name=path.join(prefix,ent.name),src=path.join(root,ent.name);
    if(ent.isDirectory())entries(src,name,out);
    else if(ent.isFile())out.push({name,content:fs.readFileSync(src)});
    else throw new Error('Unsupported skill bundle entry');
  }
  return out;
}
const directoryHash=dir=>hash(Buffer.concat(entries(dir).flatMap(x=>[Buffer.from(x.name.split(path.sep).join('/')+'\0'),x.content])));
const safeHash=dir=>{try{return directoryHash(dir)}catch{return 'unsupported-tree'}};
function copyDirectory(src,dst){
  fs.mkdirSync(dst,{recursive:true});
  for(const item of entries(src)){
    const file=path.join(dst,item.name);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,item.content,{flag:'wx'});
  }
}
function managedLink(dst,src){
  try{return fs.lstatSync(dst).isSymbolicLink() && fs.realpathSync(dst)===fs.realpathSync(src)}
  catch{return false}
}
function build(options){
  const {scope='workspace',mode='copy',cwd=process.cwd(),home=os.homedir(),runtimes=[],skills=[],guards=[],harness='none',env=process.env}=options;
  if(!['workspace','global'].includes(scope)||!['copy','symlink'].includes(mode))
    throw new Error('Scope must be workspace|global and mode must be copy|symlink');
  if(scope==='workspace'&&mode==='copy')throw new Error('Workspace copy uses the existing setup installer');
  if(scope==='global'&&harness!=='none')
    throw new Error('Harness is workspace-only. Use --harness none for global skills.');
  if(!runtimes.length||!skills.length)throw new Error('Select AI runtimes and skills explicitly');
  const rootHome=fs.realpathSync(path.resolve(home));
  const workspace=scope==='workspace'?fs.realpathSync(path.resolve(cwd)):null;
  const selected=skillDependencyClosure(skills);
  const store=path.join(rootHome,'.xyeena','skill-store','v'+VERSION);
  const items=[],seen=new Set();
  for(const skill of selected){
    const source=path.join(SKILLS_DIR,skill);
    const fingerprint=directoryHash(source);
    const sourceStore=path.join(store,skill+'-'+fingerprint.slice(0,16));
    if(mode==='symlink')items.push({kind:'store',src:source,dst:sourceStore,root:rootHome,skill,sha:fingerprint});
  }
  for(const runtime of runtimes){
    runtimeDescriptor(runtime);
    const base=scope==='global'?portableSkillTarget(runtime,{home:rootHome,env}):
      path.join(workspace,runtimeDescriptor(runtime).skillDir);
    for(const skill of selected){
      const dst=path.join(base,skill);
      if(seen.has(path.resolve(dst)))continue;
      seen.add(path.resolve(dst));
      const src=path.join(SKILLS_DIR,skill);
      const fingerprint=directoryHash(src);
      const stored=path.join(store,skill+'-'+fingerprint.slice(0,16));
      items.push({kind:mode==='symlink'?'link':'copy',src:mode==='symlink'?stored:src,
        dst,root:scope==='global'?rootHome:workspace,runtime,skill});
    }
  }
  if(scope==='workspace'&&harness!=='none'){
    for(const [src,dst] of [
      ['harness/default-config.json','.xyeena/config.json'],
      ['harness/project-profile.template.md','.xyeena/profile.md']])
      items.push({kind:'file',src:path.join(PACKAGE_ROOT,src),dst:path.join(workspace,dst),root:workspace});
    for(const guard of guards){
      const root=path.join(PACKAGE_ROOT,'harness','guides',guard);
      for(const item of entries(root))
        items.push({kind:'file',src:path.join(root,item.name),
          dst:path.join(workspace,'.xyeena','harness','guides',guard,item.name),root:workspace});
    }
  }
  const records=items.map(item=>({...item,...inspect(item)}));
  const fingerprint=hash(JSON.stringify(records.map(x=>[x.kind,x.dst,x.status,x.before,x.sha||null])));
  return {scope,mode,runtimes,skills:selected,harness,home:rootHome,workspace,records,fingerprint,store};
}
function inspect(item){
  safePath(item.root,item.dst,{allowLeafSymlink:true});
  const stat=lstat(item.dst);
  if(!stat)return {status:'create',before:null};
  if(stat.isSymbolicLink()){
    return item.kind==='link'&&managedLink(item.dst,item.src)?
      {status:'unchanged',before:'managed-link'}:{status:'foreign-link',before:'unowned-link'};
  }
  if(item.kind==='link')return {status:'conflict',before:stat.isDirectory()?safeHash(item.dst):hash(fs.readFileSync(item.dst))};
  if(item.kind==='file'){
    if(!stat.isFile())return {status:'conflict',before:'not-a-file'};
    const old=fs.readFileSync(item.dst);
    return {status:old.equals(fs.readFileSync(item.src))?'unchanged':'conflict',before:hash(old)};
  }
  if(!stat.isDirectory())return {status:'conflict',before:'not-a-directory'};
  const current=safeHash(item.dst);
  const correct=item.kind==='store'?item.sha:directoryHash(item.src);
  return {status:current===correct?'unchanged':item.kind==='store'?'tampered-store':'conflict',before:current};
}
export function previewPortableSetup(options={}){
  const p=build(options);
  const update=options.update===true;
  const errors=p.records.filter(x=>['foreign-link','tampered-store'].includes(x.status));
  const changed=p.records.filter(x=>x.status==='create'||(update&&x.status==='conflict'));
  return {scope:p.scope,mode:p.mode,runtimes:p.runtimes,skills:p.skills,
    home:p.home,cwd:p.workspace,durableStore:p.mode==='symlink'?p.store:null,
    fingerprint:p.fingerprint,update,blocked:errors.map(x=>x.dst),
    conflicts:p.records.filter(x=>x.status==='conflict').map(x=>x.dst),
    unchangedCount:p.records.filter(x=>x.status==='unchanged').length,
    filesToWrite:changed.length,previewPaths:changed.map(x=>x.dst).slice(0,15),
    noModelCalls:true,next:errors.length?'Cannot replace foreign links or modified immutable store.':
      'Review the absolute paths and confirm before installing.'};
}
export function applyPortableSetup(options={}){
  if(options.yes!==true)throw new Error('Explicit --yes or wizard confirmation required');
  const p=build(options),update=options.update===true;
  if(options.expectedFingerprint&&options.expectedFingerprint!==p.fingerprint)
    throw new Error('Project/global files changed after preview; preview again');
  const blocked=p.records.filter(x=>['foreign-link','tampered-store'].includes(x.status));
  if(blocked.length)throw new Error('Unsafe global/linked paths: '+blocked.map(x=>x.dst).join(', '));
  const changed=p.records.filter(x=>x.status==='create'||(update&&x.status==='conflict'));
  // Reject nested links in existing user custom bundles before copying or removing them.
  for(const x of changed)if(x.status==='conflict'&&lstat(x.dst)?.isDirectory())entries(x.dst);
  const backupRoot=path.join(p.home,'.xyeena','backups','portable',
    new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));
  const backed=[],written=[];
  try{
    for(let i=0;i<changed.length;i++){
      const x=changed[i],state=inspect(x);
      if(state.status!==x.status||state.before!==x.before)throw new Error('Destination changed after preview: '+x.dst);
      if(x.status==='conflict'){
        const backup=path.join(backupRoot,String(i));
        fs.mkdirSync(backupRoot,{recursive:true});
        if(!lstat(path.join(backupRoot,'.gitignore')))fs.writeFileSync(path.join(backupRoot,'.gitignore'),'*\n!.gitignore\n');
        if(fs.lstatSync(x.dst).isDirectory())copyDirectory(x.dst,backup);
        else {fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(x.dst,backup);}
        backed.push({dst:x.dst,backup});
      }
      safePath(x.root,x.dst,{allowLeafSymlink:true});
      fs.mkdirSync(path.dirname(x.dst),{recursive:true});
      if(x.status==='conflict')fs.rmSync(x.dst,{recursive:true,force:false});
      written.push(x);
      if(x.kind==='link'){
        if(!lstat(x.src)?.isDirectory())throw new Error('Persistent source missing: '+x.src);
        fs.symlinkSync(x.src,x.dst,process.platform==='win32'?'junction':'dir');
      } else if(x.kind==='file')fs.copyFileSync(x.src,x.dst);
      else copyDirectory(x.src,x.dst);
    }
  }catch(error){
    for(const x of written.reverse()){
      try{
        if(lstat(x.dst))fs.rmSync(x.dst,{recursive:true,force:true});
        const record=backed.find(b=>b.dst===x.dst);
        if(record){
          if(fs.lstatSync(record.backup).isDirectory())copyDirectory(record.backup,x.dst);
          else {fs.mkdirSync(path.dirname(x.dst),{recursive:true});fs.copyFileSync(record.backup,x.dst);}
        }
      }catch{/* originals remain in backup for manual recovery */}
    }
    throw error;
  }
  return {installed:true,scope:p.scope,mode:p.mode,runtimes:p.runtimes,
    linked:written.filter(x=>x.kind==='link').map(x=>x.dst),
    written:written.map(x=>x.dst),
    preserved:p.records.filter(x=>x.status==='conflict'&&!update).map(x=>x.dst),
    backupDirectory:backed.length?backupRoot:null,
    durableStore:p.mode==='symlink'?p.store:null,
    nativeActivationVerified:false};
}
