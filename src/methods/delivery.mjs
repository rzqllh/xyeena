/**
 * Xyeena Native Methods - Delivery & Artifacts Suite
 * Concise technical documentation, Architecture Decision Records (ADRs),
 * human-centric UX copy generation, and structured artifact delivery.
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
}
