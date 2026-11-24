---
name: veyra-test
description: Use when executing regression tests, investigating failed assertions, or checking acceptance criteria.
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

## Operational Instructions
1. Native Host Integration: Execute real test commands via veyra-verify CLI instead of inferring PASS from existing test files.
2. Engine entry: `import { classifyTestSuites, evaluateSuiteResult, auditAssertionDensity } from './engine.mjs'`
3. Evidence boundary: A passing command exit code establishes that invocation succeeded, not that all behavior is correct.
