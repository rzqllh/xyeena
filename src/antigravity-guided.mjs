import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pendingRuns, resumeCapsule, bindConversation, unbindConversation, startHookProbe, hookProbeStatus, clearHookProbe } from './antigravity-guided-hook.mjs';

const GROUP = 'xyeena-rig-guided';
const SOURCE = fileURLToPath(new URL('./antigravity-guided-hook.mjs', import.meta.url));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const withoutToggle = entry => {
  if (!object(entry)) return entry;
  const { enabled, ...rest } = entry;
  return rest;
};

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

/** Canonical managed hook group, shared by installer and read-only diagnostics. */
function managedHookDefinition(script, disabled = false) {
  // agy CLI 1.4.7 runs workspace hooks from the .agents directory, not root.
  // The Windows command remains quote-free to avoid cmd quote parsing failures.
  const command = process.platform === 'win32'
    ? 'node ../.xyeena/hooks/antigravity-guided.mjs'
    : quote(process.execPath) + ' ' + quote(script);
  const result = {
    SessionStart: [{ type: 'command', command: command + ' SessionStart', timeout: 3 }],
    PreInvocation: [{ type: 'command', command: command + ' PreInvocation', timeout: 3 }],
    PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: command + ' PreToolUse', timeout: 3 }] }],
    PostToolUse: [{ matcher: 'run_command|write_to_file|replace_file_content|multi_replace_file_content', hooks: [{ type: 'command', command: command + ' PostToolUse', timeout: 3 }] }],
    Stop: [{ type: 'command', command: command + ' Stop', timeout: 3 }],
  };
  if (disabled) result.enabled = false;
  return result;
}
/** Report only JSON field paths: never print command values or host-managed data. */
function changedJsonPaths(expected, actual, prefix = '', result = []) {
  if (result.length >= 24) return result;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    for (let i = 0; i < Math.max(expected.length, actual.length) && result.length < 24; i++)
      changedJsonPaths(expected[i], actual[i], prefix + '[' + i + ']', result);
  } else if (object(expected) && object(actual)) {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      if (result.length >= 24) break;
      changedJsonPaths(expected[key], actual[key], prefix ? prefix + '.' + key : key, result);
    }
  } else if (expected !== actual) result.push(prefix || '(root)');
  return result;
}
function guidedIntegrity(cwd) {
  const f = paths(cwd);
  const cfg = readConfig(f.config), manifest = readManifest(f.manifest);
  const group = cfg.value[GROUP];
  const present = object(group);
  const managedHashMatch = present && !!manifest &&
    hash(JSON.stringify(withoutToggle(group))) === manifest.groupHash;
  let runnerIntegrity = 'MISSING';
  if (fs.existsSync(f.script)) {
    if (!fs.statSync(f.script).isFile() || fs.lstatSync(f.script).isSymbolicLink())
      runnerIntegrity = 'INVALID_FILE';
    else runnerIntegrity = manifest &&
      hash(fs.readFileSync(f.script, 'utf8')) === manifest.scriptHash ? 'MATCH' : 'MODIFIED';
  }
  const target = managedHookDefinition(f.script);
  const driftPaths = present && manifest && !managedHashMatch ?
    changedJsonPaths(target, withoutToggle(group)) : [];
  const pre = group?.PreToolUse?.[0], entry = pre?.hooks?.[0];
  const preToolUseRegistered = pre?.matcher === '*' && entry?.type === 'command' &&
    entry?.command === target.PreToolUse[0].hooks[0].command;
  const enabled = present && group.enabled !== false;
  return {
    installed: !!manifest && present,
    enabled,
    config: f.config,
    managedIntegrity: !manifest ? (present ? 'UNOWNED' : 'NOT_INSTALLED')
      : !present ? 'MISSING_GROUP' : managedHashMatch ? 'MATCH' : 'MODIFIED',
    runnerIntegrity, changedManagedFields: driftPaths,
    preToolUseRegistered, preToolUseEnabled: enabled && preToolUseRegistered &&
      pre.enabled !== false && entry.enabled !== false,
    hostEnforcement: 'UNVERIFIED', securityEnforcementVerified: false,
  };
}

export function hookPlan({ cwd = process.cwd(), action = 'install' } = {}) {
  if (!['install', 'uninstall'].includes(action)) throw new Error('Unknown hook action');
  const f = paths(cwd), config = readConfig(f.config), manifest = readManifest(f.manifest);
  const current = config.value[GROUP];
  if (current !== undefined && !manifest) throw new Error('Conflicting unowned hook group');
  if (manifest && current === undefined) throw new Error('Managed hook group is missing; review before repair');
  // The IDE may toggle enabled without changing the managed hook commands.
  if (manifest && hash(JSON.stringify(withoutToggle(current))) !== manifest.groupHash)
    throw new Error('Managed hook group was changed; refusing overwrite');
  const script = fs.readFileSync(SOURCE, 'utf8');
  const installedScript = fs.existsSync(f.script) ? fs.readFileSync(f.script, 'utf8') : null;
  if (manifest && installedScript !== null && hash(installedScript) !== manifest.scriptHash)
    throw new Error('Managed hook runner changed; refusing overwrite');
  const proposed = managedHookDefinition(f.script, current?.enabled === false);
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
      const ignore = path.join(path.dirname(plan.f.backup), '.gitignore');
      if (fs.existsSync(ignore)) {
        if (fs.lstatSync(ignore).isSymbolicLink() ||
            !/(^|\n)antigravity\/(\r?\n|$)/.test(fs.readFileSync(ignore, 'utf8'))) {
          throw new Error('Antigravity hook backups must be ignored by Git');
        }
      } else {
        fs.mkdirSync(path.dirname(ignore), { recursive: true });
        fs.writeFileSync(ignore, 'antigravity/\n', { flag: 'wx', mode: 0o600 });
      }
      fs.mkdirSync(plan.f.backup, { recursive: true });
      const backup = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID() + '.json';
      fs.writeFileSync(path.join(plan.f.backup, backup), plan.config.raw, { flag: 'wx', mode: 0o600 });
    }
    atomic(plan.f.script, plan.script);
    atomic(plan.f.config, JSON.stringify(plan.next, null, 2) + '\n');
    atomic(plan.f.manifest, JSON.stringify({ schema: 1, group: GROUP,
      groupHash: hash(JSON.stringify(withoutToggle(plan.next[GROUP]))), scriptHash: hash(plan.script),
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

/** Status remains read-only and available even if the host rewrites the group. */
function guidedStatus(cwd) {
  const info = guidedIntegrity(cwd);
  let probe;
  try { probe = hookProbeStatus(cwd); }
  catch { probe = { state: 'PROBE_STATE_INVALID' }; }
  let upgradeAvailable = null;
  if (info.managedIntegrity === 'MATCH' && info.runnerIntegrity === 'MATCH') {
    try { upgradeAvailable = hookPlan({ cwd }).changed; } catch { /* read-only status */ }
  } else if (info.managedIntegrity === 'NOT_INSTALLED') {
    try { upgradeAvailable = hookPlan({ cwd }).changed; } catch { /* invalid script */ }
  }
  return { ...info, upgradeAvailable,
    hostActivation: probe.state === 'CALLBACK_OBSERVED_UNATTESTED'
      ? 'CALLBACK_OBSERVED_UNATTESTED' : 'UNVERIFIED',
    probe: probe.state,
    note: info.managedIntegrity === 'MODIFIED'
      ? 'Managed hook group drift detected. Probe start and installer still refuse to overwrite it; review changedManagedFields and .agents/hooks.json. No files changed by status.'
      : 'Filesystem configuration or a local callback does not prove Antigravity native policy enforcement.' };
}

export function guidedCommand(command, { cwd = process.cwd(), yes = false, id = null, conversationId = null, probeAction = null } = {}) {
  if (command === 'list') return pendingRuns(cwd).map(r => ({
    id: r.id, goal: String(r.snapshot.goal).slice(0, 120), state: r.snapshot.workflow_state }));
  if (command === 'resume') return resumeCapsule(cwd, id);
  if (command === 'bind') return bindConversation(cwd, id, conversationId, { yes });
  if (command === 'unbind') return unbindConversation(cwd, conversationId, { yes });
  if (command === 'probe') {
    const root = paths(cwd).root;
    if (probeAction === 'status') return hookProbeStatus(root);
    if (!['start', 'clear'].includes(probeAction))
      throw new Error('Expected guided probe start|status|clear');
    if (!yes) throw new Error('Explicit --yes required for hook probe changes');
    if (probeAction === 'clear') return clearHookProbe(root);
    const plan = hookPlan({ cwd: root, action: 'install' });
    if (!plan.manifest || plan.config.value[GROUP]?.enabled === false ||
        !plan.config.value[GROUP]?.PreToolUse || plan.changed)
      throw new Error('Install or upgrade the enabled Xyeena PreToolUse hook before probing');
    return startHookProbe(root);
  }
  if (command === 'status') return guidedStatus(cwd);
  if (!['preview', 'install', 'uninstall'].includes(command))
    throw new Error('Expected guided preview|install|uninstall|status|list|resume|bind|unbind');
  const action = command === 'uninstall' ? 'uninstall' : 'install';
  const plan = hookPlan({ cwd, action });
  if (command === 'preview') return plan.preview;
  return { ...plan.preview, result: applyHookPlan(plan, { yes }) };
}