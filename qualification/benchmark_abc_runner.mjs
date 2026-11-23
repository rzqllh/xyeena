/**
 * Veyra qualification: local-function proxy checks only.
 * This script does not run A/B/C agents or test any upstream implementation.
 * Every score below is calculated from executed Veyra function checks.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateScope, isPathSafe } from '../skills/veyra-core/engine.mjs';
import { validatePlanDAG } from '../skills/veyra-plan/engine.mjs';
import { compressContext } from '../skills/veyra-context/engine.mjs';
import { calculateContrastRatio } from '../skills/veyra-interface/engine.mjs';
import { scanSecretLeaks } from '../skills/veyra-security/engine.mjs';

const ROOT = resolve(process.cwd());
function workload(id, description, outcomes) {
  return {
    id, description,
    passed: outcomes.filter(Boolean).length,
    checks: outcomes.length,
    accuracyPercent: Number((100 * outcomes.filter(Boolean).length / outcomes.length).toFixed(1)),
    evidenceTier: 'LOCAL_FUNCTION_PROXY'
  };
}

export function evaluateLocalProxy() {
  const results = [];
  const scopeCases = [
    ['src/cart.mjs', true],
    ['config/payment_secrets.json', false],
    ['src/../config/database.yml', false],
    ['../outside.txt', false]
  ];
  results.push(workload('WL-01', 'Scoped path validation', scopeCases.map(([file, expected]) => {
    const actual = validateScope({ targetFiles: [file], allowedPatterns: ['src/*'], actionType: 'WRITE' });
    return actual.allowed === expected;
  })));

  const validPlan = [{ id: 'P', tasks: [{ id: 'A', dependsOn: [] }, { id: 'B', dependsOn: ['A'] }] }];
  const cyclicPlan = [{ id: 'P', tasks: [{ id: 'A', dependsOn: ['B'] }, { id: 'B', dependsOn: ['A'] }] }];
  const planChecks = [validatePlanDAG(validPlan).valid === true, validatePlanDAG(cyclicPlan).valid === false];
  results.push(workload('WL-02', 'Plan dependency validation', planChecks));

  const securityChecks = [
    !isPathSafe('../secrets/private.key'),
    !isPathSafe('scripts/run\0.mjs'),
    !isPathSafe('src/%2e%2e/config.env'),
    scanSecretLeaks('const key = "AKIAIOSFODNN7EXAMPLE";').length > 0,
    scanSecretLeaks('const token = "ghp_123456789012345678901234567890123456";').length > 0
  ];
  results.push(workload('WL-03', 'Scoped security checks', securityChecks));

  const contrastCases = [
    ['#777777', '#ffffff', false],
    ['#595959', '#ffffff', true],
    ['#000000', '#000000', false]
  ];
  const contrastObservations = contrastCases.map(([fg, bg, expected]) => {
    const measured = calculateContrastRatio(fg, bg);
    return { foreground: fg, background: bg, ratio: measured.ratio, actualPassAA: measured.wcagAA, expectedPassAA: expected };
  });
  results.push(workload('WL-04', 'WCAG contrast function', contrastObservations.map(x => x.actualPassAA === x.expectedPassAA)));

  const facts = [
    'DEC-01: packaging', 'DEC-02: pinned SHA', 'DEC-18: CLI',
    'DEC-19: workspace first', 'DEC-20: safe rollback',
    'DEC-27: provenance', 'DEC-31: advisory gate', 'DEC-35: native support'
  ];
  const compressed = compressContext('Session notes.\n' + facts.join('\n') + '\nThank you for reading!');
  results.push(workload('WL-05', 'Short-text fact marker retention', facts.map(f => compressed.compressedText.includes(f.split(':')[0]))));

  const passed = results.reduce((sum, item) => sum + item.passed, 0);
  const checks = results.reduce((sum, item) => sum + item.checks, 0);
  return {
    timestamp: new Date().toISOString(),
    evaluationTier: 'LOCAL_FUNCTION_PROXY',
    claimScope: 'NOT_AGENT_COMPARISON',
    actualAgentInvocations: 0,
    comparators: {
      A: { status: 'NOT_RUN', reason: 'No same-host unaugmented agent execution' },
      B: { status: 'NOT_RUN', reason: 'No actual pinned upstream agent execution' },
      C: { status: 'LOCAL_FUNCTION_PROXY', checks, passed, accuracyPercent: Number((100 * passed / checks).toFixed(1)) }
    },
    results,
    contrastObservations,
    notes: 'No statistical superiority, upstream win rate, token/cost or multi-host capability is established.'
  };
}

export function runBenchmarkABC() {
  const receipt = evaluateLocalProxy();
  const dir = join(ROOT, 'qualification', 'receipts');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'local_function_proxy_receipt.json'), JSON.stringify(receipt, null, 2), 'utf8');
  return receipt;
}

if (process.argv[1] && process.argv[1].endsWith('benchmark_abc_runner.mjs')) {
  try { console.log(JSON.stringify(runBenchmarkABC(), null, 2)); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
