---
name: veyra-test
description: Automated test execution, regression suite management, and test category classification.
version: 1.0.0
aliases:
  - test
---

# veyra-test

Verify system behavior with fresh automated test suites across unit, integration, and regression levels.

## When to Use
- Before marking any implementation task as complete.
- When classifying and auditing test suites for assertion coverage.

## Invariants
1. Evidence First: Only fresh test execution receipts constitute proof of correctness.
2. Category Discipline: Maintain clear segregation among unit, integration, and regression suites.
3. Adequate Assertions: Every test case must declare observable assertions (density >= 1.5).
