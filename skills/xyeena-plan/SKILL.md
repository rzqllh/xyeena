---
name: xyeena-plan
description: Use when a change is multi-step, cross-file, dependency-sensitive, high-risk, or needs an executable implementation plan.
---

# Plan — v1 Procedure Entry

**Activate when:** Locked multi-stage implementation spanning components, migration, schema, tests or host integrations.

**Do not activate for:** One obvious reversible change, blocked owner intent, or an unresolved architecture decision that belongs to GRILL.

## Execution route

1. Map objective, acceptance criteria, locked constraints and exclusions; separate known facts from assumptions.
2. Trace the critical user path across layers and define the smallest vertical slice yielding observable behavior.
3. Build an acyclic task DAG with dependencies, ownership/write conflicts, risk tier and exact verification command per task.
4. Put rollback or containment before high-risk changes, identify environment/permission dependencies and do not auto-approve them.
5. Require each task to end in a concrete artifact/evidence checkpoint; route changed requirements back to GRILL rather than quietly broadening scope.

**Output contract:** Dependency-ordered tracer tasks, proof per task, risk/rollback, approval gates and first action.

**Failure boundary:** A task 'implement auth' without a verifiable outcome, test seam or authorization check is not executable.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
