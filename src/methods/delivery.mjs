/**
 * Xyeena Native Methods - Delivery, Documentation & Artifacts Suite
 * Concise technical documentation, Architecture Decision Records (ADRs),
 * human-centric UX copy generation, documentation quality rubric, and structured artifact delivery.
 */

export class DeliveryMethods {
  /**
   * Compose an Architecture Decision Record (ADR).
   * @param {object} params
   * @param {string} params.id - e.g., 'ADR-001'
   * @param {string} params.title - Decision title
   * @param {'PROPOSED'|'ACCEPTED'|'REJECTED'|'DEPRECATED'} params.status
   * @param {string} params.context - Problem context and background
   * @param {string} params.decision - Stated decision
   * @param {string} params.consequences - Tradeoffs and outcomes
   */
  static composeAdr({ id, title, status, context, decision, consequences }) {
    const lines = [
      `# ${id}: ${title}`,
      '',
      `**Status:** ${status}  `,
      `**Date:** ${new Date().toISOString().split('T')[0]}  `,
      '',
      '## Context',
      context.trim(),
      '',
      '## Decision',
      decision.trim(),
      '',
      '## Consequences',
      consequences.trim(),
      ''
    ];
    return lines.join('\n');
  }

  /**
   * Generate crisp, functional button/action microcopy.
   * Direct verb + noun, zero marketing fluff.
   * @param {string} actionVerb
   * @param {string} objectNoun
   */
  static composeActionLabel(actionVerb, objectNoun) {
    const cleanVerb = actionVerb.trim();
    const cleanNoun = objectNoun.trim();
    return `${cleanVerb} ${cleanNoun}`.trim();
  }

  /**
   * Structure metadata for persistent artifact creation.
   * @param {object} params
   * @param {string} params.summary - Multi-line detailed summary
   * @param {boolean} [params.userFacing=true]
   * @param {boolean} [params.requestFeedback=false]
   */
  static formatArtifactMetadata({ summary, userFacing = true, requestFeedback = false }) {
    return {
      Summary: summary.trim(),
      UserFacing: Boolean(userFacing),
      RequestFeedback: Boolean(requestFeedback)
    };
  }

  /**
   * Audit technical documentation against a rubric:
   * 1. Structure (presence of markdown headers)
   * 2. Actionability (presence of code/command blocks)
   * 3. Absence of lazy placeholder text (TODO, Lorem ipsum, [insert ...])
   * @param {string} markdownText
   */
  static auditDocumentationRubric(markdownText = '') {
    const text = markdownText || '';
    const findings = [];
    let score = 100;

    // Check placeholder tokens
    const placeholderPatterns = [
      /lorem\s+ipsum/i,
      /todo:\s*fill/i,
      /\[insert\s+[a-z_\-]+\]/i,
      /<insert\s+[a-z_\-]+>/i,
      /your\s+(?:text|content|name)\s+here/i
    ];

    for (const pat of placeholderPatterns) {
      if (pat.test(text)) {
        findings.push(`Placeholder text detected: matches ${pat}`);
        score -= 25;
      }
    }

    // Check structure
    const hasHeadings = /^#{1,3}\s+/m.test(text);
    if (!hasHeadings && text.length > 200) {
      findings.push('Documentation lacks structured markdown headings (## / ###)');
      score -= 20;
    }

    // Check code blocks if document is substantial
    const hasCodeBlocks = /```[a-z]*\n[\s\S]*?\n```/i.test(text) || /`[^`]+`/.test(text);
    if (!hasCodeBlocks && text.length > 500) {
      findings.push('Substantial technical documentation lacks code examples or command references');
      score -= 15;
    }

    score = Math.max(0, score);
    return {
      score,
      compliant: score >= 80,
      findings
    };
  }
}
