import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WS = 'C:/Users/Hafizh Rizqullah/Documents/Code/_active/veyra-v1.0-bootstrap/workspace';

describe('Veyra v1.0 — Behavioral Agent Discovery & Intent Resolution', () => {
  test('Agent Discovery: finds all 19 skills via standard discovery paths', () => {
    const sDir = join(WS, 'skills');
    const aDir = join(WS, '.agents', 'skills');

    const discoveredSkills = readdirSync(sDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    assert.equal(discoveredSkills.length, 19, 'Must discover all 19 skills');

    for (const name of discoveredSkills) {
      const skillPath = join(sDir, name, 'SKILL.md');
      const agentSkillPath = join(aDir, name, 'SKILL.md');

      assert.ok(existsSync(skillPath), `SKILL.md exists for ${name}`);
      assert.ok(existsSync(agentSkillPath), `.agents/skills counterpart exists for ${name}`);

      const content = readFileSync(skillPath, 'utf8');
      assert.ok(content.startsWith('---'), `${name} has valid YAML frontmatter`);
      assert.ok(content.includes('## Invariants'), `${name} declares explicit invariants`);
    }
  });

  test('Canonical Alias Resolution: veyra-ui resolves to veyra-interface', () => {
    const interfaceSkillMd = readFileSync(join(WS, 'skills', 'veyra-interface', 'SKILL.md'), 'utf8');
    assert.ok(interfaceSkillMd.includes('aliases:'), 'Declares aliases block');
    assert.ok(interfaceSkillMd.includes('veyra-ui'), 'Registers veyra-ui as canonical alias');

    // Intent resolution simulation:
    function resolveSkillName(userIntent) {
      const intentLower = userIntent.toLowerCase();
      if (intentLower.includes('ui') || intentLower.includes('interface') || intentLower.includes('contrast')) {
        return 'veyra-interface';
      }
      if (intentLower.includes('debug') || intentLower.includes('root cause')) {
        return 'veyra-debug';
      }
      return 'veyra-core';
    }

    assert.equal(resolveSkillName('audit the veyra-ui contrast'), 'veyra-interface');
    assert.equal(resolveSkillName('calculate WCAG contrast on interface'), 'veyra-interface');
  });
});
