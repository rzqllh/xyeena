/**
 * Veyra Verify Engine — veyra-verify
 * Mandatory execution receipts, empirical completion proof, gate enforcement.
 * Zero external dependencies.
 */

export function generateVerificationReceipt(taskName, command, exitCode, outputSummary) {
  if (!taskName || !command) throw new Error('TASK_AND_COMMAND_REQUIRED');
  const timestamp = new Date().toISOString();
  const passed = exitCode === 0;

  return {
    receiptId: `rcpt-${Date.now()}`,
    taskName,
    command,
    exitCode,
    passed,
    outputSummary: outputSummary ? outputSummary.slice(0, 300) : '',
    timestamp,
    evidenceTier: passed ? 'LIVE_HOST_VERIFIED' : 'EXECUTION_FAILED'
  };
}

export function validateCompletionClaims(receipts = [], requiredTasks = []) {
  const missing = [];
  const failed = [];

  for (const req of requiredTasks) {
    const rcpt = receipts.find(r => r.taskName === req);
    if (!rcpt) missing.push(req);
    else if (!rcpt.passed) failed.push(req);
  }

  const verified = missing.length === 0 && failed.length === 0;
  return {
    verified,
    totalRequired: requiredTasks.length,
    missingTasks: missing,
    failedTasks: failed,
    status: verified ? 'PASS' : 'REJECTED'
  };
}

export function verifyFreshnessReceipt(receipt, maxAgeSeconds = 300) {
  if (!receipt || !receipt.timestamp) return { fresh: false, reason: 'MISSING_TIMESTAMP' };
  const ageSec = (Date.now() - new Date(receipt.timestamp).getTime()) / 1000;
  return { fresh: ageSec <= maxAgeSeconds, ageSeconds: Number(ageSec.toFixed(1)) };
}
