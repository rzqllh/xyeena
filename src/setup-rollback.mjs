import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const exists = file => {
  try { fs.lstatSync(file); return true; }
  catch(e) { if(e.code === 'ENOENT') return false; throw e; }
};
function resolveSafe(root, relative, allowMissing = true) {
  if(typeof relative !== 'string' || !relative || relative.length > 1000 ||
      relative.includes('\\') || relative.startsWith('/') || relative.split('/').some(x=>!x||x==='.'||x==='..') ||
      !/^(?:\.agents|\.agent|\.claude|\.gemini|\.hermes|\.xyeena)\//.test(relative) ||
      relative.startsWith('.xyeena/backups/')) throw new Error('Invalid rollback relative path');
  const file=path.resolve(root,...relative.split('/'));
  const rel=path.relative(root,file);
  if(rel.startsWith('..')||path.isAbsolute(rel)) throw new Error('Rollback path escapes project');
  let current=root;
  for(const part of relative.split('/')){
    current=path.join(current,part);
    if(!exists(current)){if(!allowMissing) throw new Error('Missing rollback file: '+relative);continue;}
    const stat=fs.lstatSync(current);
    if(stat.isSymbolicLink()) throw new Error('Refusing symlink or junction in rollback path: '+relative);
    if(current===file&&!stat.isFile())throw new Error('Rollback destination is not a regular file');
    if(current!==file&&!stat.isDirectory())throw new Error('Rollback parent is not a directory');
  }
  return file;
}
function backupFolder(root,id) {
  if(typeof id!=='string'||! /^[0-9T-Za-z._-]{8,90}$/.test(id)||id.includes('..')) throw new Error('Invalid backup ID');
  const base=path.join(root,'.xyeena','backups');
  const folder=path.join(base,id);
  if(!exists(folder)||fs.lstatSync(folder).isSymbolicLink()||!fs.statSync(folder).isDirectory())
    throw new Error('Backup not found');
  // Reject linked .xyeena/backups parent too, before touching sensitive data.
  for(const segment of [path.join(root,'.xyeena'),base]) {
    if(fs.lstatSync(segment).isSymbolicLink())throw new Error('Unsafe backup directory');
  }
  return folder;
}
export function listSetupBackups({cwd=process.cwd()}={}) {
  const root=fs.realpathSync(path.resolve(cwd)),dir=path.join(root,'.xyeena','backups');
  if(!exists(dir))return [];
  if(fs.lstatSync(dir).isSymbolicLink())throw new Error('Unsafe backup directory');
  return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.isSymbolicLink())
    .map(e=>({id:e.name,rollbackSupported:exists(path.join(dir,e.name,'rollback.json'))}))
    .sort((a,b)=>b.id.localeCompare(a.id)).slice(0,50);
}
function loadRollback({cwd,id}) {
  const root=fs.realpathSync(path.resolve(cwd));
  const folder=backupFolder(root,id);
  const journalFile=path.join(folder,'rollback.json');
  if(!exists(journalFile)) return {root,folder,legacy:true,files:[]};
  if(fs.lstatSync(journalFile).isSymbolicLink()||fs.statSync(journalFile).size>128*1024)
    throw new Error('Invalid rollback journal');
  const journal=JSON.parse(fs.readFileSync(journalFile,'utf8'));
  if(journal.schema!==1||journal.cwd!==root||!Array.isArray(journal.files)||journal.files.length>512)
    throw new Error('Rollback journal is invalid or belongs to a different project');
  const seen=new Set();
  const files=journal.files.map(item=>{
    if(!item||typeof item.path!=='string'||seen.has(item.path) ||
      !/^[0-9a-f]{64}$/.test(item.afterSha256) ||
      (item.existed&&!/^[0-9a-f]{64}$/.test(item.beforeSha256)) ||
      (!item.existed&&item.beforeSha256!==null) ||
      typeof item.existed!=='boolean') throw new Error('Invalid rollback journal entry');
    seen.add(item.path);
    const dst=resolveSafe(root,item.path);
    const current=exists(dst)?sha(fs.readFileSync(dst)):null;
    let backup=null;
    if(item.existed){
      backup=path.join(folder,...item.path.split('/'));
      const rel=path.relative(folder,backup);
      if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Backup path escapes folder');
      let node=folder;
      for(const part of item.path.split('/')){
        node=path.join(node,part);
        if(fs.lstatSync(node).isSymbolicLink())throw new Error('Unsafe backup symlink');
      }
      if(!fs.lstatSync(backup).isFile()||sha(fs.readFileSync(backup))!==item.beforeSha256)
        throw new Error('Backup integrity failed for '+item.path);
    }
    return {path:item.path,dst,backup,existed:item.existed,
      afterSha256:item.afterSha256,currentSha256:current,
      status:current===item.afterSha256?'ready':'changed-after-installation'};
  });
  return {root,folder,legacy:false,files};
}
export function previewSetupRollback({cwd=process.cwd(),id}={}) {
  const data=loadRollback({cwd,id});
  if(data.legacy)return {id,available:false,legacy:true,
    message:'Older backup has no rollback journal. Inspect original files manually; automatic rollback is refused.'};
  const ready=data.files.every(x=>x.status==='ready');
  const fingerprint=sha(JSON.stringify(data.files.map(x=>[x.path,x.currentSha256])));
  return {id,available:ready,legacy:false,fingerprint,
    restore:data.files.filter(x=>x.existed).map(x=>x.path),
    removeCreated:data.files.filter(x=>!x.existed).map(x=>x.path),
    changes:data.files.filter(x=>x.status!=='ready').map(x=>x.path),
    message:ready?'Preview only. Rollback needs explicit --yes.':'Project files changed since install; rollback refused to protect later edits.'};
}
export function runSetupRollback({cwd=process.cwd(),id,yes=false,expectedFingerprint}={}) {
  if(yes!==true)throw new Error('Rollback requires explicit --yes after preview');
  const preview=previewSetupRollback({cwd,id});
  if(!preview.available)throw new Error(preview.message);
  if(expectedFingerprint&&expectedFingerprint!==preview.fingerprint)
    throw new Error('Rollback preview is stale; preview again');
  const data=loadRollback({cwd,id});
  if(data.files.some(x=>x.status!=='ready'))throw new Error('Project changed since rollback preview');
  // Preserve current installed state for best-effort recovery from partial filesystem writes.
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-rollback-stage-'));
  const modified=[];
  try {
    for(let i=0;i<data.files.length;i++) {
      const item=data.files[i],scratch=path.join(temp,String(i));
      fs.copyFileSync(item.dst,scratch);
    }
    for(let i=0;i<data.files.length;i++){
      const item=data.files[i];
      const current=resolveSafe(data.root,item.path,false);
      if(sha(fs.readFileSync(current))!==item.afterSha256)
        throw new Error('File changed during rollback: '+item.path);
      modified.push({item,scratch:path.join(temp,String(i))});
      if(item.existed)fs.copyFileSync(item.backup,current);
      else fs.unlinkSync(current); // Never deletes an entire skill directory.
    }
  }catch(error){
    for(const {item,scratch} of modified.reverse()) {
      try{
        if(exists(item.dst))fs.copyFileSync(scratch,item.dst);
        else { fs.mkdirSync(path.dirname(item.dst),{recursive:true});fs.copyFileSync(scratch,item.dst); }
      }catch{/* recovered file remains in temporary staging only during this attempt */}
    }
    throw error;
  }finally{
    fs.rmSync(temp,{recursive:true,force:true});
  }
  return {rolledBack:true,backupId:id,restored:preview.restore,removedCreated:preview.removeCreated,
    originalBackupPreserved:true,hostActivationVerified:false};
}
