# xyeena-debug — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** Reproducible failure, regression, exception, performance anomaly or behavior inconsistent with spec.

**Negative trigger:** Feature development with no failure, purely cosmetic preference, or a guessed root cause without a symptom.

## Operational procedure

### 1. Discover

Record expected vs observed behavior, environment, revision, scope, frequency and earliest known failure.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Reproduce with a minimal command, fixture or interaction; if blocked, explicitly record REPRO_BLOCKED and safe next measurement.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Rank at most three discriminating hypotheses with predictions and instrumentation; locate the highest causal boundary before editing.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Change a single causal variable, observe whether predictions hold, and identify root cause before implementing smallest correction.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Verify original symptom and negative regression on same input and a nearby boundary; inspect remaining variants and document limitations.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Repro receipt, hypothesis table, root-cause chain, minimal patch, before/after verification and regression guard.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. Do not shotgun-edit all plausible causes. A passing unrelated test does not close the original symptom; a production-only issue needs authorized production evidence.

## Upstream provenance

RE-01 Superpowers systematic debugging, RE-02 Superior seam tests, RE-05 Caveman minimal proof.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
