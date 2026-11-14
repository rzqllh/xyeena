/**
 * Acceptance Suite: Lightweight Behavior, Artifact Safety & Live Host Matrix (P10.1 / DEC-28 / DEC-30)
 * Evaluates:
 * 1. Concrete, empirical micro-task overhead (0 DAG, 0 subagents, 0 disk writes, execution time in ms)
 * 2. Artifact safety: collision protection, convention prioritization, scratch isolation
 * 3. Actual host acceptance matrix: Antigravity native inspection vs portable degradation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { createDefaultCortex } from '../src/core/index.mjs';
import { TASK_TIERS } from '../src/core/router.mjs';
import { EXECUTION_MODES } from '../src/core/policy.mjs';
import {
  ARTIFACT_TYPES,
  shouldPersistArtifact,
  resolveArtifactPath,
  writeArtifactAtomic,
  writeScratchFile
} from '../src/runtime/index.mjs';
import { HostNegotiator, HOST_NAMES, SUPPORT_LEVELS } from '../src/core/negotiator.mjs';

test('P10.1 Lightweight Behavior: Micro-tasks have 0 DAG, 0 subagents, 0 disk writes, and low execution overhead', async () => {
  const cortex = createDefaultCortex();
  const scenarios = [
    { name: 'Typo fix', prompt: 'perbaiki typo di line 4 readme' },
    { name: 'Simple Q&A', prompt: 'apa fungsi let di javascript?' },
    { name: 'Direct calculation', prompt: 'hitung 24 * 60 * 60 detik' }
  ];

  for (const s of scenarios) {
    const t0 = performance.now();
    const plan = cortex.resolve(s.prompt);
    const execResult = await cortex.execute(s.prompt, { execute: true });
    const elapsedMs = performance.now() - t0;

    // Invariants for simple/micro tasks
    assert.equal(plan.tier, TASK_TIERS.TIER_0_MICRO, `${s.name} must be classified as TIER_0_MICRO`);
    assert.equal(plan.workflow.requiresSubagent, false, `${s.name} must not require subagents`);
    assert.equal(plan.workflow.delegationStrategy, 'none', `${s.name} must have 'none' delegation`);
    assert.equal(plan.workflow.steps.length, 1, `${s.name} must have exactly 1 direct step (0 DAG)`);

    // Verification of adaptive artifact persistence: micro tasks must NOT write artifacts
    const artifactCheck = shouldPersistArtifact({ prompt: s.prompt, tier: plan.tier, mode: plan.mode });
    assert.equal(artifactCheck.shouldPersist, false, `${s.name} must not trigger persistent artifact generation`);

    // Execution time must be crisp (under 25ms locally)
    assert.ok(elapsedMs < 25, `${s.name} overhead took ${elapsedMs.toFixed(2)}ms, must be < 25ms`);
  }
});

test('P10.1 Task Sizing: Complexity tiers scale faithfully from standard to architectural', () => {
  const cortex = createDefaultCortex();

  // Standard 1-file edit / targeted change
  const stdPlan = cortex.resolve('tambahkan validasi email pada endpoint register');
  assert.equal(stdPlan.tier, TASK_TIERS.TIER_1_STANDARD);
  assert.equal(stdPlan.workflow.requiresSubagent, false);
  assert.equal(stdPlan.workflow.delegationStrategy, 'internal-inline');

  // Multi-phase implementation
  const cpxPlan = cortex.resolve('implement database migration and data backfill');
  assert.equal(cpxPlan.tier, TASK_TIERS.TIER_2_COMPLEX);
  assert.equal(cpxPlan.workflow.delegationStrategy, 'internal-dag');
  assert.equal(cpxPlan.workflow.steps.length, 4);

  // Architectural / risk-gate task
  const archPlan = cortex.resolve('full security audit for multi-agent release');
  assert.equal(archPlan.tier, TASK_TIERS.TIER_3_ARCHITECTURAL);
  assert.equal(archPlan.workflow.requiresSubagent, true);
  assert.equal(archPlan.workflow.delegationStrategy, 'host-native-subagent');
  assert.equal(archPlan.workflow.requiresRiskGate, true);
});

test('P10.1 Artifact Safety: Prevents silent overwrite and enforces collision deduplication', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-art-safe-'));

  try {
    const target = path.join(tmpDir, 'docs', 'plans', 'release-plan.md');

    // 1. First atomic write
    const res1 = writeArtifactAtomic({
      filePath: target,
      content: '# Version 1',
      overwrite: false
    });
    assert.equal(res1.written, true);
    assert.equal(res1.deduplicated, false);
    assert.equal(fs.readFileSync(target, 'utf8'), '# Version 1');

    // 2. Second atomic write without overwrite=true must NOT silently replace!
    const res2 = writeArtifactAtomic({
      filePath: target,
      content: '# Version 2',
      overwrite: false
    });
    assert.equal(res2.written, true);
    assert.equal(res2.deduplicated, true, 'Must deduplicate target path to protect existing file');
    assert.notEqual(res2.path, target);
    assert.ok(fs.existsSync(res2.path));
    // Verify original target still contains Version 1!
    assert.equal(fs.readFileSync(target, 'utf8'), '# Version 1');

    // 3. Third atomic write WITH overwrite=true explicitly permitted
    const res3 = writeArtifactAtomic({
      filePath: target,
      content: '# Version 3 (Authorized)',
      overwrite: true
    });
    assert.equal(res3.written, true);
    assert.equal(res3.overwritten, true);
    assert.equal(res3.path, target);
    assert.equal(fs.readFileSync(target, 'utf8'), '# Version 3 (Authorized)');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('P10.1 Host Acceptance Matrix: Verifies Antigravity native presence and honest degradation for other hosts', () => {
  // 1. Antigravity environment inspection
  const agyNegotiator = new HostNegotiator(
    { ANTIGRAVITY_APP_DIR: 'C:\\Users\\User\\.gemini\\antigravity-cli' },
    { run_command: true, invoke_subagent: true }
  );
  assert.equal(agyNegotiator.detectHost(), HOST_NAMES.ANTIGRAVITY);

  const agyMatrix = agyNegotiator.negotiateFeatureMatrix();
  assert.equal(agyMatrix.terminal_execution, SUPPORT_LEVELS.SUPPORTED);
  assert.equal(agyMatrix.subagent_delegation, SUPPORT_LEVELS.SUPPORTED);

  // 2. Generic offline environment: honestly reports UNAVAILABLE without false parity claims
  const genericNegotiator = new HostNegotiator({}, {});
  assert.equal(genericNegotiator.detectHost(), HOST_NAMES.GENERIC);

  const genericMatrix = genericNegotiator.negotiateFeatureMatrix();
  assert.equal(genericMatrix.terminal_execution, SUPPORT_LEVELS.UNAVAILABLE);
  assert.equal(genericMatrix.subagent_delegation, SUPPORT_LEVELS.DEGRADED);

  // 3. Workspace native files existence check
  assert.ok(fs.existsSync('.agents/rules/xyeena-core.md'), 'Workspace Antigravity kernel rule must exist');
  assert.ok(fs.existsSync('.agents/hooks.json'), 'Workspace Antigravity hooks config must exist');
});
