/**
 * Xyeena Native Methods - Security Guidance, Threat Modeling & Audit Parity
 * Implements passive defensive advice, STRIDE threat models, Cloudflare-grade
 * structured finding schema validation, coverage ledger tracking, scoped diff review,
 * hardening specifications, retest verification, supply-chain vetting, runtime isolation checks,
 * and strict activation gating for full security audits.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

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
   * Provide passive defensive security guidance without active scanning or exploitation (security.guidance).
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
   * Enforce STRIDE threat classification (security.threat-model).
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
   * Validate a security finding against the structured findings schema (security.findings-validation).
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
   * Conduct a scoped security review of a Git diff without running a full repository audit (security.scoped-review).
   * @param {object} params
   * @param {string} params.diff
   * @param {string[]} [params.sensitivePaths=[]]
   */
  static auditScopedDiffSecurity({ diff = '', sensitivePaths = [] }) {
    const findings = [];

    // Check for hardcoded credentials / tokens
    if (/ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{30,}/.test(diff)) {
      findings.push({
        severity: 'CRITICAL',
        issue: 'Suspected hardcoded API key or private secret introduced in diff.'
      });
    }

    // Check for dangerous innerHTML or unescaped injection
    if (/dangerouslySetInnerHTML|innerHTML\s*=/i.test(diff)) {
      findings.push({
        severity: 'HIGH',
        issue: 'Direct innerHTML assignment detected; ensure strict sanitization or prefer textContent.'
      });
    }

    // Check for raw SQL concatenation
    if (/(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\+\s*[a-zA-Z0-9_]+/i.test(diff)) {
      findings.push({
        severity: 'HIGH',
        issue: 'Possible SQL string concatenation detected; use parameterized queries.'
      });
    }

    return {
      clean: findings.length === 0,
      findings,
      verdict: findings.length === 0 ? 'DIFF_SECURITY_CLEAN' : 'SECURITY_RISKS_DETECTED'
    };
  }

  /**
   * Formulate standard production hardening specification (security.hardening).
   * @param {object} params
   * @param {string} params.environment - 'production' | 'staging'
   */
  static formulateHardeningSpec({ environment = 'production' }) {
    return {
      environment,
      requiredHttpHeaders: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; frame-ancestors 'none';",
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      corsPolicy: {
        allowWildcardWithCredentials: false,
        enforceOriginValidation: true
      },
      verdict: 'HARDENING_SPEC_COMPOSED'
    };
  }

  /**
   * Verify retest remediation for a previously identified vulnerability (security.retest).
   * @param {object} params
   * @param {string} params.findingId
   * @param {boolean} params.retestTestPassed
   * @param {string} params.retestEvidence
   */
  static verifyRetestRemediation({ findingId, retestTestPassed = false, retestEvidence = '' }) {
    if (!retestTestPassed || !retestEvidence || retestEvidence.length < 5) {
      return {
        findingId,
        remediated: false,
        verdict: 'REMEDIATION_UNPROVEN',
        reason: 'Retest requires an explicit passing regression test and verifiable execution evidence.'
      };
    }

    return {
      findingId,
      remediated: true,
      verdict: 'FINDING_REMEDIATED_AND_VERIFIED',
      evidenceSummary: retestEvidence
    };
  }

  /**
   * Audit third-party skill supply chain and declared permissions (security.skill-supply-chain).
   * @param {object} params
   * @param {string} params.skillName
   * @param {string[]} params.declaredPermissions
   * @param {string[]} params.networkEndpoints
   */
  static auditSkillSupplyChain({ skillName, declaredPermissions = [], networkEndpoints = [] }) {
    const unapprovedNetwork = networkEndpoints.length > 0;
    const hasUnrestrictedWrite = declaredPermissions.includes('unrestricted_fs_write');

    const blockedReasons = [];
    if (unapprovedNetwork) blockedReasons.push(`Outbound network calls to ${networkEndpoints.join(', ')} forbidden without explicit approval.`);
    if (hasUnrestrictedWrite) blockedReasons.push('Unrestricted filesystem write permission is denied by sandbox policy.');

    const compliant = blockedReasons.length === 0;
    return {
      skillName,
      compliant,
      blockedReasons,
      verdict: compliant ? 'SUPPLY_CHAIN_APPROVED' : 'SUPPLY_CHAIN_BLOCKED'
    };
  }

  /**
   * Verify process and workspace runtime isolation boundaries (security.runtime-isolation).
   * @param {object} params
   * @param {boolean} params.worktreeIsolated
   * @param {boolean} params.networkDisabled
   * @param {boolean} params.processKillTreeSupported
   */
  static verifyRuntimeIsolation({ worktreeIsolated = true, networkDisabled = true, processKillTreeSupported = true }) {
    const isolated = worktreeIsolated && networkDisabled && processKillTreeSupported;
    return {
      worktreeIsolated,
      networkDisabled,
      processKillTreeSupported,
      isolated,
      verdict: isolated ? 'RUNTIME_STRICTLY_ISOLATED' : 'ISOLATION_BOUNDARY_BREACHED'
    };
  }

  /**
   * Assert that a full 6-phase security audit cannot run without explicit operator command (security.full-audit).
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
