# xyeena-test — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A behavioral change must be protected, user requests TDD, or a production symptom requires reproducible regression.

**Negative trigger:** A pure explanation, manual exploration without executable environment, or a snapshot that cannot assert user-visible behavior.

## Operational procedure

### 1. Discover

Extract one observable behavior with input, expected output and boundary; choose the highest stable public seam before white-box internals.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Capture a RED baseline on the correct tree and confirm failure reason is relevant; if RED cannot run, label the exercise BLOCKED rather than synthetic.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Implement minimum change to achieve GREEN; execute the exact targeted command and preserve exit code/output/revision.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Refactor without changing behavior, then re-run the targeted and relevant broad suites; add invalid-input, rollback, timeout or concurrency cases according to risk.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Report test gaps, skipped checks and environment mismatch. Only claim the specific scenario passed where a real runner produced evidence.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Test seam; RED/GREEN receipts; executed commands; passing/failing/skipped counts; uncovered risks.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. A skipped test, mocked worker reply, or previously green CI from another commit must not satisfy the current acceptance gate.

## Upstream provenance

RE-01 Superpowers TDD with independent review; RE-02 Superior Skills seam-focused tests; RE-21..30 normative testing references.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
