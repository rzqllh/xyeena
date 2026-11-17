---
name: xyeena-orchestrate
description: Use when a task benefits from PM/controller orchestration, parallel independent specialists, executor/auditor separation, or multi-agent recovery.
---

# Orchestrate — v1 Procedure Entry

**Activate when:** Interdependent tasks require ordered joins, native delegated specialists, independent review, isolated write scopes or recovery from worker failure.

**Do not activate for:** A trivial answer, absent executable host adapter, a request merely to list skill names, or an unapproved multi-agent swarm.

## Execution route

1. Discover host version and installed skill registry (workspace first, then trusted global); load only selected entrypoints and require permission for external tools.
2. Build one Cortex-governed DAG with immutable task IDs, dependencies, input/output schema, risk gates and explicit worker/host tool requirements.
3. Dispatch only through actually discovered native host mechanisms; tie each task to host dispatch ID; if none exists, report BLOCKED rather than fabricate READY/RUNNING workers.
4. Track worker lifecycle separately from tasks: acknowledge messages, handle cancelled/stale/replayed dispatch, serialize conflicting writes and isolate verified worktrees.
5. Join outputs by requirement and evidence; send independent review without Builder rationale, cap fix/review loops and promote to VERIFIED only after authoritative proof.

**Output contract:** Task DAG, selected skill provenance, native dispatch IDs, permission/host evidence, reconciled findings, recovery checkpoint and final status.

**Failure boundary:** Host configuration or a printed simulated invocation is not execution. Lost cancellation acknowledgement leaves remote side effects UNKNOWN until a host receipt resolves them.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
