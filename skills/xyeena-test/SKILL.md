---
name: xyeena-test
description: Use when behavior changes need automated verification, a bug needs regression protection, or the user asks for TDD/testing.
---

# Test — v1 Procedure Entry

**Activate when:** A behavioral change must be protected, user requests TDD, or a production symptom requires reproducible regression.

**Do not activate for:** A pure explanation, manual exploration without executable environment, or a snapshot that cannot assert user-visible behavior.

## Execution route

1. Extract one observable behavior with input, expected output and boundary; choose the highest stable public seam before white-box internals.
2. Capture a RED baseline on the correct tree and confirm failure reason is relevant; if RED cannot run, label the exercise BLOCKED rather than synthetic.
3. Implement minimum change to achieve GREEN; execute the exact targeted command and preserve exit code/output/revision.
4. Refactor without changing behavior, then re-run the targeted and relevant broad suites; add invalid-input, rollback, timeout or concurrency cases according to risk.
5. Report test gaps, skipped checks and environment mismatch. Only claim the specific scenario passed where a real runner produced evidence.

**Output contract:** Test seam; RED/GREEN receipts; executed commands; passing/failing/skipped counts; uncovered risks.

**Failure boundary:** A skipped test, mocked worker reply, or previously green CI from another commit must not satisfy the current acceptance gate.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
