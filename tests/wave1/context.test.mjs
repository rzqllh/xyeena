import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { compressContext, calculateInformationDensity, extractTechnicalFacts, enforceMemoryBoundary } from '../../skills/veyra-context/engine.mjs';

describe('Veyra Context — Fact Preservation Invariance (DEC-24, RE-06)', () => {
  test('extracts all technical facts accurately', () => {
    const sample = 'Checked commit b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f on C:/repo/dist/archive.zip according to DEC-33 with 100.0% match.';
    const facts = extractTechnicalFacts(sample);
    assert.ok(facts.hashes.includes('b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f'));
    assert.ok(facts.decisions.includes('DEC-33'));
    assert.ok(facts.paths.some(p => p.includes('C:/repo/dist/archive.zip')));
    assert.ok(facts.numbers.includes('100.0%'));
  });

  test('compresses conversational fluff without dropping any technical facts', () => {
    const verbose = `Sure, I'd be happy to help with that! Here is the latest status for your project.
Checked commit b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f at references/manifest.json per DEC-02.
Hope this helps! Let me know if you need anything else!`;

    const res = compressContext(verbose);
    assert.ok(res.compressedBytes < res.originalBytes);
    assert.ok(res.compressionRatio < 1.0);
    // Invariance: technical facts must remain present
    assert.ok(res.compressedText.includes('b6081f09b1be68f15b73babb1411835756860a338845d7f5be4918fb5b4f2c1f'));
    assert.ok(res.compressedText.includes('references/manifest.json'));
    assert.ok(res.compressedText.includes('DEC-02'));
    // Fluff must be stripped
    assert.ok(!res.compressedText.includes("Sure, I'd be happy to help"));
    assert.ok(!res.compressedText.includes("Hope this helps"));
  });
});

describe('Veyra Context — Information Density & Memory Fencing', () => {
  test('calculates technical density metric', () => {
    const highDensity = 'DEC-01 DEC-02 commit a98e38504fdefc5ae64430c859d0f3ee10593ac53dbdeefb52c4d5e164316d51 file workspace/docs/PRD.md';
    const lowDensity = 'We are having a very nice conversation about various topics and ideas that might be interesting to explore together sometime soon.';

    const mHigh = calculateInformationDensity(highDensity);
    const mLow = calculateInformationDensity(lowDensity);

    assert.ok(mHigh.technicalDensity > mLow.technicalDensity);
    assert.ok(mHigh.totalFactCount >= 4);
    assert.equal(mLow.totalFactCount, 0);
  });

  test('enforces memory boundary with anchor slots', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({ id: i, text: `Turn ${i}` }));
    const bounded = enforceMemoryBoundary(entries, 6);

    assert.equal(bounded.length, 7); // 2 head + 1 summary + 4 tail
    assert.equal(bounded[0].id, 0);
    assert.equal(bounded[1].id, 1);
    assert.equal(bounded[bounded.length - 1].id, 19);
    assert.equal(bounded[2].type, 'COMPACTED_SUMMARY');
  });
});
