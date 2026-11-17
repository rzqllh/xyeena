# xyeena-research — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** The task needs current API behavior, version-matched docs, normative standards, benchmark baselines or upstream source inspection.

**Negative trigger:** The complete correct source is already provided or a pure transformation needs no external claims.

## Operational procedure

### 1. Discover

Form falsifiable research questions and rank by decision impact; limit scope and define source freshness requirements.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Gather canonical primary documentation and inspected code on pinned SHA/version; distinguish README claims from implementation and tests.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Audit source licenses and file-specific conditions before copying any code, text, images or data.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Triangulate conflicts using exact text/code and reproduction where practical; never turn absence of contrary data into proof.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Produce a decision-ready evidence matrix with fact, source, observed version/date, confidence, unknowns, implications and follow-up.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Source ledger, narrowed findings, unresolved contradictions, recommended next discriminating test.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. When source access is blocked, explicitly mark the claim UNKNOWN; never invent an upstream feature or license.

## Upstream provenance

RE-12 Anthropic Agent Skills conventions, RE-17/18 design source pointers, RE-31 Konoha retrieval principles.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
