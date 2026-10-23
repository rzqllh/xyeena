import fs from 'node:fs';
import path from 'node:path';

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
  const required = [...new Set(contextualRequested.map(x => GROUPS[x]).filter(Boolean))];
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
 * Executable Harness Execution Gate for Pre-Tool, Post-Tool, and Worker Policy Propagation.
 * Xyeena supports only ALLOW_ONCE, DENY, and ANSWER_QUESTION for privileged/destructive actions.
 * There is NO persistent Always Allow equivalent for destructive or privileged operations.
 */
export class HarnessExecutionGate {
  constructor({
    cwd = process.cwd(),
    operationClass = 'standard',
    permissions = {},
    workerId = 'governor',
    inheritedFrom = null,
    auditLog = [],
    contextualRequested = [],
    depth = 0,
    allowOnceTokens = []
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
    this.allowOnceTokens = new Set();
    if (Array.isArray(allowOnceTokens)) {
      for (const tok of allowOnceTokens) {
        this.grantAllowOnce(tok);
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

  grantAllowOnce(token) {
    if (typeof token === 'string' && token.trim()) {
      this.allowOnceTokens.add(token.trim());
      return true;
    }
    if (token && typeof token === 'object' && token.toolName) {
      const actionType = token.actionType || 'destructive';
      const sig = `${actionType}:${token.toolName}:${JSON.stringify(token.args || {})}`;
      this.allowOnceTokens.add(sig);
      return true;
    }
    return false;
  }

  preToolGate({ toolName, args = {}, targetPath = null, actionType = 'read', workerId = null } = {}) {
    const effectiveWorkerId = workerId || this.workerId;
    const now = new Date().toISOString();

    // 1. Scope & Workspace Boundary Enforcement
    const candidatePath = targetPath || args?.path || args?.targetPath || args?.TargetFile || args?.file || args?.cwd;
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

    // 2. Destructive Actions Gate
    const isDestructive = actionType === 'destructive' ||
      ['rm_file', 'delete_file', 'drop_table', 'reset_hard'].includes(toolName) ||
      (args?.CommandLine && /(rm\s+-rf|rmdir\s+\/s|git\s+reset\s+--hard|git\s+clean\s+-fd)/i.test(args.CommandLine));

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

    // 3. External Actions Gate
    const isExternal = actionType === 'external' ||
      ['publish', 'git_push', 'external_api'].includes(toolName) ||
      (args?.CommandLine && /(git\s+push|npm\s+publish|curl|wget)/i.test(args.CommandLine));

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

    // 4. Anti-Loop Gate
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

    // 5. Default ALLOW with core safety rules active
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
        verified = true;
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
      contextualRequested: this.contextual.contextual.requested,
      depth: this.depth + 1
    });
  }
}

export function createHarnessExecutionGate(options = {}) {
  return new HarnessExecutionGate(options);
}
