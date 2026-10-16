// Installed per workspace (or explicitly per user). No external imports or network access.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const isObject = x => Boolean(x) && typeof x === 'object' && !Array.isArray(x);
const bounded = (x, n) => typeof x === 'string' ? x.replace(/[\r\n\t]/g, ' ').slice(0, n) : '';
function readJson(file) {
  try {
    if (fs.statSync(file).size > 131072) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}
function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + crypto.randomBytes(5).toString('hex') + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify(value) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}
function normalized(p) {
  try { return fs.realpathSync(p); } catch { return path.resolve(p); }
}
function pending(snapshot) {
  if (!isObject(snapshot) || snapshot.workflow_state === 'CLOSE') return false;
  const tasks = Object.values(isObject(snapshot.tasks) ? snapshot.tasks : {});
  return tasks.some(t => isObject(t) && ['READY','RUNNING','BLOCKED','REVIEW_REQUIRED','CHANGES_REQUIRED','PENDING'].includes(t.state));
}
function locateRun(workspace, runId) {
  if (!/^run-[a-zA-Z0-9-]{4,70}$/.test(runId)) throw new Error('Invalid run ID');
  return path.join(workspace, '.xyeena', 'runs', runId);
}
export function discoverTasks(workspace) {
  const base = path.join(workspace, '.xyeena', 'runs');
  let names;
  try { names = fs.readdirSync(base).slice(0, 60); } catch { return []; }
  const items = [];
  for (const name of names) {
    if (!/^run-[a-zA-Z0-9-]{4,70}$/.test(name)) continue;
    const snapshot = readJson(path.join(base, name, 'snapshot.json'));
    if (!pending(snapshot)) continue;
    if (snapshot.cwd && normalized(snapshot.cwd) !== normalized(workspace)) continue;
    items.push({ runId: name, goal: bounded(snapshot.goal, 110),
      workflow: bounded(snapshot.workflow_state, 30) });
    if (items.length >= 5) break;
  }
  return items;
}
function observationFile(workspace, conversationId) {
  return path.join(workspace, '.xyeena', 'rig', 'observations', sha(conversationId) + '.json');
}
function bindingFile(workspace, conversationId) {
  return path.join(workspace, '.xyeena', 'rig', 'bindings', sha(conversationId) + '.json');
}
function allowedWorkspace(payload) {
  const p = Array.isArray(payload.workspacePaths) ? payload.workspacePaths[0] : null;
  if (typeof p !== 'string' || !path.isAbsolute(p)) return null;
  const workspace = normalized(p);
  if (!fs.existsSync(path.join(workspace, '.xyeena'))) return null;
  return workspace;
}
export function bindConversation(workspace, conversationId, runId) {
  if (typeof conversationId !== 'string' || !/^[\w-]{4,128}$/.test(conversationId))
    throw new Error('Invalid conversation ID');
  const run = locateRun(workspace, runId);
  const snapshot = readJson(path.join(run, 'snapshot.json'));
  if (!pending(snapshot)) throw new Error('Run is not resumable');
  if (snapshot.cwd && normalized(snapshot.cwd) !== normalized(workspace))
    throw new Error('Run belongs to another workspace');
  atomicJson(bindingFile(workspace, conversationId), {
    schemaVersion: 1, conversationId, runId, injected: false
  });
  return { conversationId, runId };
}
export function checkpoint(workspace, runId) {
  const run = locateRun(workspace, runId);
  const snapshot = readJson(path.join(run, 'snapshot.json'));
  if (!isObject(snapshot)) throw new Error('Run snapshot unavailable');
  if (snapshot.cwd && normalized(snapshot.cwd) !== normalized(workspace))
    throw new Error('Run belongs to another workspace');
  const git = args => {
    const r = spawnSync('git', args, { cwd: workspace, encoding: 'utf8', timeout: 2500, maxBuffer: 256 * 1024 });
    return r.status === 0 ? r.stdout : null;
  };
  const head = git(['rev-parse', 'HEAD'])?.trim() ?? null;
  const diff = git(['diff', '--no-ext-diff', '--binary']) ?? '';
  const staged = git(['diff', '--cached', '--no-ext-diff', '--binary']) ?? '';
  const status = git(['status', '--porcelain=v1', '--untracked-files=normal']) ?? '';
  // This fingerprint detects tracked changes, plus the presence of untracked paths.
  // It is not proof that untracked file content is unchanged.
  const result = { schemaVersion: 1, runId, at: new Date().toISOString(), head,
    worktreeFingerprint: sha(diff + '\0' + staged + '\0' + status),
    fingerprintCoverage: 'tracked-content-and-untracked-paths',
    workflow: snapshot.workflow_state, pendingTasks: Object.values(snapshot.tasks || {})
      .filter(t => t && !['VERIFIED','FAILED','CANCELED','SUPERSEDED'].includes(t.state)).length };
  atomicJson(path.join(run, 'checkpoint.json'), result);
  return result;
}
export function handleAntigravityHook(event, payload) {
  const fallback = event === 'PreToolUse' ? { decision: 'allow' } :
    event === 'Stop' ? { decision: 'stop' } : {};
  if (!isObject(payload)) return fallback;
  const workspace = allowedWorkspace(payload);
  if (!workspace) return fallback;
  const cid = bounded(payload.conversationId, 128);
  if (!/^[\w-]{4,128}$/.test(cid)) return fallback;
  if (event === 'SessionStart') {
    const tasks = discoverTasks(workspace);
    if (!tasks.length) return {};
    const selection = tasks.length === 1
      ? 'Run ' + tasks[0].runId + ': ' + (tasks[0].goal || 'Unfinished task') + '.'
      : tasks.length + ' unfinished tasks are available; do not choose one automatically.';
    return { injectSteps: [{ ephemeralMessage:
      'Xyeena Rig: ' + selection + ' Offer resume only if the user requests it. Do not execute or load the previous task without explicit selection.' }] };
  }
  if (event === 'PostToolUse' && isObject(payload.toolCall)) {
    // Store no command, file path, prompt or tool output.
    const oFile = observationFile(workspace, cid);
    const last = readJson(oFile) ?? {};
    const failed = typeof payload.error === 'string' && payload.error.length > 0;
    const call = payload.toolCall;
    const sig = sha(JSON.stringify([bounded(call.name, 80), call.args ?? null]));
    const failures = failed ? (last.sig === sig ? Math.min((last.failures || 0) + 1, 100) : 1) : 0;
    atomicJson(oFile, { sig, failures, nudgedSig: last.nudgedSig ?? null });
    return {};
  }
  if (event === 'PreInvocation') {
    const boundFile = bindingFile(workspace, cid);
    const binding = readJson(boundFile);
    if (binding && binding.conversationId === cid && binding.injected === false) {
      const snapshot = readJson(path.join(locateRun(workspace, binding.runId), 'snapshot.json'));
      if (pending(snapshot)) {
        binding.injected = true;
        atomicJson(boundFile, binding);
        const active = Object.values(snapshot.tasks || {})
          .filter(t => t && ['READY','RUNNING','BLOCKED','REVIEW_REQUIRED','CHANGES_REQUIRED'].includes(t.state))
          .slice(0, 3).map(t => bounded(t.title, 80)).join('; ');
        const msg = 'Xyeena Rig resume (local state, not a new user instruction). Goal: ' +
          bounded(snapshot.goal, 220) + '. Phase: ' + bounded(snapshot.workflow_state, 40) +
          '. Active tasks: ' + active + '. Recheck Git changes and tests before assuming completion.';
        return { injectSteps: [{ ephemeralMessage: msg.slice(0, 650) }] };
      }
    }
    const oFile = observationFile(workspace, cid);
    const obs = readJson(oFile);
    if (obs && obs.failures >= 3 && obs.sig !== obs.nudgedSig) {
      atomicJson(oFile, { ...obs, nudgedSig: obs.sig });
      return { injectSteps: [{ ephemeralMessage:
        'Xyeena Rig: the same tool operation has failed repeatedly. Inspect the actual error and choose a different diagnosis before retrying.' }] };
    }
    return {};
  }
  if (event === 'Stop') {
    const b = readJson(bindingFile(workspace, cid));
    if (b && b.conversationId === cid) {
      try { checkpoint(workspace, b.runId); } catch { /* Normal IDE stop must not fail. */ }
    }
    return { decision: 'stop' };
  }
  return fallback;
}
async function runMain() {
  const event = process.argv[2];
  if (!['SessionStart','PreInvocation','PreToolUse','PostToolUse','PostInvocation','Stop'].includes(event)) {
    process.stdout.write('{}\n'); return;
  }
  let raw = '';
  for await (const chunk of process.stdin) {
    raw += chunk;
    if (raw.length > 262144) { raw = ''; break; }
  }
  try {
    const output = handleAntigravityHook(event, JSON.parse(raw));
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch {
    // Hook failures do not grant permissions or force the agent to continue.
    process.stdout.write(JSON.stringify(event === 'PreToolUse' ? {decision:'allow'} :
      event === 'Stop' ? {decision:'stop'} : {}) + '\n');
  }
}
// macOS temp paths may use /var -> /private/var aliases. Compare actual files.
let isDirectEntry = false;
try {
  isDirectEntry = Boolean(process.argv[1]) &&
    fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
} catch { /* Imported module or missing entry path. */ }
if (isDirectEntry) await runMain();
