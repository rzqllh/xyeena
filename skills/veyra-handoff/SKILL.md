---
name: veyra-handoff
description: Use when transferring work between agents or resuming after compaction without losing verified state.
version: 1.0.0
aliases:
  - handoff
  - checkpoint
---

# veyra-handoff

Serialize and parse structured Markdown checkpoints, enabling seamless session resumption across LLM context compaction cycles.

## When to Use
- At the end of every completed phase or wave.
- When an agent is prompted with `continue` to determine the exact deterministic next step.
- When recovering from session interruptions or context window compaction.

## Invariants
1. Structured Serialization: Produces predictable Markdown headers and task checklist formats.
2. Deterministic Resolution: Resumption resolves the exact next uncompleted task without guessing.
3. Corruption Tolerance: Gracefully falls back to baseline recovery state if a checkpoint file is truncated.

## Operational Instructions
1. Native Host Integration: Read the actual checkpoint and current Git HEAD; reconcile stale entries against tool outputs before resuming.
2. Engine entry: `import { serializeCheckpoint, createCheckpoint, parseCheckpoint } from './engine.mjs'`
3. Evidence boundary: Serialized text proves format, not truthfulness or freshness of saved claims.
