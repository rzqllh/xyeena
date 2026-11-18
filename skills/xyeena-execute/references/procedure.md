# xyeena-execute — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** User approved work with explicit acceptance criteria, safe local/repo write scope and known target files.

**Negative trigger:** Unresolved product decision, exploratory research only, blocked host writes, or implied permission to deploy/publish.

## Operational procedure

### 1. Discover

Verify branch, tests, scope, owners, uncommitted changes, host capabilities and permission before writing.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Establish a failing behavioral test for the intended change when practical; keep the baseline and reason for failure.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Implement one tracer slice at a time, preserving stable interfaces, user files and existing architecture unless approved to change.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Run narrow tests and inspect results; capture exact commands, target commit, output and side effects; fix actual failures only.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Request independent review of criteria and changed artifacts; do not self-promote implementation success to VERIFIED or release permission.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Changed path list and diff, RED/GREEN proof, test transcript, explicit unresolved cases and review handoff.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. If a command has partial side effects or timed out, inspect actual state and invoke recovery; no blind rerun or overwriting unrelated files.

## Upstream provenance

RE-01 Superpowers RED/GREEN, RE-02 Superior implementation craft, RE-04 Ponytail lean diff, RE-05 Caveman stop discipline.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
