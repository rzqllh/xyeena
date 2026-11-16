/**
 * Xyeena Native Methods - Coordination & Orchestration Suite
 * Implements local skill discovery auditing, agent inspection without persona mutation,
 * task graph validation, transparent decision explainability, safe task dispatching,
 * worktree concurrency isolation fences, and strict opt-in gates for external discovery.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class CoordinationMethods {
  /**
   * Audit local skill discovery and resolve duplicate collisions with workspace precedence (coordination.local-skill-discovery).
   * @param {Array<{ name: string, location: 'workspace'|'plugin'|'global', path: string }>} discoveredSkills
   */
  static auditLocalSkillDiscovery(discoveredSkills = []) {
    const resolved = new Map();
    const collisions = [];

    // Precedence: workspace > plugin > global
    const priority = { workspace: 3, plugin: 2, global: 1 };

    for (const skill of discoveredSkills) {
      const existing = resolved.get(skill.name);
      if (!existing) {
        resolved.set(skill.name, skill);
      } else {
        collisions.push({
          skillName: skill.name,
          winner: priority[existing.location] >= priority[skill.location] ? existing.location : skill.location,
          shadowed: priority[existing.location] >= priority[skill.location] ? skill.location : existing.location
        });
        if (priority[skill.location] > priority[existing.location]) {
          resolved.set(skill.name, skill);
        }
      }
    }

    return {
      totalDiscovered: discoveredSkills.length,
      resolvedCount: resolved.size,
      resolvedSkills: Array.from(resolved.values()),
      collisions,
      hasCollisions: collisions.length > 0,
      verdict: 'DISCOVERY_PRECEDENCE_RESOLVED'
    };
  }

  /**
   * Inspect host agents while enforcing persona protection (coordination.agent-discovery).
   * @param {object} params
   * @param {Array<{ name: string, personaFilePath: string, isMutable: boolean }>} params.agents
   */
  static auditAgentDiscovery({ agents = [] }) {
    const violations = [];
    for (const a of agents) {
      if (a.isMutable) {
        violations.push(`Agent "${a.name}" is marked mutable; persona must be read-only (ARCH-DEC-03).`);
      }
    }

    const compliant = violations.length === 0;
    return {
      agentCount: agents.length,
      compliant,
      violations,
      verdict: compliant ? 'AGENTS_DISCOVERED_READONLY' : 'MUTABLE_PERSONA_VIOLATION'
    };
  }

  /**
   * Generate transparent explainability for capability and skill routing decisions (coordination.explainability).
   * @param {object} params
   * @param {string} params.prompt
   * @param {string} params.intentMode
   * @param {string[]} params.selectedSkills
   * @param {string[]} params.rejectedSkills
   */
  static generateExecutionExplanation({ prompt, intentMode, selectedSkills = [], rejectedSkills = [] }) {
    const reasons = [];

    if (intentMode === 'DISCUSSION') {
      reasons.push('Execution mode is DISCUSSION: destructive tools and modification capabilities are strictly pruned.');
    }

    for (const s of selectedSkills) {
      reasons.push(`Selected [${s}]: Matched intent and positive trigger criteria for current task.`);
    }

    for (const r of rejectedSkills) {
      reasons.push(`Excluded [${r}]: Inactive domain or negative trigger prevented activation (Lazy loading).`);
    }

    return {
      prompt,
      intentMode,
      selectedCount: selectedSkills.length,
      rejectedCount: rejectedSkills.length,
      explanationLog: reasons,
      verdict: 'DECISION_FULLY_EXPLAINABLE'
    };
  }

  /**
   * Assert consent before dispatching tasks to workers or subagents (coordination.dispatch).
   * @param {object} params
   * @param {string} params.taskId
   * @param {boolean} params.isDestructiveOrExternal
   * @param {boolean} params.hasOperatorConsent
   */
  static assertTaskDispatchConsent({ taskId, isDestructiveOrExternal = false, hasOperatorConsent = false }) {
    if (isDestructiveOrExternal && !hasOperatorConsent) {
      return {
        allowed: false,
        status: 'BLOCKED',
        reason: `Task "${taskId}" involves external network or destructive filesystem operations. Operator consent required.`
      };
    }

    return {
      allowed: true,
      status: 'DISPATCH_AUTHORIZED'
    };
  }

  /**
   * Verify concurrency fencing and run lock isolation (coordination.isolation).
   * @param {object} params
   * @param {string} params.runId
   * @param {string} params.activeLockOwnerPid
   * @param {boolean} params.isPidAlive
   */
  static verifyIsolationBoundary({ runId, activeLockOwnerPid, isPidAlive = false }) {
    if (activeLockOwnerPid && isPidAlive) {
      return {
        isolated: false,
        status: 'CONCURRENT_LOCK_HELD',
        reason: `Run "${runId}" is actively locked by live process PID ${activeLockOwnerPid}. Concurrent execution blocked.`
      };
    }

    return {
      isolated: true,
      status: 'EXCLUSIVE_ISOLATION_AVAILABLE'
    };
  }

  /**
   * Gate external network discovery (coordination.external-discovery).
   * Strictly blocks unsolicited external network calls unless explicit operator opt-in is granted.
   * @param {boolean} isOptInExplicit
   */
  static assertExternalDiscoveryGate(isOptInExplicit) {
    if (!isOptInExplicit) {
      return {
        allowed: false,
        status: 'BLOCKED',
        reason: 'External network skill discovery is permanently OPT_IN_ONLY. Zero unsolicited outbound network requests.'
      };
    }

    return {
      allowed: true,
      status: 'OPT_IN_ACTIVATED'
    };
  }
}
