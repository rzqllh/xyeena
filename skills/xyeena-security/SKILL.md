---
name: xyeena-security
description: Use when work touches authentication, authorization, permissions, secrets, untrusted input, uploads, webhooks, RLS, dependencies, cryptography, or production security boundaries.
---

# Security — v1 Procedure Entry

**Activate when:** The change crosses a trust boundary or handles credentials, tenant data, RLS, privileged actions, sensitive network input or secrets.

**Do not activate for:** Generic style review without a security boundary; a FULL audit absent explicit user authorization.

## Execution route

1. Pin scoped assets, threat actors, trust boundaries, sensitive inputs, relevant deployment and permission boundaries; distinguish scoped review from explicit full audit.
2. Trace representative hostile input to a security-sensitive sink, including authorization enforced on the server/database rather than just UI visibility.
3. Verify tenant isolation with actual authorized database tests when available; static SQL policy patterns are SUSPECTED_RISK not empirical cross-tenant access.
4. Test secrets/redaction, injection, unsafe defaults, dependency provenance, migrations and failure modes; attach file/line or controlled reproduction to findings.
5. Prioritize actionable findings by demonstrated exploit condition and impact; retest fixes and report residual uncertainty, never perform production changes without consent.

**Output contract:** Scoped threat model; affected boundaries; evidence-based findings; false-positive dispositions; retest proof and owner-gated remediation.

**Failure boundary:** No source-to-sink or live database evidence means no exploit-confirmed or RLS_LIVE_ISOLATION_VERIFIED claim.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
