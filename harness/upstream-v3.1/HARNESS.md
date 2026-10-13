# Xyeena Harness System v1

> **Principle:** Maximum discipline, minimum ceremony.

This system is an operating contract for coding/design agents. It is not a giant checklist that runs on every task.


## Bootstrap / missing-config behavior

A repository does **not** need to be initialized with Xyeena Harness before it can be audited.

If `.xyeena/config.json` is absent:
- use embedded universal defaults;
- auto-detect applicable adapters;
- continue `doctor`, `audit`, `scan`, or generic `verify`;
- never fabricate project-specific rules;
- label output as `BOOTSTRAP`;
- recommend `xyeena init` after the audit if persistent configuration would help.

Missing configuration is informational. An existing malformed configuration is a blocker because silently ignoring it would hide an explicit project contract.

## Activation model

- **CORE** — active for almost every implementation task.
- **TRIGGERED** — active only when the work touches that domain or reaches the relevant risk threshold.
- **PROFILE** — persistent user/project decisions that override generic taste, but never safety constraints.

## Mandatory start sequence

1. Inspect actual repository/worktree state.
2. Recover the requested outcome and current agreed scope.
3. Identify completed, in-progress, and untouched work.
4. Classify change risk.
5. Activate only relevant harnesses.
6. State assumptions only when they materially affect implementation.
7. Work locally first whenever possible.

## Mandatory finish sequence

1. Compare result with the original outcome and project invariants.
2. Run verification proportional to risk.
3. Review the final diff as a reviewer, not as the author.
4. Check for accidental scope expansion and generated/AI residue.
5. Only then perform permitted remote actions.

## Universal hard rules

- Inspect before edit.
- Evidence before claiming "fixed", "done", "secure", "responsive", or "production-ready".
- Fix root causes rather than collecting symptom patches.
- Do not perform speculative refactors.
- Do not add dependencies without a concrete need.
- Do not repeat already completed work.
- Do not use remote deployment as a development feedback loop.
- Do not silently expand scope.
- Do not weaken security, validation, tests, or authorization merely to make a check pass.
- Do not treat hidden UI as authorization.
- Do not leave debug output, scratch plans, prompt dumps, or bot comments in the repository.
- Prefer the simplest correct design that preserves the product contract.

See `CATALOG.md` for the full categorized module inventory.
