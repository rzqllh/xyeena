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
  HarnessExecutionGate,
  HostApprovalAuthority,
  createHostApprovalAuthority,
  IndependentEvidenceVerifier
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
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });

  const actionArgs = { path: path.join(cwd, 'temp.txt') };

  // Missing approval fails closed
  const deniedFirst = gate.preToolGate({
    toolName: 'delete_file',
    args: actionArgs,
    actionType: 'destructive'
  });
  assert.equal(deniedFirst.decision, 'DENY');
  assert.equal(deniedFirst.blocked, true);

  // Grant single-use consumable token using unforgeable host authority proof
  const proof = hostAuthority.issueApproval({ toolName: 'delete_file', args: actionArgs, actionType: 'destructive' });
  gate.grantAllowOnce(proof);

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
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });

  const authorizedArgs = { CommandLine: 'git clean -fd' };
  const differentArgs = { CommandLine: 'git reset --hard' };

  // Grant token only for git clean
  const proof = hostAuthority.issueApproval({ toolName: 'run_command', args: authorizedArgs, actionType: 'destructive' });
  gate.grantAllowOnce(proof);

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
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });

  const outsideArgs = { path: path.join(os.tmpdir(), 'outside-secret.txt') };
  const proof = hostAuthority.issueApproval({ toolName: 'delete_file', args: outsideArgs, actionType: 'destructive' });
  gate.grantAllowOnce(proof);

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
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });

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
  const proof = hostAuthority.issueApproval({ toolName: 'run_command', args: actionArgs, actionType: 'external' });
  gate.grantAllowOnce(proof);

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

  // Verified claim with physical evidenceRefs existing and non-empty
  const logPath = path.join(cwd, 'test-run-123.log');
  fs.writeFileSync(logPath, '12/12 passing');
  const verifiedPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['test-run-123.log'] }
  });
  assert.equal(verifiedPost.verified, true);
  assert.equal(verifiedPost.warning, null);

  // Non-existent evidence file fails independent verification
  const missingPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['non-existent.log'] }
  });
  assert.equal(missingPost.verified, false);
  assert.ok(missingPost.warning.includes('does not exist'));

  // Empty evidence file (0 bytes) fails independent verification
  const emptyPath = path.join(cwd, 'empty.log');
  fs.writeFileSync(emptyPath, '');
  const emptyPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['empty.log'] }
  });
  assert.equal(emptyPost.verified, false);
  assert.ok(emptyPost.warning.includes('empty'));
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
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });

  // Raw string, unsigned object, or self-issued proof must fail closed
  assert.throws(
    () => gate.grantAllowOnce({ toolName: 'delete_file', actionType: 'destructive' }, { approver: 'agent' }),
    { code: 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE' }
  );
  assert.throws(
    () => gate.grantAllowOnce({ toolName: 'delete_file', actionType: 'destructive', signature: 'bad-hmac' }),
    { code: 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE' }
  );
  assert.throws(
    () => gate.grantAllowOnce('destructive:rm_file:{}'),
    { code: 'ERR_MISSING_AUTHORIZATION_CREDENTIALS' }
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

test('regression P03: constructor injection of unverified approval tokens is rejected', t => {
  const cwd = temp(t);
  // Attempting to bypass authorization by constructor injection
  const gate = new HarnessExecutionGate({
    cwd,
    allowOnceTokens: [
      'destructive:delete_file:{}',
      { toolName: 'delete_file', actionType: 'destructive', approver: 'host-user' }
    ]
  });

  // Action must still be denied because injected tokens lacked cryptographic host verification
  const decision = gate.preToolGate({ toolName: 'delete_file', actionType: 'destructive' });
  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.blocked, true);
});

test('regression P03: anti-loop gate blocks repeated failures before checking ALLOW_ONCE token', t => {
  const cwd = temp(t);
  const hostAuthority = new HostApprovalAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority });
  const toolArgs = { path: path.join(cwd, 'broken-target.txt') };

  // Grant an ALLOW_ONCE token with valid host authority
  const proof = hostAuthority.issueApproval({ toolName: 'delete_file', args: toolArgs, actionType: 'destructive' });
  gate.grantAllowOnce(proof);

  // Simulate 3 prior consecutive errors
  for (let i = 0; i < 3; i++) {
    gate.postToolGate({ toolName: 'delete_file', args: toolArgs, error: 'I/O failure' });
  }

  // Pre-tool gate must block with anti-loop DENY, NOT consume or approve via ALLOW_ONCE
  const decision = gate.preToolGate({ toolName: 'delete_file', args: toolArgs, actionType: 'destructive' });
  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.rule, 'anti-loop');
  assert.equal(decision.blocked, true);
});

test('regression P03: worker delegation preserves requested and installed contextual Harness guides', t => {
  const cwd = temp(t);
  const guideDir = path.join(cwd, '.xyeena', 'harness', 'guides', '50-quality');
  fs.mkdirSync(guideDir, { recursive: true });
  fs.writeFileSync(path.join(guideDir, 'README.md'), '# quality guide');

  const parentGate = createHarnessExecutionGate({
    cwd,
    contextualRequested: ['testing', 'security']
  });

  assert.deepEqual(parentGate.contextual.contextual.requested, ['50-quality', '60-security']);
  assert.deepEqual(parentGate.contextual.contextual.installed, ['50-quality']);

  // Delegate child worker: must preserve requested and installed groups
  const childGate = parentGate.delegateWorker('child-qa-worker');
  assert.deepEqual(childGate.contextual.contextual.requested, ['50-quality', '60-security']);
  assert.deepEqual(childGate.contextual.contextual.installed, ['50-quality']);
  assert.equal(childGate.contextual.contextual.enforcement, 'active-contextual-enforcement');
});

test('regression P03: shell command execution with filesystem escape or uncontained runtime fails closed', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  // 1. CommandLine trying directory escape (cd ..) is blocked
  const escapeDecision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'cd .. && ls' }
  });
  assert.equal(escapeDecision.decision, 'DENY');
  assert.equal(escapeDecision.rule, 'scope-control');
  assert.equal(escapeDecision.blocked, true);

  // 2. Explicit Cwd escaping workspace root is blocked
  const outsideCwdDecision = gate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'npm test', Cwd: path.join(os.tmpdir(), 'other-dir') }
  });
  assert.equal(outsideCwdDecision.decision, 'DENY');
  assert.equal(outsideCwdDecision.rule, 'scope-control');
  assert.equal(outsideCwdDecision.blocked, true);

  // 3. Shell execution on unsupported host runtime fails closed
  const headlessGate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'unsupported-headless' });
  const unsupportedDecision = headlessGate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'echo hello' }
  });
  assert.equal(unsupportedDecision.decision, 'DENY');
  assert.equal(unsupportedDecision.rule, 'runtime-enforcement');
  assert.equal(unsupportedDecision.blocked, true);
});

test('regression P03: postToolGate requires independent evidence verifier and rejects dummy/placeholder files', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  // 1. Placeholder string 'ok' is rejected even if file is non-empty
  const dummyLog = path.join(cwd, 'dummy.log');
  fs.writeFileSync(dummyLog, 'ok\n');
  const dummyPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['dummy.log'] }
  });
  assert.equal(dummyPost.verified, false);
  assert.ok(dummyPost.warning.includes('placeholder') || dummyPost.warning.includes('trivial'));

  // 2. Empty JSON object '{}' is rejected
  const emptyJson = path.join(cwd, 'empty.json');
  fs.writeFileSync(emptyJson, '{}\n');
  const emptyJsonPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['empty.json'] }
  });
  assert.equal(emptyJsonPost.verified, false);
  assert.ok(emptyJsonPost.warning.includes('placeholder') || emptyJsonPost.warning.includes('trivial'));

  // 3. JSON artifact with non-VERIFIED status is rejected
  const failedJson = path.join(cwd, 'failed-evidence.json');
  fs.writeFileSync(failedJson, JSON.stringify({ id: 'task-1', statement: 'ran tests', status: 'INFERRED', freshness: 'CURRENT' }) + '\n');
  const failedJsonPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['failed-evidence.json'] }
  });
  assert.equal(failedJsonPost.verified, false);
  assert.ok(failedJsonPost.warning.includes('expected "VERIFIED"'));

  // 4. Genuine structured evidence artifact is verified
  const validJson = path.join(cwd, 'valid-evidence.json');
  fs.writeFileSync(validJson, JSON.stringify({ id: 'task-1', statement: 'verified 15/15 checks', status: 'VERIFIED', freshness: 'CURRENT' }) + '\n');
  const validJsonPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['valid-evidence.json'] }
  });
  assert.equal(validJsonPost.verified, true);
  assert.equal(validJsonPost.warning, null);
});

test('regression P03: delegated worker cannot grant ALLOW_ONCE even with valid host proof', t => {
  const cwd = temp(t);
  const hostAuthority = new HostApprovalAuthority();
  const parentGate = createHarnessExecutionGate({ cwd, hostAuthority });
  const childGate = parentGate.delegateWorker('child-worker-1');

  const actionArgs = { path: path.join(cwd, 'child-target.txt') };
  const proof = hostAuthority.issueApproval({ toolName: 'delete_file', args: actionArgs, actionType: 'destructive' });

  // Delegated worker must fail with ERR_UNAUTHORIZED_ALLOW_ONCE
  assert.throws(
    () => childGate.grantAllowOnce(proof),
    { code: 'ERR_UNAUTHORIZED_ALLOW_ONCE' }
  );
});


