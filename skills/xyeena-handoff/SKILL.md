---
name: xyeena-handoff
description: Use when continuing work in another session/agent, approaching context limits, or creating a compact recovery handoff.
---

# Handoff — v1 Procedure Entry

**Activate when:** A session must transfer ownership, a worker is replaced, or a verified task waits on a separate actor.

**Do not activate for:** Same-session short answer or a speculative future handoff with no concrete state.

## Execution route

1. Read persisted artifacts and Git state, not just conversational history; identify the source commit and dirty/untracked state.
2. Record the task graph: completed, ready, blocked and cancelled nodes, with receipt IDs and who owns the next step.
3. Preserve locked decisions, approvals and expiry; include exact evidence paths, command outcomes, versions and known failures.
4. Include reproducible minimal restart: working directory, branch, first read, command that failed, immediate next action and safe fallback.
5. Mark external worker state UNKNOWN if the host cannot confirm termination or completion; never duplicate side effects on replay.

**Output contract:** Short resumable handoff envelope, evidence index, blockers and next executable action.

**Failure boundary:** If upstream worker reports DONE without a native dispatch receipt, handoff must say REVIEW_REQUIRED rather than VERIFIED.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
