---
name: veyra-review
description: Use when reviewing concrete code changes for correctness, regressions, safety, and architecture impact.
version: 1.0.0
aliases:
  - review
---

# veyra-review

Perform independent, dual-axis code reviews evaluating architectural seams and surgical implementation safety.

## When to Use
- Prior to merging, committing, or declaring phase completion.
- To inspect code diffs for unintended complexity, security hazards, or scope creep.

## Invariants
1. Dual-Axis Discipline: Reviews must inspect both architectural boundaries and diff-level safety.
2. Blocker Gate: High/Critical severity findings immediately result in a BLOCKED verdict.
3. Constructive Findings: Every finding must include concrete line citations and actionable remedies.

## Operational Instructions
1. Native Host Integration: Inspect the actual diff, related callers and tests; evaluate both correctness and scope.
2. Engine entry: `import { evaluateDualAxisReview, calculateComplexityEstimate } from './engine.mjs'`
3. Evidence boundary: The reviewer engine scores structured findings; it cannot independently discover missing code or prove regressions.
