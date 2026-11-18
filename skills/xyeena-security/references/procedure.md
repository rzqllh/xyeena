# xyeena-security — Detailed procedure (v1 candidate)

## Activation and exclusions

**Positive trigger:** The change crosses a trust boundary or handles credentials, tenant data, RLS, privileged actions, sensitive network input or secrets.

**Negative trigger:** Generic style review without a security boundary; a FULL audit absent explicit user authorization.

## Operational procedure

### 1. Discover

Pin scoped assets, threat actors, trust boundaries, sensitive inputs, relevant deployment and permission boundaries; distinguish scoped review from explicit full audit.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 2. Bound

Trace representative hostile input to a security-sensitive sink, including authorization enforced on the server/database rather than just UI visibility.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 3. Execute / Investigate

Verify tenant isolation with actual authorized database tests when available; static SQL policy patterns are SUSPECTED_RISK not empirical cross-tenant access.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 4. Validate / Reconcile

Test secrets/redaction, injection, unsafe defaults, dependency provenance, migrations and failure modes; attach file/line or controlled reproduction to findings.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

### 5. Close / Handoff

Prioritize actionable findings by demonstrated exploit condition and impact; retest fixes and report residual uncertainty, never perform production changes without consent.

**Checkpoint:** Supply a precise observation, source and next action. For every material claim, link fresh evidence from the exact tree/host; do not use confident prose as proof.

## Decision and recovery branches

- **Blocked prerequisite:** Stop dependent tasks and mark `BLOCKED`; report missing owner decision, artifact or host authority and the narrow unblock action.
- **Untrusted or unavailable host:** Do not create a synthetic subagent or tool receipt. `HOST_UNVERIFIED` stays distinct from local deterministic checks.
- **Conflicting evidence:** Identify the scope/commit of both claims; independent verifier or a discriminating reproduction resolves them.
- **Interrupted execution:** Check actual side effects before retrying. Cancellation request is not process termination proof.
- **Requirement change:** Request owner decision for out-of-scope, destructive, global-config or external actions; do not infer authorization from prior routine edits.
- **Unverified criterion:** Return `REVIEW_REQUIRED` and a named test or evidence dependency rather than a blanket PASS.

## Result envelope

Scoped threat model; affected boundaries; evidence-based findings; false-positive dispositions; retest proof and owner-gated remediation.

Attach `inputScope`, `sourceRevision`, `selectedSkill`, `hostAndVersion` if independently observed, `actionsActuallyRun`, `changedPaths`, `evidenceRefs`, `unknowns`, `status`, and `nextAction`. Missing execution receipts must remain missing rather than user-invented substitutes.

## Adversarial exercises

1. The actor says the requested action ran, but no host-dispatch receipt exists: reject `HOST_VERIFIED`.
2. A requirement keyword appears in code but no behavioral test exists: reject `PASS`.
3. A regression passes for old commit while code changed: invalidate the stale gate.
4. No source-to-sink or live database evidence means no exploit-confirmed or RLS_LIVE_ISOLATION_VERIFIED claim.

## Upstream provenance

RE-06 Cloudflare Security Audit, RE-15 Trail of Bits clean-room invariants and RE-16 Supabase Agent Skills RLS/migration methodology.

The upstream references inform original Xyeena procedural guidance but are not bundled foreign execution engines. Source SHA, per-file license, actual code reuse and comparative parity must be reviewed separately in `docs/future/UPSTREAM_INVENTORY.md`; mapping alone is not proof.
