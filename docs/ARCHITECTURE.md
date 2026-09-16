# Xyeena Architecture

Xyeena is a manager-orchestrated capability system. It intentionally avoids peer-to-peer agent meshes.

## Kernel

The runtime-neutral kernel is implemented in `src/`:

- `resolver.mjs` — context-activated capability selection with a bounded support budget.
- `governor.mjs` — workflow state machine, failure routing and loop breaker.
- `task-graph.mjs` — immutable task units, dependency validation and ready-task selection.
- `broker.mjs` — single-topology-owner agent broker. Only the Governor may spawn or cancel workers.
- `context.mjs` — role-scoped context packs.
- `ledger.mjs` — append-only run journal and rebuildable snapshot.
- `consent.mjs` — safe/workspace/external/destructive operation classification.
- `protocol.mjs` — small typed message envelope.
- `runtime.mjs` — portable runtime descriptors for Antigravity, Claude Code and Codex.

## Topology

```text
User
  |
Governor
  |-- Capability Resolver
  |-- Workflow Governor
  |-- Task DAG / Scheduler
  |-- Context Governor
  |-- Evidence Ledger
  |-- Consent Engine
  `-- Agent Broker
        |-- Executor
        |-- Auditor
        |-- Researcher
        |-- Designer
        |-- Debugger
        `-- other specialists on demand
```

Workers do not recursively spawn peers. They can send a `CAPABILITY_REQUEST` to the Governor. This keeps topology observable and prevents orchestration recursion.

## Roles are not capabilities

A capability describes *what discipline/workflow is needed*. A role describes *which worker is executing it*. A small bug may run `xyeena-debug` in the current agent; a complex regression may dispatch a Debugger with the same capability.

## Tasks, messages and artifacts

- Task: immutable unit of work with explicit dependencies.
- Message: small coordination event.
- Artifact: larger durable result such as a report, screenshot or benchmark.
- Evidence: material supporting a claim.

Task requirements are never silently rewritten. If requirements change, supersede the old task with a new task.

## Workflow

```text
TRIAGE
  -> DISCOVER -> GRILL / RESEARCH / PROTOTYPE
  -> DEFINE -> PLAN
  -> EXECUTE -> DEBUG when needed
  -> VERIFY -> REVIEW
  -> RELEASE -> CLOSE
```

The route is dynamic. The Governor chooses the smallest defensible path rather than forcing every task through every state.

## Context discipline

Context is compiled per role. An Auditor receives spec, acceptance criteria, diff and evidence, but not Executor rationale. A Researcher receives the question and known/unknown facts without unrelated implementation chatter.

## Evidence freshness

Verification is scoped to the state it observed. Git-bound evidence can become stale after the working tree advances. Completion claims require fresh evidence for the exact claim being made.

## Consent boundary

Workspace-local reversible changes may run inside an approved task. External or destructive actions require user authorization. The policy engine is deliberately separate from skills so safety does not depend only on a model remembering prose.
