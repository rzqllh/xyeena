/**
 * Test Suite: Cortex Default Orchestration & Intelligent Routing (P10 / DEC-27)
 * Verifies that Cortex operates as the default native intelligence layer without
 * requiring manual skill picking, adapts complexity tiers faithfully, honors user
 * explicit choices, respects Rule 4, and coordinates subagents safely.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CortexOrchestrator,
  createDefaultCortex,
  DEFAULT_CAPABILITIES,
  createDefaultRegistry
} from '../src/core/index.mjs';
import { TASK_TIERS } from '../src/core/router.mjs';
import { EXECUTION_MODES } from '../src/core/policy.mjs';

test('Cortex Engine: default initialization and status inspection', () => {
  const cortex = createDefaultCortex();
  const status = cortex.getStatus();

  assert.equal(status.engine, 'Cortex');
  assert.equal(status.status, 'ONLINE');
  assert.equal(status.isDefault, true);
  assert.equal(status.registrySize, 64);
  assert.ok(status.activeInvariants.length >= 4);
  assert.ok(status.supportedTiers.includes(TASK_TIERS.TIER_0_MICRO));
  assert.ok(status.supportedTiers.includes(TASK_TIERS.TIER_3_ARCHITECTURAL));
});

test('Cortex Natural Language: TIER_0_MICRO executes directly with zero DAG overhead', async () => {
  const cortex = createDefaultCortex();
  const prompt = 'apa bedanya let dan const di javascript?';

  const plan = cortex.resolve(prompt);
  assert.equal(plan.mode, EXECUTION_MODES.DISCUSSION);
  assert.equal(plan.tier, TASK_TIERS.TIER_0_MICRO);
  assert.equal(plan.isExecutionAuthorized, false);
  assert.equal(plan.workflow.delegationStrategy, 'none');
  assert.equal(plan.workflow.requiresSubagent, false);
  assert.equal(plan.workflow.steps.length, 1);

  // Discussion mode execute fails closed without modifying files
  const discResult = await cortex.execute(prompt);
  assert.equal(discResult.status, 'DISCUSSION_MODE');

  // Forced execution of micro task executes cleanly with zero DAG
  const execResult = await cortex.execute(prompt, { execute: true });
  assert.equal(execResult.status, 'COMPLETED');
  assert.equal(execResult.tier, TASK_TIERS.TIER_0_MICRO);
});

test('Cortex Natural Language: TIER_1_STANDARD routes domain capabilities lazily', () => {
  const cortex = createDefaultCortex();
  const prompt = 'review styling dan accessibility pada modal komponen ini';

  const plan = cortex.resolve(prompt);
  assert.equal(plan.tier, TASK_TIERS.TIER_1_STANDARD);

  const capIds = plan.activeCapabilities.map(c => c.id);
  assert.ok(capIds.includes('design.interface'), 'Should include design.interface');
  assert.ok(capIds.includes('design.accessibility'), 'Should include design.accessibility');
  assert.equal(plan.workflow.requiresSubagent, false);
});

test('Cortex Explicit Commands: honors user explicit slash-command and skill selection', () => {
  const cortex = createDefaultCortex();
  const prompt = '/antislop bersihkan copywriting dan komentar generik di modul auth';

  const plan = cortex.resolve(prompt);
  assert.ok(plan.explicitSkills.includes('antislop'), 'Must detect antislop explicit skill');

  const tddPrompt = 'jalankan tdd untuk membuat queue worker';
  const tddPlan = cortex.resolve(tddPrompt);
  assert.ok(tddPlan.explicitSkills.includes('tdd'), 'Must detect tdd explicit skill');
});

test('Cortex Rule 4 Gate: execution intent unlocks execution mode', () => {
  const cortex = createDefaultCortex();

  // Discussion phrase
  const discPlan = cortex.resolve('menurut lu modul ini perlu di-refactor gak?');
  assert.equal(discPlan.mode, EXECUTION_MODES.DISCUSSION);
  assert.equal(discPlan.isExecutionAuthorized, false);

  // Execution phrase
  const execPlan = cortex.resolve('fix sekarang dan ubah kodenya agar lolos lint');
  assert.equal(execPlan.mode, EXECUTION_MODES.EXECUTION);
  assert.equal(execPlan.isExecutionAuthorized, true);
  assert.equal(execPlan.tier, TASK_TIERS.TIER_2_COMPLEX);
  assert.equal(execPlan.workflow.delegationStrategy, 'internal-dag');
});

test('Cortex TIER_3_ARCHITECTURAL: activates host-native delegation and risk gates', () => {
  const cortex = createDefaultCortex();
  const prompt = 'full security audit untuk seluruh pipeline CI/CD dan multi-agent release';

  const plan = cortex.resolve(prompt);
  assert.equal(plan.mode, EXECUTION_MODES.EXPLICIT_RISK_GATE);
  assert.equal(plan.tier, TASK_TIERS.TIER_3_ARCHITECTURAL);
  assert.equal(plan.workflow.requiresSubagent, true);
  assert.equal(plan.workflow.delegationStrategy, 'host-native-subagent');
  assert.equal(plan.workflow.requiresRiskGate, true);
  assert.ok(plan.budget.maxTokens >= 8000);
});

test('Cortex Diagnostic Inspection: returns complete audit trace', () => {
  const cortex = createDefaultCortex();
  const inspection = cortex.inspect('diagnose kenapa memory leak saat background worker jalan');

  assert.equal(inspection.cortexEngine, 'ONLINE');
  assert.equal(inspection.intentClassification.mode, EXECUTION_MODES.DIAGNOSE);
  assert.ok(inspection.skills.nativeCapabilitiesResolved >= 4);
  assert.equal(typeof inspection.budgetCeiling, 'number');
  assert.ok(inspection.budgetCeiling > 0);
});
