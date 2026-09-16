import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { runtimeTargets } from '../src/runtime.mjs';

test('Antigravity and Codex share project Agent Skills target without duplicate installs', () => {
  const targets = runtimeTargets('/repo', ['antigravity', 'codex', 'claude']);

  assert.equal(targets.length, 2);

  const sharedSkillTarget = path.join('/repo', '.agents', 'skills');
  const agents = targets.find((x) => x.target === sharedSkillTarget);

  assert.ok(agents);
  assert.deepEqual(agents.runtimes, ['antigravity', 'codex']);
});