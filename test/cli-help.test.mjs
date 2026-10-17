import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = path.resolve('bin/xyeena.mjs');
const run = (args) => spawnSync(process.execPath, [cli, ...args], {
  encoding: 'utf8',
  timeout: 10000,
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

const subcommands = ['init', 'doctor', 'harness', 'audit'];
const flags = ['--help', '-h'];

for (const cmd of subcommands) {
  for (const flag of flags) {
    test(`subcommand ${cmd} with ${flag} prints usage with exit code 0 non-TTY`, () => {
      const res = run([cmd, flag]);
      assert.equal(res.status, 0, `Command ${cmd} ${flag} failed with stderr: ${res.stderr}`);
      assert.ok(res.stdout.includes('Usage:'), `Expected Usage: in stdout for ${cmd} ${flag}`);
      assert.ok(res.stdout.includes('Xyeena Rig'), `Expected Xyeena Rig in stdout for ${cmd} ${flag}`);
      assert.ok(res.stdout.includes('changed|adapters'), `Expected changed|adapters in stdout for ${cmd} ${flag}`);
      assert.ok(res.stdout.includes('--evidence'), `Expected --evidence in stdout for ${cmd} ${flag}`);
      assert.equal(res.stderr, '', `Expected empty stderr for ${cmd} ${flag}`);
    });
  }
}
