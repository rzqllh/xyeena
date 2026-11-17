---
name: xyeena-architecture
description: Use when choosing module boundaries, interfaces, seams, architecture, testability strategy, or evaluating whether an abstraction earns its cost.
---

# Architecture — v1 Procedure Entry

**Activate when:** The change requires a persistence boundary, new layer, integration seam or high-impact refactor architecture.

**Do not activate for:** The code change fits an existing interface with no material trade-off; style cleanup without architecture risk.

## Execution route

1. Inventory real callers, invariants, data flow and trust boundaries; profile change frequency rather than assuming future variants.
2. Compare at least two feasible designs (including keep-as-is) on cohesion, abstraction cost, test seam, operability, reversibility and risk.
3. Test the abstraction deletion criterion and dependency direction; protect domain logic from transport/persistence concerns.
4. Define contract examples, ownership and failure semantics; include negative tests for invalid inputs, timeouts, upgrade/migration boundaries.
5. Choose the smallest deep module consistent with requirements; record ADR only for materially irreversible decisions, otherwise keep it local.

**Output contract:** Options matrix, chosen seam, interface contract, dependency diagram, test and migration strategy.

**Failure boundary:** A high LOC-to-method ratio is a design clue, not a proof of correctness or actual modularity.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
