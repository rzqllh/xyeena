import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SKILLS_DIR = join(ROOT, 'skills');
const AGENTS_DIR = join(ROOT, '.agents', 'skills');

describe('Veyra v1.0 — 19 Skills Parity Verification (skills/ vs .agents/skills/)', () => {
  test('all 19 skills have identical byte-for-byte counterpart in .agents/skills/', () => {
    const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    assert.equal(skills.length, 19, 'Must contain exactly 19 co-equal skills');

    for (const skill of skills) {
      const srcSkill = join(SKILLS_DIR, skill, 'SKILL.md');
      const agentSkill = join(AGENTS_DIR, skill, 'SKILL.md');

      assert.ok(existsSync(srcSkill), 'Source SKILL.md must exist: ' + srcSkill);
      assert.ok(existsSync(agentSkill), 'Agent counterpart SKILL.md must exist: ' + agentSkill);

      const content1 = readFileSync(srcSkill, 'utf8');
      const content2 = readFileSync(agentSkill, 'utf8');

      assert.equal(
        content1,
        content2,
        'Parity mismatch detected between ' + srcSkill + ' and ' + agentSkill
      );
    }
  });
});
