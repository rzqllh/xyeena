import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { SKILLS_DIR, VERSION } from './paths.mjs';
import { setupSelection } from './setup.mjs';
import { skillDependencyClosure } from './selection.mjs';
import { runtimeDescriptor } from './runtime.mjs';
import { portableSkillTarget } from './setup-portable.mjs';

const NAME = 'xyeena-rig';
const MARKER = '.xyeena-managed.json';
const MAX_FILE = 1024 * 1024;
const MAX_BUNDLE = 12 * 1024 * 1024;
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const rootOf = location => fs.realpathSync(path.resolve(location));
const within = (root, file) => {
  const relative = path.relative(root, path.resolve(file));
  return !!relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};
function checkPath(root, file) {
  if (!within(root, file)) throw new Error('Compact setup target escapes selected root');
  let current = root;
  for (const part of path.relative(root, file).split(path.sep)) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error('Compact setup refuses symlink/junction: ' + current);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
function collect(root, relative = '', out = []) {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) collect(root, rel, out);
    else if (entry.isFile()) {
      const file = path.join(root, rel);
      if (fs.statSync(file).size > MAX_FILE) throw new Error('Oversized compact skill file: ' + rel);
      out.push({ path: rel.split(path.sep).join('/'), content: fs.readFileSync(file) });
    } else throw new Error('Unsupported symlink or special file inside skill: ' + rel);
  }
  return out;
}
function fingerprint(files) {
  const digest = crypto.createHash('sha256');
  for (const file of [...files].sort((a,b) => a.path.localeCompare(b.path))) {
    digest.update(file.path + '\0');
    digest.update(sha(file.content) + '\n');
  }
  return digest.digest('hex');
}
function bundle(skills) {
  const files = [{path:'SKILL.md',content: Buffer.from([
    '---',
    'name: xyeena-rig',
    'description: Use for Xyeena Rig task orchestration, native skill fallback, project harness boundaries, verification and guided execution.',
    '---',
    '# Xyeena Rig — compact skill entry',
    '',
    'You are the single Xyeena workflow governor. Select a small number of relevant installed, eligible skills using the active host inventory.',
    'External Superior and Superpowers skills are optional; use the native Xyeena modules below whenever equivalent external capabilities are missing or ineligible.',
    'The internal modules below are reference instructions, not independently installed host skills. Read only the relevant module SKILL.md on demand.',
    'Do not pretend that an internal module was loaded as an external host skill. Never spawn workers without a real, authorized host adapter.',
    'For delegation use only healthy, authorized Simpul or host-native subagents; otherwise work inline. No nested uncontrolled dispatch.',
    'Apply core permission, evidence, scope, and anti-loop boundaries for every operation. Contextual harness guides are opt-in and project-scoped.',
    'Never grant Always Allow, install external skills, change trust, modify hooks, or approve destructive actions implicitly.',
    'Task completion requires independently checked evidence; model claims alone stay REVIEW_REQUIRED.',
    '',
    '## Native module index'
  ].concat(skills.map(name => '- ' + name + ': references/skills/' + name + '/SKILL.md')).concat(['']).join('\n'))}];
  for (const name of skills) {
    const folder = path.join(SKILLS_DIR,name);
    for (const file of collect(folder))
      files.push({path:'references/skills/' + name + '/' + file.path, content:file.content});
  }
  if (files.reduce((n,x) => n + x.content.length,0) > MAX_BUNDLE) throw new Error('Compact bundle too large');
  return files;
}
function inspect(directory) {
  try { if (!fs.existsSync(directory)) return {status:'create'}; } catch { return {status:'conflict', reason:'inaccessible target'}; }
  try {
    if (!fs.lstatSync(directory).isDirectory() || fs.lstatSync(directory).isSymbolicLink())
      return {status:'conflict',reason:'target not a regular directory'};
    const entries = collect(directory);
    const marker = entries.find(f => f.path === MARKER);
    if (!marker) return {status:'conflict',reason:'existing folder is not owned by Xyeena'};
    const metadata = JSON.parse(marker.content.toString('utf8'));
    if (metadata.schema !== 1 || metadata.managedBy !== 'xyeena-agent' ||
        metadata.layout !== 'compact' || typeof metadata.fingerprint !== 'string')
      return {status:'conflict',reason:'invalid Xyeena ownership marker'};
    const actual = fingerprint(entries.filter(f => f.path !== MARKER));
    if (actual !== metadata.fingerprint) return {status:'conflict',reason:'managed files changed; manual review required'};
    return {status:'managed', fingerprint:actual};
  } catch { return {status:'conflict',reason:'cannot verify owned bundle'}; }
}
/** Read-only compact layout preview. Existing loose skills and third-party packages are never touched. */
export function previewCompactSetup({cwd=process.cwd(),home=os.homedir(),runtime,
  preset='balanced',scope='workspace',env=process.env}={}) {
  if (!['workspace','global'].includes(scope)) throw new Error('Compact scope must be workspace or global');
  const choice = setupSelection({runtime,preset,harness:'none'});
  const selectedSkills = skillDependencyClosure(choice.skills).sort();
  const files = bundle(selectedSkills);
  const expected = fingerprint(files);
  const root = rootOf(scope === 'workspace' ? cwd : home);
  const targets = [];
  for (const host of choice.runtimes) {
    const base = scope === 'workspace'
      ? path.join(root,runtimeDescriptor(host).skillDir)
      : portableSkillTarget(host,{home:root,env});
    const directory = path.join(base,NAME);
    checkPath(root,directory);
    const current = inspect(directory);
    const status = current.status === 'managed'
      ? current.fingerprint === expected ? 'unchanged' : 'managed-update'
      : current.status;
    if (!targets.some(target => target.directory === directory))
      targets.push({directory,status,reason:current.reason || null,host:[host]});
    else targets.find(target => target.directory === directory).host.push(host);
  }
  return {schema:1,kind:'compact-setup',layout:'compact',scope,runtime:choice.runtimes,preset,
    root,selectedSkills,entrySkill:NAME,fileCount:files.length,fingerprint:expected,
    targets,conflicts:targets.filter(t => t.status === 'conflict'),noProviderCalls:true,
    noHostAuthChanges:true,dryRun:true};
}
/** Confirmed multi-target install. Stage all roots before mutation; compensate on failure. */
export function applyCompactSetup(options={}) {
  if (options.yes !== true) throw new Error('Compact installation requires explicit --yes');
  const plan = previewCompactSetup(options);
  if (plan.conflicts.length)
    throw new Error('Unowned or modified compact target; no files changed: ' + plan.conflicts.map(x => x.directory).join(', '));
  if (plan.targets.some(t => t.status === 'managed-update') && options.update !== true)
    throw new Error('Managed compact bundle differs; preview and pass --update for backed-up upgrade');
  if (options.expectedFingerprint && options.expectedFingerprint !== plan.fingerprint)
    throw new Error('Compact bundle changed since preview');
  const files = bundle(plan.selectedSkills);
  const marker = {schema:1,managedBy:'xyeena-agent',layout:'compact',version:VERSION,
    fingerprint:plan.fingerprint,selectedSkills:plan.selectedSkills};
  const prepared=[],committed=[];
  try {
    // Prepare *all* selected runtime destinations before changing any existing skill.
    for (const target of plan.targets.filter(t => t.status !== 'unchanged')) {
      const parent = path.dirname(target.directory);
      checkPath(plan.root,parent);
      fs.mkdirSync(parent,{recursive:true});
      const staging=fs.mkdtempSync(path.join(parent,'.xyeena-stage-'));
      prepared.push({target,staging,backup:null});
      for (const file of [...files,{path:MARKER,content:Buffer.from(JSON.stringify(marker,null,2)+'\n')}]) {
        const output=path.join(staging,...file.path.split('/'));
        fs.mkdirSync(path.dirname(output),{recursive:true});
        fs.writeFileSync(output,file.content,{flag:'wx'});
      }
    }
    // Reject a stale or concurrent mutation before the first commit.
    for (const {target} of prepared) {
      checkPath(plan.root,target.directory);
      const current=inspect(target.directory);
      const status=current.status==='managed'
        ? current.fingerprint===plan.fingerprint ? 'unchanged' : 'managed-update' : current.status;
      if (status!==target.status) throw new Error('Compact destination changed during setup');
    }
    for (const item of prepared) {
      const {target,staging}=item;
      checkPath(plan.root,target.directory);
      const current=inspect(target.directory);
      const status=current.status==='managed'
        ? current.fingerprint===plan.fingerprint ? 'unchanged' : 'managed-update' : current.status;
      if (status!==target.status) throw new Error('Compact target changed before commit');
      if (target.status==='managed-update') {
        const backupRoot=path.join(plan.root,'.xyeena','backups','compact');
        checkPath(plan.root,backupRoot);
        fs.mkdirSync(backupRoot,{recursive:true});
        item.backup=path.join(backupRoot,crypto.randomUUID());
        fs.renameSync(target.directory,item.backup);
      }
      // Track before rename: if this fails, the backup is also rolled back.
      committed.push(item);
      fs.renameSync(staging,target.directory);
    }
  } catch(error) {
    const failures=[];
    for (const item of committed.reverse()) {
      const {target,backup}=item;
      try {
        if (fs.existsSync(target.directory)) {
          const actual=inspect(target.directory);
          if (actual.status!=='managed'||actual.fingerprint!==plan.fingerprint)
            throw new Error('Cannot undo a compact entry modified during rollback');
          fs.rmSync(target.directory,{recursive:true});
        }
        if (backup && fs.existsSync(backup))
          fs.renameSync(backup,target.directory);
      } catch (recoveryError) { failures.push(recoveryError); }
    }
    if (failures.length)
      throw new AggregateError([error,...failures],'Compact install failed; manual recovery required');
    throw error;
  } finally {
    for (const item of prepared)
      if (fs.existsSync(item.staging)) fs.rmSync(item.staging,{recursive:true,force:true});
  }
  return {installed:true,layout:'compact',entrySkill:NAME,
    modified:prepared.map(({target,backup})=>({directory:target.directory,action:target.status,backup})),
    selectedSkills:plan.selectedSkills};
}
