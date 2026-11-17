---
name: xyeena-execute
description: Use when requirements or a plan are sufficiently locked and the task is ready for scoped implementation, especially when the user says to implement, execute, build, or code the agreed work.
---

# Execute — v1 Procedure Entry

**Activate when:** User approved work with explicit acceptance criteria, safe local/repo write scope and known target files.

**Do not activate for:** Unresolved product decision, exploratory research only, blocked host writes, or implied permission to deploy/publish.

## Execution route

1. Verify branch, tests, scope, owners, uncommitted changes, host capabilities and permission before writing.
2. Establish a failing behavioral test for the intended change when practical; keep the baseline and reason for failure.
3. Implement one tracer slice at a time, preserving stable interfaces, user files and existing architecture unless approved to change.
4. Run narrow tests and inspect results; capture exact commands, target commit, output and side effects; fix actual failures only.
5. Request independent review of criteria and changed artifacts; do not self-promote implementation success to VERIFIED or release permission.

**Output contract:** Changed path list and diff, RED/GREEN proof, test transcript, explicit unresolved cases and review handoff.

**Failure boundary:** If a command has partial side effects or timed out, inspect actual state and invoke recovery; no blind rerun or overwriting unrelated files.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
