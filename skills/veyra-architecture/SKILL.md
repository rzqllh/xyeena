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
