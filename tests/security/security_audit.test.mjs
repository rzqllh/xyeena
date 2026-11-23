import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scanSecretLeaks, auditRlsPolicies, auditInputSanitization, detectPathTraversal } from '../../skills/veyra-security/engine.mjs';
import { validateMigrationRollback } from '../../skills/veyra-release/engine.mjs';

describe('Veyra v1.0 — Security & Reliability Audit (DEC-31)', () => {
  test('Path Traversal Prevention: detects directory traversal and null byte escapes', () => {
    assert.equal(detectPathTraversal('../../etc/passwd').safe, false);
    assert.equal(detectPathTraversal('..\\..\\windows\\system32').safe, false);
    assert.equal(detectPathTraversal('legit/path/%2e%2e/secret').safe, false);
    assert.equal(detectPathTraversal('workspace/skills/veyra-core/engine.mjs').safe, true);
  });

  test('Secret Leak Prevention: scans multiple credential formats', () => {
    const awsSecret = 'accessKey = "AKIAIOSFODNN7EXAMPLE";';
    const privKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
    const ghToken = 'const token = "ghp_123456789012345678901234567890123456";';

    assert.ok(scanSecretLeaks(awsSecret).some(l => l.type === 'AWS_ACCESS_KEY'));
    assert.ok(scanSecretLeaks(privKey).some(l => l.type === 'PRIVATE_KEY'));
    assert.ok(scanSecretLeaks(ghToken).some(l => l.type === 'GITHUB_TOKEN'));
  });

  test('RLS & Injection Sanitization: flags multi-tenant bypasses and raw interpolation', () => {
    const rawSql = 'ALTER TABLE tenants ADD COLUMN name text;';
    const rlsAudit = auditRlsPolicies(rawSql);
    assert.equal(rlsAudit.compliant, false);
    assert.equal(rlsAudit.issues[0].issue, 'TABLE_WITHOUT_RLS');

    const sqliCode = 'const query = "SELECT * FROM users WHERE id = " + $userId;';
    const sanitization = auditInputSanitization(sqliCode);
    assert.equal(sanitization.clean, false);
    assert.equal(sanitization.issues[0].type, 'SQL_INJECTION_RISK');
  });

  test('Migration Reversibility: rejects forward migrations without rollbacks', () => {
    const forwardOnly = validateMigrationRollback('CREATE TABLE invoices (id int);', '');
    assert.equal(forwardOnly.reversible, false);

    const paired = validateMigrationRollback('CREATE TABLE invoices (id int);', 'DROP TABLE invoices;');
    assert.equal(paired.reversible, true);
  });
});
