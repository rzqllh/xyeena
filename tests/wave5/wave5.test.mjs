import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateContrastRatio, auditHallmarkFloor } from '../../skills/veyra-interface/engine.mjs';
import { detectMarketingSlop, calculateReadabilityEconomy } from '../../skills/veyra-writing/engine.mjs';

describe('Veyra Wave 5 — Design & Content Skills', () => {
  test('veyra-interface: WCAG contrast ratio calculation and Hallmark Floor audit', () => {
    // Pure black on pure white: ratio 21:1
    const contrast = calculateContrastRatio('#000000', '#ffffff');
    assert.equal(contrast.ratio, 21);
    assert.equal(contrast.wcagAA, true);
    assert.equal(contrast.wcagAAA, true);

    // Light gray on white: low contrast
    const lowContrast = calculateContrastRatio('#cccccc', '#ffffff');
    assert.equal(lowContrast.wcagAA, false);

    // Generic AI purple gradient check
    const floorCheck = auditHallmarkFloor('background: linear-gradient(to right, purple, indigo);');
    assert.equal(floorCheck.passesTheFloor, false);
    assert.equal(floorCheck.issues.length, 1);
  });

  test('veyra-writing: marketing slop elimination and readability economy', () => {
    const slop = detectMarketingSlop('This revolutionary tool will seamlessly empower your workflow.');
    assert.equal(slop.length, 3); // revolutionary, seamlessly, empower
    assert.ok(slop.some(s => s.buzzword.toLowerCase() === 'revolutionary'));
    assert.ok(slop.some(s => s.buzzword.toLowerCase() === 'seamlessly'));

    const economy = calculateReadabilityEconomy('Keep responses concise, clear, and factual.');
    assert.equal(economy.isEconomical, true);
    assert.ok(economy.averageWordLength < 8.0);
  });
});
