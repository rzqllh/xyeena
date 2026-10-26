import path from 'node:path';
import { spawn } from 'node:child_process';

// This is a termination REQUEST, not a proof that every descendant stopped.
// Only the process object returned by our own spawn call may be supplied.
// No user-provided PID, shell command, inherited stdio, or file deletion.
const windowsKiller = () => {
  const systemRoot = process.env.SystemRoot || process.env.WINDIR;
  return typeof systemRoot === 'string' && path.win32.isAbsolute(systemRoot)
    ? path.win32.join(systemRoot, 'System32', 'taskkill.exe')
    : 'C:\\Windows\\System32\\taskkill.exe';
};

export function requestOwnedProcessTermination(child, {
  platform = process.platform, spawnImpl = spawn
} = {}) {
  let fallbackRequested = false;
  const fallback = () => {
    if (fallbackRequested) return;
    fallbackRequested = true;
    try { child?.kill?.(); } catch { /* best effort, never mask cancel */ }
  };
  if (!child || typeof child.kill !== 'function') return;

  // Node's child.kill() on Windows only targets the direct process. When a
  // CLI or Python bridge spawned children, taskkill /T requests its tree.
  // A missing/non-owned/invalid PID must never become a taskkill argument.
  if (platform !== 'win32' || !Number.isSafeInteger(child.pid) ||
      child.pid < 1 || child.pid > 2147483647 ||
      child.exitCode != null || child.signalCode != null) {
    fallback();
    return;
  }
  try {
    const killer = spawnImpl(windowsKiller(),
      ['/PID', String(child.pid), '/T', '/F'],
      { shell: false, windowsHide: true, stdio: 'ignore' });
    if (!killer || typeof killer.once !== 'function') {
      fallback();
      return;
    }
    // Neither taskkill failure nor a delayed exit can turn a canceled task
    // into success. The direct child is still asked to stop on fallback.
    killer.once('error', fallback);
    killer.once('close', code => { if (code !== 0) fallback(); });
    killer.unref?.();
  } catch {
    fallback();
  }
}
