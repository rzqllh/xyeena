import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTestSuites, evaluateSuiteResult } from '../../skills/veyra-test/engine.mjs';
import { evaluateDualAxisReview } from '../../skills/veyra-review/engine.mjs';
import { generateVerificationReceipt, validateCompletionClaims } from '../../skills/veyra-verify/engine.mjs';
import { scanSecretLeaks, auditRlsPolicies, auditInputSanitization } from '../../skills/veyra-security/engine.mjs';
import { calculateSemVer, validateMigrationRollback } from '../../skills/veyra-release/engine.mjs';

describe('Veyra Wave 4 — Quality, Security & Release Skills', () => {
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
    const receipt = generateVerificationReceipt('test-run', 'npm test', 0, '25 passed');
    assert.equal(receipt.passed, true);
    assert.equal(receipt.evidenceTier, 'LIVE_HOST_VERIFIED');

    const completion = validateCompletionClaims([receipt], ['test-run']);
    assert.equal(completion.verified, true);
    assert.equal(completion.status, 'PASS');
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
