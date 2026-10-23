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
  const canonicalCwd = fs.realpathSync(cwd);
  const validPath = path.join(cwd, 'src', 'index.js');
  assert.equal(assertWorkspaceBoundary(validPath, cwd), path.join(canonicalCwd, 'src', 'index.js'));
  assert.equal(assertWorkspaceBoundary('src/index.js', cwd), path.join(canonicalCwd, 'src', 'index.js'));

  // Non-existent nested target path inside workspace resolves correctly
  const nonExistentNested = path.join(cwd, 'deep', 'nested', 'target.js');
  assert.equal(assertWorkspaceBoundary(nonExistentNested, cwd), path.join(canonicalCwd, 'deep', 'nested', 'target.js'));

  // Traversal outside cwd
  assert.throws(() => assertWorkspaceBoundary('../outside.txt', cwd), /boundary violation/);
  assert.throws(() => assertWorkspaceBoundary(path.join(os.tmpdir(), 'other.txt'), cwd), /boundary violation/);

  // Null byte injection rejected
  assert.throws(() => assertWorkspaceBoundary('src/\0evil.js', cwd), /boundary violation/);
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

test('pre-tool gate blocks unauthorized destructive actions with DENY (fails closed)', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const decision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'rm -rf /tmp/test' },
    actionType: 'destructive'
  });

  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'permission-boundary');
  assert.equal(decision.blocked, true);
  assert.ok(decision.reason.includes('ALLOW_ONCE'));
});

test('pre-tool gate enforces single-use consumable authorization (ALLOW_ONCE, no reuse)', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const actionArgs = { path: path.join(cwd, 'temp.txt') };
  const actionSig = `destructive:delete_file:${JSON.stringify(actionArgs)}`;

  // Missing approval fails closed
  const deniedFirst = gate.preToolGate({
    toolName: 'delete_file',
    args: actionArgs,
    actionType: 'destructive'
  });
  assert.equal(deniedFirst.decision, 'DENY');
  assert.equal(deniedFirst.blocked, true);

  // Grant single-use consumable token
  gate.grantAllowOnce(actionSig);

  // Approved action executes once
  const allowed = gate.preToolGate({
    toolName: 'delete_file',
    args: actionArgs,
    actionType: 'destructive'
  });
  assert.equal(allowed.decision, 'ALLOW_ONCE');
  assert.equal(allowed.blocked, false);

  // Approval cannot be reused -> fails closed on second attempt
  const deniedSecond = gate.preToolGate({
    toolName: 'delete_file',
    args: actionArgs,
    actionType: 'destructive'
  });
  assert.equal(deniedSecond.decision, 'DENY');
  assert.equal(deniedSecond.blocked, true);
});

test('pre-tool gate requires separate authorization for different arguments', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const authorizedArgs = { CommandLine: 'git clean -fd' };
  const differentArgs = { CommandLine: 'git reset --hard' };

  // Grant token only for git clean
  gate.grantAllowOnce({ toolName: 'run_command', args: authorizedArgs, actionType: 'destructive' });

  // Different arguments fail closed
  const denied = gate.preToolGate({
    toolName: 'run_command',
    args: differentArgs,
    actionType: 'destructive'
  });
  assert.equal(denied.decision, 'DENY');
  assert.equal(denied.blocked, true);

  // Authorized arguments succeed once
  const allowed = gate.preToolGate({
    toolName: 'run_command',
    args: authorizedArgs,
    actionType: 'destructive'
  });
  assert.equal(allowed.decision, 'ALLOW_ONCE');
  assert.equal(allowed.blocked, false);
});

test('pre-tool gate rejects destructive action outside workspace boundary even if token was granted', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const outsideArgs = { path: path.join(os.tmpdir(), 'outside-secret.txt') };
  gate.grantAllowOnce({ toolName: 'delete_file', args: outsideArgs, actionType: 'destructive' });

  const decision = gate.preToolGate({
    toolName: 'delete_file',
    args: outsideArgs,
    actionType: 'destructive'
  });

  // Scope control takes precedence over permission token
  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'scope-control');
  assert.equal(decision.blocked, true);
});

test('pre-tool gate interactive mode yields ANSWER_QUESTION', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, permissions: { interactive: true } });

  const decision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'git clean -fd' },
    actionType: 'destructive'
  });
  assert.equal(decision.decision, 'ANSWER_QUESTION');
  assert.equal(decision.blocked, true);
  assert.ok(decision.prompt);
});

test('pre-tool gate blocks unauthorized external operations (push, publish)', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const decision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'git push origin main' },
    actionType: 'external'
  });

  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'permission-boundary');
  assert.equal(decision.blocked, true);

  // Authorize single-use external action
  const actionArgs = { CommandLine: 'git push origin main' };
  gate.grantAllowOnce({ toolName: 'run_command', args: actionArgs, actionType: 'external' });

  const allowed = gate.preToolGate({
    toolName: 'run_command',
    args: actionArgs,
    actionType: 'external'
  });
  assert.equal(allowed.decision, 'ALLOW_ONCE');
  assert.equal(allowed.blocked, false);

  // Cannot reuse
  const deniedAgain = gate.preToolGate({
    toolName: 'run_command',
    args: actionArgs,
    actionType: 'external'
  });
  assert.equal(deniedAgain.decision, 'DENY');
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

test('adversarial: delegated child worker cannot self-issue ALLOW_ONCE tokens', t => {
  const cwd = temp(t);
  const parentGate = createHarnessExecutionGate({ cwd });
  const childGate = parentGate.delegateWorker('untrusted-child-worker');

  assert.throws(
    () => childGate.grantAllowOnce({ toolName: 'delete_file', actionType: 'destructive' }),
    { code: 'ERR_UNAUTHORIZED_ALLOW_ONCE' }
  );
});

test('adversarial: untrusted approver (agent/model/worker) cannot self-issue privileged authorization', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  // Approver specified as agent or model must fail closed
  assert.throws(
    () => gate.grantAllowOnce({ toolName: 'delete_file', actionType: 'destructive' }, { approver: 'agent' }),
    { code: 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE' }
  );
  assert.throws(
    () => gate.grantAllowOnce({ toolName: 'delete_file', actionType: 'destructive' }, { approver: 'model' }),
    { code: 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE' }
  );
});

test('adversarial: host runtime without verified live tool interception fails closed on privileged operations', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'unsupported-headless-runtime' });

  const destructiveDecision = gate.preToolGate({
    toolName: 'delete_file',
    args: { path: path.join(cwd, 'test.txt') },
    actionType: 'destructive'
  });
  assert.equal(destructiveDecision.decision, 'DENY');
  assert.equal(destructiveDecision.rule, 'runtime-enforcement');
  assert.equal(destructiveDecision.blocked, true);

  const externalDecision = gate.preToolGate({
    toolName: 'git_push',
    args: { CommandLine: 'git push origin main' },
    actionType: 'external'
  });
  assert.equal(externalDecision.decision, 'DENY');
  assert.equal(externalDecision.rule, 'runtime-enforcement');
  assert.equal(externalDecision.blocked, true);
});

