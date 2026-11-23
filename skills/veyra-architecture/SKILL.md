---
name: veyra-architecture
description: Deep module boundary auditing, Clean Architecture seam enforcement, and coupling metrics.
version: 1.0.0
aliases:
  - architecture
---

# veyra-architecture

Define and enforce deep module boundaries, dependency inversion, and architectural decoupling.

## When to Use
- When deciding module boundaries, subsystem seams, or package organization.
- To audit coupling metrics (Instability metric $I = C_e / (C_a + C_e)$) and detect circular imports.

## Invariants
1. Dependency Inversion: Core domain business logic must never depend directly on infrastructure.
2. Narrow Interfaces: Favor narrow, cohesive interfaces over wide, coupled abstractions.
3. No Circular Imports: Module dependency graphs must remain strictly acyclic.

## Operational Instructions
1. Discovery & Activation: Activated when user requests architectural review, dependency auditing, modular boundaries, or refactoring safety.
2. Engine Invocation:
   - Programmatic: `import { auditModuleBoundaries, calculateAfferentEfferentCoupling, detectCircularImports } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-architecture/engine.mjs').then(m => console.log(m.detectCircularImports([])))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Scan codebase module imports using `read_file` or static analysis before suggesting boundary changes.
   - Claude Code / Codex: Evaluate coupling metrics and flag any circular dependency before generating code plans.
4. Output & Verification: Emit module coupling report with Instability (I) scores and zero circular import cycles.
