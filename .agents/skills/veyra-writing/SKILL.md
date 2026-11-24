---
name: veyra-writing
description: Use when editing product copy, technical prose, release notes, or documentation for clarity and brevity.
version: 1.0.0
aliases:
  - writing
  - copy
---

# veyra-writing

Write and edit concise, evidence-based technical documentation and user interface copy without AI marketing slop.

## When to Use
- When authoring documentation, PRD copy, release notes, or UI labels.
- To detect and eliminate marketing buzzwords ('revolutionize', 'seamless', 'game-changing').

## Invariants
1. Anti-Buzzword Gate: Generic AI superlatives are strictly flagged and removed.
2. Active Voice: Prioritize direct, active subject-verb-object construction.
3. Character Economy: Avoid repetitive bullet points and bloated narrative filler.

## Operational Instructions
1. Native Host Integration: Revise the actual text and run checkAntiSlop or readability metrics on the final copy.
2. Engine entry: `import { detectMarketingSlop, calculateReadabilityEconomy, calculateFleschReadingEase } from './engine.mjs'`
3. Evidence boundary: Do not reject accurate technical language merely because an adjective appears in a generic word list.
