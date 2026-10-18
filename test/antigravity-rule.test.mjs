import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Antigravity modular core rule includes valid always-on activation', () => {
  const rule = fs.readFileSync(new URL('../rules/xyeena-core.md', import.meta.url), 'utf8');
  assert.match(rule, /^---\r?\ntrigger: always_on\r?\n/);
  assert.match(rule, /description:/);
});
