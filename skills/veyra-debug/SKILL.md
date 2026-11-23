---
name: veyra-debug
description: Systematic root-cause isolation, failure reproduction, and anti-shotgun patch enforcement.
version: 1.0.0
aliases:
  - debug
---

# veyra-debug

Diagnose hard bugs, reproducible failures, and regressions systematically before modifying code.

## When to Use
- When encountering an unexpected failure, crash, or regression.
- To rank competing diagnostic hypotheses against observable primary evidence.

## Invariants
1. Reproduce First: Never guess or patch code before reproducing the failure.
2. Anti-Shotgun Gate: Fixing a bug must touch only the narrowest responsible root cause layer.
3. Regression Protection: Every bug fix must include a regression test that fails before the fix.

## Operational Instructions
1. Discovery & Activation: Activated when investigating failing tests, unhandled exceptions, runtime crashes, or regressions.
2. Engine Invocation:
   - Programmatic: `import { parseFailureLog, evaluateHypothesisEvidence, rankHypotheses } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-debug/engine.mjs').then(m => console.log(m.parseFailureLog('Error: sample')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Parse error logs from `run_command` output, isolate failure stack traces, and formulate ranked testable hypotheses.
   - Claude Code / Codex: Avoid shotgun debugging; test single variable hypothesis before proposing code changes.
4. Output & Verification: Deliver isolated root-cause proof, minimal reproduction test, and targeted fix.
