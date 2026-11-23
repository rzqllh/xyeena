---
name: veyra-handoff
description: Structured session continuation, deterministic checkpoint serialization, recovery, and state resumption.
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
1. Discovery & Activation: Activated at milestone boundaries, end of session, or when transitioning context across agents.
2. Engine Invocation:
   - Programmatic: `import { serializeCheckpoint, createCheckpoint, parseCheckpoint } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-handoff/engine.mjs').then(m => console.log(m.serializeCheckpoint({ status: 'ACTIVE' })))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Write updated state directly to `CHECKPOINT.md` on disk with exact git commit SHA, active wave, and todo items.
   - Claude Code / Codex: Re-read `CHECKPOINT.md` on session resume to maintain continuous context without duplicate work.
4. Output & Verification: Deliver parseable, standardized markdown checkpoint with 100% verified state.
