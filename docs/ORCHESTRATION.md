# Orchestration protocol

[Current source and host acceptance (2026-10-26)](STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

Xyeena Rig maintains a single workflow governor. Workers cannot create uncontrolled subagent trees or increase the permissions delegated to them.

## Task model

Tasks have bounded scope, explicit dependencies, execution eligibility and acceptance conditions. Supported coordination types include `ASSIGN`, `STATUS`, `QUESTION`, `RESULT`, `FINDING`, `CHALLENGE`, `RESPONSE`, `EVIDENCE`, `BLOCKED`, `FAILED`, `CANCEL` and `CAPABILITY_REQUEST`.

Large results should be stored as artifacts referenced by identifier, not duplicated across all workers.

## Execution selection

The governor may select an eligible inline executor, a native host worker or an optional Simpul backend. Selecting a backend requires more than transport connectivity: actual execution readiness, host permission authority, cancellation capability and available budgets must be verified. If unavailable, delegate safely elsewhere or return BLOCKED.

Independent read-only tasks may run concurrently. Shared writes require serialization or demonstrably separate worktree isolation.

## Review and verification

The reviewer evaluates evidence against acceptance criteria. A model status label or locally written JSON is not sufficient. Independent verification failures result in REVIEW_REQUIRED or BLOCKED, not a fabricated success.

## Recovery

Task state is distinct from worker process state. Checkpoints and per-run locking prevent competing resume operations. Idempotent tasks may be retried with bounded backoff; uncertain non-idempotent writes and external operations require explicit reconciliation rather than automatic replay.

Anti-loop safeguards stop repeated failing execution/review cycles and return control to the operator when authorization or new evidence is required.

See [Architecture](ARCHITECTURE.md), [Orchestration routing](INTELLIGENT-ROUTING.md) and [Operational acceptance](xyeena-rig/ACCEPTANCE_MATRIX.md).
