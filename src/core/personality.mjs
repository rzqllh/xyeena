/**
 * Xyeena Core - Generic Behavioral Trait & Guidance Overlay (P13/P14 / DEC-32)
 *
 * Epistemic Provenance: XYN_ARCHITECTURAL_PRINCIPLES_SOURCE_INSPECTED_LOCAL.
 * Synthesized from locally inspected XYN architectural skills (`xyn-evidence-verification`,
 * `xyn-qa-audit`, `xyn-orchestrate`) on host filesystem.
 * Strictly extracts methodology principles:
 *   1. Maker-Checker separation (author cannot self-certify).
 *   2. Empirical claim boundaries (raw inspection claims require attached primary artifacts).
 *   3. Adversarial testing (happy-path is not proof of production stability).
 *   4. Single governor invariant (Cortex controller routes and bounds all tasks).
 * Strictly avoids fictional character identities, character names, private personas, or system prompt hijacking.
 * Provides per-domain trait overlays with minimal token overhead (~50–120 tokens).
 */

import { estimateTokens } from './budget.mjs';

/**
 * Authoritative Behavioral Trait Families.
 */
export const BEHAVIORAL_TRAITS = Object.freeze({
  INVESTIGATIVE_SKEPTIC: {
    id: 'trait.investigative-skeptic',
    name: 'Investigative Skeptic',
    domain: 'research',
    guidance: 'Challenge unverified assumptions; distinguish OBSERVED from INFERRED. Require concrete evidence.',
    guardrail: 'Assertive, not obstructive.'
  },
  STRATEGIC_PLANNER: {
    id: 'trait.strategic-planner',
    name: 'Strategic Planner',
    domain: 'planning',
    guidance: 'Anticipate cross-cutting dependencies; formulate phased steps with verification gates and rollback paths.',
    guardrail: 'Adaptive effort; zero ceremony on micro tasks.'
  },
  DESIGN_CRAFT_TASTE: {
    id: 'trait.design-craft-taste',
    name: 'Design Craft & Taste',
    domain: 'design',
    guidance: 'Reject generic templates; enforce intentional visual hierarchy, WCAG 2.2 contrast/targets, and fluid grids.',
    guardrail: 'Preserve repository design tokens.'
  },
  PRECISION_ENGINEER: {
    id: 'trait.precision-engineer',
    name: 'Precision Engineer',
    domain: 'engineering',
    guidance: 'Make the smallest correct change. Refine before rebuilding; back changes with regression tests.',
    guardrail: 'Avoid premature abstraction.'
  },
  ROOT_CAUSE_DEBUGGER: {
    id: 'trait.root-cause-debugger',
    name: 'Root-Cause Debugger',
    domain: 'debugging',
    guidance: 'Follow 4-phase discipline: Reproduce -> Isolate -> Propose Fix -> Verify Fix. Avoid speculative patches.',
    guardrail: 'Diagnose from observed reproduction evidence.'
  },
  SECURITY_CAUTION: {
    id: 'trait.security-caution',
    name: 'Security Caution',
    domain: 'security',
    guidance: 'Model explicit trust boundaries and least privilege. Scoped diff review by default.',
    guardrail: 'Full audits strictly require explicit user consent.'
  },
  INDEPENDENT_REVIEWER: {
    id: 'trait.independent-reviewer',
    name: 'Independent Quality Reviewer',
    domain: 'review',
    guidance: 'Evaluate against objective contracts. Dual-axis: architectural depth and diff safety.',
    guardrail: 'Read-only inspection; no modifications.'
  },
  HUMAN_WRITING: {
    id: 'trait.human-writing',
    name: 'Human Writing & Microcopy',
    domain: 'writing',
    guidance: 'Write with direct, concise clarity. Eliminate corporate buzzwords, AI fillers, and robotic apologies.',
    guardrail: 'High density with natural user tone.'
  },
  ADAPTIVE_ORCHESTRATOR: {
    id: 'trait.adaptive-orchestrator',
    name: 'Adaptive Orchestrator',
    domain: 'orchestration',
    guidance: 'Select least costly route. Serialize shared writes, checkpoint task state, use host capabilities first.',
    guardrail: 'Cortex is sole governor; no unmanaged swarms.'
  },
  EVIDENCE_GROUNDING: {
    id: 'trait.evidence-grounding',
    name: 'Evidence Grounding & Overclaim Prevention',
    domain: 'verification',
    guidance: 'Enforce empirical claim boundaries. Statements asserting raw data or file inspection require attached primary evidence artifacts. Enforce conditional disclosure on synthetic/hypothetical tasks.',
    guardrail: 'Reject unattached raw data claims as overclaims; eliminate spurious precision.'
  },
  MAKER_CHECKER: {
    id: 'trait.maker-checker',
    name: 'Maker-Checker Separation',
    domain: 'review',
    guidance: 'Authors cannot verify or certify their own deliverables. Enforce independent review before completion.',
    guardrail: 'Reject self-certification with MakerCheckerViolation.'
  },
  ADVERSARIAL_TESTING: {
    id: 'trait.adversarial-testing',
    name: 'Adversarial QA Testing',
    domain: 'testing',
    guidance: 'Happy-path tests are not proof of production readiness. Actively probe boundary conditions, edge cases, error states, and unhandled failure modes.',
    guardrail: 'Challenge completion claims with fresh executable edge evidence.'
  }
});

export class BehavioralTraitOverlay {
  static resolveTraitsForDomain(domainOrIntent = '') {
    return BehavioralTraitOverlay.resolveTraits(domainOrIntent);
  }

  static formatTraitGuidance(traitsOrDomain = '') {
    if (typeof traitsOrDomain === 'string') {
      return BehavioralTraitOverlay.formatOverlay(traitsOrDomain).overlayText;
    }
    const traits = Array.isArray(traitsOrDomain) ? traitsOrDomain : [];
    const lines = ['# Architectural Guidance Overlay (DEC-32 Generic Behavioral Traits)'];
    for (const t of traits) {
      lines.push(`- **${t.name}:** ${t.guidance} *(Guardrail: ${t.guardrail})*`);
    }
    return lines.join('\n');
  }

  /**
   * Enforce Maker-Checker Separation Invariant (inspected from xyn-qa-audit).
   * Authors cannot evaluate or certify their own deliverables.
   */
  static validateMakerChecker({ author = '', reviewer = '' } = {}) {
    const cleanAuthor = String(author || '').trim().toLowerCase();
    const cleanReviewer = String(reviewer || '').trim().toLowerCase();

    if (!cleanAuthor || !cleanReviewer) {
      return {
        valid: false,
        violation: 'IncompletePrincipalSpecification',
        reason: 'Both author and reviewer identifiers are required to evaluate Maker-Checker boundary.'
      };
    }

    if (cleanAuthor === cleanReviewer) {
      return {
        valid: false,
        violation: 'MakerCheckerViolation',
        reason: `Maker-Checker violation: Author "${author}" cannot review or certify their own deliverable.`
      };
    }

    return {
      valid: true,
      author,
      reviewer,
      verdict: 'MAKER_CHECKER_SEPARATION_VERIFIED'
    };
  }

  /**
   * Enforce Empirical Claim Boundaries (inspected from xyn-evidence-verification).
   * Statements claiming raw data/file inspection require attached primary artifacts.
   */
  static validateEmpiricalClaim({ claimText = '', attachedArtifacts = [] } = {}) {
    const rawInspectionRegex = /\b(?:telah memeriksa data mentah|membaca langsung log database|verified against primary survey files|inspected raw database logs|inspected raw data files|verified against raw production data)\b/i;

    const assertsRawInspection = rawInspectionRegex.test(claimText);
    const hasArtifact = Array.isArray(attachedArtifacts) && attachedArtifacts.length > 0;

    if (assertsRawInspection && !hasArtifact) {
      return {
        valid: false,
        overclaim: true,
        violation: 'EmpiricalClaimBoundaryViolation',
        reason: 'Empirical inspection claim rejected as overclaim: Statement asserts raw data inspection without attached primary evidence artifact.'
      };
    }

    return {
      valid: true,
      overclaim: false,
      assertsRawInspection,
      artifactCount: hasArtifact ? attachedArtifacts.length : 0,
      verdict: 'EMPIDICAL_BOUNDARIES_CONFIRMED'
    };
  }

  /**
   * Enforce Hypothetical & Conceptual Guardrails (inspected from xyn-evidence-verification).
   * Tasks with synthetic/hypothetical assumptions must disclose their conditional nature and avoid spurious precision.
   */
  static validateHypotheticalDisclosure({ text = '', isHypothetical = false } = {}) {
    if (!isHypothetical) {
      return { compliant: true, isHypothetical: false };
    }

    const conditionalRegex = /\b(?:conditional|hypothetical|bersyarat|kondisional|asumsi|simulasi|scenario|skenario|synthetic|model)\b/i;
    const hasDisclosure = conditionalRegex.test(text);

    // Spurious precision check: e.g. claiming 99.999% without empirical sample
    const spuriousPrecisionRegex = /(?:\b99\.\d{3,}%?|\b0\.000\d+)/;
    const hasSpuriousPrecision = spuriousPrecisionRegex.test(text);

    if (!hasDisclosure) {
      return {
        compliant: false,
        violation: 'MissingConditionalDisclosure',
        reason: 'Hypothetical tasks must explicitly disclose their conditional and model-dependent nature.'
      };
    }

    if (hasSpuriousPrecision) {
      return {
        compliant: false,
        violation: 'SpuriousPrecisionDetected',
        reason: 'Spurious precision detected: Extreme statistical certainty asserted without empirical probability sample.'
      };
    }

    return {
      compliant: true,
      conditionalDisclosed: true,
      spuriousPrecisionDetected: false,
      verdict: 'HYPOTHETICAL_DISCLOSURE_VERIFIED'
    };
  }

  /**
   * Parse and validate QA Review Verdict Tokens (inspected from xyn-qa-audit).
   */
  static evaluateQaVerdict(verdictToken = '') {
    const raw = String(verdictToken || '').trim().toUpperCase();
    const tokenRegex = /^VERDICT:\s*(PASS|PASS_WITH_LIMITATIONS|FAIL|BLOCKED)$/;
    const match = raw.match(tokenRegex);

    if (!match) {
      return {
        validToken: false,
        status: 'UNKNOWN_VERDICT',
        reason: 'Review verdict must use standard token format: VERDICT: PASS | PASS_WITH_LIMITATIONS | FAIL | BLOCKED'
      };
    }

    const status = match[1];
    return {
      validToken: true,
      status,
      isAcceptable: status === 'PASS' || status === 'PASS_WITH_LIMITATIONS',
      requiresMitigation: status === 'PASS_WITH_LIMITATIONS'
    };
  }

  /**
   * Resolve relevant behavioral traits for a given task domain or intent.
   * @param {string} domainOrIntent - e.g. 'design', 'engineering', 'debugging', 'security', 'planning', 'writing'
   * @returns {Array<object>}
   */
  static resolveTraits(domainOrIntent = '') {
    const key = (domainOrIntent || '').toLowerCase();
    const traits = [];

    if (key.includes('design') || key.includes('ui') || key.includes('ux') || key.includes('css')) {
      traits.push(BEHAVIORAL_TRAITS.DESIGN_CRAFT_TASTE);
    }
    if (key.includes('plan') || key.includes('architect') || key.includes('roadmap')) {
      traits.push(BEHAVIORAL_TRAITS.STRATEGIC_PLANNER);
    }
    if (key.includes('debug') || key.includes('bug') || key.includes('fix') || key.includes('error')) {
      traits.push(BEHAVIORAL_TRAITS.ROOT_CAUSE_DEBUGGER);
    }
    if (key.includes('code') || key.includes('impl') || key.includes('exec') || key.includes('refactor')) {
      traits.push(BEHAVIORAL_TRAITS.PRECISION_ENGINEER);
    }
    if (key.includes('sec') || key.includes('auth') || key.includes('vuln') || key.includes('audit')) {
      traits.push(BEHAVIORAL_TRAITS.SECURITY_CAUTION);
    }
    if (key.includes('rev') || key.includes('eval') || key.includes('check')) {
      traits.push(BEHAVIORAL_TRAITS.INDEPENDENT_REVIEWER);
      traits.push(BEHAVIORAL_TRAITS.MAKER_CHECKER);
    }
    if (key.includes('test') || key.includes('qa') || key.includes('adversar')) {
      traits.push(BEHAVIORAL_TRAITS.ADVERSARIAL_TESTING);
    }
    if (key.includes('verif') || key.includes('claim') || key.includes('ground')) {
      traits.push(BEHAVIORAL_TRAITS.EVIDENCE_GROUNDING);
    }
    if (key.includes('write') || key.includes('doc') || key.includes('copy') || key.includes('readme')) {
      traits.push(BEHAVIORAL_TRAITS.HUMAN_WRITING);
    }
    if (key.includes('research') || key.includes('investigate') || key.includes('explore')) {
      traits.push(BEHAVIORAL_TRAITS.INVESTIGATIVE_SKEPTIC);
    }

    // Default fallback if no specific domain matched
    if (traits.length === 0) {
      traits.push(BEHAVIORAL_TRAITS.INVESTIGATIVE_SKEPTIC);
      traits.push(BEHAVIORAL_TRAITS.PRECISION_ENGINEER);
    }

    return traits;
  }

  /**
   * Format compact prompt overlay block for injection into prompt context.
   * Measured budget: ~50-120 tokens.
   * @param {string} domainOrIntent
   * @returns {{ overlayText: string, tokenEstimate: number, traitCount: number }}
   */
  static formatOverlay(domainOrIntent = '') {
    const traits = BehavioralTraitOverlay.resolveTraits(domainOrIntent);
    const lines = ['# Architectural Guidance Overlay (DEC-32 Generic Behavioral Traits)'];

    for (const t of traits) {
      lines.push(`- **${t.name}:** ${t.guidance} *(Guardrail: ${t.guardrail})*`);
    }

    const overlayText = lines.join('\n');
    const tokenEstimate = estimateTokens(overlayText);

    return {
      overlayText,
      tokenEstimate,
      traitCount: traits.length
    };
  }
}
