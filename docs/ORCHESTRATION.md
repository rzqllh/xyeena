# Orchestration Protocol

## Manager controlled DAG

Only the Governor owns topology. Workers cannot recursively construct an agent mesh.

Supported coordination message types are intentionally small:

`ASSIGN`, `STATUS`, `QUESTION`, `RESULT`, `FINDING`, `CHALLENGE`, `RESPONSE`, `EVIDENCE`, `BLOCKED`, `FAILED`, `CANCEL`, `CAPABILITY_REQUEST`.

Large output belongs in artifacts and is referenced by ID/path rather than pasted into every parent message.

## Challenge loop

Auditor finding -> Governor -> Executor response/evidence -> Governor adjudication. The Governor can accept, reject, request discriminating evidence or escalate. Findings are not settled by confidence or majority vote.

## Parallelism

Independent read/research/review tasks may run concurrently. Shared-write tasks are serialized unless isolated workspaces/worktrees make their write sets independent.

## Recovery

Agent state and task state are separate. If a worker fails, its non-terminal task can return to `READY` and be dispatched to a new worker with the same context pack.

## Breakers

Repeated findings or excessive review cycles trip the Governor breaker. The system then re-diagnoses, replans, escalates the model/role, asks the user when authority is required, or aborts when no defensible route remains.
