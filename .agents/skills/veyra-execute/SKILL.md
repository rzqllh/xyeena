---
name: veyra-execute
description: Use when implementing a user-approved code change with scoped files and regression protection.
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
1. Native Host Integration: Inspect git diff and real file changes, validate declared scope, then run tests with the Veyra verification CLI.
2. Engine entry: `import { validateExecutionScope, trackTddPhase, validatePatchIntegrity } from './engine.mjs'`
3. Evidence boundary: Passing validateExecutionScope on model-supplied targetFiles is advisory, not a filesystem enforcement hook.

## Red flags
- "Tests probably pass" without an actual test command and exit code.
- Validator received a planned file list, but no actual git diff was inspected.
- User approval for one edit was treated as authorization for unrelated changes.

## Pressure tests
1. Agent tries to edit an unapproved config while a code fix is authorized: reject and request scope approval.
2. Failing regression: do not claim fixed until command receipt passes.
3. TDD steps are listed but never executed: report NOT_RUN, not GREEN.
