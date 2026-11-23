---
name: veyra-security
description: Advisory security auditing, secret leak detection, RLS policy validation, and untrusted input boundaries.
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
1. Discovery & Activation: Activated when writing authentication, authorization, database queries, API routes, or scanning secrets.
2. Engine Invocation:
   - Programmatic: `import { scanSecretLeaks, auditRlsPolicies, auditInputSanitization, detectPathTraversal } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-security/engine.mjs').then(m => console.log(m.scanSecretLeaks('sample code')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Scan staged code for hardcoded tokens (AWS, GitHub, JWT), verify input sanitization, and block path traversal.
   - Claude Code / Codex: Ensure Row Level Security (RLS) is active on user tables and untrusted inputs are strictly parameterized.
4. Output & Verification: Deliver zero-leak security audit certificate with verified boundary checks.
