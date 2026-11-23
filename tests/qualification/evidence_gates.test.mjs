import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { evaluateLocalProxy } from '../../qualification/benchmark_abc_runner.mjs';
import { auditLicenses } from '../../bin/veyra.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = path => readFileSync(join(ROOT, path), 'utf8');

test('qualification function proxy is measured without invented A/B agent scores', () => {
  const result = evaluateLocalProxy();
  assert.equal(result.evaluationTier, 'LOCAL_FUNCTION_PROXY');
  assert.equal(result.actualAgentInvocations, 0);
  assert.equal(result.comparators.A.status, 'NOT_RUN');
  assert.equal(result.comparators.B.status, 'NOT_RUN');
  assert.equal('accuracyPercent' in result.comparators.A, false);
  assert.equal('accuracyPercent' in result.comparators.B, false);
  assert.equal(result.results.length, 5);
  for (const r of result.results) {
    assert.ok(r.checks > 0);
    assert.equal(r.accuracyPercent, Number((100*r.passed/r.checks).toFixed(1)));
  }
  const ui = result.contrastObservations;
  assert.equal(ui.length,3);
  assert.deepEqual(ui.map(x=>x.actualPassAA),[false,true,false]);
  assert.deepEqual(ui.map(x=>x.expectedPassAA),[false,true,false]);
});

test('old host and benchmark receipts are explicitly disqualified for live claims', () => {
  const host = JSON.parse(read('qualification/receipts/host_e2e_receipt.json'));
  const bench = JSON.parse(read('qualification/receipts/benchmark_abc_receipt.json'));
  assert.equal(host.testScope, 'NODE_INTEGRATION_ONLY');
  assert.equal(host.nativeAgentE2EStatus, 'NOT_RUN');
  assert.equal(host.agentSessionsExecuted, 0);
  assert.equal(bench.evaluationStatus, 'INVALIDATED_HARDCODED_BASELINES');
  assert.equal(bench.scores.comparatorA_Baseline, null);
  assert.equal(bench.scores.comparatorB_UpstreamRef, null);
  assert.equal(bench.scores.comparatorC_Veyra, null);
});

test('upstream receipt redacts local paths and does not claim pinned SHA checks', () => {
  const receipt = JSON.parse(read('qualification/receipts/upstream_integrity_receipt.json'));
  assert.equal(receipt.sources.status, 'PINNED_SOURCE_SHA_NOT_VERIFIED');
  assert.equal(receipt.sources.verifiedCount, 0);
  assert.equal(receipt.auditCorrection.pathRedacted, true);
  const serialized = JSON.stringify(receipt);
  assert.doesNotMatch(serialized, /C:\\Users\\/i);
  assert.doesNotMatch(serialized, /Documents\\Code/i);
});

test('release notes and license inventory do not silently promote unverified gates', () => {
  const gate = read('qualification/RELEASE-GATE-DECISION.md');
  const benchDoc = read('qualification/BENCHMARK-RESULTS.md');
  assert.match(gate, /STABLE public release|Stable public release/i);
  assert.match(gate, /BLOCKED/);
  assert.match(benchDoc,/RETRACTED/);
  const license = auditLicenses();
  assert.equal(license.compliant, null);
  assert.equal(license.auditedCount, 0);
});
