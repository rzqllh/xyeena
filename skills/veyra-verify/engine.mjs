/**
 * Veyra Verify Engine — veyra-verify
 * Mandatory execution receipts, empirical completion proof, gate enforcement.
 * Strict P0 Evidence standard: LIVE_HOST_VERIFIED requires verifiable process execution.
 * Zero external dependencies — 100% Node.js standard library.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export function generateVerificationReceipt(taskName, command, exitCode, outputSummary, executionProof = null) {
  if (!taskName || !command) throw new Error('TASK_AND_COMMAND_REQUIRED');
  const timestamp = new Date().toISOString();
  const passed = exitCode === 0;

  const isLiveHost = Boolean(executionProof && executionProof.realExecution === true && passed);
  const evidenceTier = !passed
    ? 'EXECUTION_FAILED'
    : isLiveHost
    ? 'LIVE_HOST_VERIFIED'
    : 'SYNTHETIC_RECEIPT';

  return {
    receiptId: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskName,
    command,
    exitCode,
    passed,
    outputSummary: outputSummary ? outputSummary.slice(0, 300) : '',
    timestamp,
    executionProof: executionProof || null,
    evidenceTier
  };
}

export function executeAndVerify(taskName, command, options = {}) {
  if (!taskName || !command) throw new Error('TASK_AND_COMMAND_REQUIRED');
  const startTime = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let executedSuccessfully = false;

  try {
    const res = spawnSync(command, {
      shell: true,
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      encoding: 'utf8'
    });
    exitCode = res.status ?? (res.signal ? 1 : 0);
    stdout = res.stdout || '';
    stderr = res.stderr || '';
    executedSuccessfully = true;
  } catch (err) {
    exitCode = err.status || 1;
    stderr = err.message || '';
  }

  const durationMs = Date.now() - startTime;
  const passed = exitCode === 0;
  const combinedOutput = (stdout + '\n' + stderr).trim();
  const outputSummary = combinedOutput.slice(0, 300);
  const outputHash = createHash('sha256').update(combinedOutput).digest('hex');

  const executionProof = {
    realExecution: true,
    executedSuccessfully,
    pid: process.pid,
    durationMs,
    outputHash,
    executedAt: new Date().toISOString()
  };

  return generateVerificationReceipt(taskName, command, exitCode, outputSummary, executionProof);
}

export function validateCompletionClaims(receipts = [], requiredTasks = [], options = {}) {
  const missing = [];
  const failed = [];
  const syntheticRejected = [];

  for (const req of requiredTasks) {
    const rcpt = receipts.find(r => r.taskName === req);
    if (!rcpt) {
      missing.push(req);
    } else if (!rcpt.passed) {
      failed.push(req);
    } else if (rcpt.evidenceTier === 'SYNTHETIC_RECEIPT' && options.disallowSynthetic !== false) {
      syntheticRejected.push(req);
    }
  }

  const verified = missing.length === 0 && failed.length === 0 && syntheticRejected.length === 0;
  return {
    verified,
    totalRequired: requiredTasks.length,
    missingTasks: missing,
    failedTasks: failed,
    syntheticRejected,
    status: verified ? 'PASS' : 'REJECTED'
  };
}

export function verifyFreshnessReceipt(receipt, maxAgeSeconds = 300) {
  if (!receipt || !receipt.timestamp) return { fresh: false, reason: 'MISSING_TIMESTAMP' };
  const ageSec = (Date.now() - new Date(receipt.timestamp).getTime()) / 1000;
  return { fresh: ageSec <= maxAgeSeconds, ageSeconds: Number(ageSec.toFixed(1)) };
}
