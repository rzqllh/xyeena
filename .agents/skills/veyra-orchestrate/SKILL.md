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
