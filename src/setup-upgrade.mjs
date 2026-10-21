import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { installSelective } from './install.mjs';

const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const slash = relative => relative.split(path.sep).join('/');
const byPath = (a, b) => a.rel.localeCompare(b.rel);
const exists = file => { try { fs.lstatSync(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };

function safeDestination(root, file) {
  const rel = path.relative(root, file);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel))
    throw new Error('Setup path escapes project: ' + file);
  let current = root;
  for (const part of rel.split(path.sep)) {
    current = path.join(current, part);
    if (!exists(current)) continue;
    const info = fs.lstatSync(current);
    if (info.isSymbolicLink()) throw new Error('Refusing to follow a symlink/junction: ' + current);
    if (current !== file && !info.isDirectory()) throw new Error('Parent is not a directory: ' + current);
    if (current === file && !info.isFile()) throw new Error('Setup target is not a regular file: ' + current);
  }
}
function stagedFiles(root, sub = '') {
  const dir = path.join(root, sub), result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink()) throw new Error('Unexpected symlink in staged package');
    const rel = path.join(sub, item.name);
    if (item.isDirectory()) result.push(...stagedFiles(root, rel));
    else if (item.isFile()) result.push(rel);
    else throw new Error('Unexpected staged package entry');
  }
  return result;
}
const unique = values => [...new Set(values.filter(x => typeof x === 'string'))];
function mergeTargets(a = [], b = []) {
  const entries = new Map();
  for (const item of [...a, ...b]) {
    if (!item || typeof item.path !== 'string' || !Array.isArray(item.runtimes)) continue;
    entries.set(item.path, unique([...(entries.get(item.path) || []), ...item.runtimes]));
  }
  return [...entries].map(([target, runtimes]) => ({path: target, runtimes}));
}
function mergedManifest(old, current) {
  const manifest = {
    ...old, ...current,
    components: unique([...(old.components || []), ...(current.components || [])]),
    runtimes: unique([...(old.runtimes || []), ...(current.runtimes || [])]),
    skills: unique([...(old.skills || []), ...(current.skills || [])]).sort(),
    guards: unique([...(old.guards || []), ...(current.guards || [])]).sort(),
    skill_targets: mergeTargets(old.skill_targets, current.skill_targets),
    agent_targets: mergeTargets(old.agent_targets, current.agent_targets)
  };
  if (old.installed_at) manifest.installed_at = old.installed_at;
  // Keep an unchanged manifest byte-identical on a repeated setup.
  if (JSON.stringify(manifest) !== JSON.stringify(old))
    manifest.updated_at = new Date().toISOString();
  return JSON.stringify(manifest, null, 2) + '\n';
}
/** Stages package installer output outside the project; never writes during preview. */
export function stagedSetup({cwd, choice, visit}) {
  const root = fs.realpathSync(path.resolve(cwd));
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-setup-stage-'));
  try {
    installSelective({cwd: stage, components: choice.components, runtimes: choice.runtimes,
      skills: choice.skills, guards: choice.guards, force:false, dryRun:false});
    const manifestRel = path.join('.xyeena','install.json');
    const manifestDst = path.join(root, manifestRel);
    safeDestination(root, manifestDst);
    const previous = exists(manifestDst) ? JSON.parse(fs.readFileSync(manifestDst,'utf8')) : {};
    const proposed = JSON.parse(fs.readFileSync(path.join(stage, manifestRel),'utf8'));
    fs.writeFileSync(path.join(stage, manifestRel), mergedManifest(previous, proposed));
    const records = stagedFiles(stage).map(rel => {
      const dst = path.join(root,rel), src = path.join(stage, rel);
      safeDestination(root,dst);
      const desired = fs.readFileSync(src);
      const present = exists(dst), original = present ? fs.readFileSync(dst) : null;
      return { rel:slash(rel),src,dst,present,
        status: !present ? 'create' : desired.equals(original) ? 'unchanged' : rel === manifestRel ? 'metadata-update' : 'conflict',
        currentHash:present ? hash(original) : null, desiredHash:hash(desired) };
    }).sort(byPath);
    // The installer manifest contains a generated timestamp. Only the current
    // file hash should affect consent; proposed metadata timestamps are not material.
    const digest = hash(JSON.stringify(records.map(({rel,status,currentHash,desiredHash})=>({
      rel,status,currentHash,desiredHash:rel === '.xyeena/install.json' ? 'managed-metadata' : desiredHash
    }))));
    return visit({root,stage,records,digest});
  } finally {
    fs.rmSync(stage,{recursive:true,force:true});
  }
}

/** Explicit, bounded comparison: no skill scripts are evaluated. */
export function setupFileDiff({cwd,choice,file,maxBytes=65536,maxLines=120}={}) {
  if(typeof file!=='string' || !file.trim()) throw new Error('Select one conflict file to inspect');
  if(!Number.isInteger(maxLines) || maxLines<1 || maxLines>200) throw new Error('Invalid diff budget');
  return stagedSetup({cwd,choice,visit:({root,records})=>{
    const normalized=file.replace(/\\/g,'/').replace(/^\.\//,'');
    const record=records.find(r=>r.rel===normalized);
    if(!record || record.status!=='conflict') throw new Error('Select a listed conflict file (from setup --dry-run)');
    if(fs.statSync(record.src).size>maxBytes || fs.statSync(record.dst).size>maxBytes)
      return {file:normalized,status:'too-large',bytesLimit:maxBytes,diff:[]};
    const original=fs.readFileSync(record.dst,'utf8').replace(/\r\n/g,'\n').split('\n');
    const proposed=fs.readFileSync(record.src,'utf8').replace(/\r\n/g,'\n').split('\n');
    let prefix=0;
    while(prefix<original.length && prefix<proposed.length && original[prefix]===proposed[prefix]) prefix++;
    let suffix=0;
    while(suffix<original.length-prefix && suffix<proposed.length-prefix &&
      original[original.length-1-suffix]===proposed[proposed.length-1-suffix]) suffix++;
    const minus=original.slice(prefix,original.length-suffix);
    const plus=proposed.slice(prefix,proposed.length-suffix);
    const budget=Math.min(maxLines,minus.length+plus.length);
    const partMinus=minus.slice(0,budget);
    const partPlus=plus.slice(0,Math.max(0,budget-partMinus.length));
    return {file:normalized,status:'conflict',changeStartLine:prefix+1,
      originalRemovedLines:minus.length,proposedAddedLines:plus.length,
      truncated:partMinus.length<minus.length||partPlus.length<plus.length,
      diff:[...partMinus.map(line=>'- '+line),...partPlus.map(line=>'+ '+line)]};
  }});
}

export function setupFilePlan({cwd,choice}){
  return stagedSetup({cwd,choice,visit:({records,digest}) => ({
    fingerprint:digest,
    create:records.filter(r=>r.status==='create').map(r=>r.rel),
    unchanged:records.filter(r=>r.status==='unchanged').map(r=>r.rel),
    conflicts:records.filter(r=>r.status==='conflict').map(r=>r.rel),
    metadataUpdates:records.filter(r=>r.status==='metadata-update').map(r=>r.rel),
    totalFiles:records.length
  })});
}
function ensureSafeParents(root, file) {
  safeDestination(root,file);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  safeDestination(root,file);
}
function copyToDestination(root, record) {
  ensureSafeParents(root,record.dst);
  fs.copyFileSync(record.src,record.dst);
}
/** Back up conflicting originals before any replacement; keep mode never changes custom files. */
export function installStagedSetup({cwd,choice,policy='keep',replaceFiles=[],expectedFingerprint} = {}){
  if (!['keep','backup-replace','selected'].includes(policy)) throw new Error('Unknown conflict policy');
  if (!Array.isArray(replaceFiles) || replaceFiles.length>128 || replaceFiles.some(x=>typeof x!=='string'))
    throw new Error('Invalid selected file list');
  return stagedSetup({cwd,choice,visit:({root,records,digest})=>{
    if (expectedFingerprint && expectedFingerprint !== digest)
      throw new Error('Project changed since preview. Run setup preview again; no files written');
    const conflicting = records.filter(r=>r.status==='conflict');
    const selected=new Set(replaceFiles);
    if (replaceFiles.length!==selected.size || [...selected].some(file=>!conflicting.some(r=>r.rel===file)))
      throw new Error('Selected replacement is not a listed conflict; run setup --dry-run');
    const changed = records.filter(r=>r.status==='create' || r.status==='metadata-update' ||
      (r.status==='conflict' && (policy==='backup-replace' || (policy==='selected' && selected.has(r.rel)))));
    const toBackup = changed.filter(r=>r.present);
    let backupDir = null;
    const nonce = new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex');
    const backupRoot = path.join(root,'.xyeena','backups',nonce);
    if(toBackup.length){
      for(const item of toBackup) safeDestination(root,path.join(backupRoot,...item.rel.split('/')));
      fs.mkdirSync(backupRoot,{recursive:true});
      backupDir = backupRoot;
      // Protect backups from accidental Git commits without editing project .gitignore.
      const localIgnore = path.join(backupRoot,'.gitignore');
      safeDestination(root,localIgnore);
      fs.writeFileSync(localIgnore,'*\n!.gitignore\n',{flag:'wx'});
      for(const item of toBackup){
        const backupFile = path.join(backupRoot,...item.rel.split('/'));
        ensureSafeParents(root,backupFile);
        fs.copyFileSync(item.dst, backupFile, fs.constants.COPYFILE_EXCL);
      }
    }
    // Journal is written before changing project files, so a crash can be inspected safely.
    // Any journal-less backups from earlier versions remain available for manual restoration.
    if (changed.length) {
      if (!backupDir) {
        safeDestination(root,path.join(backupRoot,'.gitignore'));
        fs.mkdirSync(backupRoot,{recursive:true});
        backupDir=backupRoot;
        fs.writeFileSync(path.join(backupRoot,'.gitignore'),'*\\n!.gitignore\\n',{flag:'wx'});
      }
      const journal={schema:1,cwd:root,createdAt:new Date().toISOString(),files:changed.map(r=>({
        path:r.rel,existed:r.present,beforeSha256:r.currentHash,afterSha256:r.desiredHash
      }))};
      const journalFile=path.join(backupRoot,'rollback.json');
      safeDestination(root,journalFile);
      fs.writeFileSync(journalFile,JSON.stringify(journal,null,2)+'\\n',{flag:'wx'});
    }
    const written = [];
    try {
      for(const item of changed) {
        // Re-validate immediately before each write (including reparse-point changes).
        safeDestination(root,item.dst);
        const current = exists(item.dst) ? hash(fs.readFileSync(item.dst)) : null;
        if (current !== item.currentHash)
          throw new Error('Destination changed after preview: '+item.rel);
        written.push(item);
        copyToDestination(root,item);
      }
    } catch (error){
      // Best-effort rollback: preserve originals and remove only newly created files.
      for(const item of written.reverse()){
        try {
          if(item.present && backupDir)
            fs.copyFileSync(path.join(backupDir,...item.rel.split('/')),item.dst);
          else if(!item.present && exists(item.dst)) fs.rmSync(item.dst);
        } catch { /* backup remains available for manual recovery */ }
      }
      throw error;
    }
    return {
      installed:true, conflictPolicy:policy, written:written.map(r=>r.rel),
      preserved:conflicting.filter(r=>!changed.includes(r)).map(r=>r.rel),
      replaced:conflicting.filter(r=>changed.includes(r)).map(r=>r.rel),
      unchangedCount:records.filter(r=>r.status==='unchanged').length,
      backupDirectory:backupDir ? slash(path.relative(root,backupDir)) : null
    };
  }});
}
