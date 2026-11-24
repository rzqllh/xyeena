---
name: veyra-core
description: Use when checking proposed file scope, classifying execution claims, or editing repetitive AI copy.
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
2. Anti-Slop: Flag boilerplate marketing phrases and em dashes; retain legitimate technical terms and numeric en-dash ranges.
3. Epistemic Grounding: OBSERVED is limited to a successful command-exit assertion backed by the persisted signed receipt; semantic conclusions require independent inspection.
4. Zero External Dependencies: Implemented strictly using Node.js built-in standard library.

## Schema
- `validateScope({ targetFiles: string[], allowedPatterns: string[], actionType: string }) => { verdict: 'PROCEED'|'BLOCKED_SCOPE'|'NEEDS_OWNER_APPROVAL', allowed: boolean, violations: string[] }`
- `checkAntiSlop(text: string) => { pass: boolean, findings: Array<{ type: string, word?: string, index: number }> }`
- `classifyClaim(statement: string, receipt?: object, options?: object) => { category: 'OBSERVED'|'INFERENCE'|'UNKNOWN', confidence: number }`; OBSERVED requires `COMMAND_EXIT_ZERO:<taskName>` and a valid journal receipt.

## Operational Instructions
1. Native Host Integration: Inspect actual changed files, not just agent-supplied targetFiles; validateScope is a proposed-path advisory unless a trusted tool hook enforces it.
2. Engine entry: `import { validateScope, checkAntiSlop, classifyClaim } from './engine.mjs'`
3. Evidence boundary: Only `COMMAND_EXIT_ZERO:<task>` with a persisted signed receipt can be OBSERVED; other claims require source inspection. See veyra-verify.

## Red flags
- "I checked scope" means the agent passed a self-selected list to validateScope, not that filesystem writes were constrained.
- "Tests pass" is marked OBSERVED because the model supplied `['trust me']`.
- A path pattern `src/**` is mistaken for an OS sandbox. It is not.

## Pressure tests
1. A fabricated evidence array must classify UNKNOWN.
2. A live signed node -v receipt must not certify "the bug is fixed".
3. An encoded traversal in targetFiles must fail the path check.

## Optional owner-controlled write gate
- For real pre-tool checks, use hook.mjs with an explicitly configured Gemini BeforeTool or Claude/Codex PreToolUse hook. See docs/VEYRA-RUNTIME-CONTRACT.md.
- The hook reads .veyra/scope.json. Missing policy means read-only; writes outside approved patterns and shell commands are blocked by default.
- This is not enabled by installation. It does not intercept external processes or guarantee filesystem confinement.
