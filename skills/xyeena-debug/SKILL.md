---
name: xyeena-debug
description: Use when investigating a bug, error, crash, regression, failing test, performance anomaly, or behavior that differs from expectation.
---

# Debug — v1 Procedure Entry

**Activate when:** Reproducible failure, regression, exception, performance anomaly or behavior inconsistent with spec.

**Do not activate for:** Feature development with no failure, purely cosmetic preference, or a guessed root cause without a symptom.

## Execution route

1. Record expected vs observed behavior, environment, revision, scope, frequency and earliest known failure.
2. Reproduce with a minimal command, fixture or interaction; if blocked, explicitly record REPRO_BLOCKED and safe next measurement.
3. Rank at most three discriminating hypotheses with predictions and instrumentation; locate the highest causal boundary before editing.
4. Change a single causal variable, observe whether predictions hold, and identify root cause before implementing smallest correction.
5. Verify original symptom and negative regression on same input and a nearby boundary; inspect remaining variants and document limitations.

**Output contract:** Repro receipt, hypothesis table, root-cause chain, minimal patch, before/after verification and regression guard.

**Failure boundary:** Do not shotgun-edit all plausible causes. A passing unrelated test does not close the original symptom; a production-only issue needs authorized production evidence.

Use [references/procedure.md](references/procedure.md) for decision and recovery branches. Route execution through Cortex and real host capabilities; reading this skill is not evidence of invocation or behavioral parity. Do not claim HOST_VERIFIED without an actual host-version-specific receipt.
