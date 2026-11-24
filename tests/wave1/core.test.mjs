import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScope, evaluateAntiSlop, classifyEvidence, auditSmallestChange } from '../../skills/veyra-core/engine.mjs';

describe('Veyra Core — Scope Fencing (DEC-03, DEC-08)', () => {
  test('allows modifications strictly within approved file patterns', () => {
    const res = evaluateScope({
      targetFiles: ['workspace/docs/PRD.md', 'workspace/docs/BRD.md'],
      allowedPatterns: ['workspace/docs/*'],
      actionType: 'WRITE'
    });
    assert.equal(res.verdict, 'PROCEED');
    assert.equal(res.allowed, true);
    assert.equal(res.violations.length, 0);
  });

  test('blocks out-of-scope file modifications', () => {
    const res = evaluateScope({
      targetFiles: ['workspace/docs/PRD.md', 'workspace/package.json', '/etc/passwd'],
      allowedPatterns: ['workspace/docs/*'],
      actionType: 'WRITE'
    });
    assert.equal(res.verdict, 'BLOCKED_SCOPE');
    assert.equal(res.allowed, false);
    assert.equal(res.violations.length, 2);
    assert.ok(res.violations.includes('workspace/package.json'));
  });

  test('requires Owner approval for destructive operations', () => {
    const res = evaluateScope({
      targetFiles: ['workspace/docs/PRD.md'],
      allowedPatterns: ['workspace/docs/*'],
      actionType: 'WRITE',
      isDestructive: true
    });
    assert.equal(res.verdict, 'NEEDS_OWNER_APPROVAL');
    assert.equal(res.allowed, false);
  });
});

describe('Veyra Core — Universal Anti-Slop Filter (DEC-05)', () => {
  test('passes clean, factual technical text', () => {
    const text = 'Reconciled DEC-01 through DEC-35. Decompression verified 130 files intact with zero errors.';
    const res = evaluateAntiSlop(text);
    assert.equal(res.pass, true);
    assert.equal(res.findings.length, 0);
  });

  test('flags banned AI clichés and filler', () => {
    const text = 'This release is a testament to cutting-edge technology that will revolutionize developer workflows.';
    const res = evaluateAntiSlop(text);
    assert.equal(res.pass, false);
    assert.ok(res.findings.some(f => f.matched.toLowerCase() === 'testament to'));
    assert.ok(res.findings.some(f => f.matched.toLowerCase() === 'cutting-edge'));
    assert.ok(res.findings.some(f => f.matched.toLowerCase() === 'revolutionize'));
  });

  test('flags prohibited em-dash and en-dash punctuation', () => {
    const text = 'Wave 0 — Complete';
    const res = evaluateAntiSlop(text);
    assert.equal(res.pass, false);
    assert.ok(res.findings.some(f => f.type === 'BANNED_PUNCTUATION'));
  });
});

describe('Veyra Core — Epistemic Evidence Classification (DEC-07)', () => {
  test('rejects untrusted claim arrays as unobserved', () => {
    const claim = 'Verification output passed: 45637 / 45637 files matched by SHA-256.';
    const res = classifyEvidence(claim, ['45637 / 45637']);
    assert.equal(res.category, 'UNKNOWN');
    assert.equal(res.confidence, 0.0);
  });

  test('classifies unverified conjecture as UNKNOWN', () => {
    const claim = 'The feature will run flawlessly on all future hosts.';
    const res = classifyEvidence(claim, []);
    assert.equal(res.category, 'UNKNOWN');
    assert.equal(res.confidence, 0.0);
  });
});

describe('Veyra Core — Smallest Correct Change Audit', () => {
  test('identifies extraneous file edits outside minimal scope', () => {
    const audit = auditSmallestChange(
      ['docs/PRD.md', 'docs/BRD.md', 'unrelated/config.json'],
      ['docs/PRD.md', 'docs/BRD.md']
    );
    assert.equal(audit.isMinimal, false);
    assert.deepEqual(audit.extraneousFiles, ['unrelated/config.json']);
  });
});
