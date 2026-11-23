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

## Operational Instructions
1. Discovery & Activation: Activated when planning multi-step features, complex refactors, or cross-cutting migrations.
2. Engine Invocation:
   - Programmatic: `import { validatePlanDAG, detectCycles, estimateBlastRadius, calculateCriticalPath } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-plan/engine.mjs').then(m => console.log(m.validatePlanDAG([])))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Construct acyclic execution DAGs, verify task dependencies, and estimate file blast radius before execution.
   - Claude Code / Codex: Structure plans into sequential, reviewable phases with explicit exit criteria.
4. Output & Verification: Deliver valid Kahn-DAG execution plan with zero dependency cycles and scoped blast radius.
