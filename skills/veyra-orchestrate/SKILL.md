---
name: veyra-orchestrate
description: Multi-agent coordination, native collaboration, optional governor, sequential fallback.
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
1. Discovery & Activation: Activated when receiving high-level user goals, composite multi-domain requests, or multi-skill tasks.
2. Engine Invocation:
   - Programmatic: `import { routeTaskByIntent, resolveExecutionStrategy, compileOrchestrationReceipts } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-orchestrate/engine.mjs').then(m => console.log(m.routeTaskByIntent('audit UI')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Route user prompt to appropriate skill domain, resolve native execution strategy, and coordinate tool dispatch.
   - Claude Code / Codex: Maintain single coherent voice without creating simulated multi-agent conversations.
4. Output & Verification: Aggregate verified skill receipts into an integrated task completion report.
