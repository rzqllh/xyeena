/**
 * Xyeena Native Methods - Thinking, Reasoning & Systematic Debugging Suite
 * Implements structured discovery, 4-phase systematic debugging, falsifiable hypothesis tracking,
 * phased planning, domain modeling, adversarial counterexample generation, primary-source research evaluation,
 * and relentless grilling/stress-testing.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class ThinkingMethods {
  /**
   * Structure problem discovery and constraint sizing.
   * @param {string} problemStatement
   * @param {string[]} [knownConstraints=[]]
   * @returns {object} Discovery framework
   */
  static sizeProblem(problemStatement, knownConstraints = []) {
    return {
      problem: problemStatement.trim(),
      constraints: [...knownConstraints],
      riskProfile: knownConstraints.length > 3 ? 'HIGH_CONSTRAINT' : 'STANDARD',
      recommendedAction: 'ESTABLISH_EVIDENCE_BOUNDARY'
    };
  }

  /**
   * Formulate ranked, falsifiable hypotheses for debugging or system design.
   * @param {string} symptom
   * @param {Array<{ name: string, mechanism: string, testCommand: string }>} candidates
   * @returns {Array<object>} Ranked hypotheses with disproof criteria
   */
  static rankHypotheses(symptom, candidates = []) {
    return candidates.map((c, index) => ({
      rank: index + 1,
      symptom,
      name: c.name,
      mechanism: c.mechanism,
      disproofCommand: c.testCommand,
      status: 'UNTESTED'
    }));
  }

  /**
   * Structure problem brainstorming before entering planning (Superpowers RE-01).
   * Analyzes context, sizes the work, and outlines distinct approaches with tradeoffs.
   * @param {object} params
   * @param {string} params.goal - High-level objective
   * @param {string} [params.context=''] - Available context or spec
   * @param {string[]} [params.existingFiles=[]] - Files identified in context
   * @param {object} [params.options={}]
   * @returns {object} Structured brainstorming deliverable
   */
  static brainstormTask({ goal, context = '', existingFiles = [], options = {} }) {
    if (!goal || typeof goal !== 'string') {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Brainstorming requires a goal statement.');
    }

    const isComplex = goal.length > 80 || existingFiles.length > 3 || context.length > 500;
    const workSize = isComplex ? 'FULL_DESIGN_DOC' : 'SHORT_SPEC';

    const approaches = [
      {
        id: 'approach-a',
        name: 'Direct Refinement (Smallest Scope)',
        tradeoff: 'Fastest turnaround and minimal blast radius, but preserves existing structural bounds.'
      },
      {
        id: 'approach-b',
        name: 'Modular Extraction (Clean Seams)',
        tradeoff: 'Higher testability and isolation, but introduces a new module seam to maintain.'
      }
    ];

    return {
      goal: goal.trim(),
      workSize,
      contextFilesExamined: existingFiles.length,
      approaches,
      nextStep: 'Select an approach, approve design doc, then invoke writing-plans.',
      status: 'BRAINSTORM_COMPLETE'
    };
  }

  /**
   * Record an inline execution ruling in the ledger (Superpowers executing-plans RE-01).
   * Ensures deviations, ambiguities, or plan defects are explicitly recorded and traceable.
   * @param {object} params
   * @param {string} params.ruling - What was decided
   * @param {string} params.rationale - Why it was decided
   * @param {string} params.costIfWrong - What it costs if the decision is incorrect
   * @returns {object} Formatted ruling entry
   */
  static recordInlineRuling({ ruling, rationale, costIfWrong }) {
    if (!ruling || !rationale || !costIfWrong) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Inline ruling requires ruling, rationale, and costIfWrong.');
    }

    const formatted = `Ruling: ${ruling.trim()} — ${rationale.trim()} — ${costIfWrong.trim()}`;
    return {
      entry: formatted,
      ruling: ruling.trim(),
      rationale: rationale.trim(),
      costIfWrong: costIfWrong.trim(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enforce 4-phase systematic debugging discipline (Superpowers systematic-debugging RE-01):
   * Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
   * Phase 1 (REPRODUCE) -> Phase 2 (ISOLATE / Pattern Analysis) -> Phase 3 (PROPOSE_FIX / Hypothesis) -> Phase 4 (VERIFY_FIX)
   * @param {object} params
   * @param {'REPRODUCE'|'ISOLATE'|'PROPOSE_FIX'|'VERIFY_FIX'} params.stage
   * @param {object} params.evidence
   * @param {string} [params.evidence.reproduceCommand] - Executable command reproducing the failure
   * @param {string} [params.evidence.rootCauseLocation] - File/line/module boundary
   * @param {string} [params.evidence.fixDiff] - Proposed smallest fix
   * @param {boolean} [params.evidence.regressionPassed] - Clean regression test proof
   */
  static trackDebuggingInvestigation({ stage, evidence = {} }) {
    if (stage === 'ISOLATE' && !evidence.reproduceCommand) {
      return {
        compliant: false,
        stage,
        ironLaw: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
        reason: 'Debugging discipline violation: Cannot isolate root cause without first having a reliable reproduction command.'
      };
    }

    if (stage === 'PROPOSE_FIX') {
      if (!evidence.reproduceCommand) {
        return {
          compliant: false,
          stage,
          ironLaw: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
          reason: 'Debugging discipline violation: Cannot propose a fix without first having a reliable reproduction command.'
        };
      }
      if (!evidence.rootCauseLocation) {
        return {
          compliant: false,
          stage,
          ironLaw: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
          reason: 'Debugging discipline violation: Cannot propose a fix before isolating root cause location.'
        };
      }
    }

    if (stage === 'VERIFY_FIX' && (!evidence.reproduceCommand || !evidence.rootCauseLocation || !evidence.regressionPassed)) {
      return {
        compliant: false,
        stage,
        ironLaw: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
        reason: 'Debugging discipline violation: Cannot declare fix verified without executable regression test pass.'
      };
    }

    return {
      compliant: true,
      stage,
      ironLawSatisfied: true,
      status: 'DISCIPLINE_SATISFIED'
    };
  }

  /**
   * Compose reviewable, phased execution plan with explicit phase gates.
   * @param {string} title
   * @param {Array<{ phase: number, name: string, files: string[], verificationCmd: string }>} phases
   * @returns {object} Phased execution plan
   */
  static composePhasedPlan(title, phases = []) {
    return {
      title,
      totalPhases: phases.length,
      phases: phases.map(p => ({
        phase: p.phase,
        name: p.name,
        targetFiles: [...(p.files || [])],
        gateCommand: p.verificationCmd,
        completed: false
      })),
      governingRule: 'Phase verification must pass before progressing to next phase.'
    };
  }

  /**
   * Extract domain dictionary and invariant rules.
   * @param {Record<string, string>} entities - Map of entity name to domain definition
   * @param {string[]} invariants - Rules that must always hold
   */
  static defineDomainModel(entities = {}, invariants = []) {
    return {
      ubiquitousLanguage: { ...entities },
      invariants: [...invariants],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate adversarial counterexamples for a technical claim or contract.
   * @param {string} claim
   * @param {Array<{ input: unknown, expectedFailure: string }>} edgeCases
   */
  static evaluateCounterexamples(claim, edgeCases = []) {
    return {
      targetClaim: claim,
      edgeCases: edgeCases.map(ec => ({
        inputSample: ec.input,
        potentialFailure: ec.expectedFailure,
        mitigationRequired: true
      }))
    };
  }

  /**
   * Conduct structured primary-source research evaluation (thinking.research).
   * Rejects ungrounded claims and verifies citations against high-trust sources.
   * @param {object} params
   * @param {string} params.topic
   * @param {Array<{ urlOrPath: string, type: 'OFFICIAL_DOC'|'SPECIFICATION'|'SOURCE_CODE'|'SECONDARY_BLOG' }>} params.sources
   * @param {Array<{ claim: string, sourceRef: string }>} params.findings
   */
  static conductResearchEvaluation({ topic, sources = [], findings = [] }) {
    if (!topic || typeof topic !== 'string') {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Research evaluation requires a valid topic.');
    }

    const sourceMap = new Map(sources.map(s => [s.urlOrPath, s]));
    const verifiedFindings = [];
    const ungroundedClaims = [];

    for (const f of findings) {
      const source = sourceMap.get(f.sourceRef);
      if (!source) {
        ungroundedClaims.push({ claim: f.claim, reason: `Cites missing or unregistered source: ${f.sourceRef}` });
      } else if (source.type === 'SECONDARY_BLOG') {
        ungroundedClaims.push({ claim: f.claim, reason: `Cites low-trust secondary blog instead of primary source: ${f.sourceRef}` });
      } else {
        verifiedFindings.push({
          claim: f.claim,
          source: f.sourceRef,
          trustLevel: 'PRIMARY_SOURCE_GROUNDED'
        });
      }
    }

    return {
      topic,
      totalSources: sources.length,
      verifiedFindingsCount: verifiedFindings.length,
      ungroundedClaimsCount: ungroundedClaims.length,
      groundedRatio: findings.length > 0 ? verifiedFindings.length / findings.length : 1,
      verifiedFindings,
      ungroundedClaims,
      verdict: ungroundedClaims.length === 0 ? 'RESEARCH_GROUNDED' : 'EVIDENCE_INSUFFICIENT'
    };
  }

  /**
   * Relentless grilling / stress-testing of a plan or architectural decision (thinking.grill).
   * Challenges assumptions, single points of failure, failure modes, and rollback viability.
   * @param {object} params
   * @param {string} params.title
   * @param {Array<{ name: string, rollbackAvailable: boolean }>} params.steps
   * @param {Array<{ statement: string, verifiedByTest: boolean }>} params.assumptions
   */
  static grillPlanOrDecision({ title, steps = [], assumptions = [] }) {
    const challengeQuestions = [];
    let riskScore = 0;

    for (const step of steps) {
      if (!step.rollbackAvailable) {
        challengeQuestions.push(`Step "${step.name}" has no rollback path. What happens if this fails midway in production?`);
        riskScore += 25;
      }
    }

    for (const asm of assumptions) {
      if (!asm.verifiedByTest) {
        challengeQuestions.push(`Assumption "${asm.statement}" is unproven by executable test evidence. What disproves this assumption?`);
        riskScore += 20;
      }
    }

    if (steps.length === 0) {
      challengeQuestions.push('Plan has zero discrete execution steps. How will progress be measured?');
      riskScore += 40;
    }

    const resilient = challengeQuestions.length === 0;
    return {
      title,
      resilient,
      riskScore: Math.min(100, riskScore),
      challengeQuestions,
      verdict: resilient ? 'BATTLE_TESTED_RESILIENT' : 'REVISION_REQUIRED_UNDER_GRILLING'
    };
  }

  /**
   * Detect requirement drift between original specification and proposed/actual implementation (core.requirement-drift).
   * @param {object} params
   * @param {string[]} params.agreedScope - Explicit user requirements
   * @param {string[]} params.actualChanges - Implemented changes / files
   */
  static detectRequirementDrift({ agreedScope = [], actualChanges = [] }) {
    const unfulfilledRequirements = [];
    const speculativeAdditions = [];

    const lowerScope = agreedScope.map(s => s.toLowerCase());
    const lowerChanges = actualChanges.map(c => c.toLowerCase());

    for (const req of agreedScope) {
      const words = req.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const isRepresented = lowerChanges.some(change => words.some(w => change.includes(w)));
      if (!isRepresented) {
        unfulfilledRequirements.push(req);
      }
    }

    for (const change of actualChanges) {
      const words = change.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchesAgreed = lowerScope.some(req => words.some(w => req.includes(w)));
      if (!matchesAgreed) {
        speculativeAdditions.push(change);
      }
    }

    const hasDrift = unfulfilledRequirements.length > 0 || speculativeAdditions.length > 0;
    return {
      hasDrift,
      unfulfilledRequirements,
      speculativeAdditions,
      verdict: hasDrift ? 'DRIFT_DETECTED' : 'STRICT_SCOPE_ALIGNED'
    };
  }
}
