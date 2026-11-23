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
