---
name: veyra-plan
description: Dependency-ordered phased execution planning, DAG acyclicity validation, critical path analysis.
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
