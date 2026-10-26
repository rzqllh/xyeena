import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverWorkspaceSkills, routeWorkspaceSkills } from './workspace-skills.mjs';

const WORKER = fileURLToPath(new URL('../bridges/antigravity-sdk-worker.py', import.meta.url));
const MAX_STDOUT = 100000;
const MAX_STDERR = 20000;
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const MAX_TIMEOUT = 300000;

/** Explicit, one-shot Antigravity SDK bridge. Never invoked by Guided hooks. */
export function createAntigravitySdkAdapter({
  cwd = process.cwd(), python = process.platform === 'win32' ? 'python' : 'python3',
  skillPaths = [], timeoutMs = 120000, enableSubagents = false, workerPath = WORKER, spawnImpl = spawn
} = {}) {
  const root = fs.realpathSync(path.resolve(cwd));
  if (typeof enableSubagents !== 'boolean') throw new Error('Invalid subagent flag');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > MAX_TIMEOUT)
    throw new Error('SDK timeout must be between 1000 and 300000 milliseconds');
  if (typeof python !== 'string' || !python.trim()) throw new Error('Invalid Python executable');
  if (!Array.isArray(skillPaths) || skillPaths.length > 8) throw new Error('Invalid skill path budget');
  for (const selected of skillPaths) {
    if (typeof selected !== 'string' || !fs.existsSync(selected) ||
        !fs.statSync(selected).isDirectory() || !fs.existsSync(path.join(selected, 'SKILL.md')))
      throw new Error('Invalid selected skill path');
    if (fs.lstatSync(selected).isSymbolicLink() || fs.lstatSync(path.join(selected, 'SKILL.md')).isSymbolicLink())
      throw new Error('Symlinked skills are not supported');
  }
  return {
    async executeTask(task, { signal } = {}) {
      if (!isObj(task) || typeof task.id !== 'string' ||
          !isObj(task.scope) || task.scope.readOnly !== true || (task.scope.operationClass || 'safe') !== 'safe')
        throw new Error('Antigravity SDK bridge requires a safe read-only task');
      if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > 4000)
        throw new Error('Invalid task title');
      if (signal !== undefined && (typeof signal?.addEventListener !== 'function' ||
          typeof signal?.removeEventListener !== 'function' || typeof signal?.aborted !== 'boolean'))
        throw new Error('Invalid SDK cancellation signal');
      const cancelled = () => Object.assign(new Error('Antigravity SDK worker canceled'), {
        code: 'ERR_SDK_CANCELED'
      });
      if (signal?.aborted) throw cancelled();
      const request = JSON.stringify({ cwd: root, task: { id: task.id, title: task.title,
        scope: { readOnly: true, operationClass: 'safe' } }, skillPaths, enableSubagents }) + '\n';
      return new Promise((resolve, reject) => {
        let finished = false, stdout = '', stdoutBytes = 0, stderrBytes = 0;
        let child, timeout = null, onAbort = null;
        const done = (error, result) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          if (onAbort) signal?.removeEventListener('abort', onAbort);
          if (error) reject(error); else resolve(result);
        };
        // This only requests direct-child termination; descendants and
        // host-level process containment must still be tested natively.
        const stopChild = error => {
          if (finished) return;
          done(error);
          try { child.kill(); } catch { /* best-effort termination */ }
        };
        try {
          child = spawnImpl(python, [workerPath], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true, shell: false, env: process.env });
        } catch {
          reject(new Error('Unable to launch the configured Python executable'));
          return;
        }
        timeout = setTimeout(() => stopChild(new Error('Antigravity SDK worker timeout')), timeoutMs);
        if (signal) {
          onAbort = () => stopChild(cancelled());
          signal.addEventListener('abort', onAbort, { once: true });
          if (signal.aborted) onAbort();
        }
        child.on('error', () => done(new Error('Unable to launch the configured Python executable')));
        child.stdout.on('data', chunk => {
          if (finished) return;
          stdoutBytes += chunk.length;
          if (stdoutBytes > MAX_STDOUT) {
            stopChild(new Error('Antigravity SDK output limit exceeded')); return;
          }
          stdout += chunk.toString('utf8');
        });
        child.stderr.on('data', chunk => {
          if (finished) return;
          stderrBytes += chunk.length;
          if (stderrBytes > MAX_STDERR) {
            stopChild(new Error('Antigravity SDK stderr limit exceeded'));
          }
        });
        child.on('close', code => {
          if (finished) return;
          let output;
          try { output = JSON.parse(stdout.trim()); } catch {
            done(new Error('Antigravity SDK worker returned an invalid response')); return;
          }
          if (!isObj(output) || output.ok !== true || code !== 0) {
            // Do not echo provider/worker-originated stderr, paths or secrets.
            done(new Error('Antigravity SDK worker failed or returned an unsuccessful status')); return;
          }
          if (output.executed !== true || typeof output.report !== 'string') {
            done(new Error('SDK worker did not confirm execution')); return;
          }
          // A single model report is not independent verification, even if a worker claims otherwise.
          done(null, { executed: true, verified: false, evidenceRefs: [], report: output.report,
            usageTokens: Number.isSafeInteger(output.usageTokens) ? output.usageTokens : null });
        });
        child.stdin.on('error', () => {}); // Prevent an EPIPE from crashing after a failed spawn.
        if (!finished) child.stdin.end(request);
      });
    }
  };
}

/** No model call: determine which already-installed skills a read-only task may use. */
export function previewAntigravitySdkTask({ cwd = process.cwd(), goal, state = 'TRIAGE', home, includeGlobal = true } = {}) {
  if (typeof goal !== 'string' || !goal.trim()) throw new Error('Goal is required');
  const root = fs.realpathSync(path.resolve(cwd));
  const routing = routeWorkspaceSkills({ cwd: root, runtime: 'antigravity', prompt: goal, state,
    ...(home ? {home} : {}), includeGlobal });
  const discovered = discoverWorkspaceSkills({ cwd: root, runtime: 'antigravity',
    ...(home ? {home} : {}), includeGlobal });
  const governor = discovered.find(s => s.availability === 'detected' && s.name === 'xyeena-rig') ||
    discovered.find(s => s.availability === 'detected' && s.name === 'xyeena-orchestrate');
  const chosen = [governor, routing.primary, ...routing.supporting].filter(Boolean);
  const allowed = new Set(discovered.filter(s => s.availability === 'detected').map(skill => skill.path));
  const skillPaths = [...new Set(chosen.map(s => s.path).filter(p => allowed.has(p)))].slice(0, 8).map(p => path.dirname(p));
  return { mode: 'read-only', requiresExplicitExecution: true, goal, cwd: root, skillPaths,
    selectedSkills: [...new Set(chosen.map(s => s.name))], executed: false, tokenCost: 'provider-dependent' };
}
