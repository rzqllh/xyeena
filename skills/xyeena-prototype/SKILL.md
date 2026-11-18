---
name: xyeena-prototype
description: Use when a design or debugging decision depends on technical behavior that static inspection or documentation cannot establish reliably, and a small disposable experiment can answer it.
---

# Prototype — v1 Procedure Entry

**Activate when:** One bounded technical unknown can be settled with a disposable experiment.

**Do not activate for:** Routine implementation, production-ready UI request, or irreversible migration without authorization.

## Execution route

1. Phrase one falsifiable question, enumerate plausible outcomes and define stopping threshold and budget.
2. Isolate the experiment in a scratch harness, temporary route or disposable worktree with zero production credentials and bounded side effects.
3. Capture baseline, run controlled variants and collect outputs (including failures) under documented versions.
4. Map observed result to the decision it informs; separate proven behavior from assumptions and performance noise.
5. Quarantine/delete disposable artifacts only when ownership is verified; promotion to product requires normal plan, review and tests.

**Output contract:** Experiment specification, actual observations, conclusions with limits and disposition of throwaway artifacts.

**Failure boundary:** An attractive screenshot or running demo does not establish compatibility, security, accessibility, or fitness for production.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
