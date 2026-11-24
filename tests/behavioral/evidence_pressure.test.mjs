import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {
  executeAndVerify, generateVerificationReceipt, validateCompletionClaims,
  readVerificationLedger, verifyFreshnessReceipt
} from '../../skills/veyra-verify/engine.mjs';
import { classifyClaim, checkAntiSlop, validateScope, isPathSafe } from '../../skills/veyra-core/engine.mjs';
import { validateExecutionScope } from '../../skills/veyra-execute/engine.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFY = join(ROOT, 'skills', 'veyra-verify', 'engine.mjs');
const sandbox = fn => {
  const root = mkdtempSync(join(tmpdir(), 'veyra-pressure-'));
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};
const runCli = (cwd, ...args) => spawnSync(process.execPath, [VERIFY, ...args], { cwd, encoding: 'utf8' });

test('P0: receipt survives different Node process and gate checks persisted journal', () => sandbox(root => {
  const run = runCli(root, 'run', '--task', 'smoke', '--', process.execPath, '-e', 'console.log("SMOKE_OK")');
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout.trim());
  assert.equal(receipt.evidenceTier, 'LOCAL_PROCESS_VERIFIED');
  const gate = runCli(root, 'gate', '--task', 'smoke');
  assert.equal(gate.status, 0, gate.stdout + gate.stderr);
  assert.equal(JSON.parse(gate.stdout).verified, true);
  const journal = readVerificationLedger({ cwd: root });
  assert.equal(journal.valid, true);
  assert.equal(journal.receipts.length, 1);
  assert.notEqual(journal.receipts[0].executionProof.outputHash, '');
  assert.equal(journal.receipts[0].outputSummary, undefined, 'terminal output is not persisted');
}));

test('P0: ledger tampering and caller-faked receipt fail closed', () => sandbox(root => {
  const run = runCli(root, 'run', '--task', 'smoke', '--', process.execPath, '-e', 'process.exit(0)');
  assert.equal(run.status, 0, run.stderr);
  const path = join(root, '.veyra', 'receipts.jsonl');
  const stored = JSON.parse(readFileSync(path, 'utf8').trim());
  assert.equal(validateCompletionClaims([{ ...stored, receiptId: 'fake' }], ['smoke'], { cwd: root }).verified, false);
  stored.exitCode = 42;
  writeFileSync(path, JSON.stringify(stored) + '\n', 'utf8');
  const gate = runCli(root, 'gate', '--task', 'smoke');
  assert.notEqual(gate.status, 0);
  assert.equal(readVerificationLedger({ cwd: root }).valid, false);
}));

test('P0: failures, missing receipts and future/stale timestamps cannot pass', () => sandbox(root => {
  assert.equal(runCli(root, 'gate', '--task', 'missing').status, 1);
  const failure = runCli(root, 'run', '--task', 'failure', '--', process.execPath, '-e', 'process.exit(4)');
  assert.notEqual(failure.status, 0);
  assert.equal(runCli(root, 'gate', '--task', 'failure').status, 1);
  assert.equal(verifyFreshnessReceipt({ timestamp: new Date(Date.now() - 301000).toISOString() }).fresh, false);
  assert.equal(verifyFreshnessReceipt({ timestamp: new Date(Date.now() + 100000).toISOString() }).fresh, false);
  assert.equal(validateCompletionClaims([], [], { cwd: root, fromLedger: true }).verified, false);
}));

test('P0: claim classifier cannot promote untrusted strings or unrelated receipt', () => sandbox(root => {
  assert.equal(classifyClaim('tests pass', ['trust me']).category, 'UNKNOWN');
  assert.equal(classifyClaim('tests pass', { verified: true }).category, 'UNKNOWN');
  const receipt = executeAndVerify('node-ver', [process.execPath, '-v'], { cwd: root, keyDir: join(root, 'private-keys') });
  assert.equal(classifyClaim('tests pass', receipt, { cwd: root, keyDir: join(root, 'private-keys') }).category, 'UNKNOWN');
  const asserted = classifyClaim('COMMAND_EXIT_ZERO:node-ver', receipt, { cwd: root, keyDir: join(root, 'private-keys') });
  assert.equal(asserted.category, 'OBSERVED');
  assert.equal(asserted.evidence.scope, 'COMMAND_EXIT_ZERO_ONLY');
  assert.equal(classifyClaim('COMMAND_EXIT_ZERO:node-ver', generateVerificationReceipt('node-ver', 'node -v', 0, 'OK'), { cwd: root }).category, 'UNKNOWN');
}));

test('P1: scoped matching covers glob suffix, nested paths and encoded traversal', () => {
  assert.equal(validateScope({ targetFiles: ['home.js'], allowedPatterns: ['*.js'] }).allowed, true);
  assert.equal(validateScope({ targetFiles: ['src/nested/file.js'], allowedPatterns: ['src/**'] }).allowed, true);
  for (const file of ['src/%2e%2e/config.env','src/%252e%252e/config.env','../private','C:\\Windows\\secret','src//file.js']) {
    assert.equal(isPathSafe(file), false, 'unsafe path accepted: ' + file);
  }
  assert.equal(validateExecutionScope(['src/**'], ['src/a.mjs', 'src/nested/b.mjs']).valid, true);
  assert.equal(validateExecutionScope(['src/**'], ['src/../secret']).valid, false);
});

test('P1: prose hygiene avoids ordinary adjectives and valid numeric ranges', () => {
  const ordinary = checkAntiSlop('A robust change is crucial for 1–5 clients with vital connectivity.');
  assert.equal(ordinary.pass, true);
  assert.equal(checkAntiSlop('A cutting-edge tapestry is a testament to our work.').pass, false);
});

test('P1: installed skill discovery metadata and pressure cases are inspectable', () => {
  const all = readdirSync(join(ROOT, 'skills'), { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name);
  assert.equal(all.length, 19);
  for (const skill of all) {
    const body = readFileSync(join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(body, /^description: Use when /m, skill + ' must declare discovery triggers');
  }
  for (const skill of ['veyra-verify', 'veyra-execute', 'veyra-grill']) {
    const body = readFileSync(join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(body, /## Red flags/);
    assert.match(body, /## Pressure tests/);
  }
});
