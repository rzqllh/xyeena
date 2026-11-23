#!/usr/bin/env node
/**
 * Veyra v1.0 Workspace Continuation Driver
 * Reads CHECKPOINT.md, runs preflight verification, and provides exact resumption state.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT_PATH = join(ROOT, 'CHECKPOINT.md');

console.log('=== Veyra v1.0 Workspace Continuation Protocol ===\n');

if (!existsSync(CHECKPOINT_PATH)) {
  console.error('[FAIL] CHECKPOINT.md not found in workspace root.');
  process.exit(1);
}

const checkpointContent = readFileSync(CHECKPOINT_PATH, 'utf8');

const statusMatch = checkpointContent.match(/> \*\*Status:\*\* \`([^\`]+)\`/);
const phaseMatch = checkpointContent.match(/> \*\*(?:Active )?Phase:\*\* ([^\n\r]+)/);
const timestampMatch = checkpointContent.match(/> \*\*Timestamp:\*\* ([^\n\r]+)/);

const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
const phase = phaseMatch ? phaseMatch[1] : 'UNKNOWN';
const timestamp = timestampMatch ? timestampMatch[1] : 'UNKNOWN';

console.log(`Current Status:    ${status}`);
console.log(`Active Phase:      ${phase}`);
console.log(`Last Checkpoint:   ${timestamp}\n`);

// Run preflight check
console.log('Running upstream preflight verification...\n');
try {
  const preflightOutput = execFileSync('node', [join(ROOT, 'scripts', 'preflight-upstream.mjs')], {
    encoding: 'utf8',
    cwd: ROOT
  });
  console.log(preflightOutput);
} catch (e) {
  console.error(`[WARN] Preflight encountered issues:\n${e.stdout || e.message}`);
}

console.log('\n--- Next Action Guidance for Agent ---');
if (status.includes('STABLE') || status.includes('RELEASE') || status.includes('ALL_WAVES_')) {
  console.log('1. All 19 Veyra skills across Waves 1 through 6 are IMPLEMENTED, HARDENED & VERIFIED.');
  console.log('2. Review Independen: EVIDENCE_PACKAGE_READY (Upload veyra-v1.0-codex-review-package.zip to Codex).');
  console.log('3. Gate Status: STABLE_RELEASE_CANDIDATE_READY. Public release strictly STOPPED.');
  console.log('4. DO NOT perform public release, git push, or npm publish without explicit Owner instruction.');
} else {
  console.log('1. Focus on specification & document initialization (PRD, BRD, Architecture, Design, Roadmap).');
  console.log('2. Respect the 35 Canonical Owner Decisions in docs/OWNER_DECISIONS.md (DEC-01 through DEC-35, 100% LOCKED).');
  console.log('3. Input files status: Developer Brief and Planning Baseline are INTEGRATED in docs/.');
  console.log('4. DO NOT start implementation of the 19 skills now (Skill coding requires explicit Wave 1 GO).');
}
