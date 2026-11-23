# Veyra v1.0 — Benchmark Evidence Correction

**Historical A/B/C percentages are RETRACTED as release evidence.**
The previous comparator A/B values were fixed illustrative assumptions, not measured same-host agents or actual upstream implementations. Comparator C included unconditional full scores and an incorrect WCAG pass comparison of an object against a number.

The new benchmark_abc_runner.mjs performs local function checks and computes observed pass rates from outputs. It explicitly records:

| Comparator | Current qualification |
| --- | --- |
| A: same-host agent without Veyra | NOT_RUN |
| B: actual pinned upstream agent | NOT_RUN |
| C: Veyra functions | LOCAL_FUNCTION_PROXY_ONLY |

No A/B/C superiority percentage is released. The historical receipt remains marked RETRACTED for audit traceability. Future comparative evaluation must actually execute all three agent configurations with equal task set, model, context, tool access and budget.

To create a new local-function-only receipt: node qualification/benchmark_abc_runner.mjs.
