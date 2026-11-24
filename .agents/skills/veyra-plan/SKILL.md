---
name: veyra-plan
description: Use when building a dependency-ordered implementation plan with real prerequisites and acceptance criteria.
version: 1.0.0
aliases:
  - plan
---

# veyra-plan

Transform complex multi-step technical requirements into dependency-ordered execution DAGs with blast radius safety ratings.

## When to Use
- Before starting multi-step feature implementation or cross-file refactoring.
- To compute critical path dependencies and calculate blast radius.

## Invariants
1. Acyclic DAG: Circular task dependencies are strictly prohibited.
2. Explicit Inputs & Outputs: Every task must declare files to modify and exit verification commands.
3. Blast Radius Approval: High risk tier tasks require explicit Owner authorization.

## Operational Instructions
1. Native Host Integration: Extract tasks from actual requirements; run validatePlanDAG against explicit dependencies before authorization.
2. Engine entry: `import { validatePlanDAG, detectCycles, estimateBlastRadius, calculateCriticalPath } from './engine.mjs'`
3. Evidence boundary: The DAG engine checks the supplied graph; missing requirements or made-up dependencies remain unverified.
