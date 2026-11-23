import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScope, evaluateAntiSlop } from '../../skills/veyra-core/engine.mjs';
import { compressContext } from '../../skills/veyra-context/engine.mjs';
import { createCheckpoint, parseCheckpoint, resolveNextAction } from '../../skills/veyra-handoff/engine.mjs';

describe('Veyra Wave 1 — End-to-End Governance Pipeline Integration', () => {
  test('complete pipeline: task fence -> antislop check -> context compress -> handoff checkpoint', () => {
    // 1. Task Fence Gate (veyra-core)
    const proposedEdits = ['workspace/skills/veyra-core/SKILL.md', 'workspace/skills/veyra-context/SKILL.md'];
    const scopeEvaluation = evaluateScope({
      targetFiles: proposedEdits,
      allowedPatterns: ['workspace/skills/*'],
      actionType: 'WRITE'
    });
    assert.equal(scopeEvaluation.verdict, 'PROCEED', 'Step 1: Scope evaluation must allow compliant skill edits');

    // 2. Anti-Slop Audit (veyra-core)
    const logOutput = 'Wave 1 implementation verified across unit, contract, and integration test suites. 100% facts preserved.';
    const antiSlopCheck = evaluateAntiSlop(logOutput);
    assert.equal(antiSlopCheck.pass, true, 'Step 2: Log output must pass AntiSlop invariants');

    // 3. Context Economy Compression (veyra-context)
    const verboseSessionReport = `Certainly! I'd be pleased to assist with the Veyra Wave 1 execution.
Tested files: workspace/skills/veyra-core/engine.mjs and workspace/skills/veyra-context/engine.mjs.
All tests passing under DEC-01, DEC-09, and DEC-35.
Hope this helps!`;
    const compressionResult = compressContext(verboseSessionReport);
    assert.ok(compressionResult.compressionRatio < 1.0, 'Step 3: Context compression must reduce byte payload');
    assert.ok(compressionResult.preservedFacts.decisions.includes('DEC-01'), 'Step 3: Decision IDs must be preserved');

    // 4. Checkpoint Serialization (veyra-handoff)
    const checkpointState = {
      status: 'WAVE_1_COMPLETE',
      activePhase: 'Wave 1 — Core Governance & Context',
      timestamp: '2026-11-22T12:00:00Z',
      authority: 'Canonical Owner Decisions DEC-01 through DEC-35 (LOCKED)',
      skillImplementationStatus: 'WAVE_1_VERIFIED',
      artifacts: [
        { name: 'skills/veyra-core/SKILL.md', location: 'workspace/skills/veyra-core', status: 'VERIFIED' },
        { name: 'skills/veyra-context/SKILL.md', location: 'workspace/skills/veyra-context', status: 'VERIFIED' },
        { name: 'skills/veyra-handoff/SKILL.md', location: 'workspace/skills/veyra-handoff', status: 'VERIFIED' }
      ],
      nextActions: ['Await Owner review and explicit Wave 2 GO']
    };
    const checkpointResult = createCheckpoint(checkpointState);
    assert.equal(checkpointResult.isValid, true, 'Step 4: Checkpoint serialization must produce valid artifact');

    // 5. Continuation Driver Parse (veyra-handoff)
    const parsedState = parseCheckpoint(checkpointResult.markdown);
    assert.equal(parsedState.status, 'WAVE_1_COMPLETE');
    const nextAction = resolveNextAction(parsedState);
    assert.equal(nextAction.action, 'AWAIT_WAVE_2_GO', 'Step 5: Next action must correctly pause before Wave 2');
  });
});
