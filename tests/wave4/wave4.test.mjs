import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTestSuites, evaluateSuiteResult } from '../../skills/veyra-test/engine.mjs';
import { evaluateDualAxisReview } from '../../skills/veyra-review/engine.mjs';
import { generateVerificationReceipt, executeAndVerify, validateCompletionClaims } from '../../skills/veyra-verify/engine.mjs';
import * as verificationExports from '../../skills/veyra-verify/engine.mjs';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanSecretLeaks, auditRlsPolicies, auditInputSanitization } from '../../skills/veyra-security/engine.mjs';
import { calculateSemVer, validateMigrationRollback } from '../../skills/veyra-release/engine.mjs';

describe('Veyra Wave 4 — Quality, Security & Release Skills', () => {
  test('full preflight fails closed in CI when physical sources are absent', () => {
    const root = mkdtempSync(join(tmpdir(), 'veyra-upstream-preflight-'));
    try {
      mkdirSync(join(root, 'scripts'), { recursive: true });
      mkdirSync(join(root, 'references'), { recursive: true });
      cpSync('scripts/preflight-upstream.mjs', join(root, 'scripts', 'preflight-upstream.mjs'));
      cpSync('references/upstreams.lock.json', join(root, 'references', 'upstreams.lock.json'));
      const outcome = spawnSync(process.execPath, [join(root, 'scripts', 'preflight-upstream.mjs')], {
        cwd: root, encoding: 'utf8',
        env: { ...process.env, USERPROFILE: root, CI: 'true' }
      });
      assert.notEqual(outcome.status, 0, 'Full upstream preflight must not report PASS without sources');
      assert.match(outcome.stderr, /Upstream archive and local sources are missing/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('preflight metadata mode labels upstream contents UNVERIFIED', () => {
    const res = spawnSync(process.execPath, ['scripts/preflight-upstream.mjs', '--metadata-only'], {
      cwd: process.cwd(), encoding: 'utf8'
    });
    assert.equal(res.status, 0);
    assert.match(res.stdout, /Pinned lockfile metadata schema verified/);
    assert.match(res.stdout, /UNVERIFIED.*contents NOT CHECKED/);
  });
  test('veyra-test: classifies suites and evaluates results', () => {
    const classification = classifyTestSuites([
      'tests/unit/core.test.mjs',
      'tests/integration/pipeline.test.mjs',
      'tests/regression/bug12.test.mjs'
    ]);
    assert.equal(classification.totalSuites, 3);
    assert.equal(classification.hasRegressionProtection, true);
    assert.equal(classification.categories.INTEGRATION.length, 1);

    const result = evaluateSuiteResult({ total: 10, passed: 10, failed: 0, durationMs: 120 });
    assert.equal(result.pass, true);
    assert.equal(result.fast, true);
  });

  test('veyra-review: evaluates dual-axis review and flags blockers', () => {
    const review = evaluateDualAxisReview({
      diffLines: ['+ const temp = TODO: FIXME finish this;'],
      architecturalRules: [{ violated: true, severity: 'HIGH', message: 'Domain imports database' }]
    });
    assert.equal(review.verdict, 'BLOCKED');
    assert.equal(review.blockerCount, 1);
    assert.equal(review.findingCount, 2);
  });

  test('veyra-verify: receipts and completion claims', () => {
    // 1. Synthetic call without process execution must yield SYNTHETIC_RECEIPT
    const syntheticReceipt = generateVerificationReceipt('test-synth', 'npm test', 0, '25 passed');
    assert.equal(syntheticReceipt.passed, true);
    assert.equal(syntheticReceipt.evidenceTier, 'SYNTHETIC_RECEIPT', 'Synthetic receipt without execution proof must NOT be LIVE_HOST_VERIFIED');

    // Synthetic receipt is rejected for production completion claim
    const synthCompletion = validateCompletionClaims([syntheticReceipt], ['test-synth']);
    assert.equal(synthCompletion.verified, false);
    assert.equal(synthCompletion.status, 'REJECTED');
    assert.ok(synthCompletion.syntheticRejected.includes('test-synth'));

    // 2. Caller attempt to forge LIVE_HOST_VERIFIED by passing fake realExecution
    const forgedReceipt = generateVerificationReceipt('test-forge', 'fake command', 0, 'output', {
      realExecution: true,
      timestamp: Date.now()
    });
    assert.equal(forgedReceipt.isForged, true);
    assert.equal(forgedReceipt.evidenceTier, 'SYNTHETIC_RECEIPT');

    const forgedCompletion = validateCompletionClaims([forgedReceipt], ['test-forge']);
    assert.equal(forgedCompletion.verified, false);
    assert.equal(forgedCompletion.status, 'REJECTED');
    assert.ok(forgedCompletion.forgedRejected.includes('test-forge'));

    // 3. Real execution via executeAndVerify achieves LIVE_HOST_VERIFIED
    const liveReceipt = executeAndVerify('node-version-check', 'node -v');
    assert.equal(liveReceipt.passed, true);
    assert.equal(liveReceipt.evidenceTier, 'LOCAL_PROCESS_VERIFIED');
    assert.ok(liveReceipt.executionProof.durationMs >= 0);
    assert.ok(liveReceipt.executionProof.outputHash.length === 64);

    assert.equal('signExecutionProof' in verificationExports, false, 'Signing key is not exposed as public API');
    const fakeLabel = { ...syntheticReceipt, evidenceTier: 'LOCAL_PROCESS_VERIFIED' };
    assert.equal(validateCompletionClaims([fakeLabel], ['test-synth']).verified, false, 'Caller cannot forge a trusted tier label');
    const clonedReceipt = { ...liveReceipt };
    assert.equal(validateCompletionClaims([clonedReceipt], ['node-version-check']).verified, true, 'Signed receipts must survive cloning and process boundaries');
    assert.equal(validateCompletionClaims([syntheticReceipt], ['test-synth'], { disallowSynthetic: false }).verified, false, 'Legacy options cannot bypass trusted evidence');

    const liveCompletion = validateCompletionClaims([liveReceipt], ['node-version-check']);
    assert.equal(liveCompletion.verified, true);
    assert.equal(liveCompletion.status, 'PASS');

    // 4. Missing binary execution error handling (ENOENT -> exitCode 127)
    const missingReceipt = executeAndVerify('missing-binary', 'nonexistent_tool_xyz_999 --version');
    assert.equal(missingReceipt.passed, false);
    assert.equal(missingReceipt.exitCode, 127);
    assert.ok(missingReceipt.outputSummary.toLowerCase().includes('command not found'));

    // 5. Array arguments execution
    const arrayReceipt = executeAndVerify('array-check', ['node', '-e', 'console.log("ARRAY_OK")']);
    assert.equal(arrayReceipt.passed, true);
    assert.ok(arrayReceipt.outputSummary.includes('ARRAY_OK'));
  });

  test('veyra-security: secret scanning and RLS policy checking', () => {
    const leaks = scanSecretLeaks('const token = "ghp_123456789012345678901234567890123456";');
    assert.equal(leaks.length, 2); // Matches both generic token and ghp_ token patterns
    assert.ok(leaks.some(l => l.type === 'GITHUB_TOKEN'));
    assert.ok(leaks.some(l => l.type === 'GENERIC_SECRET_KEY'));

    const rls = auditRlsPolicies('CREATE POLICY "all_access" ON users FOR ALL USING (true);');
    assert.equal(rls.compliant, false);
    assert.equal(rls.issues[0].severity, 'CRITICAL');
  });

  test('veyra-release: semver calculation and migration rollback', () => {
    const bump = calculateSemVer('1.0.0', [{ type: 'FEATURE' }]);
    assert.equal(bump.nextVersion, '1.1.0');
    assert.equal(bump.bumpType, 'MINOR');

    const breaking = calculateSemVer('1.1.0', [{ type: 'BREAKING' }]);
    assert.equal(breaking.nextVersion, '2.0.0');
    assert.equal(breaking.bumpType, 'MAJOR');

    const migration = validateMigrationRollback('CREATE TABLE users (id int);', 'DROP TABLE users;');
    assert.equal(migration.reversible, true);
  });
});
