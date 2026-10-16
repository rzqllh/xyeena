import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pendingRuns, resumeCapsule } from './antigravity-guided-hook.mjs';

const GROUP = 'xyeena-rig-guided';
const SOURCE = fileURLToPath(new URL('./antigravity-guided-hook.mjs', import.meta.url));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function paths(cwd) {
  const root = fs.realpathSync(path.resolve(cwd));
  const files = { root, config: path.join(root, '.agents', 'hooks.json'),
    script: path.join(root, '.xyeena', 'hooks', 'antigravity-guided.mjs'),
    manifest: path.join(root, '.xyeena', 'antigravity-guided.json'),
    backup: path.join(root, '.xyeena', 'backups', 'antigravity') };
  for (const filename of [files.config, files.script, files.manifest, files.backup]) {
    const rel = path.relative(root, filename);
    if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel))
      throw new Error('Path escapes workspace');
    let current = root;
    for (const segment of rel.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      try {
        if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Refusing symlink or junction: ' + current);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  return files;
}
function readConfig(filename) {
  if (!fs.existsSync(filename)) return { exists: false, raw: '', value: {} };
  if (!fs.statSync(filename).isFile() || fs.statSync(filename).size > 524288)
    throw new Error('Invalid hook config size or type');
  const raw = fs.readFileSync(filename, 'utf8');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('Invalid hooks.json; no changes made'); }
  if (!object(value)) throw new Error('hooks.json must be a JSON object');
  return { exists: true, raw, value };
}
function readManifest(filename) {
  if (!fs.existsSync(filename)) return null;
  let m;
  try { m = JSON.parse(fs.readFileSync(filename, 'utf8')); } catch { throw new Error('Invalid Xyeena hook manifest'); }
  if (!object(m) || m.schema !== 1 || m.group !== GROUP || typeof m.groupHash !== 'string' ||
      typeof m.scriptHash !== 'string') throw new Error('Invalid Xyeena hook manifest');
  return m;
}
function quote(filename) {
  if (/["\r\n]/.test(filename)) throw new Error('Unsafe executable path');
  return '"' + filename + '"';
}
function atomic(filename, contents) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temp = filename + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temp, contents, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temp, filename);
  } finally { if (fs.existsSync(temp)) fs.rmSync(temp); }
}
export function hookPlan({ cwd = process.cwd(), action = 'install' } = {}) {
  if (!['install', 'uninstall'].includes(action)) throw new Error('Unknown hook action');
  const f = paths(cwd), config = readConfig(f.config), manifest = readManifest(f.manifest);
  const current = config.value[GROUP];
  if (current !== undefined && !manifest) throw new Error('Conflicting unowned hook group');
  if (manifest && current === undefined) throw new Error('Managed hook group is missing; review before repair');
  if (manifest && hash(JSON.stringify(current)) !== manifest.groupHash)
    throw new Error('Managed hook group was changed; refusing overwrite');
  const script = fs.readFileSync(SOURCE, 'utf8');
  const installedScript = fs.existsSync(f.script) ? fs.readFileSync(f.script, 'utf8') : null;
  if (manifest && installedScript !== null && hash(installedScript) !== manifest.scriptHash)
    throw new Error('Managed hook runner changed; refusing overwrite');
  const command = quote(process.execPath) + ' ' + quote(f.script);
  const proposed = {
    SessionStart: [{ type: 'command', command: command + ' SessionStart', timeout: 3 }],
    Stop: [{ type: 'command', command: command + ' Stop', timeout: 3 }],
  };
  const next = action === 'install' ? { ...config.value, [GROUP]: proposed } :
    Object.fromEntries(Object.entries(config.value).filter(([key]) => key !== GROUP));
  const changed = action === 'install'
    ? (!manifest || JSON.stringify(current) !== JSON.stringify(proposed) || installedScript !== script)
    : !!manifest;
  return { f, config, manifest, script, next, action, changed,
    preview: { action, changed, file: f.config, runner: f.script, group: GROUP,
      previous: current ?? null, proposed: action === 'install' ? proposed : null,
      preservedGroups: Object.keys(config.value).filter(k => k !== GROUP),
      backup: changed && config.exists } };
}
export function applyHookPlan(plan, { yes = false } = {}) {
  if (!yes) throw new Error('Explicit --yes required; no changes made');
  if (!plan.changed) return { changed: false };
  const current = hookPlan({ cwd: plan.f.root, action: plan.action });
  if (current.config.raw !== plan.config.raw || JSON.stringify(current.preview) !== JSON.stringify(plan.preview))
    throw new Error('Config changed since preview; no changes made');
  if (plan.action === 'install') {
    if (plan.config.exists) {
      fs.mkdirSync(plan.f.backup, { recursive: true });
      const backup = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID() + '.json';
      fs.writeFileSync(path.join(plan.f.backup, backup), plan.config.raw, { flag: 'wx', mode: 0o600 });
    }
    atomic(plan.f.script, plan.script);
    atomic(plan.f.config, JSON.stringify(plan.next, null, 2) + '\n');
    atomic(plan.f.manifest, JSON.stringify({ schema: 1, group: GROUP,
      groupHash: hash(JSON.stringify(plan.next[GROUP])), scriptHash: hash(plan.script),
      configCreated: !plan.config.exists }, null, 2) + '\n');
  } else {
    if (plan.manifest.configCreated && Object.keys(plan.next).length === 0) fs.rmSync(plan.f.config);
    else atomic(plan.f.config, JSON.stringify(plan.next, null, 2) + '\n');
    if (fs.existsSync(plan.f.script) &&
        hash(fs.readFileSync(plan.f.script, 'utf8')) === plan.manifest.scriptHash) fs.rmSync(plan.f.script);
    fs.rmSync(plan.f.manifest);
  }
  return { changed: true, file: plan.f.config };
}
export function guidedCommand(command, { cwd = process.cwd(), yes = false, id = null } = {}) {
  if (command === 'list') return pendingRuns(cwd).map(r => ({
    id: r.id, goal: String(r.snapshot.goal).slice(0, 120), state: r.snapshot.workflow_state }));
  if (command === 'resume') return resumeCapsule(cwd, id);
  if (!['preview', 'install', 'uninstall', 'status'].includes(command))
    throw new Error('Expected guided preview|install|uninstall|status|list|resume');
  const action = command === 'uninstall' ? 'uninstall' : 'install';
  const plan = hookPlan({ cwd, action });
  if (command === 'status') return { installed: !!plan.manifest, config: plan.f.config };
  if (command === 'preview') return plan.preview;
  return { ...plan.preview, result: applyHookPlan(plan, { yes }) };
}