/**
 * Xyeena Runtime - Artifact Governance Engine (P10 / DEC-28 / DEC-30)
 *
 * Adaptive Artifact Persistence & Strict Isolation:
 * - Differentiates user-facing persistent artifacts from internal state and temporary scratch.
 * - Enforces adaptive persistence criteria (DEC-30): context and purpose-driven, not rigid tier counters.
 * - Respects existing repository documentation structures (docs/plans, docs/audits, docs/decisions, etc.).
 * - Atomic document writing via .tmp + fs.renameSync to prevent partial/corrupted writes.
 * - Prevents collision and arbitrary directory pollution.
 */

import fs from 'node:fs';
import path from 'node:path';

export const ARTIFACT_TYPES = Object.freeze({
  PLAN: 'PLAN',
  AUDIT: 'AUDIT',
  DECISION: 'DECISION', // ADR
  REVIEW: 'REVIEW',
  SCRATCH: 'SCRATCH'
});

export const ARTIFACT_DIRECTORIES = Object.freeze({
  [ARTIFACT_TYPES.PLAN]: 'docs/plans',
  [ARTIFACT_TYPES.AUDIT]: 'docs/audits',
  [ARTIFACT_TYPES.DECISION]: 'docs/decisions',
  [ARTIFACT_TYPES.REVIEW]: 'docs/reviews',
  [ARTIFACT_TYPES.SCRATCH]: '.xyeena/scratch'
});

/**
 * Determine whether a persistent artifact should be generated for the given context.
 * Complies with DEC-30 (Adaptive Artifact Persistence).
 *
 * @param {object} context
 * @param {string} [context.prompt='']
 * @param {string} [context.tier='']
 * @param {string} [context.mode='']
 * @param {boolean} [context.explicitRequest=false]
 * @param {boolean} [context.isMultiPhase=false]
 * @param {boolean} [context.requiresHandoff=false]
 * @param {boolean} [context.isAudit=false]
 * @param {boolean} [context.isDecision=false]
 * @param {boolean} [context.isHighRisk=false]
 * @returns {{ shouldPersist: boolean, reason: string, artifactType: string|null }}
 */
export function shouldPersistArtifact(context = {}) {
  const prompt = (context.prompt || '').toLowerCase();

  // Negative rules (DEC-30): NEVER persist for typos, trivial Q&A, short queries
  if (
    /\b(typo|fix typo|spelling|rename var|one line|quick question|hitung|calculate)\b/i.test(prompt) ||
    context.isTypoOrMinor === true
  ) {
    return {
      shouldPersist: false,
      reason: 'Negative rule: trivial typo, calculation, or minor fix does not warrant persistent artifact.',
      artifactType: null
    };
  }

  // Positive Rule 1: Explicit user request
  if (
    context.explicitRequest ||
    /\b(buat plan|buat rencana|create plan|tulis plan|buat adr|catat adr|buat audit|simpan laporan|export report)\b/i.test(prompt)
  ) {
    let type = ARTIFACT_TYPES.PLAN;
    if (/\b(adr|decision|arsitektur)\b/i.test(prompt) || context.isDecision) type = ARTIFACT_TYPES.DECISION;
    else if (/\b(audit|evaluasi|investigasi)\b/i.test(prompt) || context.isAudit) type = ARTIFACT_TYPES.AUDIT;
    else if (/\b(review|tinjau)\b/i.test(prompt)) type = ARTIFACT_TYPES.REVIEW;

    return {
      shouldPersist: true,
      reason: 'Explicit user request for document persistence.',
      artifactType: type
    };
  }

  // Positive Rule 2: Multi-phase complex work or dependency tracking
  if (context.isMultiPhase || context.tier === 'TIER_3_ARCHITECTURAL') {
    return {
      shouldPersist: true,
      reason: 'Multi-phase or architectural task requires tracked persistent documentation.',
      artifactType: context.isAudit ? ARTIFACT_TYPES.AUDIT : ARTIFACT_TYPES.PLAN
    };
  }

  // Positive Rule 3: Session handoff or approval gate requirement
  if (context.requiresHandoff) {
    return {
      shouldPersist: true,
      reason: 'Multi-session continuation or handoff requires persistent progress ledger.',
      artifactType: ARTIFACT_TYPES.PLAN
    };
  }

  // Positive Rule 4: Preserving audit, review, or architecture decision evidence
  if (context.isAudit) {
    return {
      shouldPersist: true,
      reason: 'Audit findings require permanent epistemic evidence preservation.',
      artifactType: ARTIFACT_TYPES.AUDIT
    };
  }
  if (context.isDecision) {
    return {
      shouldPersist: true,
      reason: 'Architectural decision requires immutable ADR record.',
      artifactType: ARTIFACT_TYPES.DECISION
    };
  }

  // Positive Rule 5: High risk / security / production blast radius
  if (context.isHighRisk || context.mode === 'EXPLICIT_RISK_GATE') {
    return {
      shouldPersist: true,
      reason: 'High-risk or explicit risk gate operation requires documented safety plan.',
      artifactType: ARTIFACT_TYPES.PLAN
    };
  }

  // Default: do not pollute repository with unnecessary files
  return {
    shouldPersist: false,
    reason: 'Standard scoped task completed without requiring persistent file storage.',
    artifactType: null
  };
}

/**
 * Resolve target path for an artifact, prioritizing existing repository conventions.
 *
 * @param {object} params
 * @param {string} [params.cwd=process.cwd()]
 * @param {string} params.type - Member of ARTIFACT_TYPES
 * @param {string} params.slug - Title or slug for filename
 * @param {string} [params.explicitPath]
 * @returns {string} Absolute resolved file path
 */
export function resolveArtifactPath({ cwd = process.cwd(), type, slug, explicitPath } = {}) {
  const root = path.resolve(cwd);

  if (explicitPath) {
    const target = path.resolve(root, explicitPath);
    if (!target.startsWith(root)) {
      throw new Error(`Security boundary violation: artifact path escapes workspace root: ${explicitPath}`);
    }
    return target;
  }

  const cleanSlug = (slug || 'unnamed-artifact')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  const filename = `${cleanSlug}.md`;

  // Check for existing project conventions
  const candidates = [
    ARTIFACT_DIRECTORIES[type] || 'docs',
    type === ARTIFACT_TYPES.PLAN ? 'plans' : null,
    type === ARTIFACT_TYPES.DECISION ? 'docs/adr' : null,
    type === ARTIFACT_TYPES.DECISION ? 'adr' : null,
    'docs'
  ].filter(Boolean);

  let selectedDir = path.join(root, ARTIFACT_DIRECTORIES[type] || 'docs');
  for (const cand of candidates) {
    const fullCand = path.join(root, cand);
    if (fs.existsSync(fullCand) && fs.statSync(fullCand).isDirectory()) {
      selectedDir = fullCand;
      break;
    }
  }

  return path.join(selectedDir, filename);
}

/**
 * Write artifact atomically using a temporary file and atomic rename.
 * Prevents partial writes, race conditions, and corrupted files.
 * Enforces collision protection: never silently replaces existing files without overwrite: true.
 *
 * @param {object} params
 * @param {string} params.filePath
 * @param {string} params.content
 * @param {Record<string, unknown>} [params.metadata]
 * @param {boolean} [params.overwrite=false]
 * @returns {{ path: string, bytes: number, written: boolean, overwritten: boolean, deduplicated: boolean }}
 */
export function writeArtifactAtomic({ filePath, content, metadata = null, overwrite = false }) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Valid filePath string required');
  }
  if (typeof content !== 'string') {
    throw new Error('Artifact content must be a string');
  }

  // Prevent silent replacement: if file exists and overwrite is false, deduplicate filename
  let finalTarget = filePath;
  let deduplicated = false;
  if (fs.existsSync(filePath) && !overwrite) {
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    finalTarget = path.join(dir, `${base}-${Date.now().toString(36)}${ext}`);
    deduplicated = true;
  }

  const dir = path.dirname(finalTarget);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let finalContent = content;
  if (metadata && typeof metadata === 'object') {
    const yamlHeader = [
      '---',
      ...Object.entries(metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
      '---',
      ''
    ].join('\n');
    finalContent = `${yamlHeader}\n${content}`;
  }

  const tmpPath = `${finalTarget}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;

  try {
    fs.writeFileSync(tmpPath, finalContent, 'utf8');
    fs.renameSync(tmpPath, finalTarget);
    return {
      path: finalTarget,
      bytes: Buffer.byteLength(finalContent, 'utf8'),
      written: true,
      overwritten: fs.existsSync(filePath) && overwrite,
      deduplicated
    };
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    throw err;
  }
}

/**
 * Write a scratch or temporary session file in the isolated .xyeena/scratch directory.
 * DEC-28: Never mix scratch files with user deliverables or repository source.
 *
 * @param {object} params
 * @param {string} [params.cwd=process.cwd()]
 * @param {string} params.filename
 * @param {string} params.content
 * @returns {string} Absolute path to written scratch file
 */
export function writeScratchFile({ cwd = process.cwd(), filename, content }) {
  const root = path.resolve(cwd);
  const scratchDir = path.join(root, '.xyeena', 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const safeFilename = path.basename(filename);
  const targetPath = path.join(scratchDir, safeFilename);
  fs.writeFileSync(targetPath, content, 'utf8');
  return targetPath;
}
