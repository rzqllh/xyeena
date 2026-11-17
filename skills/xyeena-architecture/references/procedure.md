# xyeena-architecture — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** The change requires a persistence boundary, new layer, integration seam or high-impact refactor architecture.

**Negative trigger:** The code change fits an existing interface with no material trade-off; style cleanup without architecture risk.

## Operational procedure

### 1. Discover

Inventory real callers, invariants, data flow and trust boundaries; profile change frequency rather than assuming future variants.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Compare at least two feasible designs (including keep-as-is) on cohesion, abstraction cost, test seam, operability, reversibility and risk.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Test the abstraction deletion criterion and dependency direction; protect domain logic from transport/persistence concerns.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Define contract examples, ownership and failure semantics; include negative tests for invalid inputs, timeouts, upgrade/migration boundaries.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Choose the smallest deep module consistent with requirements; record ADR only for materially irreversible decisions, otherwise keep it local.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Options matrix, chosen seam, interface contract, dependency diagram, test and migration strategy.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. A high LOC-to-method ratio is a design clue, not a proof of correctness or actual modularity.

## Upstream provenance

RE-02 Superior Skills deep modules, RE-13 Vercel frontend boundaries, RE-16 Supabase migration semantics.

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
