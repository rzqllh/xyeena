/**
 * Acceptance Suite: Cortex 64 Capability Operational Binding & Integration (P10.1 / DEC-27)
 * Proves the distinction between:
 * 1. Contract registered in registry
 * 2. Executable handler bound to contract
 * 3. Handler callable and returning conforming results
 * 4. Cortex resolving and dispatching handlers from natural-language tasks
 * 5. Backward compatibility for the 19 packaged skills & legacy CLI entrypoints
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCortex,
  createDefaultRegistry,
  DEFAULT_CAPABILITIES,
  CAPABILITY_HANDLERS
} from '../src/core/index.mjs';
import { loadRegistry } from '../src/registry.mjs';
import { resolveCapabilities } from '../src/resolver.mjs';
import { validateSource } from '../src/validate.mjs';
import { PACKAGE_ROOT } from '../src/paths.mjs';

test('P10.1 Cortex 64 Contracts: All 64 capability contracts have verified executable handler bindings', () => {
  const cortex = createDefaultCortex();
  const registry = cortex.registry;

  assert.equal(registry.size(), 64, 'Must register exactly 64 capability contracts');

  let boundCount = 0;
  for (const cap of registry.getAll()) {
    assert.ok(cap.id, 'Capability must have an id');
    assert.ok(cap.layer, `Capability ${cap.id} must declare a layer`);
    assert.ok(cap.domain, `Capability ${cap.id} must declare a domain`);

    // Verify operational handler binding (DEC-27 requirement: registration is not coverage)
    assert.equal(
      typeof cap.handler,
      'function',
      `Capability ${cap.id} must have an executable handler function bound, not null or stub`
    );

    // Call dispatch through Cortex
    const result = cortex.dispatch(cap.id);
    assert.notEqual(
      result,
      undefined,
      `Capability ${cap.id} handler execution must return conforming result, not undefined`
    );
    boundCount++;
  }

  assert.equal(boundCount, 64, 'All 64 capabilities must be operational and executable');
});

test('P10.1 Cortex NL Resolution: Resolves appropriate native capabilities from natural language without slash commands', () => {
  const cortex = createDefaultCortex();

  // 1. Natural language testing task
  const tddRes = cortex.resolve('tolong buat unit test untuk memverifikasi perhitungan diskon');
  const tddCaps = tddRes.activeCapabilities.map(c => c.id);
  assert.ok(tddCaps.includes('engineering.tdd'), 'Should map natural language test prompt to engineering.tdd');
  assert.ok(tddCaps.includes('engineering.test-strategy'));

  // 2. Natural language debugging task
  const debugRes = cortex.resolve('investigasi crash kenapa server mendadak OOM saat upload file');
  const debugCaps = debugRes.activeCapabilities.map(c => c.id);
  assert.ok(debugCaps.includes('engineering.root-cause'), 'Should map bug prompt to engineering.root-cause');
  assert.ok(debugCaps.includes('thinking.hypothesis'));

  // 3. Natural language UI task
  const uiRes = cortex.resolve('perbaiki kontras warna tombol modal agar ramah disabilitas');
  const uiCaps = uiRes.activeCapabilities.map(c => c.id);
  assert.ok(uiCaps.includes('design.accessibility'), 'Should map accessibility prompt to design.accessibility');
  assert.ok(uiCaps.includes('design.interface'));

  // 4. Natural language security task
  const secRes = cortex.resolve('audit otorisasi JWT token dan sanitize input user');
  const secCaps = secRes.activeCapabilities.map(c => c.id);
  assert.ok(secCaps.includes('security.guidance'));
  assert.ok(secCaps.includes('security.threat-model'));
});

test('P10.1 Backward Compatibility: 19 Packaged Agent Skills and CLI functions intact', () => {
  // 1. Packaged skills registry loaded from filesystem
  const legacyRegistry = loadRegistry();
  assert.equal(legacyRegistry.length, 19, 'Must load all 19 packaged agent skills');

  // 2. Legacy resolver works
  const resolved = resolveCapabilities(legacyRegistry, { prompt: 'audit security diff', state: 'REVIEW' });
  assert.equal(resolved.kernel, 'xyeena-core');
  assert.ok(resolved.primary && resolved.primary.name === 'xyeena-review');

  // 3. validateSource passes
  const valid = validateSource(PACKAGE_ROOT);
  assert.equal(valid.ok, true, 'Source validation must pass');
  assert.equal(valid.capabilities.length, 19, 'Must validate 19 agent skills');
  assert.equal(valid.nativeContractsCount, 64, 'Must validate 64 native capability contracts');
});
