# xyeena-prototype — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** One bounded technical unknown can be settled with a disposable experiment.

**Negative trigger:** Routine implementation, production-ready UI request, or irreversible migration without authorization.

## Operational procedure

### 1. Discover

Phrase one falsifiable question, enumerate plausible outcomes and define stopping threshold and budget.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Isolate the experiment in a scratch harness, temporary route or disposable worktree with zero production credentials and bounded side effects.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Capture baseline, run controlled variants and collect outputs (including failures) under documented versions.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Map observed result to the decision it informs; separate proven behavior from assumptions and performance noise.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Quarantine/delete disposable artifacts only when ownership is verified; promotion to product requires normal plan, review and tests.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Experiment specification, actual observations, conclusions with limits and disposition of throwaway artifacts.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. An attractive screenshot or running demo does not establish compatibility, security, accessibility, or fitness for production.

## Upstream provenance

RE-32 Huashu Design exploratory prototypes, RE-11 UI UX Pro Max system constraints, RE-14 GSAP motion lifecycle.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
