# xyeena-handoff — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A session must transfer ownership, a worker is replaced, or a verified task waits on a separate actor.

**Negative trigger:** Same-session short answer or a speculative future handoff with no concrete state.

## Operational procedure

### 1. Discover

Read persisted artifacts and Git state, not just conversational history; identify the source commit and dirty/untracked state.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Record the task graph: completed, ready, blocked and cancelled nodes, with receipt IDs and who owns the next step.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Preserve locked decisions, approvals and expiry; include exact evidence paths, command outcomes, versions and known failures.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Include reproducible minimal restart: working directory, branch, first read, command that failed, immediate next action and safe fallback.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Mark external worker state UNKNOWN if the host cannot confirm termination or completion; never duplicate side effects on replay.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Short resumable handoff envelope, evidence index, blockers and next executable action.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. If upstream worker reports DONE without a native dispatch receipt, handoff must say REVIEW_REQUIRED rather than VERIFIED.

## Upstream provenance

RE-01 Superpowers handoff, RE-33 Cindy context sharing, RE-34 Orca task/dispatch identity (method references).

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
