import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry } from '../src/registry.mjs';
import { resolveCapabilities } from '../src/resolver.mjs';
import { validateSkillStructure, evaluateV1Structure } from '../src/eval-v1.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

describe('v1 bounded evaluation protocol', () => {
  it('validates 19 entrypoints structurally without falsely promoting behavior/host', () => {
    const report = evaluateV1Structure();
    assert.equal(report.status, 'STRUCTURE_ONLY_PASS');
    assert.equal(report.checked, 19);
    assert.equal(report.structurePassed, 19);
    assert.equal(report.behaviorVerified, 0);
    assert.equal(report.hostVerified, 0);
    for (const entry of report.results) {
      assert.equal(entry.gates.STRUCTURE_VALID, 'PASS');
      assert.equal(entry.gates.TRIGGER_VERIFIED, 'NOT_RUN');
      assert.equal(entry.gates.HOST_VERIFIED, 'NOT_RUN');
    }
  });

  it('rejects absent and linked references instead of returning structure PASS', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'xyeena-v1-gates-'));
    try {
      const dir = join(tmp, 'skills', 'xyeena-test', 'references');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(tmp, 'skills', 'xyeena-test', 'SKILL.md'),
        '---\nname: xyeena-test\ndescription: Test\n---\n[broken](references/missing.md)');
      writeFileSync(join(tmp, 'skills', 'xyeena-test', 'capability.json'),
        JSON.stringify({ metadata: { name: 'xyeena-test' } }));
      const result = validateSkillStructure(tmp, 'xyeena-test');
      assert.equal(result.verdict, 'FAIL');
      assert.ok(result.errors.some(x => x.includes('procedure')));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('exercises positive/negative deterministic router fixtures without claiming model activation', () => {
    const fixture = JSON.parse(readFileSync(join(root, 'evals/v1-trigger-cases.json'), 'utf8'));
    const registry = loadRegistry();
    assert.equal(fixture.length, 19);
    for (const example of fixture) {
      const yes = resolveCapabilities(registry, { prompt: example.positive.prompt, state: example.positive.state });
      const no = resolveCapabilities(registry, { prompt: example.negative.prompt, state: example.negative.state });
      if (example.scope === 'kernel') {
        assert.equal(yes.kernel, example.skillId);
        assert.equal(no.kernel, example.skillId);
      } else {
        assert.ok(yes.candidates.some(x => x.name === example.skillId),
          `Expected router candidate ${example.skillId} for ${example.positive.prompt}`);
        assert.ok(!no.candidates.some(x => x.name === example.skillId),
          `Unexpected router candidate ${example.skillId} for ${example.negative.prompt}`);
      }
    }
  });
});
