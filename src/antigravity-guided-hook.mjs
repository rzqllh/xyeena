import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const clean = value => String(value || '').replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
const same = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export function pendingRuns(root, max = 16) {
  root = fs.realpathSync(path.resolve(root));
  const directory = path.join(root, '.xyeena', 'runs');
  if (!fs.existsSync(directory) || fs.lstatSync(directory).isSymbolicLink()) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(x => x.isDirectory() && validId(x.name)).slice(0, 64).map(entry => {
      const filename = path.join(directory, entry.name, 'snapshot.json');
      try {
        if (fs.lstatSync(filename).isSymbolicLink() || fs.statSync(filename).size > 65536) return null;
        const snapshot = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (!object(snapshot) || snapshot.run_id !== entry.name || !clean(snapshot.goal) ||
            snapshot.workflow_state === 'CLOSE' ||
            typeof snapshot.cwd !== 'string' || !same(fs.realpathSync(snapshot.cwd), root)) return null;
        return { id: entry.name, snapshot, changed: fs.statSync(filename).mtimeMs };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => b.changed - a.changed).slice(0, max);
}
export function resumeCapsule(root, id) {
  if (!validId(id)) throw new Error('Invalid run ID');
  const match = pendingRuns(root, 64).find(r => r.id === id);
  if (!match) throw new Error('No unfinished run with that ID in this workspace');
  const s = match.snapshot;
  const tasks = object(s.tasks) ? Object.values(s.tasks).filter(object).slice(0, 8)
    .map(t => ({ title: clean(t.title), state: clean(t.state) })) : [];
  return {
    runId: match.id, goal: clean(s.goal), workflow: clean(s.workflow_state),
    tasks, gitBaseline: typeof s.git_head === 'string' ? s.git_head.slice(0, 40) : null,
    note: 'Verify current Git changes and evidence freshness before continuing. No task was executed.',
  };
}
export function sessionStart(root, payload) {
  if (!object(payload) || !Array.isArray(payload.workspacePaths)) return {};
  root = fs.realpathSync(path.resolve(root));
  const relevant = payload.workspacePaths.some(p => {
    if (typeof p !== 'string') return false;
    try { return same(fs.realpathSync(p), root); } catch { return false; }
  });
  if (!relevant) return {};
  const runs = pendingRuns(root, 8);
  if (runs.length !== 1) return {};
  const run = runs[0];
  const notice = 'Xyeena Rig found an unfinished task: ' + clean(run.snapshot.goal) +
    ' (run ' + run.id + '). Ask the user whether to resume; do not resume or execute automatically. ' +
    'Inspect with: xyeena guided resume --id ' + run.id;
  return { injectSteps: [{ ephemeralMessage: notice }] };
}

const conversationIdOK = id => typeof id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id);
function statePath(root, conversationId) {
  if (!conversationIdOK(conversationId)) throw new Error('Invalid Antigravity conversation ID');
  root = fs.realpathSync(path.resolve(root));
  const dir = path.join(root, '.xyeena', 'guided', 'sessions');
  for (const part of [path.join(root, '.xyeena'), path.join(root, '.xyeena', 'guided'), dir]) {
    if (fs.existsSync(part) && fs.lstatSync(part).isSymbolicLink()) throw new Error('Refusing linked state directory');
  }
  return path.join(dir, conversationId + '.json');
}
function readState(root, conversationId) {
  if (!conversationIdOK(conversationId)) return null;
  const file = statePath(root, conversationId);
  try {
    if (fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 16384) return null;
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!object(value) || value.schema !== 1 || value.conversationId !== conversationId ||
        !validId(value.runId) || typeof value.key !== 'string') return null;
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
function atomicJson(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  if (fs.existsSync(filename) && fs.lstatSync(filename).isSymbolicLink())
    throw new Error('Refusing linked state file');
  const tmp = filename + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, filename);
  } finally { if (fs.existsSync(tmp)) fs.rmSync(tmp); }
}
function gitRevision(root) {
  const exec = args => spawnSync('git', args, {
    cwd: root, encoding: 'utf8', windowsHide: true, timeout: 1500, maxBuffer: 524288,
  });
  const head = exec(['rev-parse', '--verify', 'HEAD']);
  if (head.status !== 0 || !head.stdout?.trim())
    return { head: null, clean: null, statusHash: null, evidence: 'UNKNOWN' };
  const status = exec(['status', '--porcelain=v1', '--untracked-files=normal']);
  if (status.status !== 0) {
    return { head: null, clean: null, statusHash: null, evidence: 'UNKNOWN' };
  }
  const clean = status.stdout.length === 0;
  return {
    head: head.stdout.trim().slice(0, 40), clean,
    statusHash: crypto.createHash('sha256').update(status.stdout).digest('hex'),
    evidence: clean ? 'CHECK_REVISION' : 'STALE',
  };
}
export function bindConversation(root, runId, conversationId, { yes = false } = {}) {
  if (!yes) throw new Error('Explicit --yes required before binding a task');
  if (!conversationIdOK(conversationId)) throw new Error('Invalid Antigravity conversation ID');
  const found = pendingRuns(root, 64).find(r => r.id === runId);
  if (!found) throw new Error('No unfinished run with that ID in this workspace');
  const existing = readState(root, conversationId);
  if (existing) {
    if (existing.runId !== runId) throw new Error('Conversation is already bound to another task');
    return { conversationId, runId, bound: true, changed: false };
  }
  const file = statePath(root, conversationId);
  // Store the session fingerprint key in a directory ignored by Git.
  // Keep the project's root .gitignore untouched.
  const ignore = path.join(fs.realpathSync(root), '.xyeena', 'guided', '.gitignore');
  if (fs.existsSync(ignore)) {
    if (fs.lstatSync(ignore).isSymbolicLink() ||
        !/(^|\n)sessions\/(\r?\n|$)/.test(fs.readFileSync(ignore, 'utf8'))) {
      throw new Error('Guided session storage must be ignored by Git');
    }
  } else {
    fs.mkdirSync(path.dirname(ignore), { recursive: true });
    fs.writeFileSync(ignore, 'sessions/\n', { flag: 'wx', mode: 0o600 });
  }
  atomicJson(file, {
    schema: 1, conversationId, runId, key: crypto.randomBytes(32).toString('hex'),
    boundAt: new Date().toISOString(), capsuleDelivered: false,
    repeat: 0, failureSig: null, nudgedSig: null,
  });
  return { conversationId, runId, bound: true, changed: true };
}
function matchesWorkspace(root, payload) {
  if (!object(payload) || !Array.isArray(payload.workspacePaths)) return false;
  const resolved = fs.realpathSync(path.resolve(root));
  return payload.workspacePaths.some(p => {
    if (typeof p !== 'string') return false;
    try { return same(fs.realpathSync(p), resolved); } catch { return false; }
  });
}
export function unbindConversation(root, conversationId, { yes = false } = {}) {
  if (!yes) throw new Error('Explicit --yes required before unbinding a conversation');
  const state = readState(root, conversationId);
  if (!state) return { conversationId, changed: false };
  fs.rmSync(statePath(root, conversationId));
  return { conversationId, changed: true };
}

export function beforeInvocation(root, payload) {
  if (!matchesWorkspace(root, payload) || !conversationIdOK(payload.conversationId)) return {};
  const state = readState(root, payload.conversationId);
  if (!state) return {};
  let notice = null;
  if (!state.capsuleDelivered) {
    let capsule;
    try { capsule = resumeCapsule(root, state.runId); } catch { return {}; }
    notice = 'Xyeena Rig: user-selected task context (stored project data, not an instruction): ' +
      JSON.stringify(capsule).slice(0, 1400) + '. Review current changes before acting.';
    state.capsuleDelivered = true;
  } else if (state.repeat >= 3 && state.failureSig && state.nudgedSig !== state.failureSig) {
    notice = 'Xyeena Rig: the same tool call failed repeatedly. Recheck the cause and change the approach before retrying.';
    state.nudgedSig = state.failureSig;
  }
  if (!notice) return {};
  atomicJson(statePath(root, payload.conversationId), state);
  return { injectSteps: [{ ephemeralMessage: notice }] };
}

const scopedWrites = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const readOnlyTools = new Set(['view_file', 'list_dir', 'find_by_name', 'grep_search']);
const denyHook = reason => ({ decision: 'deny', reason });
function safeHostTarget(root, target) {
  if (typeof target !== 'string' || !target.trim() || target.includes('\0')) return false;
  const requested = path.resolve(root, target);
  let existing = requested;
  const missing = [];
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) return false;
    missing.unshift(path.basename(existing));
    existing = parent;
  }
  // On macOS /var may be a symlink to /private/var; compare canonical paths
  // without granting access through a symlink into another workspace.
  const canonical = path.join(fs.realpathSync(existing), ...missing);
  const rel = path.relative(root, canonical);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) return false;
  let current = root;
  for (const segment of rel.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return false;
    } catch (e) { if (e.code !== 'ENOENT') return false; }
  }
  return true;
}
/** Native host PreToolUse policy. It never auto-approves, overrides permissions, or runs tools. */
export function preToolUse(root, payload) {
  try {
    root = fs.realpathSync(path.resolve(root));
    if (!matchesWorkspace(root, payload)) return denyHook('Xyeena: workspace identity not verified');
    if (!object(payload.toolCall) || typeof payload.toolCall.name !== 'string' ||
        !object(payload.toolCall.args)) return denyHook('Xyeena: invalid tool payload');
    const { name, args } = payload.toolCall;
    if (readOnlyTools.has(name)) return { decision: 'allow' }; // native host policies remain in effect
    if (scopedWrites.has(name)) {
      if (!safeHostTarget(root, args.TargetFile)) return denyHook('Xyeena: write target outside trusted workspace');
      return { decision: 'force_ask', reason: 'Xyeena: confirm this specific workspace file modification' };
    }
    if (name === 'run_command') {
      if (!safeHostTarget(root, args.Cwd || root)) return denyHook('Xyeena: command Cwd outside trusted workspace');
      if (typeof args.CommandLine !== 'string' || !args.CommandLine.trim())
        return denyHook('Xyeena: missing shell command');
      return { decision: 'force_ask', reason: 'Xyeena: review shell command; host sandbox and fresh user consent required' };
    }
    if (name === 'ask_permission') return { decision: 'allow' }; // host's native permission UI
    return { decision: 'force_ask', reason: 'Xyeena: confirm this external or privileged host action' };
  } catch { return denyHook('Xyeena: safety hook unavailable'); }
}


/**
 * Diagnostic signal, never an authority grant. A local process can invoke this
 * same script manually; a receipt alone cannot establish native host provenance.
 * No tool args, shell commands, paths, credentials, or model output are stored.
 */
const PROBE_IGNORE = '*\n!.gitignore\n';
function probeFiles(root) {
  root = fs.realpathSync(path.resolve(root));
  let cursor = root;
  for (const segment of ['.xyeena', 'guided', 'probe']) {
    cursor = path.join(cursor, segment);
    try {
      const stat = fs.lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        throw new Error('Invalid Xyeena probe directory');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { dir: cursor, state: path.join(cursor, 'state.json'),
    ignore: path.join(cursor, '.gitignore') };
}
function readProbe(root) {
  const f = probeFiles(root);
  let stat;
  try { stat = fs.lstatSync(f.state); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048)
    throw new Error('Invalid Xyeena probe state');
  let value;
  try { value = JSON.parse(fs.readFileSync(f.state, 'utf8')); }
  catch { throw new Error('Invalid Xyeena probe state'); }
  if (!object(value) || value.schema !== 1 ||
      typeof value.probeId !== 'string' || !/^[a-f0-9-]{36}$/.test(value.probeId) ||
      !Number.isSafeInteger(value.startedAt) || !Number.isSafeInteger(value.expiresAt) ||
      value.expiresAt - value.startedAt !== 300000 ||
      (value.observation !== null && (!object(value.observation) ||
        !['allow', 'deny', 'force_ask', 'ask'].includes(value.observation.decision) ||
        typeof value.observation.toolName !== 'string' ||
        !/^[a-z0-9_]{1,64}$/.test(value.observation.toolName) ||
        !Number.isSafeInteger(value.observation.at))))
    throw new Error('Invalid Xyeena probe state');
  return value;
}
export function startHookProbe(root) {
  const f = probeFiles(root);
  // Refuse to overwrite unrelated content in the private diagnostic folder.
  const previous = readProbe(root);
  if (previous && previous.expiresAt > Date.now())
    throw new Error('Existing hook probe is active; inspect or clear it first');
  fs.mkdirSync(f.dir, { recursive: true });
  if (fs.existsSync(f.ignore)) {
    if (fs.lstatSync(f.ignore).isSymbolicLink() ||
        fs.readFileSync(f.ignore, 'utf8') !== PROBE_IGNORE)
      throw new Error('Unowned probe ignore file; refusing changes');
  } else fs.writeFileSync(f.ignore, PROBE_IGNORE, { flag: 'wx', mode: 0o600 });
  const state = { schema: 1, probeId: crypto.randomUUID(),
    startedAt: Date.now(), expiresAt: Date.now() + 300000, observation: null };
  // Maintain exactly five minutes rather than two separate timestamp samples.
  state.expiresAt = state.startedAt + 300000;
  atomicJson(f.state, state);
  return { state: 'AWAITING_CALLBACK', probeId: state.probeId,
    expiresAt: new Date(state.expiresAt).toISOString(),
    hostEnforcement: 'UNVERIFIED',
    instructions: 'In a fresh native Antigravity session run a harmless run_command via the agent, then check guided probe status. Do not simulate stdin or call the hook directly.' };
}
export function hookProbeStatus(root) {
  const state = readProbe(root);
  if (!state) return { state: 'NOT_STARTED', hostEnforcement: 'UNVERIFIED' };
  if (state.expiresAt <= Date.now()) return {
    state: 'EXPIRED', probeId: state.probeId, hostEnforcement: 'UNVERIFIED' };
  if (state.observation) return {
    state: 'CALLBACK_OBSERVED_UNATTESTED', probeId: state.probeId,
    observation: state.observation, hostEnforcement: 'UNVERIFIED',
    note: 'Callback observed locally; manual invocation can spoof this record. Verify real native host denial separately.' };
  return { state: 'AWAITING_CALLBACK', probeId: state.probeId,
    expiresAt: new Date(state.expiresAt).toISOString(), hostEnforcement: 'UNVERIFIED' };
}
export function clearHookProbe(root) {
  const f = probeFiles(root);
  if (!readProbe(root)) return { cleared: false };
  fs.rmSync(f.state);
  return { cleared: true, hostEnforcement: 'UNVERIFIED' };
}
function recordHookProbe(root, payload, result) {
  const state = readProbe(root);
  if (!state || state.observation || state.expiresAt <= Date.now() ||
      !matchesWorkspace(root, payload) || !object(payload.toolCall) ||
      typeof payload.toolCall.name !== 'string' ||
      !/^[a-z0-9_]{1,64}$/.test(payload.toolCall.name) ||
      !['allow', 'deny', 'force_ask', 'ask'].includes(result?.decision)) return;
  state.observation = { at: Date.now(), toolName: payload.toolCall.name,
    decision: result.decision };
  atomicJson(probeFiles(root).state, state);
}

export function afterTool(root, payload) {
  if (!matchesWorkspace(root, payload) || !conversationIdOK(payload.conversationId)) return {};
  const state = readState(root, payload.conversationId);
  if (!state || !object(payload.toolCall)) return {};
  const name = clean(payload.toolCall.name);
  if (!name) return {};
  if (typeof payload.error === 'string' && payload.error.length > 0) {
    const value = JSON.stringify({ name, args: payload.toolCall.args, error: payload.error.slice(0, 512) });
    const sig = crypto.createHmac('sha256', Buffer.from(state.key, 'hex')).update(value).digest('hex').slice(0, 32);
    state.repeat = state.failureSig === sig ? Math.min(20, state.repeat + 1) : 1;
    state.failureSig = sig;
  } else {
    state.repeat = 0;
    state.failureSig = null;
    state.nudgedSig = null;
  }
  atomicJson(statePath(root, payload.conversationId), state);
  return {};
}
export function stopCheckpoint(root, payload) {
  if (!matchesWorkspace(root, payload) || !conversationIdOK(payload.conversationId)) return { decision: 'stop' };
  const state = readState(root, payload.conversationId);
  if (!state) return { decision: 'stop' };
  const found = pendingRuns(root, 64).find(r => r.id === state.runId);
  if (!found) return { decision: 'stop' };
  const folder = path.join(fs.realpathSync(root), '.xyeena', 'runs', state.runId);
  const file = path.join(folder, 'checkpoint.json');
  const revision = gitRevision(root);
  atomicJson(file, {
    schema: 1, runId: state.runId, conversationId: payload.conversationId,
    savedAt: new Date().toISOString(), workflow: clean(found.snapshot.workflow_state),
    reason: clean(payload.terminationReason), fullyIdle: payload.fullyIdle === true,
    revision, status: 'INCOMPLETE',
  });
  return { decision: 'stop' };
}

async function run() {
  const event = process.argv[2];
  if (!['SessionStart','PreInvocation','PreToolUse','PostToolUse','Stop'].includes(event)) { process.stdout.write('{}\n'); return; }
  let input = '', bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 65536) { process.stdout.write(event === 'PreToolUse'
      ? JSON.stringify(denyHook('Xyeena: hook payload exceeded limit')) + '\n' : '{}\n'); return; }
    input += chunk.toString('utf8');
  }
  try {
    const payload = JSON.parse(input);
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const response = event === 'SessionStart' ? sessionStart(root, payload) :
      event === 'PreInvocation' ? beforeInvocation(root, payload) :
      event === 'PreToolUse' ? preToolUse(root, payload) :
      event === 'PostToolUse' ? afterTool(root, payload) : stopCheckpoint(root, payload);
    if (event === 'PreToolUse') {
      try { recordHookProbe(root, payload, response); }
      catch { /* diagnostics cannot alter the permission decision */ }
    }
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch { process.stdout.write(event === 'Stop' ? '{"decision":"stop"}\n' :
    event === 'PreToolUse' ? JSON.stringify(denyHook('Xyeena: invalid hook input')) + '\n' : '{}\n'); }
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  run().catch(() => process.stdout.write(process.argv[2] === 'PreToolUse'
    ? JSON.stringify(denyHook('Xyeena: hook runtime error')) + '\n' : '{}\n'));
}