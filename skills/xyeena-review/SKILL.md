---
name: xyeena-review
description: Use when reviewing a diff, branch, PR, completed implementation, or when an independent verdict is required before release.
---

# Review — v1 Procedure Entry

**Activate when:** A material code change needs independent spec, engineering, or risk review, including PRs or security-relevant modifications.

**Do not activate for:** A request to self-certify from a keyword match or a plain copy edit without meaningful implementation risk.

## Execution route

1. Receive user intent, accepted requirements and actual diff/tree; do not inherit Builder's confidence or undocumented design rationale.
2. Review Intent separately: for each requirement identify observable behavior and independent proof; a symbol/keyword in diff is NOT proof.
3. Review Engineering: inspect invariants, callers, concurrency, failures, tests, migrations and unnecessary complexity; anchor each finding to file/line.
4. Review Risk: trust boundaries, data loss, backward compatibility, performance, user impact and release constraints proportional to change.
5. Return CHANGES_REQUIRED for a proven blocker, REVIEW_REQUIRED for unverified acceptance, PASS only if each required axis has appropriate evidence; enumerate residual notes.

**Output contract:** Independent findings with proof and severity, requirement-to-evidence matrix, verdict and remediation actions.

**Failure boundary:** No lint findings or the presence of an auth function is not evidence that ownership checks or request semantics are correct.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
