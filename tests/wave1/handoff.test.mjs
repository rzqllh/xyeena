import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckpoint, parseCheckpoint, resolveNextAction } from '../../skills/veyra-handoff/engine.mjs';

describe('Veyra Handoff — Portable Checkpoint Serialization (DEC-24)', () => {
  test('creates structured, valid checkpoint markdown', () => {
    const state = {
      status: 'WAVE_0_COMPLETE',
      activePhase: 'Wave 0 — Bootstrap',
      timestamp: '2026-11-22T11:45:00Z',
      authority: 'Canonical Owner Decisions DEC-01 through DEC-35 (LOCKED)',
      skillImplementationStatus: 'GATED',
      artifacts: [
        { name: 'veyra-v1.0-workspace-ready.zip', location: 'Downloads/', status: 'PRESENT', details: '130 files' }
      ],
      provenance: {
        archiveHash: 'b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f',
        manifestFiles: '45637/45637',
        pinnedRepos: '21/21'
      },
      nextActions: ['Run preflight', 'Initiate Wave 1']
    };

    const res = createCheckpoint(state);
    assert.equal(res.isValid, true);
    assert.ok(res.markdown.includes('> **Status:** `WAVE_0_COMPLETE`'));
    assert.ok(res.markdown.includes('veyra-v1.0-workspace-ready.zip'));
    assert.ok(res.markdown.includes('b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f'));
  });

  test('parses markdown checkpoint into structured state object', () => {
    const md = `# Veyra v1.0 Workspace Checkpoint

> **Status:** \`WAVE_0_COMPLETE\`
> **Active Phase:** Wave 0 — Workspace & Canonical Specification Reconciliation
> **Timestamp:** 2026-11-22T11:35:00+07:00
> **Authority:** Canonical Owner Decisions DEC-01 through DEC-35 (LOCKED)
> **Skill Implementation:** GATED / WAITING_FOR_OWNER_GO
`;

    const parsed = parseCheckpoint(md);
    assert.equal(parsed.isValid, true);
    assert.equal(parsed.status, 'WAVE_0_COMPLETE');
    assert.equal(parsed.activePhase, 'Wave 0 — Workspace & Canonical Specification Reconciliation');
    assert.equal(parsed.errors.length, 0);
  });

  test('resolves deterministic next action based on checkpoint phase', () => {
    const wave0 = parseCheckpoint('> **Status:** `WAVE_0_COMPLETE`\n> **Active Phase:** Wave 0');
    const wave1 = parseCheckpoint('> **Status:** `WAVE_1_COMPLETE`\n> **Active Phase:** Wave 1');

    assert.equal(resolveNextAction(wave0).action, 'AWAIT_OR_START_WAVE_1');
    assert.equal(resolveNextAction(wave1).action, 'AWAIT_WAVE_2_GO');
  });

  test('handles corrupted checkpoint gracefully', () => {
    const corrupted = 'random invalid text without headers';
    const parsed = parseCheckpoint(corrupted);
    assert.equal(parsed.isValid, false);
    assert.ok(parsed.errors.length > 0);

    const action = resolveNextAction(parsed);
    assert.equal(action.action, 'RECOVER_STATE');
  });
});
