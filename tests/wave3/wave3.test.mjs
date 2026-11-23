import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateExecutionScope, trackTddPhase, auditSmallestChange } from '../../skills/veyra-execute/engine.mjs';
import { parseFailureLog, evaluateHypothesisEvidence, auditAntiShotgun } from '../../skills/veyra-debug/engine.mjs';
import { createSpikeHarness, auditSpikeIsolation, generateCleanupManifest } from '../../skills/veyra-prototype/engine.mjs';

describe('Veyra Wave 3 — Scoped Engineering Skills', () => {
  test('veyra-execute: scope enforcement, TDD phase tracking, minimal change', () => {
    const scopeCheck = validateExecutionScope(['workspace/skills/veyra-execute/*'], [
      'workspace/skills/veyra-execute/engine.mjs',
      'workspace/package.json'
    ]);
    assert.equal(scopeCheck.valid, false);
    assert.equal(scopeCheck.disallowed.length, 1);
    assert.equal(scopeCheck.disallowed[0], 'workspace/package.json');

    const tddValid = trackTddPhase(['RED', 'GREEN', 'REFACTOR']);
    assert.equal(tddValid.validSequence, true);
    assert.equal(tddValid.currentPhase, 'REFACTOR');

    const tddInvalid = trackTddPhase(['GREEN', 'REFACTOR']);
    assert.equal(tddInvalid.validSequence, false);

    const changeAudit = auditSmallestChange(100, 10, 5);
    assert.equal(changeAudit.isMinimal, true);
  });

  test('veyra-debug: failure log parsing and anti-shotgun enforcement', () => {
    const stack = 'TypeError: Cannot read properties of undefined (reading count)\n    at processTask (file:///worker.mjs:42:15)';
    const parsed = parseFailureLog(stack);
    assert.equal(parsed.errorType, 'TypeError');
    assert.ok(parsed.message.includes('properties of undefined'));
    assert.equal(parsed.stackDepth, 1);

    const hypothesis = evaluateHypothesisEvidence('properties of undefined count', parsed.message);
    assert.equal(hypothesis.supported, true);

    const shotgunCheck = auditAntiShotgun(['src/worker.mjs', 'src/auth.mjs', 'src/payment.mjs'], 'src/worker.mjs');
    assert.equal(shotgunCheck.disciplined, false);
    assert.equal(shotgunCheck.unrelatedFiles.length, 2);
  });

  test('veyra-prototype: spike isolation and cleanup manifest', () => {
    const harness = createSpikeHarness('MemoryBenchmark');
    assert.equal(harness.spikeName, 'memorybenchmark');
    assert.equal(harness.isDisposable, true);

    const isolation = auditSpikeIsolation(['scratch/spike-test.mjs', 'src/leaked.mjs']);
    assert.equal(isolation.isolated, false);
    assert.equal(isolation.leakCount, 1);

    const cleanup = generateCleanupManifest(['scratch/spike-test.mjs']);
    assert.equal(cleanup.cleanupReady, true);
    assert.equal(cleanup.totalFilesToRemove, 1);
  });
});
