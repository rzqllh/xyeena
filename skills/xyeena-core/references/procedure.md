# xyeena-core — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A multi-step task has ambiguous proof, scope drift, or competing requirements; the user requests a completion verdict.

**Negative trigger:** A trivial factual answer with no risky claim; a dedicated host authorization or security audit is not needed.

## Operational procedure

### 1. Discover

Pin the user outcome, constraints, scope exclusions, acceptance criteria and current tree/host version; avoid inventing unstated requirements.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 2. Bound

Build a claim ledger: OBSERVED with exact fresh source, INFERRED with assumption, UNKNOWN with missing proof, PROPOSED with next action.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 3. Execute / Investigate

Apply EVIDENCE → CUT → CRAFT → COMMIT → VERIFY; eliminate nonessential work but never remove a safety or consent gate.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 4. Validate / Reconcile

Delegate specialist procedures only for a real trigger; never run a full DAG for a micro-question.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

### 5. Close / Handoff

Before saying done, bind each acceptance criterion to evidence from that exact artifact/version; fail closed for unproven claims.

**Checkpoint:** Write an inspectable claim, input, observation and next action; never substitute prose confidence for evidence.

## Decision and recovery branches

- **Blocked prerequisite:** Stop downstream execution, record the missing contract or owner decision, and return `BLOCKED` with the exact unblock action.
- **Wrong tool or unsupported host:** Retain task intent, mark `HOST_UNVERIFIED` and offer a native supported fallback only when real execution is authorized; no synthetic worker calls.
- **Conflicting evidence:** Prefer new, independently reproduced evidence scoped to current commit; preserve contradictions for verifier review.
- **Interrupted execution:** Check whether side effects occurred; reconcile worktree or external state before retrying. Idempotence is not assumed.
- **Scope change:** Reject silent scope growth and route material decisions to owner; preserve existing permission boundaries.
- **Unverified result:** Return `REVIEW_REQUIRED`, not `PASS`, with missing proofs and next executable check.

## Result envelope

Goal and scope; claim-by-claim evidence; task verdict (VERIFIED / REVIEW_REQUIRED / BLOCKED); remaining risk.

Include `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Empty or simulated execution receipts are not proof.

## Focused adversarial cases

1. An apparently successful output with no actual tool call must not be VERIFIED.
2. A changed commit invalidates evidence that covered the previous tree.
3. A denied/absent host cannot be reported as a successful worker completion.
4. A successful lint does not prove the user-facing behavior; an unavailable host is BLOCKED or NOT_RUN, not a default PASS.

## Upstream provenance

RE-01 Superpowers verification and RE-03 Anti-Slop discipline, RE-05 Caveman economy (references, not embedded runtimes).

This text is original Xyeena workflow adaptation guidance. Sources are **references** until the repository's provenance ledger names verified source files, accepted license terms and measured behavioral comparison. See `docs/future/UPSTREAM_INVENTORY.md` and `evals/v1-skill-matrix.json` in the repo root.
