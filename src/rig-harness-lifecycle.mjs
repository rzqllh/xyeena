import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const CORE = Object.freeze([
  'permission-boundary',
  'scope-control',
  'evidence-before-claim',
  'anti-loop',
  'external-content-trust'
]);

export const GROUPS = Object.freeze({
  design: '30-design',
  accessibility: '30-design',
  regression: '50-quality',
  testing: '50-quality',
  security: '60-security',
  review: '50-quality',
  release: '80-operations',
  rollback: '80-operations'
});

export function safeInstalledGuide(root, group) {
  const guide = path.join(root, '.xyeena', 'harness', 'guides', group);
  let cursor = root;
  for (const segment of path.relative(root, guide).split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) return false;
    } catch {
      return false;
    }
  }
  try {
    return fs.statSync(guide).isDirectory() && fs.statSync(path.join(guide, 'README.md')).isFile();
  } catch {
    return false;
  }
}

const SENSITIVE_PATTERNS = [
  /ghp_[A-Za-z0-9_]{36,}/g,
  /gho_[A-Za-z0-9_]{36,}/g,
  /github_pat_[A-Za-z0-9_]{82}/g,
  /sk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /(?:password|secret|api[_-]?key|token)\s*[:=]\s*["']?([A-Za-z0-9_\-.~+=]{8,})["']?/gi,
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g
];

export function sanitizeSecretText(text) {
  if (typeof text !== 'string') return text;
  let sanitized = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  }
  return sanitized;
}

export function sanitizeAuditData(data) {
  if (!data || typeof data !== 'object') return data;
  try {
    const json = JSON.stringify(data);
    const cleanJson = sanitizeSecretText(json);
    return JSON.parse(cleanJson);
  } catch {
    return data;
  }
}

/**
 * Validates that targetPath is strictly contained within the workspace root.
 * Normalizes existing ancestors using filesystem-aware resolution (handling macOS /var symlink, Windows paths, etc.).
 * Preserves containment against path traversal, absolute path escape, and symlink escape.
 * Rejects null-byte paths and paths outside the canonical workspace root.
 */
export function assertWorkspaceBoundary(targetPath, workspaceRoot) {
  if (!targetPath || typeof targetPath !== 'string') {
    const error = new Error('Workspace boundary validation requires a target path string');
    error.code = 'ERR_WORKSPACE_BOUNDARY_VIOLATION';
    throw error;
  }
  if (targetPath.includes('\0')) {
    const error = new Error('Workspace boundary violation: null-byte injection detected in target path');
    error.code = 'ERR_WORKSPACE_BOUNDARY_VIOLATION';
    throw error;
  }
  if (!workspaceRoot || typeof workspaceRoot !== 'string') {
    const error = new Error('Workspace boundary validation requires a workspace root string');
    error.code = 'ERR_WORKSPACE_BOUNDARY_VIOLATION';
    throw error;
  }

  const resolvedRoot = path.resolve(workspaceRoot);
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync(resolvedRoot);
  } catch (err) {
    const error = new Error(`Workspace boundary violation: workspace root "${workspaceRoot}" could not be resolved: ${err.message}`);
    error.code = 'ERR_WORKSPACE_BOUNDARY_VIOLATION';
    throw error;
  }

  // If targetPath is relative, resolve against canonicalRoot
  // If targetPath is absolute, resolve directly
  const rawTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(canonicalRoot, targetPath);

  // Walk up to find nearest existing ancestor on disk
  let current = rawTarget;
  const tailSegments = [];

  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    tailSegments.unshift(path.basename(current));
    current = parent;
  }

  let canonicalTarget;
  try {
    const canonicalAncestor = fs.realpathSync(current);
    canonicalTarget = tailSegments.length > 0
      ? path.join(canonicalAncestor, ...tailSegments)
      : canonicalAncestor;
  } catch {
    canonicalTarget = rawTarget;
  }

  const rel = path.relative(canonicalRoot, canonicalTarget);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    const error = new Error(`Workspace boundary violation: target path "${targetPath}" is outside workspace root "${canonicalRoot}"`);
    error.code = 'ERR_WORKSPACE_BOUNDARY_VIOLATION';
    throw error;
  }

  return canonicalTarget;
}

/**
 * Read-only Rig policy inspection. Detects installed project Harness guides.
 */
export function inspectRigHarness({ cwd = process.cwd(), contextualRequested = [] } = {}) {
  const root = fs.realpathSync(path.resolve(cwd));
  if (!fs.statSync(root).isDirectory()) throw new Error('Harness workspace must be a directory');
  const required = [...new Set(contextualRequested.map(x => GROUPS[x] || (Object.values(GROUPS).includes(x) ? x : null)).filter(Boolean))];
  const installed = required.filter(group => safeInstalledGuide(root, group));
  return {
    schema: 1,
    core: { rules: [...CORE], status: 'rig-read-only-boundary' },
    contextual: {
      requested: required,
      installed,
      missing: required.filter(x => !installed.includes(x)),
      enforcement: installed.length > 0 ? 'active-contextual-enforcement' : 'guide-presence-only; live host injection not verified'
    },
    executable: {
      scope: 'read-only-one-shot',
      writeGates: 'enforced',
      independentVerification: 'required'
    }
  };
}

/**
 * An actual local preflight gate for the supported safe execution path.
 */
export function enforceRigPreflight(plan, { consent = false } = {}) {
  if (consent !== true) throw new Error('Harness preflight requires explicit model-call consent');
  if (!plan || plan.schema !== 1 || !plan.ready || !plan.hostExecutionAvailable) {
    throw new Error('Harness preflight requires a ready, supported orchestration preview');
  }
  if (!['/xyeena-rig', '/xyeena-orchestrate'].includes(plan.entrypoint) ||
      !plan.selectedSkills?.includes(plan.entrypoint.slice(1))) {
    throw new Error('Harness preflight refuses missing workflow governor');
  }
  if (plan.execution !== 'cli-one-shot' && plan.execution !== 'sdk-one-shot') {
    throw new Error('Harness preflight refuses unsupported execution mode');
  }
  const root = fs.realpathSync(path.resolve(plan.cwd));
  if (root !== plan.cwd) throw new Error('Harness workspace root changed since preview');
  return {
    status: 'PASS',
    scope: 'read-only',
    operationClass: 'safe',
    rules: [...CORE],
    externalActionsAuthorized: false,
    destructiveActionsAuthorized: false,
    independentlyVerified: false
  };
}

/**
 * Trusted Host Approval Authority.
 * Generates and verifies unforgeable, cryptographically signed ALLOW_ONCE proofs.
 * Held strictly by the host environment or test harness outside the agent boundary.
 */
export class HostApprovalAuthority {
  #secret;

  constructor({ hostId = 'trusted-host', secret = null } = {}) {
    this.hostId = hostId;
    this.#secret = secret || crypto.randomBytes(32).toString('hex');
  }

  issueApproval({ toolName, args = {}, actionType = 'destructive', approver = 'host-user' } = {}) {
    if (!toolName || typeof toolName !== 'string') {
      throw new Error('Approval requires a valid toolName string');
    }
    const validApprovers = ['host-user', 'human-user', 'operator', 'user'];
    if (!validApprovers.includes(approver)) {
      throw new Error(`Untrusted approver "${approver}": must be verified host authority`);
    }
    const canonicalAction = actionType || 'destructive';
    const payload = JSON.stringify({
      actionType: canonicalAction,
      toolName,
      args: args || {},
      approver,
      hostId: this.hostId
    });
    const hmac = crypto.createHmac('sha256', this.#secret).update(payload).digest('hex');
    return Object.freeze({
      tokenType: 'host-allow-once-proof',
      actionType: canonicalAction,
      toolName,
      args: args || {},
      approver,
      hostId: this.hostId,
      signature: hmac
    });
  }

  verifyApproval(proof) {
    if (!proof || typeof proof !== 'object' || proof.tokenType !== 'host-allow-once-proof') {
      return false;
    }
    if (!proof.signature || typeof proof.signature !== 'string') {
      return false;
    }
    const payload = JSON.stringify({
      actionType: proof.actionType,
      toolName: proof.toolName,
      args: proof.args || {},
      approver: proof.approver,
      hostId: proof.hostId
    });
    const expected = crypto.createHmac('sha256', this.#secret).update(payload).digest('hex');
    if (proof.signature.length !== expected.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(proof.signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }
}

export function createHostApprovalAuthority(options = {}) {
  return new HostApprovalAuthority(options);
}

/**
 * Independent Evidence Verifier.
 * Inspects physical evidence artifacts on disk for authentic verification content,
 * structural compliance, and prevents self-reported success with dummy/placeholder files.
 */
export class IndependentEvidenceVerifier {
  constructor({ cwd = process.cwd(), customVerifier = null } = {}) {
    this.cwd = fs.realpathSync(path.resolve(cwd));
    this.customVerifier = typeof customVerifier === 'function' ? customVerifier : null;
  }

  verifyArtifact(ref, { result = null } = {}) {
    if (!ref || typeof ref !== 'string' || !ref.trim()) {
      return { valid: false, warning: 'Invalid evidence reference: expected non-empty path string' };
    }
    let resolved;
    try {
      resolved = assertWorkspaceBoundary(ref, this.cwd);
    } catch (err) {
      return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" is outside workspace or invalid: ${err.message}` };
    }

    if (!fs.existsSync(resolved)) {
      return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" does not exist on disk` };
    }

    const stat = fs.statSync(resolved);
    if (!stat.isFile() || stat.size === 0) {
      return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" is empty or not a regular file` };
    }

    let content;
    try {
      content = fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      return { valid: false, warning: `Independent verification failed: unable to read evidence artifact "${ref}": ${err.message}` };
    }

    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 8) {
      return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" content is too trivial to substantiate completion` };
    }

    const placeholderPatterns = [
      /^(test|placeholder|dummy|foo|bar|done|all good|verified|ok)$/i,
      /^\s*\{\s*\}\s*$/,
      /^\s*\[\s*\]\s*$/
    ];
    if (placeholderPatterns.some(p => p.test(trimmed))) {
      return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" contains placeholder content` };
    }

    if (ref.endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" is not a valid JSON object` };
        }
        if (parsed.status && parsed.status !== 'VERIFIED') {
          return { valid: false, warning: `Independent verification failed: evidence artifact status is "${parsed.status}", expected "VERIFIED"` };
        }
      } catch (err) {
        return { valid: false, warning: `Independent verification failed: evidence artifact "${ref}" contains invalid JSON: ${err.message}` };
      }
    }

    if (this.customVerifier) {
      try {
        const customOk = this.customVerifier(ref, { resolvedPath: resolved, content, result });
        if (customOk !== true) {
          return { valid: false, warning: `Custom independent evidence verifier rejected artifact "${ref}"` };
        }
      } catch (err) {
        return { valid: false, warning: `Custom independent evidence verifier error: ${err.message}` };
      }
    }

    return { valid: true, warning: null };
  }
}

/**
 * Executable Harness Execution Gate for Pre-Tool, Post-Tool, and Worker Policy Propagation.
 * Xyeena supports only ALLOW_ONCE, DENY, and ANSWER_QUESTION for privileged/destructive actions.
 * There is NO persistent Always Allow equivalent for destructive or privileged operations.
 */
export class HarnessExecutionGate {
  #hostAuthority;

  constructor({
    cwd = process.cwd(),
    operationClass = 'standard',
    permissions = {},
    workerId = 'governor',
    inheritedFrom = null,
    auditLog = [],
    contextualRequested = [],
    depth = 0,
    allowOnceTokens = [],
    hostAuthority = null,
    evidenceVerifier = null,
    enforcementRuntime = 'antigravity'
  } = {}) {
    this.cwd = fs.realpathSync(path.resolve(cwd));
    this.operationClass = operationClass;
    // Destructive and external operations never receive persistent allow.
    this.permissions = Object.freeze({
      destructive: false,
      external: false,
      interactive: permissions?.interactive === true
    });
    this.workerId = workerId;
    this.inheritedFrom = inheritedFrom;
    this.auditLog = auditLog;
    this.depth = depth;
    this.enforcementRuntime = enforcementRuntime;
    this.supportedEnforcementRuntimes = Object.freeze(['antigravity', 'rig-cli', 'harness-gate']);
    this.#hostAuthority = hostAuthority instanceof HostApprovalAuthority
      ? hostAuthority
      : (inheritedFrom === null ? new HostApprovalAuthority() : null);
    this.evidenceVerifier = evidenceVerifier instanceof IndependentEvidenceVerifier
      ? evidenceVerifier
      : new IndependentEvidenceVerifier({
          cwd: this.cwd,
          customVerifier: typeof evidenceVerifier === 'function' ? evidenceVerifier : null
        });
    this.allowOnceTokens = new Set();
    // Constructor strictly refuses unverified injected tokens to prevent agent self-authorization
    if (Array.isArray(allowOnceTokens) && allowOnceTokens.length > 0) {
      for (const tok of allowOnceTokens) {
        if (this.#hostAuthority && tok && typeof tok === 'object' && tok.signature) {
          try { this.grantAllowOnce(tok); } catch {}
        }
      }
    }
    this.recentErrors = new Map();
    this.contextual = inspectRigHarness({ cwd: this.cwd, contextualRequested });
    this.depth = depth;
  }

  recordAudit(entry) {
    const clean = sanitizeAuditData(entry);
    this.auditLog.push(clean);
    return clean;
  }

  grantAllowOnce(proof, { approver, authority } = {}) {
    // 1. Delegated workers can NEVER self-issue or grant ALLOW_ONCE
    if (this.inheritedFrom !== null) {
      const err = new Error('Delegated workers cannot self-issue privileged ALLOW_ONCE authorization');
      err.code = 'ERR_UNAUTHORIZED_ALLOW_ONCE';
      throw err;
    }

    // 2. Reject missing credentials or defaults that could be impersonated
    if (!proof || typeof proof !== 'object') {
      const err = new Error('Privileged authorization requires explicit trusted approver and authority credentials; self-issuance is forbidden');
      err.code = 'ERR_MISSING_AUTHORIZATION_CREDENTIALS';
      throw err;
    }

    // 3. Cryptographic host approval verification: reject plain objects without signature
    if (!proof.signature) {
      const err = new Error('Privileged authorization requires unforgeable host approval proof with cryptographic signature; self-issuance is forbidden');
      err.code = 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE';
      throw err;
    }

    if (!this.#hostAuthority || typeof this.#hostAuthority.verifyApproval !== 'function') {
      const err = new Error('No trusted host approval authority configured for this gate; cannot verify privileged approvals');
      err.code = 'ERR_NO_HOST_AUTHORITY';
      throw err;
    }

    if (!this.#hostAuthority.verifyApproval(proof)) {
      const err = new Error('Privileged authorization requires trusted host user approval; rejected untrusted or unverified signature');
      err.code = 'ERR_UNTRUSTED_AUTHORIZATION_SOURCE';
      throw err;
    }

    const actionType = proof.actionType || 'destructive';
    const sig = `${actionType}:${proof.toolName}:${JSON.stringify(proof.args || {})}`;
    this.allowOnceTokens.add(sig);
    return true;
  }

  preToolGate({ toolName, args = {}, targetPath = null, actionType = 'read', workerId = null } = {}) {
    const effectiveWorkerId = workerId || this.workerId;
    const now = new Date().toISOString();

    // 1. Scope & Workspace Boundary Enforcement
    const candidatePath = targetPath || args?.path || args?.targetPath || args?.TargetFile || args?.file || args?.cwd || args?.Cwd;
    if (candidatePath && typeof candidatePath === 'string') {
      try {
        assertWorkspaceBoundary(candidatePath, this.cwd);
      } catch (err) {
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'DENY',
          rule: 'scope-control',
          reason: err.message,
          blocked: true
        };
        return this.recordAudit(auditEntry);
      }
    }

    const isShell = toolName === 'run_command' ||
      toolName === 'execute_command' ||
      toolName === 'shell' ||
      Boolean(args?.CommandLine);

    // Shell command scope enforcement: reject path escapes in CommandLine
    if (isShell && args?.CommandLine && /(?:^|\s)(?:cd\s+\.\.|cd\s+\/|[A-Za-z]:[\\/])/i.test(args.CommandLine)) {
      const auditEntry = {
        timestamp: now,
        workerId: effectiveWorkerId,
        toolName,
        decision: 'DENY',
        rule: 'scope-control',
        reason: 'Shell command execution attempts filesystem escape outside workspace root',
        blocked: true
      };
      return this.recordAudit(auditEntry);
    }

    // 2. Anti-Loop Gate: Enforced before privileged action approval
    const callSig = `${toolName}:${JSON.stringify(args || {})}`;
    const errorCount = this.recentErrors.get(callSig) || 0;
    if (errorCount >= 3) {
      const auditEntry = {
        timestamp: now,
        workerId: effectiveWorkerId,
        toolName,
        decision: 'DENY',
        rule: 'anti-loop',
        blocked: true,
        reason: 'Anti-loop: tool call failed 3 times consecutively; approach must be revised'
      };
      return this.recordAudit(auditEntry);
    }

    // 3. Destructive & External Actions Detection
    const isDestructive = actionType === 'destructive' ||
      ['rm_file', 'delete_file', 'drop_table', 'reset_hard'].includes(toolName) ||
      (args?.CommandLine && /(rm\s+-rf|rmdir\s+\/s|git\s+reset\s+--hard|git\s+clean\s+-fd)/i.test(args.CommandLine));

    const isExternal = actionType === 'external' ||
      ['publish', 'git_push', 'external_api'].includes(toolName) ||
      (args?.CommandLine && /(git\s+push|npm\s+publish|curl|wget)/i.test(args.CommandLine));

    // 4. Runtime Enforcement Capability Gate (treat arbitrary shell / privileged actions as untrusted unless runtime intercepts)
    if (this.enforcementRuntime && !this.supportedEnforcementRuntimes.includes(this.enforcementRuntime)) {
      if (isDestructive || isExternal || isShell) {
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'DENY',
          rule: 'runtime-enforcement',
          blocked: true,
          reason: `Host runtime "${this.enforcementRuntime}" does not support verified live tool interception; failing closed for privileged operations`
        };
        return this.recordAudit(auditEntry);
      }
    }

    // 5. Destructive Actions Gate
    if (isDestructive) {
      const actionSig = `destructive:${toolName}:${JSON.stringify(args || {})}`;
      if (this.allowOnceTokens.has(actionSig)) {
        this.allowOnceTokens.delete(actionSig);
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'ALLOW_ONCE',
          rule: 'permission-boundary',
          blocked: false,
          reason: 'Allowed once by explicit scoped authorization'
        };
        return this.recordAudit(auditEntry);
      }
      if (this.permissions.interactive) {
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'ANSWER_QUESTION',
          rule: 'permission-boundary',
          blocked: true,
          prompt: `Destructive action "${toolName}" requires user confirmation before proceeding.`
        };
        return this.recordAudit(auditEntry);
      }
      const auditEntry = {
        timestamp: now,
        workerId: effectiveWorkerId,
        toolName,
        decision: 'DENY',
        rule: 'permission-boundary',
        blocked: true,
        reason: 'Destructive operation denied: explicit single-use authorization (ALLOW_ONCE) required for this exact operation and arguments'
      };
      return this.recordAudit(auditEntry);
    }

    // 6. External Actions Gate
    if (isExternal) {
      const actionSig = `external:${toolName}:${JSON.stringify(args || {})}`;
      if (this.allowOnceTokens.has(actionSig)) {
        this.allowOnceTokens.delete(actionSig);
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'ALLOW_ONCE',
          rule: 'permission-boundary',
          blocked: false,
          reason: 'Allowed once by explicit scoped authorization'
        };
        return this.recordAudit(auditEntry);
      }
      if (this.permissions.interactive) {
        const auditEntry = {
          timestamp: now,
          workerId: effectiveWorkerId,
          toolName,
          decision: 'ANSWER_QUESTION',
          rule: 'permission-boundary',
          blocked: true,
          prompt: `External operation "${toolName}" requires user authorization before execution.`
        };
        return this.recordAudit(auditEntry);
      }
      const auditEntry = {
        timestamp: now,
        workerId: effectiveWorkerId,
        toolName,
        decision: 'DENY',
        rule: 'permission-boundary',
        blocked: true,
        reason: 'External operation denied: explicit single-use authorization (ALLOW_ONCE) required for this exact operation and arguments'
      };
      return this.recordAudit(auditEntry);
    }

    // 7. Default ALLOW with core safety rules active
    const auditEntry = {
      timestamp: now,
      workerId: effectiveWorkerId,
      toolName,
      decision: 'ALLOW',
      rule: 'core-safety',
      blocked: false
    };
    return this.recordAudit(auditEntry);
  }

  postToolGate({ toolName, args = {}, result = null, error = null, workerId = null } = {}) {
    const effectiveWorkerId = workerId || this.workerId;
    const now = new Date().toISOString();
    const callSig = `${toolName}:${JSON.stringify(args || {})}`;

    if (error) {
      const current = this.recentErrors.get(callSig) || 0;
      this.recentErrors.set(callSig, current + 1);
    } else {
      this.recentErrors.delete(callSig);
    }

    let verified = false;
    let warning = null;
    if (result && typeof result === 'object') {
      const hasSelfClaim = result.verified === true || result.status === 'PASS';
      const evidenceRefs = Array.isArray(result.evidenceRefs) ? result.evidenceRefs : [];
      if (hasSelfClaim && evidenceRefs.length === 0) {
        warning = 'Self-certified success without verifiable independent evidence is invalid';
        verified = false;
      } else if (hasSelfClaim && evidenceRefs.length > 0) {
        let allValid = true;
        for (const ref of evidenceRefs) {
          const check = this.evidenceVerifier.verifyArtifact(ref, { result });
          if (!check.valid) {
            allValid = false;
            warning = check.warning;
            break;
          }
        }
        verified = allValid;
      }
    }

    const auditEntry = {
      timestamp: now,
      workerId: effectiveWorkerId,
      toolName,
      hasError: Boolean(error),
      verified,
      warning,
      rule: 'evidence-before-claim'
    };
    return this.recordAudit(auditEntry);
  }

  delegateWorker(childWorkerId, { delegatedPermissions = {} } = {}) {
    if (!childWorkerId || typeof childWorkerId !== 'string') {
      throw new Error('Worker delegation requires a valid worker ID string');
    }
    if (this.depth >= 1) {
      throw new Error(`Recursive delegation forbidden: worker "${this.workerId}" at depth ${this.depth} cannot spawn sub-workers`);
    }
    // Strict non-escalation: child permissions = parent permissions AND delegatedPermissions
    const effectivePermissions = {
      destructive: this.permissions.destructive && delegatedPermissions.destructive === true,
      external: this.permissions.external && delegatedPermissions.external === true,
      interactive: this.permissions.interactive && delegatedPermissions.interactive === true
    };

    return new HarnessExecutionGate({
      cwd: this.cwd,
      operationClass: this.operationClass,
      permissions: effectivePermissions,
      workerId: childWorkerId,
      inheritedFrom: this.workerId,
      auditLog: this.auditLog,
      contextualRequested: this.contextual?.contextual?.requested || [],
      depth: this.depth + 1,
      enforcementRuntime: this.enforcementRuntime,
      hostAuthority: null, // Delegated workers NEVER receive host authority
      evidenceVerifier: this.evidenceVerifier
    });
  }
}

export function createHarnessExecutionGate(options = {}) {
  return new HarnessExecutionGate(options);
}
