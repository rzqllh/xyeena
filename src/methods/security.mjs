/**
 * Xyeena Native Methods - Security Guidance & Threat Modeling
 * Passive defensive advice, STRIDE threat mapping, finding schema validation,
 * and strict activation gating for full audits.
 */

export const ATTACK_CLASSES = Object.freeze([
  'AUTHENTICATION_BYPASS',
  'AUTHORIZATION_BYPASS',
  'INJECTION_SQL_COMMAND',
  'CROSS_SITE_SCRIPTING',
  'DATA_LEAKAGE_SECRETS',
  'DENIAL_OF_SERVICE',
  'INSECURE_DIRECT_OBJECT_REFERENCE',
  'SUPPLY_CHAIN_TAMPERING'
]);

export const SEVERITY_LEVELS = Object.freeze([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFORMATIONAL'
]);

export class SecurityMethods {
  /**
   * Provide passive defensive security guidance without scanning or exploitation.
   * @param {string} domainTopic - e.g., 'auth', 'cors', 'secrets'
   * @returns {object} Defensive advisory checklist
   */
  static getDefensiveGuidance(domainTopic = '') {
    const topic = domainTopic.toLowerCase();
    if (topic.includes('cors')) {
      return {
        topic: 'CORS',
        recommendations: [
          'Explicitly specify allowed origins; avoid wildcard "*" with credentials.',
          'Restrict allowed methods and headers to only what clients consume.',
          'Validate Origin header on state-changing requests.'
        ]
      };
    }
    if (topic.includes('auth') || topic.includes('jwt') || topic.includes('session')) {
      return {
        topic: 'Authentication & Session Security',
        recommendations: [
          'Store session tokens in HttpOnly, Secure, SameSite=Strict cookies.',
          'Verify cryptographic signatures and expiration timestamps on every token.',
          'Enforce strict timing-safe comparison on passwords and secret tokens.'
        ]
      };
    }
    return {
      topic: 'General Defensive Security',
      recommendations: [
        'Apply Principle of Least Privilege to all API routes and database users.',
        'Sanitize and validate all untrusted inputs at the perimeter.',
        'Never log or commit raw secrets, tokens, or personal identifying data.'
      ]
    };
  }

  /**
   * Enforce STRIDE threat classification.
   * @param {string} boundaryName
   * @param {Array<{ category: 'Spoofing'|'Tampering'|'Repudiation'|'Information Disclosure'|'Denial of Service'|'Elevation of Privilege', threat: string, mitigation: string }>} threats
   */
  static composeStrideThreatModel(boundaryName, threats = []) {
    return {
      trustBoundary: boundaryName,
      totalThreats: threats.length,
      threatMatrix: threats.map(t => ({
        category: t.category,
        threat: t.threat,
        mitigation: t.mitigation,
        status: t.mitigation ? 'MITIGATED' : 'OPEN_RISK'
      }))
    };
  }

  /**
   * Validate a security finding against the structured findings schema.
   * @param {object} finding
   */
  static validateFinding(finding = {}) {
    const errors = [];
    if (!finding.file) errors.push('Missing "file" path');
    if (typeof finding.line !== 'number') errors.push('Missing or invalid "line" number');
    if (!ATTACK_CLASSES.includes(finding.attackClass)) {
      errors.push(`Invalid attackClass: ${finding.attackClass}`);
    }
    if (!SEVERITY_LEVELS.includes(finding.severity)) {
      errors.push(`Invalid severity: ${finding.severity}`);
    }
    if (!finding.remediation) errors.push('Missing "remediation" guidance');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Assert that a full 6-phase security audit cannot run without explicit operator command.
   * @param {boolean} isExplicitUserCommand
   */
  static assertAuditActivationAllowed(isExplicitUserCommand) {
    if (!isExplicitUserCommand) {
      return {
        allowed: false,
        status: 'BLOCKED',
        reason: 'Full Security Audit requires explicit owner instruction. Mode downgraded to passive security.guidance.'
      };
    }
    return {
      allowed: true,
      status: 'ACTIVATED',
      mode: 'ISOLATED_FULL_AUDIT'
    };
  }
}
