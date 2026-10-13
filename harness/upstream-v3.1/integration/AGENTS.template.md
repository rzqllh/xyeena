# AGENTS.md — Xyeena Harness Entry Point

This repository uses Xyeena Harness.

## Bootstrap rule — mandatory

Absence of `.xyeena/config.json` or `xyeena-harness.config.json` is **NOT** a blocker for:
- inspection
- `doctor`
- read-only `audit`
- repository scan
- generic verification

When project configuration is absent:
1. use the embedded universal defaults;
2. auto-detect adapters from the repository;
3. do not invent project-specific invariants;
4. report that the repository is in BOOTSTRAP mode;
5. continue the requested read-only audit;
6. recommend `xyeena init` only as a follow-up configuration step.

Only an existing-but-invalid configuration is a configuration blocker.

## Working rules

Run `xyeena doctor` before implementation.
Load `.xyeena/profile.md` when it exists.
Activate only relevant domain harnesses.
Verification depth follows risk.
Do not claim completion without evidence.
Keep remote actions deliberate and deployment-budget aware.
