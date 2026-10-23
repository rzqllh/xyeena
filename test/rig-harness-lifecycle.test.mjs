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
  createTrustedHostApprovalAuthority,
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

function testTrustedAuthority({ approved = true, hostBoundarySecret = 'test-host-secret-xyz-12345678', approver = 'host-user' } = {}) {
  process.env.XYEENA_HOST_BOUNDARY_SECRET = hostBoundarySecret;
  return createTrustedHostApprovalAuthority({
    hostId: 'trusted-host',
    hostBoundarySecret,
    approvalBridge: () => ({ approved, approver, confirmationId: `conf-${Date.now()}` })
  });
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
  const gate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'harness-gate' });

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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });

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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });

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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });

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
  const gate = createHarnessExecutionGate({ cwd, permissions: { interactive: true }, enforcementRuntime: 'harness-gate' });

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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });

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

test('postToolGate rejects self-certified completion without independent evidence', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  // 1. Self-certified claim without evidenceRefs fails
  const unverifiedPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS' }
  });
  assert.equal(unverifiedPost.verified, false);
  assert.ok(unverifiedPost.warning.includes('Self-certified'));

  // 2. Self-authored evidence artifact without independent execution checker fails
  const logPath = path.join(cwd, 'test-run-123.log');
  fs.writeFileSync(logPath, '12/12 passing');
  const unprovenPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['test-run-123.log'] }
  });
  assert.equal(unprovenPost.verified, false);
  assert.equal(unprovenPost.status, 'REVIEW_REQUIRED');
  assert.ok(unprovenPost.warning.includes('requires an independently executed checker'));

  // 3. Verified claim with independently executed checker passing acceptance criteria
  const verifiedGate = createHarnessExecutionGate({
    cwd,
    evidenceVerifier: new IndependentEvidenceVerifier({
      cwd,
      executionChecker: (ref, { content, acceptanceCriteria }) => {
        return content.includes('12/12 passing') && acceptanceCriteria === 'full-pass';
      }
    })
  });
  const verifiedPost = verifiedGate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['test-run-123.log'], acceptanceCriteria: 'full-pass' }
  });
  assert.equal(verifiedPost.verified, true);
  assert.equal(verifiedPost.status, 'VERIFIED');
  assert.equal(verifiedPost.warning, null);

  // 4. Non-existent evidence file fails independent verification
  const missingPost = verifiedGate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['non-existent.log'], acceptanceCriteria: 'full-pass' }
  });
  assert.equal(missingPost.verified, false);
  assert.ok(missingPost.warning.includes('does not exist'));

  // 5. Empty evidence file (0 bytes) fails independent verification
  const emptyPath = path.join(cwd, 'empty.log');
  fs.writeFileSync(emptyPath, '');
  const emptyPost = verifiedGate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['empty.log'], acceptanceCriteria: 'full-pass' }
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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });

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
  const hostAuthority = testTrustedAuthority();
  const gate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });
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

  // 3. Self-authored JSON artifact with VERIFIED status is rejected without independent execution checker
  const selfAuthoredJson = path.join(cwd, 'self-authored-evidence.json');
  fs.writeFileSync(selfAuthoredJson, JSON.stringify({ id: 'task-1', statement: 'verified 15/15 checks', status: 'VERIFIED', freshness: 'CURRENT' }) + '\n');
  const selfAuthoredPost = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['self-authored-evidence.json'] }
  });
  assert.equal(selfAuthoredPost.verified, false);
  assert.equal(selfAuthoredPost.status, 'REVIEW_REQUIRED');
  assert.ok(selfAuthoredPost.warning.includes('requires an independently executed checker'));

  // 4. Genuine structured evidence artifact with independent execution checker is verified
  const verifiedGate = createHarnessExecutionGate({
    cwd,
    evidenceVerifier: new IndependentEvidenceVerifier({
      cwd,
      executionChecker: (ref, { content, acceptanceCriteria, provenance }) => {
        const parsed = JSON.parse(content);
        return parsed.status === 'VERIFIED' && provenance?.exitCode === 0 && acceptanceCriteria === 'all-pass';
      }
    })
  });
  const validJsonPost = verifiedGate.postToolGate({
    toolName: 'verify_module',
    result: {
      verified: true,
      status: 'PASS',
      evidenceRefs: ['self-authored-evidence.json'],
      acceptanceCriteria: 'all-pass',
      provenance: { exitCode: 0, runner: 'node:test' }
    }
  });
  assert.equal(validJsonPost.verified, true);
  assert.equal(validJsonPost.status, 'VERIFIED');
  assert.equal(validJsonPost.warning, null);
});

test('regression P03: delegated worker cannot grant ALLOW_ONCE even with valid host proof', t => {
  const cwd = temp(t);
  const hostAuthority = testTrustedAuthority();
  const parentGate = createHarnessExecutionGate({ cwd, hostAuthority, enforcementRuntime: 'harness-gate' });
  const childGate = parentGate.delegateWorker('child-worker-1');

  const actionArgs = { path: path.join(cwd, 'child-target.txt') };
  const proof = hostAuthority.issueApproval({ toolName: 'delete_file', args: actionArgs, actionType: 'destructive' });

  // Delegated worker must fail with ERR_UNAUTHORIZED_ALLOW_ONCE
  assert.throws(
    () => childGate.grantAllowOnce(proof),
    { code: 'ERR_UNAUTHORIZED_ALLOW_ONCE' }
  );
});

test('adversarial P03: caller-created HostApprovalAuthority without host boundary credentials cannot issue approvals', t => {
  // Public construction without boundary credentials fails closed
  const callerAuth = new HostApprovalAuthority();
  assert.equal(callerAuth.isTrusted(), false);
  assert.throws(
    () => callerAuth.issueApproval({ toolName: 'delete_file', actionType: 'destructive' }),
    { code: 'ERR_UNTRUSTED_AUTHORITY_CREATION' }
  );

  // Construction with caller callback but without host boundary secret also fails closed
  const dummyAuth = new HostApprovalAuthority({
    approvalBridge: () => true
  });
  assert.equal(dummyAuth.isTrusted(), false);
  assert.throws(
    () => dummyAuth.issueApproval({ toolName: 'delete_file', actionType: 'destructive' }),
    { code: 'ERR_UNTRUSTED_AUTHORITY_CREATION' }
  );
});

test('adversarial P03: caller-created authority passed to HarnessExecutionGate is rejected', t => {
  const cwd = temp(t);
  const callerAuth = new HostApprovalAuthority({ approvalBridge: () => true });

  assert.throws(
    () => createHarnessExecutionGate({ cwd, hostAuthority: callerAuth }),
    { code: 'ERR_UNTRUSTED_HOST_AUTHORITY' }
  );
});

test('adversarial P03: default HarnessExecutionGate has null hostAuthority and fails closed on privileged operations', t => {
  const cwd = temp(t);
  const defaultGate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'harness-gate' });

  // Calling grantAllowOnce on default gate without hostAuthority throws ERR_NO_HOST_AUTHORITY
  assert.throws(
    () => defaultGate.grantAllowOnce({
      tokenType: 'host-allow-once-proof',
      toolName: 'delete_file',
      actionType: 'destructive',
      signature: 'dummy'
    }),
    { code: 'ERR_NO_HOST_AUTHORITY' }
  );

  // Destructive operation without valid authority fails closed
  const decision = defaultGate.preToolGate({
    toolName: 'delete_file',
    args: { path: path.join(cwd, 'test.txt') },
    actionType: 'destructive'
  });
  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.blocked, true);
});

test('adversarial P03: host approval bridge denial fails closed without issuing proof', t => {
  const secret = 'test-boundary-secret-denial-123456';
  process.env.XYEENA_HOST_BOUNDARY_SECRET = secret;
  const denyingAuth = createTrustedHostApprovalAuthority({
    hostBoundarySecret: secret,
    approvalBridge: () => false // Explicit host denial
  });

  assert.throws(
    () => denyingAuth.issueApproval({ toolName: 'delete_file', actionType: 'destructive' }),
    { code: 'ERR_HOST_APPROVAL_DENIED' }
  );
});

test('adversarial P03: rogue authority proof is rejected by trusted gate signature check', t => {
  const cwd = temp(t);
  const secret1 = 'trusted-boundary-secret-1-12345678';
  process.env.XYEENA_HOST_BOUNDARY_SECRET = secret1;
  const trustedAuth = createTrustedHostApprovalAuthority({
    hostBoundarySecret: secret1,
    approvalBridge: () => true
  });

  // Untrusted authority constructed with invalid secret
  const rogueAuth = new HostApprovalAuthority({
    hostBoundarySecret: 'different-rogue-secret-2-12345678',
    approvalBridge: () => true
  });
  assert.equal(rogueAuth.isTrusted(), false);
  assert.equal(rogueAuth.getAuthorizationStatus(), 'BLOCKED');

  const gate = createHarnessExecutionGate({ cwd, hostAuthority: trustedAuth, enforcementRuntime: 'harness-gate' });

  assert.throws(
    () => rogueAuth.issueApproval({ toolName: 'delete_file', actionType: 'destructive' }),
    { code: 'ERR_UNTRUSTED_AUTHORITY_CREATION' }
  );
});

test('negative P03: caller-supplied always-approve callback cannot grant privilege', t => {
  const cwd = temp(t);
  delete process.env.XYEENA_HOST_BOUNDARY_SECRET;

  const callerCallback = () => ({ approved: true, approver: 'host-user' });

  // 1. Caller cannot issue a trusted authority via createTrustedHostApprovalAuthority without host boundary authentication
  assert.throws(
    () => createTrustedHostApprovalAuthority({
      approvalBridge: callerCallback
    }),
    { code: 'ERR_HOST_BOUNDARY_UNAUTHENTICATED' }
  );

  // 2. Direct constructor with caller callback is untrusted
  const untrustedAuth = new HostApprovalAuthority({
    approvalBridge: callerCallback
  });
  assert.equal(untrustedAuth.isTrusted(), false);
  assert.equal(untrustedAuth.getAuthorizationStatus(), 'BLOCKED');

  // 3. HarnessExecutionGate strictly refuses untrusted or caller-created authority
  assert.throws(
    () => createHarnessExecutionGate({ cwd, hostAuthority: untrustedAuth }),
    { code: 'ERR_UNTRUSTED_HOST_AUTHORITY' }
  );

  // 4. Default gate has authorizationStatus BLOCKED and fails closed for privileged actions
  const defaultGate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'harness-gate' });
  assert.equal(defaultGate.getAuthorizationStatus(), 'BLOCKED');

  const decision = defaultGate.preToolGate({
    toolName: 'delete_file',
    args: { path: path.join(cwd, 'test.txt') },
    actionType: 'destructive'
  });
  assert.equal(decision.decision, 'DENY');
  assert.equal(decision.blocked, true);

  // 5. Attempting grantAllowOnce on default gate without trusted authority fails closed
  assert.throws(
    () => defaultGate.grantAllowOnce({ tokenType: 'host-allow-once-proof', signature: 'dummy' }),
    { code: 'ERR_NO_HOST_AUTHORITY' }
  );
});

test('adversarial P03: arbitrary long self-authored text fails independent evidence verification', t => {
  const cwd = temp(t);
  const gate = createHarnessExecutionGate({ cwd });

  const fakeLog = path.join(cwd, 'fake-large.log');
  fs.writeFileSync(fakeLog, 'PASS: ALL CHECKS PASSED. SYSTEM IS COMPLETELY SECURE AND VERIFIED. NO ERRORS DETECTED.\n'.repeat(20));

  const post = gate.postToolGate({
    toolName: 'verify_module',
    result: { verified: true, status: 'PASS', evidenceRefs: ['fake-large.log'] }
  });
  assert.equal(post.verified, false);
  assert.equal(post.status, 'REVIEW_REQUIRED');
  assert.ok(post.warning.includes('requires an independently executed checker'));
});

test('adversarial P03: host runtime without verified live tool hooks has LIVE_PENDING status and fails closed', t => {
  const cwd = temp(t);
  const unhookedGate = createHarnessExecutionGate({ cwd, enforcementRuntime: 'antigravity' });

  assert.equal(unhookedGate.getInterceptionStatus(), 'LIVE_PENDING');

  const shellDecision = unhookedGate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'node -v' },
    actionType: 'read'
  });
  assert.equal(shellDecision.decision, 'DENY');
  assert.equal(shellDecision.rule, 'runtime-enforcement');
  assert.equal(shellDecision.interceptionStatus, 'LIVE_PENDING');
  assert.equal(shellDecision.blocked, true);

  // When verified live host hooks are attached, status becomes LIVE_ACTIVE
  const hookedGate = createHarnessExecutionGate({
    cwd,
    enforcementRuntime: 'antigravity',
    hostHooks: {
      interceptToolCall: () => ({ allow: true }),
      isVerified: true
    }
  });
  assert.equal(hookedGate.getInterceptionStatus(), 'LIVE_ACTIVE');

  const hookedDecision = hookedGate.preToolGate({
    toolName: 'run_command',
    args: { CommandLine: 'node -v' },
    actionType: 'read'
  });
  assert.equal(hookedDecision.decision, 'ALLOW');
  assert.equal(hookedDecision.blocked, false);
});


