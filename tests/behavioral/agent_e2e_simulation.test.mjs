import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskByIntent, resolveExecutionStrategy } from '../../skills/veyra-orchestrate/engine.mjs';
import { validateScope, evaluateAntiSlop, classifyClaim } from '../../skills/veyra-core/engine.mjs';
import { validatePlanDAG } from '../../skills/veyra-plan/engine.mjs';
import { trackTddPhase, validateExecutionScope } from '../../skills/veyra-execute/engine.mjs';
import { generateVerificationReceipt, executeAndVerify, validateCompletionClaims } from '../../skills/veyra-verify/engine.mjs';
import { serializeCheckpoint, parseCheckpoint } from '../../skills/veyra-handoff/engine.mjs';
import { calculateContrastRatio } from '../../skills/veyra-interface/engine.mjs';

describe('Veyra v1.0 — Real Agent Behavioral E2E Simulation', () => {
  test('1. Intent Routing & Alias Resolution across Multi-Language User Prompts', () => {
    // English prompts
    assert.equal(routeTaskByIntent('Audit accessibility and color contrast on dashboard'), 'veyra-interface');
    assert.equal(routeTaskByIntent('We need to investigate this flaky test crash in CI'), 'veyra-debug');
    assert.equal(routeTaskByIntent('Review this diff for circular dependencies and coupling'), 'veyra-architecture');
    assert.equal(routeTaskByIntent('Scan repository for AWS secrets and RLS leaks'), 'veyra-security');

    // Bahasa Indonesia prompts
    assert.equal(routeTaskByIntent('Tolong periksa kontras warna dan layout UI di halaman login'), 'veyra-interface');
    assert.equal(routeTaskByIntent('Cari root cause dari bug regression yang baru muncul'), 'veyra-debug');
    assert.equal(routeTaskByIntent('Buat rencana implementasi multi-step dengan dependency graph'), 'veyra-plan');
    assert.equal(routeTaskByIntent('Simpan checkpoint sesi ini untuk handoff ke agent lain'), 'veyra-handoff');
  });

  test('2. Multi-Step Composite Governance Workflow Simulation', () => {
    // Step 1: Plan Phase — Generate execution DAG
    const planPhases = [
      {
        id: 'PHASE_1',
        name: 'Database Schema Migration',
        tasks: [{ id: 'TASK_SCHEMA', dependsOn: [] }]
      },
      {
        id: 'PHASE_2',
        name: 'Backend API Integration',
        tasks: [{ id: 'TASK_API', dependsOn: ['TASK_SCHEMA'] }]
      }
    ];
    const planValidation = validatePlanDAG(planPhases);
    assert.equal(planValidation.valid, true, 'DAG must be valid and acyclic');

    // Step 2: Scope Fencing — Validate file targets
    const allowedPatterns = ['workspace/src/database/*', 'workspace/src/api/*'];
    const targetFiles = ['workspace/src/database/migration.sql', 'workspace/src/api/handler.mjs'];
    const scopeCheck = validateScope({ targetFiles, allowedPatterns, actionType: 'WRITE' });
    assert.equal(scopeCheck.verdict, 'PROCEED', 'Target files must be strictly within approved patterns');

    // Step 3: TDD Execution Flow — RED -> GREEN -> REFACTOR
    let tdd = trackTddPhase([]);
    assert.equal(tdd.currentPhase, 'INITIAL');

    tdd = trackTddPhase(['RED']);
    assert.equal(tdd.currentPhase, 'RED');

    tdd = trackTddPhase(['RED', 'GREEN']);
    assert.equal(tdd.currentPhase, 'GREEN');

    // Step 4: Verification Receipt Generation — Cryptographically recorded evidence
    const receipt = executeAndVerify(
      'TASK_API',
      'node -e "console.log(\'5 tests passed in 45ms\')"'
    );
    assert.equal(receipt.passed, true);
    assert.equal(receipt.evidenceTier, 'LOCAL_PROCESS_VERIFIED');

    const completionValidation = validateCompletionClaims([receipt], ['TASK_API']);
    assert.equal(completionValidation.verified, true);
    assert.equal(completionValidation.status, 'PASS');

    // Step 5: Checkpoint Continuation — Serialized markdown artifact
    const checkpoint = serializeCheckpoint({
      status: 'PHASE_2_COMPLETE',
      activePhase: 'Backend API Integration',
      nextAction: 'PROCEED_TO_PHASE_3_UI',
      tasks: [{ id: 'TASK_API', description: 'API handler built & verified', done: true, status: 'DONE' }]
    });
    assert.ok(checkpoint.markdown.includes('> **Status:** `PHASE_2_COMPLETE`'));

    const parsed = parseCheckpoint(checkpoint.markdown);
    assert.equal(parsed.status, 'PHASE_2_COMPLETE');
    assert.equal(parsed.taskCount, 1);
    assert.equal(parsed.tasks[0].done, true);
  });

  test('3. Epistemic Claim Classification & Anti-Slop Enforcement on Agent Output', () => {
    const rawFactualOutput = 'Verified: node --test tests/api.test.mjs exited with code 0. 56 passing tests across 20 suites.';
    const antiSlopCheck = evaluateAntiSlop(rawFactualOutput);
    assert.equal(antiSlopCheck.pass, true, 'Clean factual output passes anti-slop gate');

    const epistemicClaim = classifyClaim(rawFactualOutput, ['exited with code 0']);
    assert.equal(epistemicClaim.category, 'UNKNOWN');
    assert.equal(epistemicClaim.confidence, 0.0);

    const slopOutput = 'I am pleased to revolutionize this cutting-edge solution with vital game-changing power.';
    const slopCheck = evaluateAntiSlop(slopOutput);
    assert.equal(slopCheck.pass, false, 'Flags banned AI filler and hype words');
    assert.ok(slopCheck.findings.length >= 3);
  });
});
