---
name: xyeena-grill
description: Use when the user explicitly asks to be grilled/interviewed/stress-tested, or a material irreversible decision has unresolved branches.
---

# Grill — v1 Procedure Entry

**Activate when:** Explicit GRILL request or an irreversible product/architecture decision with active owner-only choices.

**Do not activate for:** Ordinary small ambiguity, settled owner decision, discoverable repository fact, or execution step already approved.

## Execution route

1. Extract only material owner decisions; write unique IDs and prerequisite edges, detect unknown parents and cycles before questioning.
2. Fetch repository/host facts yourself, and settle only truly factual items with verified values; do not settle an owner preference from a guess.
3. Compute the frontier: unresolved decisions whose prerequisite IDs are settled; present at most five nonredundant owner questions with recommendation and trade-offs.
4. Record explicit answers for their referent; ambiguous yes/ok never approves deletion, publishing, global configuration or credential changes.
5. Stop only when all material decisions are settled, no unknown/cyclic blockers remain, and an agreed action follows; persist rejected options and residual risks.

**Output contract:** Decision graph, owner-approved choices, factual evidence, blocked nodes, next approved action.

**Failure boundary:** Frontier empty with blocked downstream nodes is DECISION_GRAPH_BLOCKED, never shared understanding. Use a blocker report, not an artificial success.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
