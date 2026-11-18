# xyeena-writing — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** A text artifact must persuade, instruct, explain, onboard, report, document API usage or reduce generic AI-style copy.

**Negative trigger:** A code bug report requiring implementation, a current external fact without research, or invented brand claims without evidence.

## Operational procedure

### 1. Discover

Establish audience, channel, purpose, voice, reading context, facts provided and what action the reader should take.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Collect concrete source material, truthful metrics and domain nouns; mark unsupported claims UNKNOWN or remove them.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Choose structure by job: procedural runbook, status report, UX error, sales page or concise technical decision. Do not apply one template to all.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Edit line by line for semantic precision, active verbs, rhythm, UI constraints and information hierarchy; protect legally required wording and code invariants.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Check factual claims and mechanics with a source/owner; test UX actions with actual flow where relevant; avoid quoting invented benchmarks or human testimonials.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Audience-fit artifact, changed claims and sources, UX states or runnable doc steps, proof/unknown list.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. Replacing all adjectives or banning gradients/expressive writing is not a writing-quality proof; user constraints outrank generic taste rules.

## Upstream provenance

RE-03 Anti-Slop context-aware copy, RE-07 Impeccable brief-first critique and RE-10 Taste content density.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
