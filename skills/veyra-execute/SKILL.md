---
name: veyra-execute
description: Scoped implementation specialist with strict TDD state tracking and smallest-change auditing.
version: 1.0.0
aliases:
  - execute
---

# veyra-execute

Execute approved implementation tasks with locked scope, minimal churn, and verified acceptance proof.

## When to Use
- When executing an approved task after explicit Owner GO.
- To track the RED-GREEN-REFACTOR state machine and enforce minimal diffs.

## Invariants
1. Approved Scope Only: File edits outside declared scope boundaries are strictly forbidden.
2. TDD State Machine: Prohibits writing production code before red test execution.
3. Minimal Churn: Reject opportunistic refactoring or reformatting of adjacent code.

## Operational Instructions
1. Discovery & Activation: Activated when user issues explicit implementation authorization (GO / implement / execute).
2. Engine Invocation:
   - Programmatic: `import { validateExecutionScope, trackTddPhase, validatePatchIntegrity } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-execute/engine.mjs').then(m => console.log(m.trackTddPhase(['RED', 'GREEN'])))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Follow Red-Green-Refactor cycle. Run test command before writing implementation, then execute smallest correct diff.
   - Claude Code / Codex: Ensure changes are strictly localized within approved scope patterns without collateral refactoring.
4. Output & Verification: Output clean git diff, passing test evidence, and concise summary of changes.
