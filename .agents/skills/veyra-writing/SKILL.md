---
name: veyra-writing
description: Concise, human technical prose authoring, marketing buzzword elimination, character economy.
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
1. Discovery & Activation: Activated when writing documentation, READMEs, PR bodies, release notes, or UX copy.
2. Engine Invocation:
   - Programmatic: `import { detectMarketingSlop, calculateReadabilityEconomy, calculateFleschReadingEase } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-writing/engine.mjs').then(m => console.log(m.detectMarketingSlop('sample text')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Scan prose for marketing filler, empty enthusiasm, and passive voice; compute readability metrics.
   - Claude Code / Codex: Deliver concise, informative technical documentation tailored to developer and operator needs.
4. Output & Verification: Ensure clear, concise technical prose free of marketing fluff and buzzwords.
