---
name: xyeena-release
description: Use when implementation is verified and the user is preparing to merge, push, publish, deploy, release, or otherwise integrate the work.
---

# Release — v1 Procedure Entry

**Activate when:** Candidate is accepted for integration or user explicitly requests release readiness, merge, deployment or package publication preparation.

**Do not activate for:** Merely completing a local edit, a draft PR, unverified tests or a request without permission for external changes.

## Execution route

1. Confirm requested release target, exact tree, version, artifact scope, owner consent and source/notice provenance.
2. Run package contents, consumer install, migration/rollback and platform-specific acceptance; inspect full CI and skipped/cancelled jobs.
3. Assess impact: semver, backward compatibility, changelog, secrets, permissions, data migration and safe rollback; verify stale host claims.
4. Keep merge/tag/publish/deploy as distinct gated operations, each requiring explicit owner instruction for that exact target.
5. Produce a GO/NO_GO release packet with reproducible commands, evidence IDs, blockers and retention/rollback plan; do not auto-delete branches/worktrees.

**Output contract:** Candidate SHA, manifest diff, CI/consumer/install receipts, license notices, go/no-go and next authorized action.

**Failure boundary:** A successful npm pack dry-run does not prove installed consumer behavior or live host support; an unreleased version number is not a published release.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
