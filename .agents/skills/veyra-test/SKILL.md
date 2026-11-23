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

## Operational Instructions
1. Discovery & Activation: Activated when writing tests, structuring test suites, or evaluating test coverage and assertions.
2. Engine Invocation:
   - Programmatic: `import { classifyTestSuites, evaluateSuiteResult, auditAssertionDensity } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-test/engine.mjs').then(m => console.log(m.classifyTestSuites([])))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Categorize suites into unit, integration, and regression; execute tests using native test runners (`node --test`).
   - Claude Code / Codex: Prevent assertion-free smoke tests; enforce meaningful behavioral expectations.
4. Output & Verification: Output execution duration, test counts, pass/fail breakdown, and regression safety confirmation.
