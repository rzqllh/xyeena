/**
 * Veyra Verify: local process receipts with cross-process persistence.
 *
 * Threat boundary: HMAC detects accidental journal edits and untrusted JSON
 * injected without the workstation key. A malicious process running as the
 * same OS user can access that key; receipts do not attest agent behavior,
 * code correctness, or prevent an agent from running a misleading command.
 */
import { spawnSync } from 'node:child_process';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const RECEIPT_TIER = 'LOCAL_PROCESS_VERIFIED';
const DEFAULT_MAX_AGE_SECONDS = 300;

function sha(text) { return createHash('sha256').update(text).digest('hex'); }
function workspace(options = {}) { const candidate = resolve(options.cwd || process.cwd()); return existsSync(candidate) ? realpathSync(candidate) : candidate; }
function paths(options = {}) {
  const root = workspace(options);
  const stateDir = resolve(options.stateDir || join(root, '.veyra'));
  const keyDir = resolve(options.keyDir || join(homedir(), '.veyra', 'keys'));
  return {
    root, stateDir, keyDir,
    ledger: join(stateDir, 'receipts.jsonl'),
    key: join(keyDir, sha(root) + '.key')
  };
}
function rejectLink(path) {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error('UNSAFE_SYMLINK: ' + basename(path));
}
function prepareDir(path) {
  rejectLink(path);
  mkdirSync(path, { recursive: true, mode: 0o700 });
  rejectLink(path);
}
function obtainKey(config, create = false) {
  const p = paths(config);
  if (create) {
    prepareDir(p.keyDir);
    rejectLink(p.key);
    if (!existsSync(p.key)) {
      try {
        const fd = openSync(p.key, 'wx', 0o600);
        try { writeFileSync(fd, randomBytes(32).toString('hex'), 'utf8'); }
        finally { closeSync(fd); }
      } catch (err) { if (err.code !== 'EEXIST') throw err; }
    }
  }
  rejectLink(p.key);
  if (!existsSync(p.key)) throw new Error('RECEIPT_KEY_MISSING');
  const secret = readFileSync(p.key, 'utf8').trim();
  if (!/^[0-9a-f]{64}$/.test(secret)) throw new Error('INVALID_RECEIPT_KEY');
  return Buffer.from(secret, 'hex');
}
function mac(key, entry) {
  return createHmac('sha256', key).update(JSON.stringify(entry)).digest('hex');
}
function secureEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
function appendTrusted(entry, options = {}) {
  const p = paths(options);
  prepareDir(p.stateDir);
  rejectLink(p.ledger);
  const key = obtainKey(options, true);
  const signed = { ...entry, signature: mac(key, entry) };
  appendFileSync(p.ledger, JSON.stringify(signed) + '\n', { encoding: 'utf8', mode: 0o600, flag: 'a' });
  return signed;
}

export function readVerificationLedger(options = {}) {
  const p = paths(options);
  rejectLink(p.stateDir);
  rejectLink(p.ledger);
  if (!existsSync(p.ledger)) return { valid: false, reason: 'LEDGER_MISSING', receipts: [] };
  let key;
  try { key = obtainKey(options, false); }
  catch (error) { return { valid: false, reason: error.message, receipts: [] }; }
  const data = readFileSync(p.ledger, 'utf8');
  const receipts = [];
  const ids = new Set();
  for (const [index, line] of data.split('\n').entries()) {
    if (!line) continue;
    let candidate;
    try { candidate = JSON.parse(line); }
    catch { return { valid: false, reason: 'CORRUPT_LEDGER_LINE_' + (index + 1), receipts: [] }; }
    const { signature, ...entry } = candidate;
    if (entry.schemaVersion !== 1 || typeof entry.receiptId !== 'string' || ids.has(entry.receiptId) ||
        !secureEqual(signature, mac(key, entry))) {
      return { valid: false, reason: 'INVALID_LEDGER_SIGNATURE_OR_RECORD_' + (index + 1), receipts: [] };
    }
    ids.add(entry.receiptId);
    receipts.push(candidate);
  }
  return { valid: true, reason: null, receipts };
}

export function verifyFreshnessReceipt(receipt, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const timestamp = Date.parse(receipt?.timestamp || '');
  if (!Number.isFinite(timestamp)) return { fresh: false, reason: 'INVALID_TIMESTAMP' };
  const seconds = (Date.now() - timestamp) / 1000;
  const limit = Number.isFinite(maxAgeSeconds) ? Math.max(0, Math.min(DEFAULT_MAX_AGE_SECONDS, maxAgeSeconds)) : DEFAULT_MAX_AGE_SECONDS;
  if (seconds < -5) return { fresh: false, reason: 'FUTURE_TIMESTAMP', ageSeconds: seconds };
  if (seconds > limit) return { fresh: false, reason: 'STALE_RECEIPT', ageSeconds: Number(seconds.toFixed(1)) };
  return { fresh: true, ageSeconds: Number(seconds.toFixed(1)) };
}

export function generateVerificationReceipt(taskName, command, exitCode, outputSummary, executionProof = null) {
  if (!taskName || !command) throw new Error('TASK_AND_COMMAND_REQUIRED');
  return {
    receiptId: 'synthetic-' + randomBytes(12).toString('hex'),
    taskName,
    command,
    exitCode,
    passed: exitCode === 0 && !executionProof,
    outputSummary: String(outputSummary || '').slice(0, 300),
    timestamp: new Date().toISOString(),
    executionProof: null,
    isForged: Boolean(executionProof),
    evidenceTier: 'SYNTHETIC_RECEIPT'
  };
}

function parseArgs(command, argsOrOptions, maybeOptions) {
  let executable, args = [], options = {};
  if (Array.isArray(command)) {
    if (!command.length) throw new Error('EXECUTABLE_REQUIRED');
    [executable, ...args] = command;
    options = (!Array.isArray(argsOrOptions) && argsOrOptions) || {};
  } else {
    executable = command;
    if (Array.isArray(argsOrOptions)) { args = argsOrOptions; options = maybeOptions || {}; }
    else { options = argsOrOptions || {}; }
    if (!args.length) {
      const pieces = String(command).match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      executable = pieces.shift()?.replace(/^["']|["']$/g, '') || '';
      args = pieces.map(x => x.replace(/^["']|["']$/g, ''));
    }
  }
  if (!executable || typeof executable !== 'string' || !args.every(x => typeof x === 'string')) throw new Error('INVALID_COMMAND');
  if (options.shell === true) throw new Error('SHELL_EXECUTION_NOT_ALLOWED');
  return { executable, args, options };
}
function safeSpawn(executable, args, opts) {
  const isWindows = process.platform === 'win32';
  if (executable === 'node') executable = process.execPath;
  if (isWindows && /^(npm|npx)(\.cmd)?$/i.test(executable)) {
    // cmd.exe is needed for npm.cmd on Windows. Reject control characters and
    // metacharacters rather than passing arbitrary shell fragments.
    if (!args.every(arg => /^[\w./:=@+-]+$/.test(arg))) {
      return { error: Object.assign(new Error('UNSAFE_WINDOWS_CMD_ARG'), { code: 'EINVAL' }) };
    }
    const tool = /^npx/i.test(executable) ? 'npx.cmd' : 'npm.cmd';
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', tool + ' ' + args.join(' ')], opts);
  }
  if (isWindows && /\.(cmd|bat)$/i.test(executable)) {
    return { error: Object.assign(new Error('CMD_WRAPPER_REQUIRES_ALLOWLIST'), { code: 'EINVAL' }) };
  }
  return spawnSync(executable, args, opts);
}

export function executeAndVerify(taskName, commandOrExecutable, argsOrOptions = [], maybeOptions = {}) {
  if (typeof taskName !== 'string' || !taskName.trim()) throw new Error('TASK_REQUIRED');
  const { executable, args, options } = parseArgs(commandOrExecutable, argsOrOptions, maybeOptions);
  const start = Date.now();
  const cwd = workspace(options);
  const commandDigest = sha(JSON.stringify([executable, args]));
  let result;
  try {
    result = safeSpawn(executable, args, {
      shell: false,
      cwd, timeout: options.timeout || 30000,
      encoding: 'utf8', maxBuffer: 2 * 1024 * 1024
    });
  } catch (error) { result = { error }; }
  const error = result.error;
  const exitCode = error ? (error.code === 'ENOENT' ? 127 : error.code === 'ETIMEDOUT' ? 124 : 1) :
    result.signal ? 143 : result.status === null ? 1 : result.status;
  const executedSuccessfully = !error && !result.signal && typeof result.status === 'number';
  const output = String(result.stdout || '') + '\n' + String(result.stderr || '');
  const outputSummary = error ? (error.code === 'ENOENT' ? 'Command not found: ' + basename(executable) : String(error.message)) : output.trim().slice(0, 300);
  const timestamp = new Date().toISOString();
  const passed = executedSuccessfully && exitCode === 0;
  const entry = {
    schemaVersion: 1,
    receiptId: randomBytes(16).toString('hex'),
    taskName, command: basename(executable) + ' [arguments redacted]',
    commandDigest, exitCode, passed, timestamp,
    evidenceTier: passed ? RECEIPT_TIER : 'EXECUTION_FAILED',
    executionProof: {
      realExecution: true, executedSuccessfully,
      outputHash: sha(output.trim()),
      durationMs: Date.now() - start,
      executedAt: timestamp
    }
  };
  // Fail closed: a command execution without persisted evidence is NOT verified.
  const stored = appendTrusted(entry, { cwd, stateDir: options.stateDir, keyDir: options.keyDir });
  return { ...stored, outputSummary };
}

export function validateCompletionClaims(receipts = [], requiredTasks = [], options = {}) {
  if (!Array.isArray(receipts) || !Array.isArray(requiredTasks)) throw new TypeError('ARRAY_ARGUMENTS_REQUIRED');
  const ledger = readVerificationLedger(options);
  const missing = [], failed = [], syntheticRejected = [], forgedRejected = [], staleRejected = [];
  for (const required of requiredTasks) {
    const candidate = receipts.length
      ? receipts.find(r => r.taskName === required)
      : options.fromLedger === true ? [...ledger.receipts].reverse().find(r => r.taskName === required) : undefined;
    if (!candidate) { missing.push(required); continue; }
    if (candidate.isForged) { forgedRejected.push(required); continue; }
    if (!candidate.passed) { failed.push(required); continue; }
    const persisted = ledger.receipts.find(r => r.receiptId === candidate.receiptId);
    if (!ledger.valid || !persisted || candidate.evidenceTier !== RECEIPT_TIER ||
        !persisted.passed || persisted.evidenceTier !== RECEIPT_TIER ||
        persisted.taskName !== candidate.taskName || persisted.exitCode !== candidate.exitCode ||
        persisted.commandDigest !== candidate.commandDigest ||
        persisted.executionProof?.outputHash !== candidate.executionProof?.outputHash ||
        persisted.timestamp !== candidate.timestamp) {
      syntheticRejected.push(required);
      continue;
    }
    if (!verifyFreshnessReceipt(persisted, options.maxAgeSeconds).fresh) staleRejected.push(required);
  }
  const verified = requiredTasks.length > 0 && missing.length === 0 && failed.length === 0 &&
    syntheticRejected.length === 0 && forgedRejected.length === 0 && staleRejected.length === 0 && ledger.valid;
  return {
    verified, totalRequired: requiredTasks.length,
    missingTasks: missing, failedTasks: failed,
    syntheticRejected, forgedRejected, staleRejected,
    ledgerStatus: ledger.valid ? 'SIGNED_LEDGER_VALID' : ledger.reason,
    status: verified ? 'PASS' : 'REJECTED'
  };
}

function cli(argv) {
  const [verb, ...flags] = argv;
  const take = (key) => { const i = flags.indexOf(key); return i >= 0 ? flags[i + 1] : undefined; };
  if (verb === 'run') {
    const task = take('--task');
    const sep = flags.indexOf('--');
    if (!task || sep < 0 || sep === flags.length - 1) throw new Error('Usage: run --task NAME -- <executable> [args]');
    const receipt = executeAndVerify(task, flags.slice(sep + 1));
    console.log(JSON.stringify({ receiptId: receipt.receiptId, taskName: receipt.taskName,
      exitCode: receipt.exitCode, passed: receipt.passed, timestamp: receipt.timestamp,
      evidenceTier: receipt.evidenceTier, outputHash: receipt.executionProof.outputHash }));
    process.exitCode = receipt.passed ? 0 : 1;
  } else if (verb === 'gate') {
    const tasks = flags.flatMap((x, i) => x === '--task' ? [flags[i + 1]] : []).filter(Boolean);
    if (!tasks.length) throw new Error('Usage: gate --task NAME [--task NAME]');
    const result = validateCompletionClaims([], tasks, { fromLedger: true });
    console.log(JSON.stringify(result));
    process.exitCode = result.verified ? 0 : 1;
  } else {
    console.log('Usage: node <verify-engine.mjs> run --task NAME -- <command> [args]\n       node <verify-engine.mjs> gate --task NAME');
    if (verb && verb !== 'help') process.exitCode = 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); }
  catch (error) { console.error('[VEYRA_VERIFY_REJECTED] ' + error.message); process.exitCode = 1; }
}
