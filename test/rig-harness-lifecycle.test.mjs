import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  inspectRigHarness,
  enforceRigPreflight,
  assertWorkspaceBoundary,
  createHarnessExecutionGate,
  HarnessExecutionGate
} from '../src/rig-harness-lifecycle.mjs';
import { applyCompactSetup } from '../src/compact-setup.mjs';
import { previewOrchestration } from '../src/orchestrator.mjs';
import { setupHealthCheck } from '../src/setup-health.mjs';

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('core Harness is available for every Rig preview without project opt-in', t => {
  const cwd = temp(t);
  const inspection = inspectRigHarness({ cwd, contextualRequested: ['testing', 'security'] });
  assert.equal(inspection.core.status, 'rig-read-only-boundary');
  assert.ok(inspection.core.rules.includes('permission-boundary'));
  assert.deepEqual(inspection.contextual.requested, ['50-quality', '60-security']);
  assert.deepEqual(inspection.contextual.installed, []);
  assert.equal(fs.readdirSync(cwd).length, 0);
});

test('contextual Harness detects only physically installed project guides', t => {
  const cwd = temp(t);
  const dir = path.join(cwd, '.xyeena', 'harness', 'guides', '50-quality');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), '# testing');
  const result = inspectRigHarness({ cwd, contextualRequested: ['testing', 'security'] });
  assert.deepEqual(result.contextual.installed, ['50-quality']);
  assert.deepEqual(result.contextual.missing, ['60-security']);
  assert.equal(result.contextual.enforcement, 'active-contextual-enforcement');
});

test('read-only execution gate requires actual selected governor and explicit consent', t => {
  const cwd = temp(t);
  applyCompactSetup({ cwd, runtime: 'codex', preset: 'essential', yes: true });
  const plan = previewOrchestration({ cwd, runtime: 'codex', goal: 'Review tests', includeGlobal: false });
  assert.equal(plan.harness.core.status, 'rig-read-only-boundary');
  assert.equal(setupHealthCheck({ cwd, runtime: 'codex', includeGlobal: false }).filesystem.orchestratorName, 'xyeena-rig');
  assert.throws(() => enforceRigPreflight(plan), /consent/);
  const gate = enforceRigPreflight(plan, { consent: true });
  assert.equal(gate.status, 'PASS');
  assert.equal(gate.externalActionsAuthorized, false);
  assert.throws(() => enforceRigPreflight({ ...plan, entrypoint: '/missing' }, { consent: true }), /governor/);
});

test('workspace boundary enforcement allows paths within root and blocks external escapes', t => {
  const cwd = temp(t);
  const validPath = path.join(cwd, 'src', 'index.js');
  assert.equal(assertWorkspaceBoundary(validPath, cwd), path.resolve(validPath));
  assert.equal(assertWorkspaceBoundary('src/index.js', cwd), path.resolve(cwd, 'src/index.js'));

  // Traversal outside cwd
  assert.throws(() => assertWorkspaceBoundary('../outside.txt', cwd), /boundary violation/);
  assert.throws(() => assertWorkspaceBoundary(path.join(os.tmpdir(), 'other.txt'), cwd), /boundary violation/);
});

test('workspace boundary blocks escaping symlinks', t => {
  const cwd = temp(t);
  const outsideDir = temp(t);
  const targetFile = path.join(outsideDir, 'secret.txt');
  fs.writeFileSync(targetFile, 'secret content');

  const linkPath = path.join(cwd, 'escaping-link.txt');
  try {
    fs.symlinkSync(targetFile, linkPath);
  } catch (err) {
    if (process.platform === 'win32' && err.code === 'EPERM') return; // Windows unprivileged symlink
    throw err;
  }

  assert.throws(() => assertWorkspaceBoundary(linkPath, cwd), /boundary violation/);
});

test('pre-tool gate blocks unauthorized destructive actions with DENY', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, permissions: { destructive: false } });

  const decision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'rm -rf /tmp/test' },
    actionType: 'destructive'
  });

  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'permission-boundary');
  assert.equal(decision.blocked, true);
});

test('pre-tool gate allows destructive action when explicit permission is granted', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, permissions: { destructive: true } });

  const decision = gate.preToolGate({
    toolName: 'delete_file',
    args: { path: path.join(cwd, 'temp.txt') },
    actionType: 'destructive'
  });

  assert.equal(decision.decision, 'ALLOW');
  assert.equal(decision.blocked, false);
});

test('pre-tool gate supports explicit ALLOW_ONCE token and ANSWER_QUESTION semantics', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, permissions: { destructive: false, interactive: false } });

  const actionArgs = { CommandLine: 'git clean -fd' };
  const actionSig = `destructive:run_command:${JSON.stringify(actionArgs)}`;

  // First check without token -> DENY
  const denDecision = gate.preToolGate({ toolName: 'run_command', args: actionArgs, actionType: 'destructive' });
  assert.equal(denDecision.decision, 'DENY');

  // Grant one-time token
  gate.grantAllowOnce(actionSig);
  const allowOnceDecision = gate.preToolGate({ toolName: 'run_command', args: actionArgs, actionType: 'destructive' });
  assert.equal(allowOnceDecision.decision, 'ALLOW_ONCE');
  assert.equal(allowOnceDecision.blocked, false);

  // Subsequent check should fail again because token was consumed
  const nextDecision = gate.preToolGate({ toolName: 'run_command', args: actionArgs, actionType: 'destructive' });
  assert.equal(nextDecision.decision, 'DENY');

  // Interactive mode yields ANSWER_QUESTION
  const interactiveGate = createHarnessExecutionGate({ cwd, permissions: { interactive: true } });
  const questionDecision = interactiveGate.preToolGate({ toolName: 'run_command', args: actionArgs, actionType: 'destructive' });
  assert.equal(questionDecision.decision, 'ANSWER_QUESTION');
  assert.ok(questionDecision.prompt);
});

test('pre-tool gate blocks unauthorized external operations (push, publish)', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, permissions: { external: false } });

  const decision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'git push origin main' },
    actionType: 'external'
  });

  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'permission-boundary');
});

test('anti-loop gate triggers after consecutive failures on identical tool calls', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });
  const toolArgs = { CommandLine: 'broken-command' };

  // Fail 3 times
  for (let i = 0; i < 3; i++) {
    gate.preToolGate({ toolName: 'run_command', args: toolArgs });
    gate.postToolGate({ toolName: 'run_command', args: toolArgs, error: 'Command failed with exit code 1' });
  }

  // 4th invocation is blocked by anti-loop gate
  const blockedDecision = gate.preToolGate({ toolName: 'run_command', args: toolArgs });
  assert.equal(blockedDecision.decision, 'DENY');
  assert.equal(blockedDecision.rule, 'anti-loop');
  assert.ok(blockedDecision.reason.includes('failed 3 times'));
});

test('post-tool gate rejects self-certified completion without independent evidence', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  // Self-certified claim without evidenceRefs
  const unverifiedPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS' }
  });
  assert.equal(unverifiedPost.verified, false);
  assert.ok(unverifiedPost.warning.includes('Self-certified'));

  // Verified claim with evidenceRefs
  const verifiedPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['test-run-123.log'] }
  });
  assert.equal(verifiedPost.verified, true);
  assert.equal(verifiedPost.warning, null);
});

test('worker delegation propagates policy strictly without permission escalation', t => {
  const cwd = temp(t);
  const parentAudit = [];
  const parentGate = createHarnessExecutionGate({
    cwd,
    permissions: { destructive: false, external: false },
    workerId: 'parent-orchestrator',
    auditLog: parentAudit
  });

  // Attempt to delegate with escalated destructive permission -> must be capped by parent
  const childGate = parentGate.delegateWorker('child-subagent', {
    delegatedPermissions: { destructive: true, external: true }
  });

  assert.equal(childGate.permissions.destructive, false);
  assert.equal(childGate.permissions.external, false);
  assert.equal(childGate.inheritedFrom, 'parent-orchestrator');

  // Verify child actions are audited under childWorkerId and recorded in parent auditLog
  childGate.preToolGate({
    toolName: 'delete_file',
    args: { path: path.join(cwd, 'test.txt') },
    actionType: 'destructive'
  });

  assert.ok(parentAudit.length > 0);
  const childEntry = parentAudit[parentAudit.length - 1];
  assert.equal(childEntry.workerId, 'child-subagent');
  assert.equal(childEntry.decision, 'DENY');
});
