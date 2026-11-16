/**
 * Xyeena Native Methods - Security Guidance, Threat Modeling & Audit Parity
 * Implements passive defensive advice, STRIDE threat models, Cloudflare-grade
 * structured finding schema validation, coverage ledger tracking, scoped diff review,
 * hardening specifications, retest verification, supply-chain vetting, runtime isolation checks,
 * and strict activation gating for full security audits.
 */

import crypto from 'node:crypto';
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

/**
 * Authorized Database Execution Adapter for live Row Level Security (RLS) isolation proofs.
 * DEC-31 / DEC-16: Live verification must originate from an authorized runtime database client,
 * not caller-asserted booleans or static receipt digests.
 */
export class LiveDatabaseAdapter {
  /**
   * @param {object} params
   * @param {string} [params.environment='postgres-live'] - Database environment name
   * @param {string} [params.connectionString=''] - Redacted connection URI
   * @param {object} [params.client=null] - Database client with query method
   */
  constructor({ environment = 'postgres-live', connectionString = '', client = null } = {}) {
    this.environment = environment;
    this.connectionString = connectionString;
    this.client = client;
    this.isAuthorizedLiveAdapter = true;
    this.lastProbeResult = null;
  }

  /**
   * Execute empirical tenant isolation queries against the connected database.
   * @param {object} params
   * @param {string} params.tableName
   * @param {Array<{ id: string, tenantId: string }>} params.testPrincipals
   * @returns {Promise<object>} Empirical probe receipt
   */
  async executeIsolationProbe({ tableName, testPrincipals = [] }) {
    if (!this.client || typeof this.client.query !== 'function') {
      throw new Error(`LiveDatabaseAdapter [${this.environment}]: Missing active database client or query function`);
    }
    if (!Array.isArray(testPrincipals) || testPrincipals.length < 2) {
      throw new Error('LiveDatabaseAdapter: Isolation probe requires at least 2 distinct test principals');
    }

    if (typeof tableName !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
      throw new Error('LiveDatabaseAdapter: Invalid SQL table identifier; dynamic SQL identifiers must be explicitly validated');
    }
    const [principalA, principalB] = testPrincipals;

    // 1. Positive query: Principal A queries data within their own tenant scope
    const posRes = await this.client.query({
      query: `SELECT * FROM "${tableName}"`,
      principal: principalA
    });

    // 2. Negative query: Principal A attempts to query data belonging to Principal B's tenant
    const negRes = await this.client.query({
      query: `SELECT * FROM "${tableName}" WHERE tenant_id = $1`,
      params: [principalB.tenantId],
      principal: principalA
    });

    const posRows = Array.isArray(posRes?.rows) ? posRes.rows.length : (Number(posRes?.rowCount) || 0);
    const negRows = Array.isArray(negRes?.rows) ? negRes.rows.length : (Number(negRes?.rowCount) || 0);

    const probeResult = {
      provenance: `live-db://${this.environment}/${tableName}`,
      timestamp: new Date().toISOString(),
      positiveQuery: {
        status: posRes?.error ? 'ERROR' : 'SUCCESS',
        rowsReturned: posRows
      },
      negativeQuery: {
        status: negRes?.error ? 'ACCESS_DENIED' : 'SUCCESS',
        rowsReturned: negRows,
        error: negRes?.error || null
      }
    };

    this.lastProbeResult = probeResult;
    return probeResult;
  }
}

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
    if (!finding.file && Array.isArray(finding.trace) && finding.trace.length > 0) {
      finding.file = finding.trace.find(t => t.kind === 'sink')?.file || finding.trace[0]?.file;
    }
    if (finding.line === undefined && Array.isArray(finding.trace) && finding.trace.length > 0) {
      finding.line = finding.trace.find(t => t.kind === 'sink')?.line || finding.trace[0]?.line;
    }

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
   * Create a structured, machine-readable security finding (Cloudflare RE-06 schema).
   * Generates a stable fingerprint and duplicateHash for tracking and suppression.
   */
  static createStructuredFinding({
    id,
    fingerprint,
    title = '',
    description = '',
    rootCause = '',
    intendedBehavior = '',
    attackClass = 'BROKEN_ACCESS_CONTROL',
    severity = 'HIGH',
    threatBoundary = 'UNTRUSTED_CLIENT_TO_SERVER',
    principal = 'anonymous_user',
    resource = 'api_endpoint',
    trace = [],
    evidence = '',
    remediation = '',
    conditions = []
  } = {}) {
    const primaryTrace = trace.find(t => t.kind === 'sink') || trace[0] || {};
    const file = primaryTrace.file || 'unknown';
    const line = primaryTrace.line || 1;

    const stableFingerprint = fingerprint ||
      `xy-sec-${Buffer.from(`${file}:${line}:${attackClass}:${title}`).toString('base64url').slice(0, 16)}`;
    const duplicateHash = stableFingerprint;

    const evidenceText = typeof evidence === 'string' && evidence.trim().length >= 3
      ? evidence
      : (trace.length > 0 ? `Source-to-sink trace at ${file}:${line}` : 'Observed vulnerability during scoped review');

    return {
      id: id || stableFingerprint,
      fingerprint: stableFingerprint,
      duplicateHash,
      title,
      description,
      rootCause,
      intendedBehavior,
      attackClass,
      severity,
      threatBoundary,
      principal,
      resource,
      file,
      line,
      trace,
      evidence: evidenceText,
      remediation,
      conditions,
      verdict: 'CONFIRMED_VULNERABILITY'
    };
  }

  /**
   * Suppress duplicate security findings based on stable fingerprint or duplicateHash (Cloudflare RE-06).
   */
  static deduplicateFindings(findings = []) {
    const seen = new Set();
    const unique = [];
    const duplicates = [];

    for (const f of findings) {
      const key = f.fingerprint || f.duplicateHash || `${f.file}:${f.line}:${f.attackClass}`;
      if (seen.has(key)) {
        duplicates.push(f);
      } else {
        seen.add(key);
        unique.push(f);
      }
    }

    return {
      totalInput: findings.length,
      uniqueCount: unique.length,
      duplicateCount: duplicates.length,
      uniqueFindings: unique,
      duplicates
    };
  }

  /**
   * Validate a security invariant and reject pattern-match-only false positives (Trail of Bits RE-15).
   * If a reported vulnerability is only a syntactic pattern match without exploitability,
   * trust-boundary crossing, or reachable sink, it must be rejected as false-positive.
   */
  static validateSecurityInvariant({
    invariantName = 'Security Invariant',
    condition = true,
    isPatternMatchOnly = false,
    reachableSink = true,
    exploitabilityEvidence = null,
    trustBoundaryCrossed = true,
    evidence = {}
  } = {}) {
    if (isPatternMatchOnly && (!reachableSink || !trustBoundaryCrossed || !exploitabilityEvidence)) {
      return {
        invariantName,
        holds: true,
        validVulnerability: false,
        verdict: 'REJECTED_FALSE_POSITIVE',
        reason: 'Finding rejected: pattern match without exploitability, reachable sink, or trust-boundary crossing is unproven.'
      };
    }

    const holds = condition === true && (!isPatternMatchOnly || reachableSink);
    return {
      invariantName,
      holds,
      validVulnerability: !holds,
      verdict: holds ? 'SECURITY_INVARIANT_HELD' : 'INVARIANT_VIOLATION_CONFIRMED',
      evidence
    };
  }

  /**
   * Audit GitHub Actions workflow for security vulnerabilities (Trail of Bits RE-15 / agentic-actions-auditor).
   * Detects:
   * 1. pull_request_target with checkout of PR head (untrusted code execution with write token)
   * 2. Script injection via unescaped context expressions in run: blocks (${{ github.event.* }})
   * 3. Unpinned third-party actions (using mutable @main, @master, @v1 tags instead of commit SHAs)
   */
  static auditWorkflowSecurity({ workflowYaml = '', workflowPath = '.github/workflows/ci.yml' } = {}) {
    const findings = [];

    // 1. pull_request_target with head checkout
    if (workflowYaml.includes('pull_request_target') &&
        (workflowYaml.includes('github.event.pull_request.head.sha') || workflowYaml.includes('ref: ${{ github.event.pull_request.head.ref }}'))) {
      findings.push({
        id: 'SEC-GHA-001',
        severity: 'CRITICAL',
        issue: 'Dangerous pull_request_target trigger checks out untrusted PR head code with repository write/secret permissions.',
        file: workflowPath,
        remediation: 'Use "pull_request" trigger for untrusted code, or do not check out PR head in "pull_request_target".'
      });
    }

    // 2. Direct expression injection in run scripts
    const runLines = workflowYaml.split('\n');
    let insideRun = false;
    for (let i = 0; i < runLines.length; i++) {
      const line = runLines[i];
      if (/^\s*run:\s*(?:\||>|-)?/.test(line)) {
        insideRun = true;
      } else if (insideRun && /^\s*[a-zA-Z0-9_-]+:/.test(line)) {
        insideRun = false;
      }

      if (insideRun && /\$\{\{\s*github\.event\.(?:issue|comment|pull_request\.title|pull_request\.body|head_commit\.message)/i.test(line)) {
        findings.push({
          id: 'SEC-GHA-002',
          severity: 'HIGH',
          issue: `Direct context expression injection in run script: ${line.trim()}`,
          file: workflowPath,
          line: i + 1,
          remediation: 'Pass untrusted context values through environment variables ("env:"), never interpolate directly in inline scripts.'
        });
      }
    }

    // 3. Unpinned third-party action tags
    const actionUses = workflowYaml.match(/uses:\s*([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+@[^\s\n]+)/g) || [];
    for (const match of actionUses) {
      const actionRef = match.replace(/uses:\s*/, '').trim();
      const [actionName, tag] = actionRef.split('@');
      if (tag && !/^[0-9a-f]{40}$/i.test(tag) && !actionName.startsWith('actions/')) {
        findings.push({
          id: 'SEC-GHA-003',
          severity: 'MEDIUM',
          issue: `Action "${actionName}" uses mutable tag "@${tag}" instead of immutable full commit SHA.`,
          file: workflowPath,
          remediation: `Pin "${actionName}" to an exact 40-character commit SHA to prevent supply-chain tampering.`
        });
      }
    }

    const secure = findings.length === 0;
    return {
      workflowPath,
      findingsCount: findings.length,
      secure,
      findings,
      verdict: secure ? 'WORKFLOW_SECURITY_VERIFIED' : 'WORKFLOW_VULNERABILITIES_DETECTED'
    };
  }

  /**
   * Evaluate Supabase / PostgreSQL Row Level Security (RLS) policies (Supabase RE-16).
   * Validates positive tenant access and negative cross-tenant boundary isolation.
   *
   * DEC-31 Epistemic Truthfulness:
   * Static string matching of "auth.uid() = user_id" confirms syntax and policy definition,
   * but does NOT claim RLS_LIVE_ISOLATION_VERIFIED unless backed by executable live query receipts.
   */
  /**
   * Compute deterministic receipt digest for test fixture purposes.
   * NOTE: Static receipt digests cannot grant live execution proof in evaluateRlsPolicy.
   * @param {object} receipt
   * @returns {string} SHA256 hex digest
   */
  static computeRlsReceiptDigest(receipt) {
    if (!receipt) return '';
    const posRows = receipt.positiveQuery?.rowsReturned ?? 0;
    const negRows = receipt.negativeQuery?.rowsReturned ?? 0;
    const negStatus = receipt.negativeQuery?.status ?? '';
    const payload = `RLS_RECEIPT:${receipt.dbEnvironment}:${receipt.tableName}:${receipt.timestamp}:${posRows}:${negRows}:${negStatus}`;
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Create a structured test fixture receipt.
   * NOTE: For testing/fixture inspection only. Calling evaluateRlsPolicy with this receipt
   * will be rejected as an unverified static fixture unless backed by an authorized LiveDatabaseAdapter.
   * @param {object} params
   * @returns {object} Structured fixture receipt
   */
  static createRlsQueryReceipt({
    dbEnvironment = 'postgres-staging',
    tableName = '',
    timestamp = new Date().toISOString(),
    positiveQuery = { query: 'SELECT * FROM tenant_data WHERE tenant_id = auth.uid()', status: 'SUCCESS', rowsReturned: 5 },
    negativeQuery = { query: 'SELECT * FROM tenant_data WHERE tenant_id != auth.uid()', status: 'ACCESS_DENIED', rowsReturned: 0 }
  } = {}) {
    const receipt = {
      dbEnvironment,
      tableName,
      timestamp,
      positiveQuery,
      negativeQuery,
      isTestFixture: true
    };
    receipt.receiptSignature = SecurityMethods.computeRlsReceiptDigest(receipt);
    return receipt;
  }

  /**
   * Evaluate Supabase / Postgres Row Level Security (RLS) policies against tenant isolation principles (Supabase RE-16).
   * Validates positive tenant access and negative cross-tenant boundary isolation.
   *
   * DEC-31 Epistemic Truthfulness:
   * Generic static policy evaluation produces only static findings (STATIC_CHECK_PASS or SUSPECTED_CROSS_TENANT_POLICY_RISK).
   * Live execution verification (RLS_LIVE_ISOLATION_VERIFIED) is DISABLED by default and requires
   * an authorized LiveDatabaseAdapter with active connection provenance. Caller-asserted booleans,
   * unauthenticated receipt digests, and metadata strings are strictly rejected.
   */
  static evaluateRlsPolicy({
    tableName = '',
    rlsEnabled = true,
    policies = [],
    testPrincipals = [],
    liveExecutionVerified = false,
    liveQueryReceipts = null,
    trustedQueryReceipt = null,
    liveDatabaseAdapter = null,
    liveProbeResult = null
  } = {}) {
    const issues = [];

    if (!rlsEnabled) {
      issues.push({
        severity: 'CRITICAL',
        issue: `Table "${tableName}" does not have Row Level Security (RLS) enabled. Public tables are accessible to anon/authenticated roles without restrictions.`,
        remediation: `Execute: ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`
      });
    }

    let hasTenantFilter = false;
    for (const pol of policies) {
      const definition = pol.definition || pol.using || '';
      if (/\b(?:auth\.uid\(\)\s*=\s*[a-zA-Z0-9_]+|tenant_id\s*=\s*|user_id\s*=\s*auth\.uid\(\))\b/i.test(definition)) {
        hasTenantFilter = true;
      }
    }

    if (rlsEnabled && policies.length === 0) {
      issues.push({
        severity: 'HIGH',
        issue: `Table "${tableName}" has RLS enabled but defines zero policies. All access will be rejected unless service role bypasses.`,
        remediation: 'Define explicit SELECT/INSERT/UPDATE/DELETE policies for intended roles.'
      });
    } else if (rlsEnabled && !hasTenantFilter) {
      issues.push({
        severity: 'HIGH',
        issue: `Table "${tableName}" policies lack tenant/user ownership clauses ("auth.uid() = user_id").`,
        remediation: 'Ensure USING expression checks tenant/user identity with auth.uid().'
      });
    }

    let suspectedCrossTenantRisk = false;
    if (testPrincipals.length >= 2) {
      const [principalA, principalB] = testPrincipals;
      if (!hasTenantFilter || policies.some(p => (p.definition || '').toLowerCase().includes('true'))) {
        suspectedCrossTenantRisk = true;
        issues.push({
          severity: 'CRITICAL',
          issue: `Suspected cross-tenant policy risk: Permissive or missing tenant filter in table "${tableName}" allows potential cross-tenant access between Principal "${principalA.id}" (tenant "${principalA.tenantId}") and Principal "${principalB.id}" (tenant "${principalB.tenantId}").`,
          remediation: 'Add strict tenant isolation predicate: "USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))".'
        });
      }
    }

    // Fail closed for the 0.5.0 release scope: a library caller can construct
    // an adapter, inject a mock query client, or invent a probe result. Neither
    // a client-supplied flag nor a convention-based provenance string attests
    // that PostgreSQL enforced the intended role/JWT and tenant isolation.
    // Until a host-controlled, independently trusted database adapter exists,
    // live verification claims are unsupported, even for successful probes.
    const suppliedRuntimeEvidence = Boolean(
      liveExecutionVerified || liveQueryReceipts || trustedQueryReceipt ||
      liveDatabaseAdapter || liveProbeResult
    );
    const receiptRejected = suppliedRuntimeEvidence;
    const receiptRejectionReason = suppliedRuntimeEvidence
      ? 'Untrusted probe, adapter, boolean, or receipt cannot prove database authentication or RLS isolation. An independently trusted, host-authorized live verifier is not available in this release.'
      : null;
    const empiricallyObservedLeak = false;
    const liveIsolationProven = false;
    const liveExecutionProvenance = null;
    const secure = issues.length === 0;
    const verdict = suspectedCrossTenantRisk
      ? 'SUSPECTED_CROSS_TENANT_POLICY_RISK'
      : (secure ? 'STATIC_CHECK_PASS' : 'RLS_MISCONFIGURATION_DETECTED');
    const requiresLiveValidation = true;

    return {
      tableName,
      rlsEnabled,
      policyCount: policies.length,
      hasTenantFilter,
      crossTenantLeak: suspectedCrossTenantRisk || empiricallyObservedLeak,
      suspectedCrossTenantRisk,
      empiricallyObservedLeak,
      secure,
      requiresLiveValidation,
      issues,
      verdict,
      epistemicStatus: (liveIsolationProven || empiricallyObservedLeak)
        ? 'LIVE_EXECUTION_PROVEN'
        : (secure ? 'STATIC_ANALYSIS_ONLY' : 'CONFIG_DEFECT_DETECTED'),
      receiptVerified: liveIsolationProven,
      ...(receiptRejected ? { receiptRejected, receiptRejectionReason } : {}),
      ...(liveExecutionProvenance ? { liveExecutionProvenance } : {})
    };
  }

  /**
   * Detect exposed Supabase service-role keys in client-facing code (Supabase RE-16).
   */
  static detectServiceRoleKeyExposure({ content = '', filePath = '' } = {}) {
    const isClientFacing = /^(?:src\/)?(?:app|pages|components|public|client|views)\b/i.test(filePath) ||
      /\.(?:tsx|jsx|html|svelte|vue)$/i.test(filePath);

    const hasServiceRoleKey = /\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role)\b/i.test(content) &&
      /(?:eyJ[a-zA-Z0-9-_]{20,}|key\s*:\s*['"][a-zA-Z0-9-_]{20,}['"]|process\.env\.SUPABASE_SERVICE_ROLE_KEY)/i.test(content);

    if (hasServiceRoleKey && isClientFacing) {
      return {
        exposed: true,
        filePath,
        severity: 'CRITICAL',
        verdict: 'SERVICE_ROLE_KEY_EXPOSED',
        reason: 'Supabase service_role key detected in client-facing frontend bundle. Service-role bypasses all RLS policies.',
        remediation: 'Remove service_role key from client-side code immediately. Use ANON key on client and restrict service-role to server-only routes.'
      };
    }

    return {
      exposed: false,
      filePath,
      verdict: 'NO_CLIENT_SERVICE_ROLE_EXPOSURE',
      reason: 'No exposed service-role credentials found in client surface.'
    };
  }

  /**
   * Audit PostgreSQL migration safety and DDL lock hazards (Supabase RE-16).
   */
  static auditPostgresMigrationSafety({ ddl = '', currentTableRows = 0 } = {}) {
    const hazards = [];

    // 1. CREATE INDEX without CONCURRENTLY
    if (/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!CONCURRENTLY\b)/i.test(ddl)) {
      hazards.push({
        type: 'LOCK_HEAVY_INDEXING',
        severity: currentTableRows > 1000 ? 'HIGH' : 'MEDIUM',
        issue: 'CREATE INDEX without CONCURRENTLY acquires an exclusive SHARE lock on the table, blocking writes.',
        remediation: 'Use "CREATE INDEX CONCURRENTLY" to build indexes without table-exclusive write locks.'
      });
    }

    // 2. ADD COLUMN ... NOT NULL without DEFAULT on populated table
    if (/ALTER\s+TABLE\s+[^\n]+ADD\s+COLUMN\s+[^\n]+NOT\s+NULL(?!\s+DEFAULT\b)/i.test(ddl)) {
      hazards.push({
        type: 'TABLE_REWRITE_LOCK',
        severity: 'HIGH',
        issue: 'Adding a NOT NULL column without a DEFAULT requires rewriting the entire table under ACCESS EXCLUSIVE lock.',
        remediation: 'Use Expand-Migrate-Contract: 1) ADD COLUMN nullable, 2) backfill, 3) ALTER COLUMN SET NOT NULL.'
      });
    }

    // 3. SECURITY DEFINER views/functions without search_path
    if (/SECURITY\s+DEFINER/i.test(ddl) && !/SET\s+search_path\s*=/i.test(ddl)) {
      hazards.push({
        type: 'SECURITY_DEFINER_PRIVILEGE_ESCALATION',
        severity: 'HIGH',
        issue: 'SECURITY DEFINER function/view defined without fixed "SET search_path = \'\'" allows search_path hijack.',
        remediation: 'Add "SET search_path = \'\'" or prefer "SECURITY INVOKER" for standard views.'
      });
    }

    const safe = hazards.length === 0;
    return {
      safe,
      hazardsCount: hazards.length,
      hazards,
      expandMigrateContractCompliant: safe,
      verdict: safe ? 'POSTGRES_MIGRATION_SAFE' : 'MIGRATION_LOCK_HAZARDS_DETECTED'
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
