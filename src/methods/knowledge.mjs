/**
 * Xyeena Native Methods - Knowledge & Reasoning Discipline Suite
 * Enforces epistemic tier classification (Observed, Inferred, Unknown, Proposed),
 * anti-hallucination source citation verification, and structured research provenance.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export const EPISTEMIC_TIERS = Object.freeze({
  OBSERVED: 'OBSERVED',     // Directly verified via terminal, file, or tool output
  INFERRED: 'INFERRED',     // Deductions reasonably drawn from verified evidence
  UNKNOWN: 'UNKNOWN',       // Explicitly unverified or unmeasured facts
  PROPOSED: 'PROPOSED'      // Suggested changes, plans, or hypotheses not yet executed
});

export class KnowledgeMethods {
  /**
   * Classify technical statements into epistemic tiers (knowledge.reasoning-discipline).
   * Flags untagged definitive assertions that lack evidence grounding.
   * @param {string} text
   */
  static classifyReasoningDiscipline(text = '') {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const classifications = [];
    let ungroundedCount = 0;

    for (const line of lines) {
      let tier = null;
      if (/\b(observed|verified|proven|terminal output|exit code 0)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.OBSERVED;
      } else if (/\b(inferred|likely|indicates|suggests|deduced)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.INFERRED;
      } else if (/\b(unknown|unverified|untested|not measured|missing)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.UNKNOWN;
      } else if (/\b(proposed|plan|recommendation|should be|will change)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.PROPOSED;
      } else {
        // Line makes an untagged claim
        if (/^(the|all|every|code|test|it)\s+/i.test(line.trim())) {
          ungroundedCount++;
        }
        tier = 'UNCLASSIFIED';
      }

      classifications.push({ line: line.trim(), tier });
    }

    const disciplined = ungroundedCount === 0;
    return {
      totalStatements: lines.length,
      ungroundedCount,
      disciplined,
      classifications,
      verdict: disciplined ? 'DISCIPLINED_EPISTEMIC_REASONING' : 'UNGROUNDED_ASSERTIONS_DETECTED'
    };
  }

  /**
   * Verify research provenance and prevent citation hallucination (knowledge.research-quality).
   * @param {object} params
   * @param {Array<{ claim: string, citationPath: string, exactQuote: string }>} params.citations
   * @param {Record<string, string>} params.availableSourceFiles - Map of path to file contents
   */
  static evaluateResearchQuality({ citations = [], availableSourceFiles = {} }) {
    const verified = [];
    const hallucinated = [];

    for (const c of citations) {
      const fileContent = availableSourceFiles[c.citationPath];
      if (!fileContent) {
        hallucinated.push({ citation: c, reason: `File "${c.citationPath}" does not exist in source repository.` });
      } else if (!fileContent.includes(c.exactQuote)) {
        hallucinated.push({ citation: c, reason: `Quoted text not found in source file "${c.citationPath}".` });
      } else {
        verified.push(c);
      }
    }

    const clean = hallucinated.length === 0;
    return {
      totalCitations: citations.length,
      verifiedCount: verified.length,
      hallucinatedCount: hallucinated.length,
      clean,
      hallucinated,
      verdict: clean ? 'PRIMARY_SOURCE_VERIFIED' : 'CITATION_HALLUCINATION_DETECTED'
    };
  }
}
