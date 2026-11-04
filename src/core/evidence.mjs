/**
 * Xyeena Core - Evidence & Anti-Hallucination Claim Verifier
 * Enforces strict 4-tier epistemic classification and forbids false completion claims.
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';

export const EVIDENCE_TIERS = Object.freeze({
  OBSERVED: 'OBSERVED',     // Directly verified via disk file, exit code, terminal trace
  INFERRED: 'INFERRED',     // High-probability deduction based on verified evidence
  UNKNOWN: 'UNKNOWN',       // Unchecked, missing, or blocked from inspection
  PROPOSED: 'PROPOSED'      // Suggested design or plan not yet executed or applied
});

export const VERDICT_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  INFERRED: 'INFERRED',
  UNKNOWN: 'UNKNOWN',
  PROPOSED: 'PROPOSED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  NOT_RUN: 'NOT_RUN'
});

export class EvidenceRecord {
  /**
   * @param {object} params
   * @param {string} params.claim - Technical statement or assertion
   * @param {string} params.tier - Member of EVIDENCE_TIERS
   * @param {string} [params.provenance=''] - Source file path, command, or citation
   * @param {string} [params.status=VERDICT_STATUS.NOT_RUN] - Member of VERDICT_STATUS
   * @param {Record<string, unknown>} [params.metadata={}] - Supporting artifacts
   */
  constructor({ claim, tier, provenance = '', status = VERDICT_STATUS.NOT_RUN, metadata = {} }) {
    if (!EVIDENCE_TIERS[tier]) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Invalid evidence tier: ${tier}`);
    }
    this.claim = claim;
    this.tier = tier;
    this.provenance = provenance;
    this.status = status;
    this.metadata = metadata;
    this.recordedAt = new Date().toISOString();
  }

  isEmpiricallyGrounded() {
    return this.tier === EVIDENCE_TIERS.OBSERVED && this.status === VERDICT_STATUS.VERIFIED;
  }
}

export class EvidenceLedger {
  constructor() {
    this.records = [];
  }

  /**
   * Add a claim to the ledger.
   * @param {EvidenceRecord} record
   */
  add(record) {
    if (!(record instanceof EvidenceRecord)) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Entry must be an instance of EvidenceRecord');
    }
    this.records.push(record);
    return record;
  }

  /**
   * Validate that a completion assertion (PASS/VERIFIED) has direct empirical evidence.
   * @param {string} claimDescription
   * @param {object} verificationEvidence
   * @param {number} verificationEvidence.exitCode - Command exit code
   * @param {string} [verificationEvidence.stdout=''] - Standard output
   * @param {string} [verificationEvidence.stderr=''] - Standard error
   * @param {string} [verificationEvidence.artifactPath=''] - Output file path
   * @returns {EvidenceRecord}
   */
  assertVerification(claimDescription, verificationEvidence) {
    const { exitCode, stdout = '', stderr = '', artifactPath = '' } = verificationEvidence;
    
    if (exitCode !== 0) {
      const record = new EvidenceRecord({
        claim: claimDescription,
        tier: EVIDENCE_TIERS.OBSERVED,
        provenance: artifactPath || 'terminal_execution',
        status: VERDICT_STATUS.FAILED,
        metadata: { exitCode, stdout, stderr }
      });
      this.add(record);
      throw new XyeenaError(
        ERROR_CODES.MISSING_EVIDENCE,
        `Verification assertion failed for claim "${claimDescription}" with exit code ${exitCode}`,
        { exitCode, stderr: stderr.slice(0, 500) }
      );
    }

    const record = new EvidenceRecord({
      claim: claimDescription,
      tier: EVIDENCE_TIERS.OBSERVED,
      provenance: artifactPath || 'terminal_execution',
      status: VERDICT_STATUS.VERIFIED,
      metadata: { exitCode, stdoutSummary: stdout.slice(0, 300) }
    });

    return this.add(record);
  }

  /**
   * Reject ungrounded pass claims.
   * @param {string} statusClaim
   */
  forbidUnverifiedPass(statusClaim) {
    const isClaimingPass = /pass|verified|success|complete/i.test(statusClaim);
    if (isClaimingPass) {
      const hasVerified = this.records.some(r => r.isEmpiricallyGrounded());
      if (!hasVerified) {
        throw new XyeenaError(
          ERROR_CODES.MISSING_EVIDENCE,
          `Cannot assert "${statusClaim}" without at least one OBSERVED & VERIFIED evidence record in ledger.`
        );
      }
    }
  }

  summary() {
    return {
      total: this.records.length,
      observed: this.records.filter(r => r.tier === EVIDENCE_TIERS.OBSERVED).length,
      inferred: this.records.filter(r => r.tier === EVIDENCE_TIERS.INFERRED).length,
      unknown: this.records.filter(r => r.tier === EVIDENCE_TIERS.UNKNOWN).length,
      proposed: this.records.filter(r => r.tier === EVIDENCE_TIERS.PROPOSED).length,
      verified: this.records.filter(r => r.status === VERDICT_STATUS.VERIFIED).length,
      failed: this.records.filter(r => r.status === VERDICT_STATUS.FAILED).length
    };
  }
}
