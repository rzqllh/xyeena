# xyeena-verify — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A claim of done, fixed, safe, passing, production-ready or host compatibility requires a final evidence gate.

**Negative trigger:** An exploratory recommendation or a description of unexecuted planned work, provided no success claim is made.

## Operational procedure

### 1. Discover

Enumerate every material claim and identify its proof type: file existence, deterministic test, independently observed host action, rendered screenshot, production measurement.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Bind each claim to exact commit/tree, environment, test command/run ID, timestamps and authoritative artifact path; reject missing or caller-invented provenance.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Run or inspect the necessary checks on the latest tree; a stale pass after a relevant code change must be re-run.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Assess evidence against each claim: VERIFIED only for matching observed proof, REVIEW_REQUIRED for plausible but unproven, FAILED for contradictory runs, BLOCKED for missing host/consent.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Publish a compact fact table with what ran, outcomes, what was not exercised and limitations; avoid aggregate PASS hiding a failed requirement.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Claim-by-claim receipt, exact evidence provenance, pass/fail/blocked breakdown and next executable verification.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. Registry ONLINE, configured hook files, green unit tests or model-generated summary do not establish live host invocation or security enforcement.

## Upstream provenance

RE-01 Superpowers verification-before-completion, RE-05 Caveman verify-and-stop, RE-20 Xyeena evidence tiers.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
