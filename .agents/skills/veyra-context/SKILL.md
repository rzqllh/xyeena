---
name: veyra-context
description: Context economy, token payload compression, technical fact preservation invariance, and memory boundary fencing.
version: 1.0.0
aliases:
  - context
  - context-manager
---

# veyra-context

Manage conversation context efficiently, compress redundant tokens, and preserve 100% of technical identifiers across compaction cycles.

## When to Use
- Before passing long conversational histories into LLM tool invocations.
- When nearing context window compaction thresholds.
- When extracting invariant technical facts (file paths, git hashes, decision IDs, percentages).

## Invariants
1. Technical Fact Invariance: 100% of extracted commit SHAs, file paths, and DEC decision IDs must remain present in compressed output.
2. Fluff Stripping: Removes boilerplate polite preambles and consecutive blank lines without semantic loss.
3. Memory Boundary: Pinned anchor slots are strictly protected during memory sliding-window trimming.

## Operational Instructions
1. Discovery & Activation: Activated automatically prior to compaction, before injecting large conversation histories, or when extracting factual anchors.
2. Engine Invocation:
   - Programmatic: `import { compressContext, extractTechnicalFacts, calculateInformationDensity } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-context/engine.mjs').then(m => console.log(m.compressContext('sample')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Filter out redundant polite turns and verify that all commit SHAs, file paths, and DEC-xx IDs are preserved in context.
   - Claude Code / Codex: Run semantic compression before generating compact checkpoints or handoffs.
4. Output & Verification: Confirm 100% technical fact preservation and verify payload size reduction.
