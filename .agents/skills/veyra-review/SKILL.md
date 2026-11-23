---
name: veyra-review
description: Dual-axis architectural depth and surgical safety code review.
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
