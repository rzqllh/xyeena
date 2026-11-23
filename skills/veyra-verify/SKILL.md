---
name: veyra-verify
description: Mandatory empirical execution receipts and completion claim gatekeeper.
version: 1.0.0
aliases:
  - verify
---

# veyra-verify

Enforce empirical verification receipts before accepting any completion or fixed claim.

## When to Use
- Whenever an agent is about to claim a bug is fixed, a feature is ready, or tests pass.
- To prevent plausible but unverified assertions.

## Invariants
1. Receipt Before Assertion: Success statements require fresh, real terminal execution output.
2. Rejection of Conjecture: Without execution receipts, claims are strictly REJECTED.
3. Freshness Boundary: Stale receipts older than 5 minutes must be re-run before release.
