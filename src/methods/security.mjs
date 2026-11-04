/**
 * Xyeena Native Methods - Security Guidance, Threat Modeling & Audit Parity
 * Implements passive defensive advice, STRIDE threat models, Cloudflare-grade
 * structured finding schema validation, coverage ledger tracking,
 * and strict activation gating for full security audits.
 */

export const ATTACK_CLASSES = Object.freeze([
  'AUTHENTICATION_BYPASS',
  'AUTHORIZATION_BYPASS',
  'INJECTION_SQL_COMMAND',
  'CROSS_SITE_SCRIPTING',
  'DATA_LEAKAGE_SECRETS',
  'DENIAL_OF_SERVICE',
  'INSECURE_DIRECT_OBJECT_REFERENCE',
  'SUPPLY_CHAIN_TAMPERING',
  'PATH_TRAVERSAL',
  'SERVER_SIDE_REQUEST_FORGERY',
  'CRYPTOGRAPHIC_WEAKNESS',
  'BROKEN_ACCESS_CONTROL'
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
   * Provide passive defensive security guidance without active scanning or exploitation.
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
   * Validate a security finding against the structured findings schema (Cloudflare Parity).
   * @param {object} finding
   */
  static validateFinding(finding = {}) {
    const errors = [];
    if (!finding.file || typeof finding.file !== 'string') {
      errors.push('Missing or invalid "file" path');
    } else if (finding.file.includes('..') || pathIsSuspicious(finding.file)) {
      errors.push('Security finding file path must not contain traversal elements');
    }

    if (typeof finding.line !== 'number' || finding.line < 1) {
      errors.push('Missing or invalid "line" number (must be integer >= 1)');
    }

    if (finding.column !== undefined && (typeof finding.column !== 'number' || finding.column < 1)) {
      errors.push('Invalid "column" number (must be integer >= 1)');
    }

    if (!ATTACK_CLASSES.includes(finding.attackClass)) {
      errors.push(`Invalid attackClass: "${finding.attackClass}". Must be one of ${ATTACK_CLASSES.join(', ')}`);
    }

    if (!SEVERITY_LEVELS.includes(finding.severity)) {
      errors.push(`Invalid severity: "${finding.severity}". Must be one of ${SEVERITY_LEVELS.join(', ')}`);
    }

    if (!finding.remediation || typeof finding.remediation !== 'string' || finding.remediation.trim().length < 5) {
      errors.push('Missing or too short "remediation" guidance');
    }

    if (finding.description !== undefined && (typeof finding.description !== 'string' || finding.description.trim().length < 5)) {
      errors.push('Invalid "description" (minimum 5 characters required if provided)');
    }

    if (finding.evidence !== undefined && (typeof finding.evidence !== 'string' || finding.evidence.trim().length < 3)) {
      errors.push('Invalid "evidence" (must cite concrete code or command output if provided)');
    }

    if (finding.cwe && !/^CWE-[0-9]+$/i.test(finding.cwe)) {
      errors.push(`Invalid CWE identifier "${finding.cwe}" (must match format CWE-<number>)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate an audit coverage ledger to prove which files were inspected without fabricated claims.
   * @param {object} ledger
   * @param {string[]} ledger.auditedFiles
   * @param {number} ledger.totalFilesCount
   * @param {string} ledger.auditTimestamp
   * @param {string} ledger.auditorRole
   */
  static validateCoverageLedger(ledger = {}) {
    const errors = [];
    if (!Array.isArray(ledger.auditedFiles) || ledger.auditedFiles.length === 0) {
      errors.push('Coverage ledger must list at least one audited file');
    } else {
      const fileSet = new Set();
      for (const f of ledger.auditedFiles) {
        if (typeof f !== 'string' || !f.trim()) {
          errors.push('Audited file entries must be non-empty strings');
        } else if (f.includes('..')) {
          errors.push(`Path traversal in audited file list: "${f}"`);
        } else if (fileSet.has(f)) {
          errors.push(`Duplicate file entry in coverage ledger: "${f}"`);
        }
        fileSet.add(f);
      }
    }

    if (typeof ledger.totalFilesCount !== 'number' || ledger.totalFilesCount < (ledger.auditedFiles?.length || 0)) {
      errors.push('totalFilesCount must be >= number of audited files');
    }

    if (!ledger.auditorRole || typeof ledger.auditorRole !== 'string') {
      errors.push('Coverage ledger requires an explicit auditorRole');
    }

    return {
      valid: errors.length === 0,
      coveragePercent: ledger.totalFilesCount > 0
        ? Math.round(((ledger.auditedFiles?.length || 0) / ledger.totalFilesCount) * 100)
        : 0,
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

function pathIsSuspicious(p) {
  return /[\0\r\n]/.test(p);
}
