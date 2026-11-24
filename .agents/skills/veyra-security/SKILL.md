---
name: veyra-security
description: Use when auditing secrets, RLS policies, SSRF exposure, or untrusted-input boundaries.
version: 1.0.0
aliases:
  - security
---

# veyra-security

Audit code and configurations against security vulnerabilities, credential leaks, and missing authorization.

## When to Use
- Before any commit or release to ensure no API keys or private keys are exposed.
- When reviewing database schema migrations for Row-Level Security (RLS) enforcement.
- When validating input handlers against command injection and path traversal.

## Invariants
1. Zero Leaked Credentials: Hardcoded secrets immediately block release.
2. Tenant Isolation: Multi-tenant database tables must enable Row-Level Security.
3. Injection Defense: Dynamic SQL or shell command interpolations are classified as CRITICAL risks.

## Operational Instructions
1. Native Host Integration: Read source and execute relevant checks; trace exploitability across guards and configuration before assigning severity.
2. Engine entry: `import { scanSecretLeaks, auditRlsPolicies, auditInputSanitization, detectPathTraversal } from './engine.mjs'`
3. Evidence boundary: Finding a fallback constant does not alone prove exploitability; differentiate OBSERVED code from inferred impact.
