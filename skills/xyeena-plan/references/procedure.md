# xyeena-plan — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** Locked multi-stage implementation spanning components, migration, schema, tests or host integrations.

**Negative trigger:** One obvious reversible change, blocked owner intent, or an unresolved architecture decision that belongs to GRILL.

## Operational procedure

### 1. Discover

Map objective, acceptance criteria, locked constraints and exclusions; separate known facts from assumptions.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Trace the critical user path across layers and define the smallest vertical slice yielding observable behavior.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Build an acyclic task DAG with dependencies, ownership/write conflicts, risk tier and exact verification command per task.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Put rollback or containment before high-risk changes, identify environment/permission dependencies and do not auto-approve them.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Require each task to end in a concrete artifact/evidence checkpoint; route changed requirements back to GRILL rather than quietly broadening scope.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Dependency-ordered tracer tasks, proof per task, risk/rollback, approval gates and first action.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. A task 'implement auth' without a verifiable outcome, test seam or authorization check is not executable.

## Upstream provenance

RE-01 Superpowers phased planning, RE-08 to-tickets, RE-04 Ponytail lean scope.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
