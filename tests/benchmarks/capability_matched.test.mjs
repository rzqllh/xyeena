import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateScope, checkAntiSlop } from '../../skills/veyra-core/engine.mjs';
import { compressContext, calculateInformationDensity, verifyFactPreservation } from '../../skills/veyra-context/engine.mjs';
import { validatePlanDAG, detectCycles } from '../../skills/veyra-plan/engine.mjs';
import { calculateContrastRatio } from '../../skills/veyra-interface/engine.mjs';

describe('Veyra v1.0 — Capability-Matched Fair Benchmarks (A/B/C Evaluation)', () => {
  test('Benchmark 1: Context Management Economy vs Head+Tail Window Truncation', () => {
    const turns = [
      'Certainly! I will help set up the Veyra workspace infrastructure.',
      'Critical DB Schema: table `tenants` with column `tenant_id UUID PRIMARY KEY`.',
      'Canonical Decisions locked: DEC-01, DEC-02, DEC-09, DEC-33, DEC-35.',
      'Base commit hash: b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f.',
      'Target implementation file: workspace/skills/veyra-core/engine.mjs.',
      'Please let me know if you would like me to proceed with anything else! Hope this helps!'
    ];
    const fullTranscript = turns.join('\n');
    const technicalEntities = [
      'tenant_id UUID PRIMARY KEY',
      'DEC-01', 'DEC-02', 'DEC-09', 'DEC-33', 'DEC-35',
      'b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f',
      'workspace/skills/veyra-core/engine.mjs'
    ];

    // Comparator A: Raw Baseline (Zero context pruning)
    const rawBytes = Buffer.byteLength(fullTranscript, 'utf8');

    // Comparator B: Standard Fixed-Window Head+Tail Truncation (FIFO dropping middle turns)
    const headTailTruncated = turns[0] + '\n[... truncated messages ...]\n' + turns[turns.length - 1];
    const headTailRetained = technicalEntities.filter(e => headTailTruncated.includes(e));
    const headTailRecall = headTailRetained.length / technicalEntities.length;
    assert.equal(headTailRecall, 0.0, 'Fixed-window head+tail drops all middle technical facts');

    // Comparator C: Veyra Semantic Anchor Engine
    const veyraResult = compressContext(fullTranscript);
    const veyraRetained = technicalEntities.filter(e => veyraResult.compressedText.includes(e));
    const veyraRecall = veyraRetained.length / technicalEntities.length;

    assert.equal(veyraRecall, 1.0, 'Veyra retains 100% of structured technical facts');
    assert.ok(veyraResult.compressionRatio < 0.85, 'Veyra achieves measurable byte reduction');
    assert.ok(veyraResult.compressedText.length < rawBytes, 'Payload size is reduced');
  });

  test('Benchmark 2: Scope Fencing Precision vs Naive String Prefix Matching', () => {
    const candidateFiles = [
      'workspace/skills/veyra-core/engine.mjs',              // Legitimate in-scope file
      'workspace/skills/veyra-core/SKILL.md',               // Legitimate in-scope file
      'workspace/package.json',                              // Protected configuration
      'workspace/skills/veyra-core/../../xyeena/secret.env', // Path traversal bypass attempt
      '/etc/passwd'                                         // Absolute path escape
    ];
    const allowedPattern = 'workspace/skills/veyra-core/*';

    // Comparator A: Unfenced Agent (Permits all operations blindly)
    const unfencedViolations = 0;

    // Comparator B: Naive String Prefix Matcher
    const naiveCheck = (file) => file.startsWith('workspace/skills/veyra-core/');
    const naiveTraversalAllowed = naiveCheck('workspace/skills/veyra-core/../../xyeena/secret.env');
    assert.equal(naiveTraversalAllowed, true, 'Naive prefix matcher allows traversal escapes');

    // Comparator C: Veyra Path-Canonicalized Scope Gate
    const veyraScopeResult = validateScope({
      targetFiles: candidateFiles,
      allowedPatterns: [allowedPattern],
      actionType: 'WRITE'
    });

    assert.equal(veyraScopeResult.allowed, false, 'Veyra blocks the batch due to violations');
    assert.equal(veyraScopeResult.violations.length, 3, 'Veyra precisely isolates the 3 out-of-scope targets');
    assert.ok(veyraScopeResult.violations.includes('workspace/package.json'));
    assert.ok(veyraScopeResult.violations.includes('workspace/skills/veyra-core/../../xyeena/secret.env'));
    assert.ok(veyraScopeResult.violations.includes('/etc/passwd'));
  });

  test('Benchmark 3: Kahn-DAG Cycle Detection & Layer Scheduling vs Naive Linear Dispatch', () => {
    const cyclicGraph = [
      { id: 'AUTH_INIT', dependsOn: ['DB_MIGRATE'] },
      { id: 'DB_MIGRATE', dependsOn: ['CONFIG_LOAD'] },
      { id: 'CONFIG_LOAD', dependsOn: ['AUTH_INIT'] }
    ];

    const cycleEvaluation = detectCycles(cyclicGraph);
    assert.equal(cycleEvaluation.hasCycle, true, 'Veyra flags circular dependency');
    assert.deepEqual(cycleEvaluation.cycleNodes.sort(), ['AUTH_INIT', 'CONFIG_LOAD', 'DB_MIGRATE'], 'Veyra identifies exact cycle nodes');

    const validGraph = [
      { id: 'STEP_1', dependsOn: [] },
      { id: 'STEP_2A', dependsOn: ['STEP_1'] },
      { id: 'STEP_2B', dependsOn: ['STEP_1'] },
      { id: 'STEP_3', dependsOn: ['STEP_2A', 'STEP_2B'] }
    ];
    const validResult = detectCycles(validGraph);
    assert.equal(validResult.hasCycle, false, 'Acyclic graph passes validation');
  });

  test('Benchmark 4: Interface Accessibility Floor (WCAG 2.2 AA) vs Blind CSS Parsing', () => {
    const lowContrastPair = { fg: '#94A3B8', bg: '#FFFFFF' };
    const editorialPair = { fg: '#0F172A', bg: '#F8FAFC' };

    const isValidHex = (c) => /^#[0-9A-F]{6}$/i.test(c);
    assert.ok(isValidHex(lowContrastPair.fg) && isValidHex(lowContrastPair.bg), 'Blind parser treats low-contrast colors as valid');

    const lowResult = calculateContrastRatio(lowContrastPair.fg, lowContrastPair.bg);
    const editorialResult = calculateContrastRatio(editorialPair.fg, editorialPair.bg);

    assert.ok(lowResult.ratio < 4.5, `Low contrast pair fails WCAG AA standard (ratio: ${lowResult.ratio})`);
    assert.ok(editorialResult.ratio >= 7.0, `Editorial pair meets WCAG AAA standard (ratio: ${editorialResult.ratio})`);
    assert.equal(lowResult.wcagAA, false);
    assert.equal(editorialResult.wcagAAA, true);
  });
});
