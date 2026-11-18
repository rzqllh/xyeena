# xyeena-release — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** Candidate is accepted for integration or user explicitly requests release readiness, merge, deployment or package publication preparation.

**Negative trigger:** Merely completing a local edit, a draft PR, unverified tests or a request without permission for external changes.

## Operational procedure

### 1. Discover

Confirm requested release target, exact tree, version, artifact scope, owner consent and source/notice provenance.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Run package contents, consumer install, migration/rollback and platform-specific acceptance; inspect full CI and skipped/cancelled jobs.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Assess impact: semver, backward compatibility, changelog, secrets, permissions, data migration and safe rollback; verify stale host claims.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Keep merge/tag/publish/deploy as distinct gated operations, each requiring explicit owner instruction for that exact target.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Produce a GO/NO_GO release packet with reproducible commands, evidence IDs, blockers and retention/rollback plan; do not auto-delete branches/worktrees.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Candidate SHA, manifest diff, CI/consumer/install receipts, license notices, go/no-go and next authorized action.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. A successful npm pack dry-run does not prove installed consumer behavior or live host support; an unreleased version number is not a published release.

## Upstream provenance

RE-01 Superpowers verification and RE-05 Caveman minimal proof; RE-20 Xyeena transactional installer and owner gates.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
