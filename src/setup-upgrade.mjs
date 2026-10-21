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
    const digest = hash(JSON.stringify(records.map(({rel,status,currentHash,desiredHash})=>({
      rel,status,currentHash,desiredHash
    }))));
    return visit({root,stage,records,digest});
  } finally {
    fs.rmSync(stage,{recursive:true,force:true});
  }
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
export function installStagedSetup({cwd,choice,policy='keep',expectedFingerprint} = {}){
  if (!['keep','backup-replace'].includes(policy)) throw new Error('Unknown conflict policy');
  return stagedSetup({cwd,choice,visit:({root,records,digest})=>{
    if (expectedFingerprint && expectedFingerprint !== digest)
      throw new Error('Project changed since preview. Run setup preview again; no files written');
    const conflicting = records.filter(r=>r.status==='conflict');
    const changed = records.filter(r=>r.status==='create' || r.status==='metadata-update' ||
      (r.status==='conflict' && policy==='backup-replace'));
    const toBackup = changed.filter(r=>r.present);
    let backupDir = null;
    const nonce = new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex');
    const backupRoot = path.join(root,'.xyeena','backups',nonce);
    if(toBackup.length){
      for(const item of toBackup) safeDestination(root,path.join(backupRoot,...item.rel.split('/')));
      fs.mkdirSync(backupRoot,{recursive:true});
      backupDir = backupRoot;
      for(const item of toBackup){
        const backupFile = path.join(backupRoot,...item.rel.split('/'));
        ensureSafeParents(root,backupFile);
        fs.copyFileSync(item.dst, backupFile, fs.constants.COPYFILE_EXCL);
      }
    }
    const written = [];
    try {
      for(const item of changed) {
        // Re-validate immediately before each write (including reparse-point changes).
        safeDestination(root,item.dst);
        const current = exists(item.dst) ? hash(fs.readFileSync(item.dst)) : null;
        if (current !== item.currentHash)
          throw new Error('Destination changed after preview: '+item.rel);
        copyToDestination(root,item);
        written.push(item);
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
      preserved:conflicting.filter(r=>policy==='keep').map(r=>r.rel),
      replaced:conflicting.filter(r=>policy==='backup-replace').map(r=>r.rel),
      unchangedCount:records.filter(r=>r.status==='unchanged').length,
      backupDirectory:backupDir ? slash(path.relative(root,backupDir)) : null
    };
  }});
}
