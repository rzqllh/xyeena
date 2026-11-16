/**
 * Xyeena Adversarial Test Suite - Merge Blocker Remediation
 * Verifies strict fixes for:
 * - Blocker 1 (P0): Installer uninstall consent contract & fail-closed protection
 * - Blocker 2 (P0): Symlink ancestor boundary & dangling symlink safety in safeChild
 * - Blocker 3 (P1): Cortex truthful execution semantics & TaskGraph state machine
 * - Blocker 4 (P1): Structured RLS query execution receipts & heuristic risk classification
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { InstallationTransaction, safeChild } from '../src/installer/transaction.mjs';
import { computeUninstallConsentFingerprint, hashBuffer } from '../src/installer/baseline-hashes.mjs';
import { CortexOrchestrator, createDefaultCortex, CORTEX_EXECUTION_STATUS } from '../src/core/cortex.mjs';
import { TASK_TIERS } from '../src/core/router.mjs';
import { TASK_STATUS } from '../src/runtime/task-dag.mjs';
import { SecurityMethods, LiveDatabaseAdapter } from '../src/methods/security.mjs';

function createDisposableWorkspace() {
  const root = path.join(os.tmpdir(), `xyeena-blocker-test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  const home = path.join(os.tmpdir(), `xyeena-home-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  return { root, home };
}

function cleanupDisposableWorkspace(root, home) {
  try {
    if (root && fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
  } catch {}
  try {
    if (home && fs.existsSync(home)) fs.rmSync(home, { recursive: true, force: true });
  } catch {}
}

// =========================================================================
// BLOCKER 1: Installer Uninstall Consent Contract
// =========================================================================

test('Blocker 1 (P0): Uninstall preserves modified files safely by default even with --force', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    const skillMd = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMd, '# User Customization in Core', 'utf8');

    // Run uninstall with force: true but WITHOUT allowModifiedRemoval
    const result = tx.uninstall({ force: true });
    assert.strictEqual(result.success, true);

    // Modified file MUST be preserved on disk
    assert.strictEqual(fs.existsSync(skillMd), true, 'Modified file must be preserved on disk');
    assert.strictEqual(fs.readFileSync(skillMd, 'utf8'), '# User Customization in Core');
    assert.ok(result.preserved.some(p => p.includes('SKILL.md')));
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

test('Blocker 1 (P0): Uninstall fails closed when allowModifiedRemoval=true without valid fingerprint', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    const skillMd = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMd, '# User Customization in Core', 'utf8');

    // 1. Missing fingerprint: must FAIL CLOSED with UNINSTALL_CONSENT_REQUIRED
    assert.throws(() => {
      tx.uninstall({ allowModifiedRemoval: true });
    }, (err) => {
      assert.strictEqual(err.code, 'UNINSTALL_CONSENT_REQUIRED');
      assert.ok(err.diffFingerprint, 'Error must report required consent fingerprint');
      return true;
    });

    // File MUST NOT have been deleted
    assert.strictEqual(fs.existsSync(skillMd), true);

    // 2. Arbitrary or wrong fingerprint: must FAIL CLOSED with UNINSTALL_CONSENT_MISMATCH
    assert.throws(() => {
      tx.uninstall({
        allowModifiedRemoval: true,
        diffApprovedFingerprint: 'arbitrary_fake_fingerprint_99999'
      });
    }, (err) => {
      assert.strictEqual(err.code, 'UNINSTALL_CONSENT_MISMATCH');
      return true;
    });

    // 3. Force flag MUST NOT bypass consent mismatch
    assert.throws(() => {
      tx.uninstall({
        force: true,
        allowModifiedRemoval: true,
        diffApprovedFingerprint: 'invalid_hash_with_force'
      });
    }, (err) => {
      assert.strictEqual(err.code, 'UNINSTALL_CONSENT_MISMATCH');
      return true;
    });

    // File MUST still exist completely intact
    assert.strictEqual(fs.existsSync(skillMd), true);

    // 4. Exact matching consent contract removes file cleanly
    const plan = tx.planUninstall();
    assert.strictEqual(plan.hasUserModifications, true);
    assert.ok(plan.uninstallConsentFingerprint);

    const validResult = tx.uninstall({
      allowModifiedRemoval: true,
      diffApprovedFingerprint: plan.uninstallConsentFingerprint
    });

    assert.strictEqual(validResult.success, true);
    assert.strictEqual(fs.existsSync(skillMd), false, 'File removed after valid consent');
    assert.ok(validResult.removed.some(r => r.includes('SKILL.md')));
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

test('Blocker 1 (P0): TOCTOU pre-mutation revalidation aborts if file changes after consent', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    const skillMd = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(skillMd, '# Initial User Edit', 'utf8');

    // Get consent fingerprint for initial edit
    const plan = tx.planUninstall();
    const approvedFingerprint = plan.uninstallConsentFingerprint;

    // Attacker or concurrent process mutates the file before uninstall runs
    fs.writeFileSync(skillMd, '# Malicious Concurrent Replacement', 'utf8');

    // Uninstall with the now-stale fingerprint MUST FAIL CLOSED via TOCTOU check
    assert.throws(() => {
      tx.uninstall({
        allowModifiedRemoval: true,
        diffApprovedFingerprint: approvedFingerprint
      });
    }, /TOCTOU security violation|mismatch/i);

    // File MUST NOT be deleted
    assert.strictEqual(fs.existsSync(skillMd), true);
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

test('Blocker 1 (P0): Destination identity prevents cross-workspace consent reuse', () => {
  const ws1 = createDisposableWorkspace();
  const ws2 = createDisposableWorkspace();

  try {
    const tx1 = new InstallationTransaction({
      cwd: ws1.root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home: ws1.home
    });
    tx1.execute();

    const tx2 = new InstallationTransaction({
      cwd: ws2.root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home: ws2.home
    });
    tx2.execute();

    const file1 = path.join(ws1.root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(file1, '# Same User Edit Content', 'utf8');

    const file2 = path.join(ws2.root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    fs.writeFileSync(file2, '# Same User Edit Content', 'utf8');

    const plan1 = tx1.planUninstall();
    const fp1 = plan1.uninstallConsentFingerprint;

    // Trying to use workspace 1's fingerprint on workspace 2 MUST fail closed
    assert.throws(() => {
      tx2.uninstall({
        allowModifiedRemoval: true,
        diffApprovedFingerprint: fp1
      });
    }, (err) => {
      assert.strictEqual(err.code, 'UNINSTALL_CONSENT_MISMATCH');
      return true;
    });

    // File in workspace 2 must remain completely intact
    assert.strictEqual(fs.existsSync(file2), true);
  } finally {
    cleanupDisposableWorkspace(ws1.root, ws1.home);
    cleanupDisposableWorkspace(ws2.root, ws2.home);
  }
});

test('Blocker 1 (P0): Installer lock prevents concurrent uninstall operations', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx1 = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx1.execute();

    const tx2 = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });

    // Manually hold lock on tx1
    tx1.acquireLock();

    // tx2.uninstall must be blocked by active lock
    assert.throws(() => {
      tx2.uninstall();
    }, /Installer lock is actively held/i);

    // Release lock
    tx1.releaseLock();

    // After release, tx2.uninstall succeeds
    const result = tx2.uninstall();
    assert.strictEqual(result.success, true);
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

test('Blocker 1 (P0): Selective per-file consent removes consented file and preserves unconsented file', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    const coreMd = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    const debugMd = path.join(root, '.agents', 'skills', 'xyeena-debug', 'SKILL.md');

    fs.writeFileSync(coreMd, '# Customized Core', 'utf8');
    fs.writeFileSync(debugMd, '# Customized Debug', 'utf8');

    const plan = tx.planUninstall();
    assert.strictEqual(plan.modifiedFiles.length, 2);

    const coreMod = plan.modifiedFiles.find(f => f.path.includes('xyeena-core'));
    assert.ok(coreMod);

    // Compute single-file selective consent fingerprint for coreMd ONLY
    const selectiveFp = computeUninstallConsentFingerprint({
      operation: 'UNINSTALL_MODIFIED_REMOVAL',
      runtime: tx.runtime,
      scope: tx.scope,
      destinationIdentity: tx.targetDir,
      files: [coreMod]
    });

    const result = tx.uninstall({
      allowModifiedRemoval: true,
      diffApprovedFingerprint: selectiveFp
    });

    assert.strictEqual(result.success, true);
    // coreMd consented -> REMOVED
    assert.strictEqual(fs.existsSync(coreMd), false, 'Consented file must be removed');
    // debugMd unconsented -> PRESERVED
    assert.strictEqual(fs.existsSync(debugMd), true, 'Unconsented modified file must be preserved');
    assert.ok(result.preserved.some(p => p.includes('xyeena-debug')));
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

test('Blocker 1 (P0): Automatic rollback on mid-uninstall failure restores unlinked files', () => {
  const { root, home } = createDisposableWorkspace();

  try {
    const tx = new InstallationTransaction({
      cwd: root,
      runtime: 'antigravity',
      scope: 'workspace',
      mode: 'copy',
      home
    });
    tx.execute();

    const coreMd = path.join(root, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
    assert.strictEqual(fs.existsSync(coreMd), true);

    // Simulate an unexpected failure midway by making manifest removal fail or throwing inside
    const originalRmSync = fs.rmSync;
    let callCount = 0;
    fs.rmSync = function (p, opts) {
      callCount++;
      if (typeof p === 'string' && p.includes('install.json')) {
        throw new Error('Simulated disk failure during manifest cleanup');
      }
      return originalRmSync.apply(this, arguments);
    };

    try {
      assert.throws(() => {
        tx.uninstall();
      }, (err) => {
        assert.match(err.message, /Simulated disk failure during manifest cleanup/i);
        assert.strictEqual(err.rolledBack, true, 'Error must indicate rollback succeeded');
        return true;
      });
    } finally {
      fs.rmSync = originalRmSync;
    }

    // After automatic rollback, coreMd must be restored on disk!
    assert.strictEqual(fs.existsSync(coreMd), true, 'Skill file must be restored after automatic rollback');
  } finally {
    cleanupDisposableWorkspace(root, home);
  }
});

// =========================================================================
// BLOCKER 2: Symlink Ancestor Boundary & safeChild
// =========================================================================

test('Blocker 2 (P0): safeChild blocks non-existent targets inside symlinked ancestor escaping root', () => {
  const { root } = createDisposableWorkspace();
  const outsideDir = path.join(os.tmpdir(), `xyeena-outside-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(outsideDir, { recursive: true });

  try {
    // Create an internal symlink pointing outside root
    const symlinkDir = path.join(root, 'symlink_escape');
    try {
      fs.symlinkSync(outsideDir, symlinkDir, 'junction');
    } catch {
      fs.symlinkSync(outsideDir, symlinkDir, 'dir');
    }

    // A non-existent target whose ancestor is the escaping symlink
    const nonExistentTarget = path.join(symlinkDir, 'nested', 'target_file.txt');

    // Must detect the escaping ancestor and throw Security error
    assert.throws(() => {
      safeChild(root, nonExistentTarget);
    }, /Security error: symlink\/junction realpath escapes destination root/i);

    // Lexical traversal outside root must also be rejected
    assert.throws(() => {
      safeChild(root, path.join(root, '..', 'evil.txt'));
    }, /Security error: path escapes destination root/i);
  } finally {
    cleanupDisposableWorkspace(root);
    try { fs.rmSync(outsideDir, { recursive: true, force: true }); } catch {}
  }
});

test('Blocker 2 (P0): safeChild detects dangling symlinks along target path', () => {
  const { root } = createDisposableWorkspace();
  const nonExistentTarget = path.join(os.tmpdir(), 'definitely-does-not-exist-target');

  try {
    const brokenSymlink = path.join(root, 'dangling_link');
    try {
      fs.symlinkSync(nonExistentTarget, brokenSymlink, 'file');
    } catch {
      fs.symlinkSync(nonExistentTarget, brokenSymlink, 'junction');
    }

    // Checking a path that traverses through the dangling symlink
    assert.throws(() => {
      safeChild(root, brokenSymlink);
    }, /Security error: dangling symlink detected along path/i);
  } finally {
    cleanupDisposableWorkspace(root);
  }
});

// =========================================================================
// BLOCKER 3: Cortex Truthful Execution Semantics
// =========================================================================

test('Blocker 3 (P1): Cortex returns READY_FOR_EXECUTION when no host executor is provided', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'buatkan arsitektur microservices untuk auth dan pembayaran';

  // 1. Without execute: true -> DISCUSSION_MODE
  const discResult = await cortex.execute(prompt);
  assert.strictEqual(discResult.status, CORTEX_EXECUTION_STATUS.DISCUSSION_MODE);

  // 2. With dryRun: true -> PLANNED
  const dryResult = await cortex.execute(prompt, { execute: true, dryRun: true });
  assert.strictEqual(dryResult.status, CORTEX_EXECUTION_STATUS.PLANNED);

  // 3. With execute: true, but NO executor -> READY_FOR_EXECUTION (truthful under DEC-31)
  const readyResult = await cortex.execute(prompt, { execute: true });
  assert.strictEqual(readyResult.status, CORTEX_EXECUTION_STATUS.READY_FOR_EXECUTION);
  assert.ok(readyResult.taskCount > 0);
  assert.ok(readyResult.plannedSteps.every(s => s.status === TASK_STATUS.READY));
  assert.match(readyResult.message, /ready for host execution/i);

  // 4. Micro tasks execute directly without DAG overhead -> COMPLETED
  const microResult = await cortex.execute('hitung 10 + 20', { execute: true });
  assert.strictEqual(microResult.status, CORTEX_EXECUTION_STATUS.COMPLETED);
  assert.strictEqual(microResult.tier, TASK_TIERS.TIER_0_MICRO);
});

test('Blocker 3 (P1): Cortex executes TaskGraph with node state transitions when executor is provided', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'buatkan refactoring modul checkout dan testing';

  const executedTasks = [];
  const executor = async (taskNode) => {
    executedTasks.push(taskNode.id);
    return { executed: true, taskId: taskNode.id };
  };

  const result = await cortex.execute(prompt, {
    execute: true,
    executor
  });

  assert.strictEqual(result.status, CORTEX_EXECUTION_STATUS.COMPLETED);
  assert.ok(result.executedSteps.length > 0);
  assert.strictEqual(executedTasks.length, result.executedSteps.length);

  // Verify all task graph nodes are COMPLETED
  const allNodes = result.taskGraph.getAll();
  assert.ok(allNodes.every(n => n.status === TASK_STATUS.COMPLETED));

  // Verify evidence ledger recorded execution
  const records = cortex.evidenceLedger.records;
  assert.ok(records.some(r => r.claim.includes('executed successfully')));
});

test('Blocker 3 (P1): Cortex handles executor failures gracefully, marking remaining tasks BLOCKED', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'implementasikan migrasi database dan validasi schema';

  let count = 0;
  const failingExecutor = async (taskNode) => {
    count++;
    if (count === 2) {
      throw new Error('Simulated database connection failure');
    }
    return { ok: true };
  };

  const result = await cortex.execute(prompt, {
    execute: true,
    executor: failingExecutor
  });

  assert.strictEqual(result.status, CORTEX_EXECUTION_STATUS.FAILED);
  assert.match(result.message, /Simulated database connection failure/i);

  // First task COMPLETED, second task FAILED, remaining tasks BLOCKED
  const nodes = result.taskGraph.getAll();
  assert.strictEqual(nodes[0].status, TASK_STATUS.COMPLETED);
  assert.strictEqual(nodes[1].status, TASK_STATUS.FAILED);
  for (let i = 2; i < nodes.length; i++) {
    assert.strictEqual(nodes[i].status, TASK_STATUS.BLOCKED);
  }
});

test('Blocker 3 (P1): Cortex executes analytical composites with METHOD_EVALUATED status', async () => {
  const cortex = createDefaultCortex();
  const result = await cortex.execute('/xyeena-design Create clean mobile navbar', {
    execute: true,
    input: {
      prompt: 'Create clean mobile navbar',
      colors: { fg: [20, 20, 20], bg: [250, 250, 250] },
      tokens: [
        { name: 'primitive.color.gray', tier: 'primitive', references: null },
        { name: 'semantic.color.bg', tier: 'semantic', references: 'primitive.color.gray' }
      ]
    }
  });

  assert.strictEqual(result.engine, 'Cortex');
  assert.strictEqual(result.status, CORTEX_EXECUTION_STATUS.METHOD_EVALUATED);
  assert.ok(result.compositeResult);
  assert.strictEqual(result.compositeResult.compositeId, 'xyeena-design');
  assert.match(result.message, /evaluated successfully/i);
});

test('Blocker 3 (P1): Cortex handles micro tasks with arithmetic computation and requireResponseProvider gate', async () => {
  const cortex = createDefaultCortex();

  // 1. Arithmetic evaluation
  const calcResult = await cortex.execute('hitung 25 * 4', { execute: true });
  assert.strictEqual(calcResult.status, CORTEX_EXECUTION_STATUS.COMPLETED);
  assert.strictEqual(calcResult.tier, TASK_TIERS.TIER_0_MICRO);
  assert.strictEqual(calcResult.output, 100);

  // 2. Micro task with requireResponseProvider returns READY_FOR_EXECUTION when unprovided
  const gateResult = await cortex.execute('hitung 10 + 20', {
    execute: true,
    requireResponseProvider: true
  });
  assert.strictEqual(gateResult.status, CORTEX_EXECUTION_STATUS.READY_FOR_EXECUTION);
  assert.match(gateResult.message, /ready for execution with response provider/i);

  // 3. Micro task with responseProvider executes COMPLETED
  const providedResult = await cortex.execute('hitung 10 + 20', {
    execute: true,
    requireResponseProvider: true,
    responseProvider: () => 30
  });
  assert.strictEqual(providedResult.status, CORTEX_EXECUTION_STATUS.COMPLETED);
  assert.strictEqual(providedResult.output, 30);
});

test('Blocker 3 (P1): Cortex handles structured executor failure signals ({ success: false })', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'buatkan refactoring service auth';

  let count = 0;
  const failingSignalExecutor = async (taskNode) => {
    count++;
    if (count === 1) {
      return { success: false, reason: 'Typecheck failed on step 1' };
    }
    return { success: true };
  };

  const result = await cortex.execute(prompt, {
    execute: true,
    executor: failingSignalExecutor
  });

  assert.strictEqual(result.status, CORTEX_EXECUTION_STATUS.FAILED);
  assert.match(result.message, /Typecheck failed on step 1/i);

  const nodes = result.taskGraph.getAll();
  assert.strictEqual(nodes[0].status, TASK_STATUS.FAILED);
  for (let i = 1; i < nodes.length; i++) {
    assert.strictEqual(nodes[i].status, TASK_STATUS.BLOCKED);
  }
});

test('Blocker 3 (P1): Cortex handles cancellation AbortSignal transitioning to BLOCKED', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'buatkan migrasi database besar';

  const controller = new AbortController();
  controller.abort();

  const result = await cortex.execute(prompt, {
    execute: true,
    signal: controller.signal,
    executor: async () => ({ success: true })
  });

  assert.strictEqual(result.status, CORTEX_EXECUTION_STATUS.BLOCKED);
  assert.match(result.message, /cancelled by signal|aborted by cancellation signal/i);
  const nodes = result.taskGraph.getAll();
  assert.ok(nodes.every(n => n.status === TASK_STATUS.BLOCKED));
});

// =========================================================================
// BLOCKER 4: Trusted RLS Execution Receipts
// =========================================================================

test('Blocker 4 (P1): RLS evaluation rejects caller-asserted booleans and requires structured receipt', async () => {
  const testPrincipals = [
    { id: 'usr-1', tenantId: 'tenant-a' },
    { id: 'usr-2', tenantId: 'tenant-b' }
  ];

  // 1. Permissive policy flagged as SUSPECTED_CROSS_TENANT_POLICY_RISK
  const leaking = SecurityMethods.evaluateRlsPolicy({
    tableName: 'organizations',
    rlsEnabled: true,
    policies: [{ name: 'all_can_read', definition: 'true' }],
    testPrincipals
  });
  assert.strictEqual(leaking.verdict, 'SUSPECTED_CROSS_TENANT_POLICY_RISK');
  assert.strictEqual(leaking.suspectedCrossTenantRisk, true);

  // 2. Clean static policy with caller-asserted boolean alone -> STATIC_CHECK_PASS
  const selfAsserted = SecurityMethods.evaluateRlsPolicy({
    tableName: 'organizations',
    rlsEnabled: true,
    policies: [{ name: 'tenant_strict', definition: 'auth.uid() = user_id' }],
    liveExecutionVerified: true,
    liveQueryReceipts: { tenantIsolationProven: true }
  });
  assert.strictEqual(selfAsserted.verdict, 'STATIC_CHECK_PASS');
  assert.strictEqual(selfAsserted.requiresLiveValidation, true);
  assert.strictEqual(selfAsserted.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
  assert.strictEqual(selfAsserted.receiptVerified, false);

  // 3. Forged / manufactured receipt using public helper createRlsQueryReceipt is rejected
  const fakeReceipt = SecurityMethods.createRlsQueryReceipt({
    tableName: 'organizations',
    dbEnvironment: 'postgres-prod'
  });
  const rejectedFake = SecurityMethods.evaluateRlsPolicy({
    tableName: 'organizations',
    rlsEnabled: true,
    policies: [{ name: 'tenant_strict', definition: 'auth.uid() = user_id' }],
    trustedQueryReceipt: fakeReceipt
  });
  assert.strictEqual(rejectedFake.verdict, 'STATIC_CHECK_PASS');
  assert.strictEqual(rejectedFake.receiptRejected, true);
  assert.strictEqual(rejectedFake.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
  assert.notStrictEqual(rejectedFake.epistemicStatus, 'LIVE_EXECUTION_PROVEN');

  // 4. Even a caller-supplied adapter with a mock database client is not trusted live evidence
  const liveAdapter = new LiveDatabaseAdapter({
    environment: 'postgres-staging',
    client: {
      query: async ({ query, principal }) => {
        if (query.includes('WHERE tenant_id = $1')) {
          return { rows: [], rowCount: 0, error: 'ACCESS_DENIED' };
        }
        return { rows: [{ id: 'org-1', user_id: principal.id }], rowCount: 1 };
      }
    }
  });
  const probe = await liveAdapter.executeIsolationProbe({
    tableName: 'organizations',
    testPrincipals
  });
  const verified = SecurityMethods.evaluateRlsPolicy({
    tableName: 'organizations',
    rlsEnabled: true,
    policies: [{ name: 'tenant_strict', definition: 'auth.uid() = user_id' }],
    liveDatabaseAdapter: liveAdapter,
    liveProbeResult: probe
  });
  assert.strictEqual(verified.verdict, 'STATIC_CHECK_PASS');
  assert.strictEqual(verified.requiresLiveValidation, true);
  assert.strictEqual(verified.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
  assert.strictEqual(verified.receiptVerified, false);
  assert.strictEqual(verified.receiptRejected, true);

  // 5. Fake/mock cross-tenant rows cannot claim empirically observed database leakage
  const leakingAdapter = new LiveDatabaseAdapter({
    environment: 'postgres-staging',
    client: {
      query: async () => ({ rows: [{ id: 'org-other' }], rowCount: 1 })
    }
  });
  const leakProbe = await leakingAdapter.executeIsolationProbe({
    tableName: 'organizations',
    testPrincipals
  });
  const leakResult = SecurityMethods.evaluateRlsPolicy({
    tableName: 'organizations',
    rlsEnabled: true,
    policies: [{ name: 'tenant_strict', definition: 'auth.uid() = user_id' }],
    liveDatabaseAdapter: leakingAdapter,
    liveProbeResult: leakProbe
  });
  assert.strictEqual(leakResult.verdict, 'STATIC_CHECK_PASS');
  assert.strictEqual(leakResult.empiricallyObservedLeak, false);
  assert.strictEqual(leakResult.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
  assert.strictEqual(leakResult.receiptRejected, true);
});

test('Release gate: forged provenance and authorized-looking adapter cannot claim live RLS proof', () => {
  const base = {
    tableName: 'organizations', rlsEnabled: true,
    policies: [{ name: 'tenant_strict', definition: 'auth.uid() = user_id' }]
  };
  const forged = {
    provenance: 'live-db://postgres-production/organizations',
    positiveQuery: { status: 'SUCCESS', rowsReturned: 10 },
    negativeQuery: { status: 'DENIED', rowsReturned: 0 }
  };
  for (const evidence of [
    { liveProbeResult: forged },
    { liveDatabaseAdapter: { isAuthorizedLiveAdapter: true, lastProbeResult: forged } },
    { liveExecutionVerified: true }
  ]) {
    const result = SecurityMethods.evaluateRlsPolicy({ ...base, ...evidence });
    assert.strictEqual(result.verdict, 'STATIC_CHECK_PASS');
    assert.strictEqual(result.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
    assert.strictEqual(result.requiresLiveValidation, true);
    assert.strictEqual(result.receiptRejected, true);
  }
});

test('Release gate: lock can only be released by its acquiring transaction', () => {
  const { root, home } = createDisposableWorkspace();
  try {
    const owner = new InstallationTransaction({ cwd: root, runtime: 'antigravity', scope: 'workspace', home });
    const other = new InstallationTransaction({ cwd: root, runtime: 'antigravity', scope: 'workspace', home });
    owner.acquireLock();
    assert.throws(() => other.acquireLock(), /Installer lock is actively held/i);
    other.releaseLock();
    assert.ok(fs.existsSync(owner.lockPath), 'Another transaction must not delete the lock');
    owner.releaseLock();
    assert.strictEqual(fs.existsSync(owner.lockPath), false);
  } finally { cleanupDisposableWorkspace(root, home); }
});

test('Release gate: untrusted table identifiers are rejected before a database probe', async () => {
  let queried = false;
  const adapter = new LiveDatabaseAdapter({ client: { query: async () => { queried = true; return { rows: [] }; } } });
  await assert.rejects(
    adapter.executeIsolationProbe({
      tableName: 'orders"; DROP TABLE users;--',
      testPrincipals: [{ id: 'a', tenantId: 'one' }, { id: 'b', tenantId: 'two' }]
    }),
    /Invalid SQL table identifier/
  );
  assert.strictEqual(queried, false);
});
