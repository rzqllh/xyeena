---
name: veyra-core
description: Core pragmatic engineering discipline, universal anti-slop filters, epistemic claim classification, and strict scope fencing.
version: 1.0.0
aliases:
  - core
  - governance-core
---

# veyra-core

Enforce disciplined engineering judgment, eliminate generic AI filler, and lock execution strictly inside authorized scope boundaries.

## When to Use
- Before any file modification to validate target path permissions.
- In every code review or response to filter generic AI marketing buzzwords.
- When classifying claims into OBSERVED, INFERENCE, UNKNOWN, or PROPOSAL.

## Invariants
1. Scope Lock: Modifications to files outside explicitly approved patterns are strictly BLOCKED.
2. Anti-Slop: Banned words ('delve', 'testament', 'seamless', 'revolutionize') and em/en-dashes are flagged.
3. Epistemic Grounding: No claim may be labeled OBSERVED without concrete, verified tool output or receipt.
4. Zero External Dependencies: Implemented strictly using Node.js built-in standard library.

## Schema
- `validateScope({ targetFiles: string[], allowedPatterns: string[], actionType: string }) => { verdict: 'ALLOWED'|'BLOCKED_SCOPE', allowed: boolean, violations: string[] }`
- `checkAntiSlop(text: string) => { pass: boolean, findings: Array<{ type: string, word?: string, index: number }> }`
- `classifyClaim(statement: string, receipt?: object) => { category: 'OBSERVED'|'INFERENCE'|'UNKNOWN'|'PROPOSAL', confidence: number }`

## Operational Instructions
1. Discovery & Activation: Always-on baseline filter for every user turn and every file modification operation.
2. Engine Invocation:
   - Programmatic: `import { validateScope, checkAntiSlop, classifyClaim } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-core/engine.mjs').then(m => console.log(m.validateScope({ targetFiles: [], allowedPatterns: ['*'], actionType: 'READ' })))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Before executing `edit_file` or `write_file`, run `validateScope` against allowed patterns. On user text output, verify zero anti-slop buzzwords and zero forbidden em-dashes.
   - Claude Code / Codex: Check epistemic classification on all claims: label OBSERVED only when supported by fresh tool output.
4. Output & Verification: Return clear, evidence-based responses without boilerplate or scope drift.
