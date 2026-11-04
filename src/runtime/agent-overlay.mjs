/**
 * Xyeena Runtime - Existing-Agent-First Ephemeral Overlay Engine
 * (Architectural Invariant ARCH-DEC-03)
 * Dispatches tasks to existing host agents using ephemeral task-specific payloads
 * without mutating or overwriting user agent personas, roles, or configuration files.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class AgentOverlayManager {
  /**
   * Compose an ephemeral task overlay for an existing host agent.
   * @param {object} params
   * @param {string} params.targetAgentName - Name/callsign of existing agent
   * @param {string} params.taskScope - Concrete bounded task description
   * @param {string[]} params.targetFiles - Files allowed to be inspected/modified
   * @param {string} [params.deliverableRequired=''] - Expected deliverable
   * @returns {object} Ephemeral dispatch payload
   */
  static composeEphemeralOverlay({
    targetAgentName,
    taskScope,
    targetFiles = [],
    deliverableRequired = ''
  }) {
    if (!targetAgentName || !taskScope) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Target agent name and task scope are required.');
    }

    const overlayPrompt = [
      `### [EPHEMERAL TASK OVERLAY — ${targetAgentName}]`,
      `**Task Objective:** ${taskScope.trim()}`,
      `**Allowed File Boundaries:** ${targetFiles.length > 0 ? targetFiles.join(', ') : 'Read-only inspection only'}`,
      `**Required Output:** ${deliverableRequired.trim() || 'Verifiable evidence and diff report.'}`,
      '',
      '> INVARIANT: You are executing an ephemeral bounded task. Do not modify your base persona, system prompt, or unrelated files.'
    ].join('\n');

    return {
      targetAgentName,
      ephemeralPrompt: overlayPrompt,
      allowedFiles: [...targetFiles],
      ephemeralOnly: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate that an agent's returned deliverable satisfies the bounded task.
   * @param {object} dispatchPayload
   * @param {object} agentResult
   * @param {string[]} [agentResult.modifiedFiles=[]]
   * @param {string} [agentResult.deliverableContent='']
   */
  static validateAgentDeliverable(dispatchPayload, agentResult = {}) {
    const { allowedFiles = [] } = dispatchPayload;
    const { modifiedFiles = [], deliverableContent = '' } = agentResult;

    // Check scope leakage: did the subagent touch unauthorized files?
    const leakedFiles = modifiedFiles.filter(f => !allowedFiles.includes(f));
    if (leakedFiles.length > 0) {
      return {
        accepted: false,
        reason: `Subagent scope leak: modified unauthorized files (${leakedFiles.join(', ')})`,
        leakedFiles
      };
    }

    if (!deliverableContent || deliverableContent.trim().length === 0) {
      return {
        accepted: false,
        reason: 'Subagent returned empty deliverable content.'
      };
    }

    return {
      accepted: true,
      agentName: dispatchPayload.targetAgentName,
      status: 'VERIFIED_DELIVERABLE'
    };
  }
}
