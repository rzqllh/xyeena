import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressContext } from '../../skills/veyra-context/engine.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const candidateXyeenaPaths = [
  resolve(ROOT, '../../xyeena/AGENTS.md'),
  'C:/Users/Hafizh Rizqullah/Documents/Code/_active/xyeena/AGENTS.md',
  join(ROOT, 'docs', 'PLANNING_BASELINE.md')
];
const xyeenaPath = candidateXyeenaPaths.find(p => existsSync(p)) || join(ROOT, 'docs', 'PLANNING_BASELINE.md');

describe('Veyra Wave 1 — Real Notes Recall Evaluation (3 Notes)', () => {
  const notes = [
    { name: 'Note 1: docs/DEVELOPER_BRIEF.md', path: join(ROOT, 'docs', 'DEVELOPER_BRIEF.md') },
    { name: 'Note 2: docs/OWNER_DECISIONS.md', path: join(ROOT, 'docs', 'OWNER_DECISIONS.md') },
    { name: 'Note 3: xyeena/AGENTS.md (Read-Only Legacy)', path: xyeenaPath }
  ];

  const GREP_PATTERNS = [
    /\bDEC-\d{2}\b/g,
    /(?:[a-zA-Z0-9_.-]+(?:[\\/][a-zA-Z0-9_.-]+)+\.[a-zA-Z0-9]+)/g,
    /\b[a-f0-9]{40,64}\b/gi,
    /\b\d+(?:\.\d+)?%/g
  ];

  for (const n of notes) {
    test('Fact recall on ' + n.name, () => {
      const content = readFileSync(n.path, 'utf8');
      const indepFacts = new Set();
      for (const pat of GREP_PATTERNS) {
        const matches = content.match(pat) || [];
        for (const item of matches) indepFacts.add(item);
      }

      assert.ok(indepFacts.size > 0, 'Note must contain extracted facts: ' + n.name);

      const res = compressContext(content);
      const retained = new Set();
      for (const f of indepFacts) {
        if (res.compressedText.includes(f)) retained.add(f);
      }

      const recall = retained.size / indepFacts.size;
      assert.equal(retained.size, indepFacts.size, 'Must retain all facts: ' + retained.size + '/' + indepFacts.size);
      assert.equal(recall, 1.0, 'Recall must be 1.0 (exact: ' + retained.size + '/' + indepFacts.size + ')');
    });
  }
});
