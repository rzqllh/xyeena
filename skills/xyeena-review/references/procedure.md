# xyeena-review — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A material code change needs independent spec, engineering, or risk review, including PRs or security-relevant modifications.

**Negative trigger:** A request to self-certify from a keyword match or a plain copy edit without meaningful implementation risk.

## Operational procedure

### 1. Discover

Receive user intent, accepted requirements and actual diff/tree; do not inherit Builder's confidence or undocumented design rationale.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Review Intent separately: for each requirement identify observable behavior and independent proof; a symbol/keyword in diff is NOT proof.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Review Engineering: inspect invariants, callers, concurrency, failures, tests, migrations and unnecessary complexity; anchor each finding to file/line.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Review Risk: trust boundaries, data loss, backward compatibility, performance, user impact and release constraints proportional to change.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Return CHANGES_REQUIRED for a proven blocker, REVIEW_REQUIRED for unverified acceptance, PASS only if each required axis has appropriate evidence; enumerate residual notes.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Independent findings with proof and severity, requirement-to-evidence matrix, verdict and remediation actions.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. No lint findings or the presence of an auth function is not evidence that ownership checks or request semantics are correct.

## Upstream provenance

RE-01 Superpowers two-stage spec/code review, RE-02 Superior Skills dual-axis separation, RE-03 Anti-Slop and RE-04 Ponytail.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
