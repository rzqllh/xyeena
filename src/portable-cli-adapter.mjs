import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { discoverWorkspaceSkills, routeWorkspaceSkills } from './workspace-skills.mjs';

const HOSTS = new Set(['gemini', 'hermes', 'codex', 'claude']);
const MAX_OUTPUT = 256 * 1024;
const MAX_PROMPT = 12000;
const HOST_TIMEOUT_MAX = 300000;
const skillName = s => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(s);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);

function windowsResolveExecutable(command, env) {
  if (path.isAbsolute(command) || /[\\/]/.test(command) || /\.[a-z0-9]+$/i.test(command)) return command;
  const entries = String(env.Path || env.PATH || '').split(';').filter(Boolean).slice(0, 128);
  for (const dir of entries) {
    for (const ext of ['.exe', '.com', '.cmd', '.bat']) {
      const candidate = path.join(dir, command + ext);
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch { /* continue */ }
    }
  }
  return command;
}
export function portableLaunchPlan({ runtime, args, executable, platform = process.platform,
  env = process.env } = {}) {
  if (!HOSTS.has(runtime) || !Array.isArray(args) ||
      args.some(a => typeof a !== 'string' || !/^[A-Za-z0-9,._/-]+$/.test(a)))
    throw new Error('Unsafe portable host arguments');
  const resolved = platform === 'win32' ? windowsResolveExecutable(executable, env) : executable;
  if (platform !== 'win32' || !/\.(cmd|bat)$/i.test(resolved))
    return { command: resolved, args };
  if (/[%!^&|<>"\r\n]/.test(resolved))
    throw new Error('Unsafe Windows shim path; use a native executable');
  // cmd.exe is necessary for Windows npm .cmd shims. Only vetted constant
  // arguments and skill identifiers are interpolated; the task prompt is stdin.
  return { command: env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', '""' + resolved + '" ' + args.join(' ') + '"'] };
}


export function previewPortableHost({ cwd = process.cwd(), runtime, goal, state = 'TRIAGE', home,
  includeGlobal = true } = {}) {
  if (!HOSTS.has(runtime)) throw new Error('Portable CLI host must be gemini, hermes, codex or claude');
  if (typeof goal !== 'string' || !goal.trim() || goal.length > MAX_PROMPT)
    throw new Error('A non-empty bounded goal is required');
  const root = fs.realpathSync(path.resolve(cwd));
  const options = { cwd: root, runtime, ...(home ? { home } : {}), includeGlobal };
  const inventory = discoverWorkspaceSkills(options);
  const eligible = inventory.filter(s => s.availability !== 'requires-host-trust');
  const governor = eligible.find(s => s.name === 'xyeena-orchestrate');
  const routing = routeWorkspaceSkills({ ...options, prompt: goal, state });
  const skills = [...new Set([...(governor ? ['xyeena-orchestrate'] : []),
    routing.primary?.name, ...routing.supporting.map(s => s.name)].filter(Boolean))];
  const blocked = !governor;
  return {
    mode: 'headless-one-shot', runtime, cwd: root, goal, state, executed: false,
    ready: !blocked, reason: blocked ? 'Install and enable xyeena-orchestrate in this host; Hermes project skills must be trusted' : null,
    requestedSkills: skills, detectedCount: inventory.length,
    untrustedSkills: inventory.filter(s => s.availability === 'requires-host-trust').map(s => s.name),
    action: 'Explicit --yes required for a provider-backed model call',
  };
}

function decodeResponse(host, output) {
  if (host === 'gemini') {
    let parsed;
    try { parsed = JSON.parse(output.trim()); }
    catch { throw new Error('Gemini CLI did not return JSON'); }
    if (!object(parsed) || typeof parsed.response !== 'string' || parsed.error)
      throw new Error('Gemini CLI reported an error or missing response');
    const tokens = parsed.stats?.models ? Object.values(parsed.stats.models).reduce(
      (count, m) => count + (Number.isSafeInteger(m?.tokens?.total) ? m.tokens.total : 0), 0) : null;
    return { report: parsed.response, usageTokens: tokens };
  }
  if (host === 'claude') {
    let parsed;
    try { parsed = JSON.parse(output.trim()); }
    catch { throw new Error('Claude Code did not return JSON'); }
    if (!object(parsed) || parsed.is_error === true || typeof parsed.result !== 'string')
      throw new Error('Claude Code returned an error or missing result');
    const usage = parsed.usage || {};
    const total = Number.isSafeInteger(usage.input_tokens) && Number.isSafeInteger(usage.output_tokens)
      ? usage.input_tokens + usage.output_tokens : null;
    return { report: parsed.result, usageTokens: total };
  }
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  if (host === 'codex') {
    let last = null, usageTokens = null, failed = false;
    for (const line of lines) {
      let event;
      try { event = JSON.parse(line); } catch { throw new Error('Codex returned invalid JSONL'); }
      if (event?.type === 'turn.failed' || event?.type === 'error') failed = true;
      if (event?.type === 'item.completed' && event?.item?.type === 'agent_message' &&
          typeof event.item.text === 'string') last = event.item.text;
      if (event?.type === 'turn.completed') {
        const u = event.usage;
        if (Number.isSafeInteger(u?.input_tokens) && Number.isSafeInteger(u?.output_tokens))
          usageTokens = u.input_tokens + u.output_tokens;
      }
    }
    if (failed || !last) throw new Error('Codex CLI did not return a successful agent message');
    return { report: last, usageTokens };
  }
  let last = null;
  for (const line of lines) {
    let event;
    try { event = JSON.parse(line); } catch { throw new Error('Hermes CLI returned invalid JSONL'); }
    if (event?.type === 'result') last = event;
  }
  if (!last || last.exit_code !== 0 || typeof last.text !== 'string' || last.error)
    throw new Error('Hermes CLI did not return a successful final result');
  return { report: last.text, usageTokens: Number.isSafeInteger(last.tokens?.total) ? last.tokens.total : null };
}

/** Caller-provided, explicit host process; never auto-launch or inherit external approvals. */
export function createPortableHostAdapter({ cwd = process.cwd(), runtime, selectedSkills = [],
  command, timeoutMs = 120000, spawnImpl = spawn, platform = process.platform, env = process.env } = {}) {
  if (!HOSTS.has(runtime)) throw new Error('Unsupported portable CLI host');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > HOST_TIMEOUT_MAX)
    throw new Error('Invalid portable host timeout');
  if (!Array.isArray(selectedSkills) || selectedSkills.length > 8 || selectedSkills.some(s => !skillName(s)))
    throw new Error('Invalid selected skill names');
  if (typeof command !== 'undefined' && (typeof command !== 'string' || !command.trim()))
    throw new Error('Invalid host executable');
  const root = fs.realpathSync(path.resolve(cwd));
  const executable = command || runtime;
  return {
    async executeTask(task) {
      if (!object(task) || !object(task.scope) || task.scope.readOnly !== true ||
          (task.scope.operationClass || 'safe') !== 'safe')
        throw new Error('Portable host accepts safe read-only tasks only');
      if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > MAX_PROMPT)
        throw new Error('Invalid task title');
      const prompt = [
        'Xyeena Rig read-only orchestration request for the current workspace.',
        'Use only available and trusted native Agent Skills. Do not invent or install missing skills.',
        'Do not edit files, execute shell commands, send messages, approve actions or publish.',
        'Return an evidence-aware report and clearly identify any blocked or unknown step.',
        'Preferred skill names (verify they are available in the native host): ' + selectedSkills.join(', '),
        runtime === 'codex' ? 'If available use $xyeena-orchestrate as the orchestrator skill.' :
          'Load xyeena-orchestrate from the already-installed skill inventory when available.',
        'Task:', task.title,
      ].join('\n');
      const args = runtime === 'hermes'
        ? ['chat', '--query-file', '-', '--oneshot', '-Q', '--format', 'stream-json',
           '--toolsets', 'safe', ...(selectedSkills.length ? ['--skills', selectedSkills.join(',')] : [])]
        : runtime === 'codex'
          ? ['exec', '--json', '--sandbox', 'read-only', '-']
          : runtime === 'claude'
            ? ['--bare', '--add-dir', '.', '--permission-mode', 'plan',
               '--output-format', 'json', '--no-session-persistence', '-p',
               'stdin']
            : ['--output-format', 'json', '--approval-mode', 'plan'];
      const launch = portableLaunchPlan({ runtime, args, executable, platform, env });
      return new Promise((resolve, reject) => {
        let finished = false, stdout = '', stderrLength = 0, child;
        const done = (error, result) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          if (error) reject(error); else resolve(result);
        };
        try {
          child = spawnImpl(launch.command, launch.args, { cwd: root, shell: false, windowsHide: true,
            stdio: ['pipe','pipe','pipe'],
            windowsVerbatimArguments: platform === 'win32' && launch.command !== executable });
        } catch { reject(new Error('Cannot launch host executable')); return; }
        const timer = setTimeout(() => { child.kill(); done(new Error('Host execution timeout')); }, timeoutMs);
        child.on('error', () => done(new Error('Cannot launch host executable')));
        child.stdout.on('data', chunk => {
          stdout += chunk.toString('utf8');
          if (Buffer.byteLength(stdout) > MAX_OUTPUT) {
            child.kill(); done(new Error('Host output exceeded limit'));
          }
        });
        child.stderr.on('data', chunk => {
          stderrLength += chunk.length;
          if (stderrLength > MAX_OUTPUT) {
            child.kill(); done(new Error('Host diagnostic output exceeded limit'));
          }
        });
        child.on('close', code => {
          if (finished) return;
          if (code !== 0) { done(new Error(runtime + ' CLI returned a nonzero status')); return; }
          try {
            const result = decodeResponse(runtime, stdout);
            done(null, { executed: true, verified: false, evidenceRefs: [],
              ...result, requestedSkills: [...selectedSkills], host: runtime,
              status: 'REVIEW_REQUIRED' });
          } catch (e) { done(e); }
        });
        child.stdin.on('error', () => {}); // EPIPE after early CLI failure must not crash parent.
        child.stdin.end(prompt);
      });
    }
  };
}
