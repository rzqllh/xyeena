/**
 * Test Suite: Artifact Governance & Adaptive Persistence (P10 / DEC-28 / DEC-30)
 * Verifies adaptive artifact persistence criteria, directory resolution conforming
 * to project conventions, atomic document writing, and scratch isolation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  ARTIFACT_TYPES,
  shouldPersistArtifact,
  resolveArtifactPath,
  writeArtifactAtomic,
  writeScratchFile
} from '../src/runtime/index.mjs';

test('Artifact Governance: negative rules prevent persistent artifacts for trivial tasks (DEC-30)', () => {
  const typoCheck = shouldPersistArtifact({ prompt: 'fix typo di readme line 12' });
  assert.equal(typoCheck.shouldPersist, false);

  const calcCheck = shouldPersistArtifact({ prompt: 'hitung token budget untuk prompt ini' });
  assert.equal(calcCheck.shouldPersist, false);

  const minorCheck = shouldPersistArtifact({ isTypoOrMinor: true, prompt: 'rename variable foo to bar' });
  assert.equal(minorCheck.shouldPersist, false);
});

test('Artifact Governance: positive rules trigger adaptive persistence (DEC-30)', () => {
  // Explicit request
  const explicitPlan = shouldPersistArtifact({ prompt: 'tolong buat plan untuk migrasi database' });
  assert.equal(explicitPlan.shouldPersist, true);
  assert.equal(explicitPlan.artifactType, ARTIFACT_TYPES.PLAN);

  const explicitAdr = shouldPersistArtifact({ prompt: 'catat ADR untuk adopsi sqlite' });
  assert.equal(explicitAdr.shouldPersist, true);
  assert.equal(explicitAdr.artifactType, ARTIFACT_TYPES.DECISION);

  // Multi-phase or architectural
  const multiPhase = shouldPersistArtifact({ isMultiPhase: true, prompt: 'rebuild core engine' });
  assert.equal(multiPhase.shouldPersist, true);

  // Handoff requirement
  const handoff = shouldPersistArtifact({ requiresHandoff: true, prompt: 'session continuation' });
  assert.equal(handoff.shouldPersist, true);

  // High risk
  const highRisk = shouldPersistArtifact({ isHighRisk: true, prompt: 'patch auth bypass' });
  assert.equal(highRisk.shouldPersist, true);
});

test('Artifact Governance: path resolution respects repository conventions', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-art-'));

  try {
    // Default fallback docs/plans
    const defaultPath = resolveArtifactPath({
      cwd: tmpDir,
      type: ARTIFACT_TYPES.PLAN,
      slug: 'migration-phase-1'
    });
    assert.ok(defaultPath.includes(path.join('docs', 'plans')));
    assert.ok(defaultPath.endsWith('migration-phase-1.md'));

    // Existing convention: if plans/ directory exists, respect it!
    const customPlansDir = path.join(tmpDir, 'plans');
    fs.mkdirSync(customPlansDir, { recursive: true });

    const respectedPath = resolveArtifactPath({
      cwd: tmpDir,
      type: ARTIFACT_TYPES.PLAN,
      slug: 'new-feature'
    });
    assert.ok(respectedPath.startsWith(customPlansDir));

    // Boundary violation protection
    assert.throws(() => {
      resolveArtifactPath({
        cwd: tmpDir,
        type: ARTIFACT_TYPES.PLAN,
        explicitPath: '../../etc/passwd'
      });
    }, /boundary violation/i);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Artifact Governance: writeArtifactAtomic writes atomically without corruption', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-art-write-'));

  try {
    const targetFile = path.join(tmpDir, 'docs', 'plans', 'my-plan.md');
    const content = '# Execution Plan\n\nPhase 1: Verification.';
    const metadata = { status: 'DRAFT', author: 'Cortex' };

    const result = writeArtifactAtomic({
      filePath: targetFile,
      content,
      metadata
    });

    assert.equal(result.written, true);
    assert.ok(fs.existsSync(targetFile));

    const readBack = fs.readFileSync(targetFile, 'utf8');
    assert.ok(readBack.includes('status: "DRAFT"'));
    assert.ok(readBack.includes('# Execution Plan'));

    // Ensure no temporary files remained
    const files = fs.readdirSync(path.dirname(targetFile));
    assert.equal(files.length, 1);
    assert.equal(files[0], 'my-plan.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Artifact Governance: writeScratchFile isolates scratch files from docs (DEC-28)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-art-scratch-'));

  try {
    const scratchPath = writeScratchFile({
      cwd: tmpDir,
      filename: 'temp-calc.json',
      content: JSON.stringify({ temp: true })
    });

    assert.ok(scratchPath.includes(path.join('.xyeena', 'scratch')));
    assert.ok(fs.existsSync(scratchPath));
    assert.equal(fs.existsSync(path.join(tmpDir, 'docs')), false, 'docs/ directory must not be created for scratch files');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
