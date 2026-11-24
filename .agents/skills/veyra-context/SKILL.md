---
name: veyra-context
description: Use when compressing long technical context while preserving file paths, SHAs, decisions, and open blockers.
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
1. Native Host Integration: Compare the actual input and compressed output for lost technical facts; save a checkpoint only when evidence is preserved.
2. Engine entry: `import { compressContext, extractTechnicalFacts, calculateInformationDensity } from './engine.mjs'`
3. Evidence boundary: Compression metrics alone cannot prove semantic fidelity to an uninspected conversation.
