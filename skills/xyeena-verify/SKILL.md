---
name: xyeena-verify
description: Use when work is about to be called complete, fixed, passing, safe, ready, or when moving from implementation into review/release.
---

# Verify — v1 Procedure Entry

**Activate when:** A claim of done, fixed, safe, passing, production-ready or host compatibility requires a final evidence gate.

**Do not activate for:** An exploratory recommendation or a description of unexecuted planned work, provided no success claim is made.

## Execution route

1. Enumerate every material claim and identify its proof type: file existence, deterministic test, independently observed host action, rendered screenshot, production measurement.
2. Bind each claim to exact commit/tree, environment, test command/run ID, timestamps and authoritative artifact path; reject missing or caller-invented provenance.
3. Run or inspect the necessary checks on the latest tree; a stale pass after a relevant code change must be re-run.
4. Assess evidence against each claim: VERIFIED only for matching observed proof, REVIEW_REQUIRED for plausible but unproven, FAILED for contradictory runs, BLOCKED for missing host/consent.
5. Publish a compact fact table with what ran, outcomes, what was not exercised and limitations; avoid aggregate PASS hiding a failed requirement.

**Output contract:** Claim-by-claim receipt, exact evidence provenance, pass/fail/blocked breakdown and next executable verification.

**Failure boundary:** Registry ONLINE, configured hook files, green unit tests or model-generated summary do not establish live host invocation or security enforcement.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
