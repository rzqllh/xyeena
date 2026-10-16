import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const GROUP = 'xyeena-rig-guided';
const SOURCE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'antigravity-hook.mjs');
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';

function safePath(root, target) {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
    throw new Error('Path escapes installation root');
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Refusing symlink or junction: ' + current);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function locations(cwd, scope, home) {
  if (!['workspace', 'global'].includes(scope)) throw new Error('Invalid Antigravity hook scope');
  const root = scope === 'global' ? path.resolve(home) : path.resolve(cwd);
  const config = scope === 'global'
    ? path.join(root, '.gemini', 'config', 'hooks.json')
    : path.join(root, '.agents', 'hooks.json');
  const runtime = path.join(root, '.xyeena', 'rig', 'antigravity-hook.mjs');
  const manifest = path.join(root, '.xyeena', 'rig', 'hooks-install.json');
  const backups = path.join(root, '.xyeena', 'rig', 'backups');
  for (const p of [config, runtime, manifest, backups]) safePath(root, p);
  return { root, config, runtime, manifest, backups };
}
function loadJson(file) {
  if (!fs.existsSync(file)) return {};
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Expected JSON object: ' + file);
  return parsed;
}
function command(node, runtime, event) {
  for (const p of [node, runtime])
    if (/["\r\n]/.test(p)) throw new Error('Unsupported characters in executable path');
  return '"' + node + '" "' + runtime + '" ' + event;
}
export function hookGroup(runtime, node = process.execPath) {
  const handler = event => ({ type: 'command', command: command(node, runtime, event), timeout: 5 });
  return {
    SessionStart: [handler('SessionStart')],
    PreInvocation: [handler('PreInvocation')],
    PreToolUse: [{ matcher: '*', hooks: [handler('PreToolUse')] }],
    PostToolUse: [{ matcher: '*', hooks: [handler('PostToolUse')] }],
    PostInvocation: [handler('PostInvocation')],
    Stop: [handler('Stop')],
  };
}
export function inspectGuidedHooks({ cwd = process.cwd(), scope = 'workspace', home = os.homedir() } = {}) {
  const files = locations(cwd, scope, home);
  const current = loadJson(files.config);
  const manifest = fs.existsSync(files.manifest) ? loadJson(files.manifest) : null;
  const previous = current[GROUP];
  if (previous && (!manifest || manifest.groupHash !== digest(previous)))
    throw new Error('The Xyeena hook group is not owned by this installation; no changes made');
  const proposed = hookGroup(files.runtime);
  const planned = { ...current, [GROUP]: proposed };
  return {
    files, scope, installed: Boolean(previous), changed: json(current) !== json(planned),
    current, planned, groupHash: digest(proposed), managed: Boolean(manifest),
    preview: { config: files.config, runtime: files.runtime, group: GROUP,
      old: previous ?? null, next: proposed, otherGroups: Object.keys(current).filter(k => k !== GROUP) }
  };
}
export function installGuidedHooks(opts = {}) {
  if (opts.approved !== true) throw new Error('Explicit approval for native Antigravity hooks required');
  const plan = inspectGuidedHooks(opts);
  const { files, current, planned, groupHash } = plan;
  const runtimeContent = fs.readFileSync(SOURCE, 'utf8');
  if (fs.existsSync(files.runtime) && plan.installed &&
      fs.readFileSync(files.runtime, 'utf8') !== runtimeContent)
    throw new Error('Installed hook launcher has changed; repair requires manual review');
  if (plan.installed && !plan.changed && fs.existsSync(files.runtime)) return { changed: false, config: files.config };
  fs.mkdirSync(files.backups, { recursive: true });
  let backup = null;
  if (fs.existsSync(files.config)) {
    backup = path.join(files.backups, 'hooks-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex') + '.json');
    fs.copyFileSync(files.config, backup, fs.constants.COPYFILE_EXCL);
  }
  atomicWrite(files.runtime, runtimeContent);
  atomicWrite(files.config, json(planned));
  atomicWrite(files.manifest, json({ schemaVersion: 1, scope: plan.scope, group: GROUP,
    config: files.config, runtime: files.runtime, groupHash,
    launcherHash: crypto.createHash('sha256').update(runtimeContent).digest('hex'),
    backup, installedAt: new Date().toISOString() }));
  return { changed: true, config: files.config, backup };
}
export function removeGuidedHooks({ cwd = process.cwd(), scope = 'workspace', home = os.homedir(), approved = false } = {}) {
  if (!approved) throw new Error('Explicit approval required to remove native hooks');
  const files = locations(cwd, scope, home);
  const manifest = fs.existsSync(files.manifest) ? loadJson(files.manifest) : null;
  const current = loadJson(files.config);
  if (!manifest || !Object.hasOwn(current, GROUP)) return { changed: false };
  if (manifest.groupHash !== digest(current[GROUP]))
    throw new Error('Xyeena hook group was modified; refusing to remove user changes');
  const remaining = { ...current };
  delete remaining[GROUP];
  atomicWrite(files.config, json(remaining));
  if (fs.existsSync(files.runtime)) {
    const runtimeHash = crypto.createHash('sha256').update(fs.readFileSync(files.runtime)).digest('hex');
    if (runtimeHash === manifest.launcherHash) fs.unlinkSync(files.runtime);
  }
  fs.unlinkSync(files.manifest);
  return { changed: true, config: files.config };
}
