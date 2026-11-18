import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const matrix = JSON.parse(readFileSync(resolve(root, 'evals/v1-skill-matrix.json'), 'utf8'));
const expectedSkills = new Set([
  'xyeena-core', 'xyeena-context', 'xyeena-handoff',
  'xyeena-research', 'xyeena-grill', 'xyeena-plan', 'xyeena-architecture',
  'xyeena-execute', 'xyeena-debug', 'xyeena-prototype',
  'xyeena-test', 'xyeena-review', 'xyeena-verify', 'xyeena-security', 'xyeena-release',
  'xyeena-interface', 'xyeena-writing',
  'xyeena-skillcraft', 'xyeena-orchestrate'
]);

describe('v1 inventory foundation (structure only; not behavioral verification)', () => {
  it('preserves all 19 existing skill entrypoints', () => {
    const actualSkills = matrix.skills.map(entry => entry.id);
    assert.equal(actualSkills.length, 19);
    assert.equal(new Set(actualSkills).size, 19);
    assert.deepEqual(new Set(actualSkills), expectedSkills);
    for (const name of actualSkills) {
      assert.equal(existsSync(resolve(root, 'skills', name, 'SKILL.md')), true, name);
      assert.equal(existsSync(resolve(root, 'skills', name, 'capability.json')), true, name);
    }
  });

  it('retains baseline upstream coverage and adds Cindy and Orca', () => {
    const ids = new Set(matrix.upstreams.map(entry => entry.id));
    for (let i = 1; i <= 20; i += 1) {
      assert.equal(ids.has(`RE-${String(i).padStart(2, '0')}`), true, `RE-${i}`);
    }
    for (const id of ['RE-21..30', 'RE-31', 'RE-32', 'RE-33', 'RE-34']) {
      assert.equal(ids.has(id), true, id);
    }
    assert.equal(matrix.upstreams.find(entry => entry.id === 'RE-33')?.source, 'makecindy/cindy');
    assert.equal(matrix.upstreams.find(entry => entry.id === 'RE-34')?.source, 'Aniekanetim/orca-agent');
  });

  it('binds every skill to known references without claiming unverified parity', () => {
    const sourceIds = new Set(matrix.upstreams.map(entry => entry.id));
    const allowedGates = [
      'STRUCTURE_VALID', 'TRIGGER_VERIFIED', 'BEHAVIOR_VERIFIED', 'HOST_VERIFIED'
    ];
    for (const skill of matrix.skills) {
      assert.ok(skill.upstreamRefs.length > 0, skill.id);
      assert.equal(skill.status, 'V1_REBUILD_NOT_VERIFIED', skill.id);
      assert.deepEqual(skill.gates, allowedGates, skill.id);
      for (const ref of skill.upstreamRefs) assert.ok(sourceIds.has(ref), `${skill.id} -> ${ref}`);
    }
    for (const source of matrix.upstreams) {
      assert.equal(source.disposition, 'REFERENCE_ONLY_UNTIL_SOURCE_AND_BEHAVIOR_VERIFIED');
    }
  });
});
