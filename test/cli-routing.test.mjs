import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = new URL('../bin/xyeena.mjs', import.meta.url).pathname;
const command = (args, cwd) => spawnSync(process.execPath, [path.resolve(cli), ...args], {
  cwd, encoding: 'utf8', timeout: 10000, windowsHide: true
});
function workspace(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-cli-routing-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const root = path.join(cwd, '.agents', 'skills', 'systematic-debugging');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: systematic-debugging\ndescription: Debug regressions and errors\n---\n# Debug\n');
  return cwd;
}

test('skills discover returns local metadata without editing workspace', t => {
  const cwd = workspace(t);
  const before = fs.readdirSync(cwd).join(',');
  const result = command(['skills', 'discover', '--runtime', 'antigravity', '--local-only'], cwd);
  assert.equal(result.status, 0, result.stderr);
  const names = JSON.parse(result.stdout).map(skill => skill.name);
  assert.deepEqual(names, ['systematic-debugging']);
  assert.equal(fs.readdirSync(cwd).join(','), before);
});
test('route produces read-only preview and does not claim execution', t => {
  const cwd = workspace(t);
  const result = command(['route', '--runtime', 'antigravity', '--local-only',
    '--prompt', 'systematic debugging for a regression', '--state', 'DEBUG'], cwd);
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.primary.name, 'systematic-debugging');
  assert.equal(plan.executed, false);
  assert.equal(plan.mode, 'preview-only');
});
test('original resolve command is still supported', t => {
  const cwd = workspace(t);
  const result = command(['resolve', '--prompt', 'redesign dashboard'], cwd);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).kernel === 'xyeena-core');
});
