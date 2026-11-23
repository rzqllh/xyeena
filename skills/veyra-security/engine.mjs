/**
 * Veyra Security Engine — veyra-security
 * Secret leak detection, RLS policy audit, untrusted input boundaries (DEC-31).
 * Zero external dependencies.
 */

export function scanSecretLeaks(content = '') {
  if (typeof content !== 'string') return [];
  const SECRET_PATTERNS = [
    { type: 'PRIVATE_KEY', pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g },
    { type: 'AWS_ACCESS_KEY', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: 'GENERIC_SECRET_KEY', pattern: /(?:api_key|secret_key|private_key|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{24,}['"]/gi },
    { type: 'GITHUB_TOKEN', pattern: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g }
  ];

  const leaks = [];
  for (const sp of SECRET_PATTERNS) {
    let m;
    while ((m = sp.pattern.exec(content)) !== null) {
      leaks.push({
        type: sp.type,
        match: m[0].slice(0, 12) + '...',
        index: m.index
      });
    }
  }

  return leaks;
}

export function auditRlsPolicies(sqlText = '') {
  if (typeof sqlText !== 'string') return { compliant: false, issues: [] };
  const issues = [];

  const lower = sqlText.toLowerCase();
  if (lower.includes('alter table') && !lower.includes('enable row level security')) {
    issues.push({ issue: 'TABLE_WITHOUT_RLS', severity: 'HIGH' });
  }

  if (lower.includes('create policy') && lower.includes('using (true)')) {
    issues.push({ issue: 'OVERLY_PERMISSIVE_POLICY_USING_TRUE', severity: 'CRITICAL' });
  }

  return {
    compliant: issues.length === 0,
    issueCount: issues.length,
    issues
  };
}

export function auditInputSanitization(codeSnippet = '') {
  const issues = [];
  if (codeSnippet.match(/SELECT\s+.*\s+FROM\s+.*\+\s*\$/i)) {
    issues.push({ type: 'SQL_INJECTION_RISK', severity: 'CRITICAL' });
  }
  if (codeSnippet.match(/exec(?:Sync)?\s*\(\s*`.*\$\{/)) {
    issues.push({ type: 'COMMAND_INJECTION_RISK', severity: 'CRITICAL' });
  }
  return {
    clean: issues.length === 0,
    issues
  };
}

export function detectPathTraversal(pathString = '') {
  const isTraversal = pathString.includes('..') || pathString.includes('%2e%2e') || pathString.includes('\0');
  return { safe: !isTraversal, pathString, reason: isTraversal ? 'PATH_TRAVERSAL_DETECTED' : 'SAFE' };
}
