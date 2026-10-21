---
name: xyeena-orchestrate
description: Use when a task benefits from PM/controller orchestration, parallel independent specialists, executor/auditor separation, or multi-agent recovery.
---

# Orchestrate

Use a manager-controlled DAG, not an agent mesh. The governor owns topology, workflow state, task creation, joins, cancellation and consent. Workers may request another capability but do not spawn arbitrary worker networks.

Model work as immutable tasks with dependencies. Parallelize only ready independent tasks; serialize shared-write conflicts unless they are isolated in separate worktrees. Agent lifecycle and task lifecycle are separate: a worker can fail while the task returns to `READY` for reassignment.

Messages stay small and typed (`ASSIGN`, `QUESTION`, `RESULT`, `FINDING`, `CHALLENGE`, `RESPONSE`, `EVIDENCE`, `BLOCKED`, `FAILED`, `CANCEL`). Large results live as artifacts. Joins reconcile contradictions through evidence rather than concatenating reports or voting.

Independent auditors do not inherit executor rationale. Repeated review/fix loops trip a breaker and re-diagnose or escalate instead of recursing forever.

## Native skill selection and execution

When the user gives a natural-language goal, use the host's installed Agent Skills inventory
(workspace first, then global) to identify relevant Xyeena and third-party skills.
Read only the selected `SKILL.md` files as needed. Do not ask the user to paste a list of
slash commands, do not blindly load every skill, and do not invent missing skills.

Use the native host's actual subagent/tool invocation interface when available. In Antigravity
that may be `invoke_subagent` for independent scoped work; pass bounded task instructions,
a suitable declared role and an isolated worktree when writes might conflict. Respect
native IDE permission prompts. Never treat emitting a plan, naming an agent, or registering
a synthetic READY worker as proof that a worker ran. If no real host adapter is present,
mark execution BLOCKED and report precisely what is missing.

Use the smallest relevant capability set first. Parallelize independent read-only tasks
when useful; keep shared writes serialized or explicitly isolated. Capture actual
file changes, test logs and evidence references before changing a task to VERIFIED.
Unverified model summaries remain REVIEW_REQUIRED. Do not silently merge, publish,
deploy, send communications, or broaden an approval.
