# xyeena-orchestrate — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** Interdependent tasks require ordered joins, native delegated specialists, independent review, isolated write scopes or recovery from worker failure.

**Negative trigger:** A trivial answer, absent executable host adapter, a request merely to list skill names, or an unapproved multi-agent swarm.

## Operational procedure

### 1. Discover

Discover host version and installed skill registry (workspace first, then trusted global); load only selected entrypoints and require permission for external tools.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Build one Cortex-governed DAG with immutable task IDs, dependencies, input/output schema, risk gates and explicit worker/host tool requirements.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Dispatch only through actually discovered native host mechanisms; tie each task to host dispatch ID; if none exists, report BLOCKED rather than fabricate READY/RUNNING workers.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Track worker lifecycle separately from tasks: acknowledge messages, handle cancelled/stale/replayed dispatch, serialize conflicting writes and isolate verified worktrees.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Join outputs by requirement and evidence; send independent review without Builder rationale, cap fix/review loops and promote to VERIFIED only after authoritative proof.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Task DAG, selected skill provenance, native dispatch IDs, permission/host evidence, reconciled findings, recovery checkpoint and final status.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. Host configuration or a printed simulated invocation is not execution. Lost cancellation acknowledgement leaves remote side effects UNKNOWN until a host receipt resolves them.

## Upstream provenance

RE-01 Superpowers subagent review, RE-31 Konoha bounded retrieval, RE-33 Cindy multi-harness context, RE-34 Orca Run/Task/Dispatch and recovery (all runtime references only).

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
