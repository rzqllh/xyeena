import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/xyeena.mjs', import.meta.url));
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], {
  cwd, encoding: 'utf8', timeout: 10000, windowsHide: true
});
const fixture = t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-sdk-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test('sdk preview makes no model call and needs no Python installation', t => {
  const cwd = fixture(t);
  const response = run(['sdk', 'preview', '--goal', 'Inspect regressions', '--local-only'], cwd);
  assert.equal(response.status, 0, response.stderr);
  const value = JSON.parse(response.stdout);
  assert.equal(value.executed, false);
  assert.equal(value.mode, 'read-only');
  assert.equal(value.requiresExplicitExecution, true);
  assert.equal(fs.existsSync(path.join(cwd, '.xyeena')), false);
});
test('sdk run without --yes fails before launching Python', t => {
  const cwd = fixture(t);
  const response = run(['sdk', 'run', '--goal', 'Inspect regressions',
    '--local-only', '--python', 'deliberately-not-installed-python'], cwd);
  assert.notEqual(response.status, 0);
  assert.match(response.stderr, /SDK run makes a real model call/);
});
test('sdk refuses unknown commands or missing goal', t => {
  const cwd = fixture(t);
  assert.notEqual(run(['sdk', 'launch', '--goal', 'abc'], cwd).status, 0);
  assert.notEqual(run(['sdk', 'preview'], cwd).status, 0);
});
