---
name: veyra-orchestrate
description: Use when routing a multi-domain task to relevant skills and coordinating authorized work.
version: 1.0.0
aliases:
  - orchestrate
---

# veyra-orchestrate

Coordinate multi-step tasks across native host agents with transparent sequential fallbacks and audit receipts.

## When to Use
- When orchestrating multi-step pipelines across discovery, planning, execution, and verification.
- To resolve collaboration strategy based on host runtime capabilities (Gemini vs Codex vs Claude).

## Invariants
1. Native Collaboration First: Respect host collaboration primitives without forcing runtime overhead (DEC-22).
2. Transparent Sequential Fallback: When native subagents are absent, fall back sequentially without faking subagents (DEC-23).
3. Immutable Trace Receipts: All multi-stage workflows must compile verifiable execution receipts.

## Operational Instructions
1. Native Host Integration: Select skills from observed task needs, then record which engines or tools actually ran.
2. Engine entry: `import { routeTaskByIntent, resolveExecutionStrategy, compileOrchestrationReceipts } from './engine.mjs'`
3. Evidence boundary: A list of specialist labels is not execution evidence; never invent subagents.
