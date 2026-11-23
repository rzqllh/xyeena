/**
 * Veyra Verify Engine — veyra-verify
 * Mandatory execution receipts, empirical completion proof, gate enforcement.
 * Strict P0 Evidence standard: LIVE_HOST_VERIFIED requires cryptographically signed process execution proof.
 * Zero external dependencies — 100% Node.js standard library.
 */

import { spawnSync } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';

// Runtime session secret for HMAC signing of authentic process executions
const RUNTIME_HMAC_SECRET = randomBytes(32).toString('hex');
const TRUSTED_LIVE_RECEIPTS = new WeakSet();

function signExecutionProof(taskName, command, exitCode, outputHash, timestamp) {
  const hmac = createHmac('sha256', RUNTIME_HMAC_SECRET);
  hmac.update(`${taskName}|${command}|${exitCode}|${outputHash}|${timestamp}`);
  return hmac.digest('hex');
}

function verifyExecutionProof(proof, taskName, command, exitCode, timestamp) {
  if (!proof || typeof proof !== 'object') return false;
  if (!proof.signature || typeof proof.signature !== 'string') return false;
  const expectedSig = signExecutionProof(taskName, command, exitCode, proof.outputHash || '', timestamp);
  return proof.signature === expectedSig;
}

export function generateVerificationReceipt(taskName, command, exitCode, outputSummary, executionProof = null) {
  if (!taskName || !command) throw new Error('TASK_AND_COMMAND_REQUIRED');
  const timestamp = new Date().toISOString();
  const passed = exitCode === 0;

  // Cryptographic signature check: callers CANNOT forge LIVE_HOST_VERIFIED by merely passing { realExecution: true }
  // This public factory is always synthetic. Only executeAndVerify may create trusted live receipts.
  const isAuthentic = false;
  const attemptedForgery = Boolean(executionProof);

  const evidenceTier = !passed
    ? 'EXECUTION_FAILED'
    : isAuthentic
    ? 'LIVE_HOST_VERIFIED'
    : 'SYNTHETIC_RECEIPT';

  return {
    receiptId: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskName,
    command,
    exitCode,
    passed: passed && !attemptedForgery,
    outputSummary: outputSummary ? outputSummary.slice(0, 300) : '',
    timestamp,
    executionProof: isAuthentic ? executionProof : null,
    isForged: attemptedForgery,
    evidenceTier
  };
}

export function executeAndVerify(taskName, commandOrExecutable, argsOrOptions = [], maybeOptions = {}) {
  if (!taskName || !commandOrExecutable) throw new Error('TASK_AND_COMMAND_REQUIRED');

  let executable = commandOrExecutable;
  let args = [];
  let options = {};
  let commandStr = '';

  if (Array.isArray(commandOrExecutable)) {
    executable = commandOrExecutable[0];
    args = commandOrExecutable.slice(1);
    commandStr = commandOrExecutable.join(' ');
    if (typeof argsOrOptions === 'object' && !Array.isArray(argsOrOptions)) {
      options = argsOrOptions || {};
    }
  } else {
    commandStr = String(commandOrExecutable);
    if (Array.isArray(argsOrOptions)) {
      args = argsOrOptions;
      options = maybeOptions || {};
    } else if (typeof argsOrOptions === 'object' && argsOrOptions !== null) {
      options = argsOrOptions;
      args = [];
    }

    // If commandOrExecutable is a string with arguments and args is empty, tokenize safely to prevent shell injection
    if (args.length === 0 && typeof commandOrExecutable === 'string') {
      const parts = commandOrExecutable.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      if (parts.length > 0) {
        executable = parts[0].replace(/^["']|["']$/g, '');
        args = parts.slice(1).map(p => p.replace(/^["']|["']$/g, ''));
      }
    }
  }

  const startTime = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let executedSuccessfully = false;
  let spawnError = null;

  try {
    const res = spawnSync(executable, args, {
      shell: options.shell === true, // Default to false: prevents shell injection
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      encoding: 'utf8'
    });

    if (res.error) {
      spawnError = res.error;
      if (res.error.code === 'ENOENT') {
        exitCode = 127;
        stderr = `Command not found: ${executable}`;
      } else if (res.error.code === 'ETIMEDOUT') {
        exitCode = 124;
        stderr = 'Execution timed out';
      } else {
        exitCode = 1;
        stderr = res.error.message;
      }
    } else if (res.signal) {
      exitCode = 128 + 15;
      stderr = `Process killed by signal: ${res.signal}`;
    } else {
      exitCode = res.status ?? 0;
      stdout = res.stdout || '';
      stderr = res.stderr || '';
      executedSuccessfully = true;
    }
  } catch (err) {
    exitCode = 1;
    stderr = err.message || '';
  }

  const durationMs = Date.now() - startTime;
  const passed = exitCode === 0 && executedSuccessfully;
  const combinedOutput = (stdout + '\n' + stderr).trim();
  const outputSummary = combinedOutput.slice(0, 300);
  const outputHash = createHash('sha256').update(combinedOutput).digest('hex');
  const executedAt = new Date().toISOString();

  const signature = signExecutionProof(taskName, commandStr, exitCode, outputHash, executedAt);
  const executionProof = {
    realExecution: true,
    executedSuccessfully,
    pid: process.pid,
    durationMs,
    outputHash,
    executedAt,
    signature
  };

  const receipt = generateVerificationReceipt(taskName, commandStr, exitCode, outputSummary);
  if (!passed) return receipt;
  const trusted = Object.freeze({
    ...receipt,
    evidenceTier: 'LIVE_HOST_VERIFIED',
    executionProof: Object.freeze(executionProof),
    isForged: false
  });
  TRUSTED_LIVE_RECEIPTS.add(trusted);
  return trusted;
}

export function validateCompletionClaims(receipts = [], requiredTasks = [], options = {}) {
  const missing = [];
  const failed = [];
  const syntheticRejected = [];
  const forgedRejected = [];

  for (const req of requiredTasks) {
    const rcpt = receipts.find(r => r.taskName === req);
    if (!rcpt) {
      missing.push(req);
    } else if (rcpt.isForged) {
      forgedRejected.push(req);
    } else if (!rcpt.passed) {
      failed.push(req);
    } else if (rcpt.evidenceTier !== 'LIVE_HOST_VERIFIED' ||
               !TRUSTED_LIVE_RECEIPTS.has(rcpt) ||
               !verifyExecutionProof(rcpt.executionProof, rcpt.taskName, rcpt.command, rcpt.exitCode, rcpt.executionProof?.executedAt) ||
               rcpt.executionProof?.executedSuccessfully !== true) {
      syntheticRejected.push(req);
    }
  }

  const verified = missing.length === 0 && failed.length === 0 && syntheticRejected.length === 0 && forgedRejected.length === 0;
  return {
    verified,
    totalRequired: requiredTasks.length,
    missingTasks: missing,
    failedTasks: failed,
    syntheticRejected,
    forgedRejected,
    status: verified ? 'PASS' : 'REJECTED'
  };
}

export function verifyFreshnessReceipt(receipt, maxAgeSeconds = 300) {
  if (!receipt || !receipt.timestamp) return { fresh: false, reason: 'MISSING_TIMESTAMP' };
  const ageSec = (Date.now() - new Date(receipt.timestamp).getTime()) / 1000;
  return { fresh: ageSec <= maxAgeSeconds, ageSeconds: Number(ageSec.toFixed(1)) };
}
