---
name: veyra-debug
description: Use when reproducing a bug, narrowing a failure cause, or assessing a regression before making a fix.
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
1. Native Host Integration: Run the failing command and capture actual stack traces before selecting one falsifiable hypothesis.
2. Engine entry: `import { parseFailureLog, evaluateHypothesisEvidence, rankHypotheses } from './engine.mjs'`
3. Evidence boundary: Do not report a root cause based only on a plausible error pattern or a single speculative explanation.
