# xyeena-skillcraft — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** An Agent Skill, trigger description, reference, script, routing contract, skill package or evaluation needs creation or revision.

**Negative trigger:** Ordinary product task, renaming a description without behavior change, or claiming skill quality from number of lines.

## Operational procedure

### 1. Discover

Write activation and negative activation fixtures before editing the entrypoint. Define target behavior, unacceptable rationalizations, and observable result.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Establish baseline without skill under matched input; record failure and scoring rubric, not a fabricated comparative win.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Implement minimal SKILL.md pointer and branch-specific reference/tool layers; verify relative paths, package ownership, script dependencies and license provenance.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Run positive/negative trigger tests, with-skill behavioral scenarios and combination scenarios using real host/tool receipts where available.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Red-team bypass patterns: fabricated worker calls, unauthorized writes, stale green tests, success with missing evidence, prompt injection; reject or revise weak skills.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Skill contract, baseline vs candidate trace, trigger confusion matrix, behavioral adversarial verdict, package acceptance.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. A parser test of SKILL.md frontmatter only supports STRUCTURE_VALID, never BEHAVIOR_VERIFIED or HOST_VERIFIED.

## Upstream provenance

RE-01 Superpowers Skill-TDD; RE-12 Anthropic format guidelines; RE-20 native Xyeena installation and Cortex contracts.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
