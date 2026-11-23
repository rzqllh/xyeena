import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScope, evaluateAntiSlop } from '../../skills/veyra-core/engine.mjs';
import { compressContext, calculateInformationDensity } from '../../skills/veyra-context/engine.mjs';

describe('Veyra Wave 1 — Comparative Evaluation (A/B Testing Baseline vs Veyra)', () => {
  test('A/B Comparison: Naive Fluffy Agent Output vs Veyra Core Anti-Slop & Context Compression', () => {
    const naiveAgentOutput = [
      'Certainly! I would be delighted to delve into the implementation details of this revolutionary project!',
      'This cutting-edge release is a testament to the seamless integration of modern software architectures.',
      'We updated the following files: workspace/skills/veyra-core/engine.mjs and workspace/tests/wave1/core.test.mjs.',
      'Commit SHA: b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f — verified with 100% accuracy.',
      'I hope this comprehensive overview serves you well! Please let me know if you need anything else!'
    ].join('\n');

    // Comparator A: Naive baseline has zero anti-slop filters and high token waste
    const naiveAntiSlop = evaluateAntiSlop(naiveAgentOutput);
    assert.equal(naiveAntiSlop.pass, false, 'Baseline A fails anti-slop due to generic AI buzzwords and em-dash');
    assert.ok(naiveAntiSlop.findings.length >= 4, 'Baseline A produces multiple anti-slop violations');

    // Comparator B: Veyra Context Compression
    const veyraCompressed = compressContext(naiveAgentOutput);
    assert.ok(veyraCompressed.compressionRatio < 0.85, 'Veyra achieves >15% byte reduction by stripping boilerplate fluff');

    // Invariance Check: Technical facts preserved 100%
    assert.ok(veyraCompressed.preservedFacts.hashes.includes('b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f'));
    assert.ok(veyraCompressed.preservedFacts.paths.length >= 2);

    // Information Density: Veyra density must exceed Naive baseline
    const naiveDensity = calculateInformationDensity(naiveAgentOutput);
    const veyraDensity = calculateInformationDensity(veyraCompressed.compressedText);
    assert.ok(veyraDensity.technicalDensity > naiveDensity.technicalDensity, 'Veyra compressed output must have higher technical density');
  });

  test('Comparative Baselines: Naive Truncation vs Head+Tail Truncation vs Veyra Context', () => {
    const text = [
      'Certainly! Here is the latest progress update for our sprint.',
      'First, we verified DEC-01 for the two connected ZIPs and DEC-02 for pinned recovery.',
      'The primary repository config is located at workspace/docs/OWNER_DECISIONS.md with status 100%.',
      'In the middle of the workflow, we observed commit SHA b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f in references/upstreams.lock.json.',
      'Critical path resolution confirmed that DEC-09 governs the dependency waves.',
      'Toward the end, we checked workspace/tests/wave1/context.test.mjs and confirmed DEC-24 for handoff checkpoints.',
      'I hope this comprehensive overview serves you well! Please let me know if you need anything else!'
    ].join('\n');

    const allFacts = [
      'DEC-01',
      'DEC-02',
      'workspace/docs/OWNER_DECISIONS.md',
      '100%',
      'b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f',
      'references/upstreams.lock.json',
      'DEC-09',
      'workspace/tests/wave1/context.test.mjs',
      'DEC-24'
    ];

    const totalFacts = allFacts.length; // 9 facts

    // 1. Baseline 1: Naive Truncation (50% cutoff)
    const naiveCut = text.slice(0, Math.floor(text.length * 0.5));
    const naiveRetained = allFacts.filter(f => naiveCut.includes(f));
    const naiveRecall = Number((naiveRetained.length / totalFacts).toFixed(4));
    const naiveRatio = Number((Buffer.byteLength(naiveCut, 'utf8') / Buffer.byteLength(text, 'utf8')).toFixed(4));

    // 2. Baseline 2: Head + Tail Truncation (25% head + 25% tail, dropping 50% middle)
    const headLen = Math.floor(text.length * 0.25);
    const tailLen = Math.floor(text.length * 0.25);
    const headTailText = text.slice(0, headLen) + '\n[...TRUNCATED...]\n' + text.slice(-tailLen);
    const htRetained = allFacts.filter(f => headTailText.includes(f));
    const htRecall = Number((htRetained.length / totalFacts).toFixed(4));
    const htRatio = Number((Buffer.byteLength(headTailText, 'utf8') / Buffer.byteLength(text, 'utf8')).toFixed(4));

    // 3. Veyra Context Compression
    const veyraRes = compressContext(text);
    const veyraRetained = allFacts.filter(f => veyraRes.compressedText.includes(f));
    const veyraRecall = Number((veyraRetained.length / totalFacts).toFixed(4));
    const veyraRatio = veyraRes.compressionRatio;

    // Numerical Verification:
    // Naive truncation drops middle/end facts (retains 4/9, recall: 0.4444)
    assert.ok(naiveRecall < 0.60, 'Naive recall should drop middle/end: ' + naiveRecall);
    assert.equal(naiveRetained.length, 4, 'Naive truncation keeps 4/9 facts');

    // Head+Tail drops middle facts (b6081f09b..., references/upstreams..., DEC-09) (retains 4/9, recall: 0.4444)
    assert.ok(htRecall < 0.60, 'Head+Tail recall should drop middle: ' + htRecall);
    assert.equal(htRetained.length, 3, 'Head+Tail keeps 4/9 facts');

    // Veyra Context preserves 100% of facts (9/9, recall: 1.0000) while trimming fluff
    assert.equal(veyraRecall, 1.0, 'Veyra retains all facts');
    assert.equal(veyraRetained.length, 9, 'Veyra keeps 9/9 facts');
    assert.ok(veyraRatio < 0.85, 'Veyra ratio is economical: ' + veyraRatio);
  });

  test('A/B Comparison: Unfenced Agent Write vs Veyra Core Scope Enforcement', () => {
    const maliciousOrAccidentalFiles = [
      'workspace/skills/veyra-core/SKILL.md',
      'workspace/package.json',
      'C:/Windows/System32/drivers/etc/hosts',
      '../../xyeena/package.json'
    ];

    const fenceResult = evaluateScope({
      targetFiles: maliciousOrAccidentalFiles,
      allowedPatterns: ['workspace/skills/*'],
      actionType: 'WRITE'
    });

    assert.equal(fenceResult.verdict, 'BLOCKED_SCOPE');
    assert.equal(fenceResult.allowed, false);
    assert.equal(fenceResult.violations.length, 3);
    assert.ok(fenceResult.violations.includes('../../xyeena/package.json'), 'Protects legacy workspace boundaries');
  });
});
