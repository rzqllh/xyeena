# xyeena-grill — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** Explicit GRILL request or an irreversible product/architecture decision with active owner-only choices.

**Negative trigger:** Ordinary small ambiguity, settled owner decision, discoverable repository fact, or execution step already approved.

## Operational procedure

### 1. Discover

Extract only material owner decisions; write unique IDs and prerequisite edges, detect unknown parents and cycles before questioning.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Fetch repository/host facts yourself, and settle only truly factual items with verified values; do not settle an owner preference from a guess.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Compute the frontier: unresolved decisions whose prerequisite IDs are settled; present at most five nonredundant owner questions with recommendation and trade-offs.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Record explicit answers for their referent; ambiguous yes/ok never approves deletion, publishing, global configuration or credential changes.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Stop only when all material decisions are settled, no unknown/cyclic blockers remain, and an agreed action follows; persist rejected options and residual risks.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Decision graph, owner-approved choices, factual evidence, blocked nodes, next approved action.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. Frontier empty with blocked downstream nodes is DECISION_GRAPH_BLOCKED, never shared understanding. Use a blocker report, not an artificial success.

## Upstream provenance

RE-08 Matt Pocock question-frontier grilling and RE-01 brainstorming; never copy a generic questionnaire.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
