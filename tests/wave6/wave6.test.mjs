import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateSkillStructure } from '../../skills/veyra-skillcraft/engine.mjs';
import { detectHostEnvironment, resolveExecutionStrategy } from '../../skills/veyra-orchestrate/engine.mjs';

describe('Veyra Wave 6 — Meta-Orchestration & Cross-Host Skills', () => {
  test('veyra-skillcraft: YAML frontmatter and structure validation', () => {
    const validSkill = '---\nname: veyra-demo\ndescription: Demo skill\n---\n# Demo\n## Invariants\n1. Invariant\n';
    const validation = validateSkillStructure(validSkill);
    assert.equal(validation.valid, true);
    assert.equal(validation.hasInvariants, true);

    const invalidSkill = '# No Frontmatter\n';
    assert.equal(validateSkillStructure(invalidSkill).valid, false);
  });

  test('veyra-orchestrate: host environment detection and sequential fallback (DEC-23)', () => {
    const host = detectHostEnvironment({ GEMINI_CLI: '1' });
    assert.equal(host, 'GEMINI_ANTIGRAVITY');

    const parallelStrat = resolveExecutionStrategy(true);
    assert.equal(parallelStrat.strategy, 'NATIVE_PARALLEL_COLLABORATION');
    assert.equal(parallelStrat.sequentialFallback, false);

    // DEC-23: Transparent sequential fallback without fake subagents
    const sequentialStrat = resolveExecutionStrategy(false);
    assert.equal(sequentialStrat.strategy, 'TRANSPARENT_SEQUENTIAL_FALLBACK');
    assert.equal(sequentialStrat.sequentialFallback, true);
    assert.ok(sequentialStrat.warning.includes('NATIVE_SUBAGENTS_UNAVAILABLE'));
  });
});
