# Harness v3.1 adoption readiness

Status: **design and source-reconciliation gate only**. No Harness v3.1 implementation has been merged or validated by this document.

## Immutable baselines

- Existing Xyeena Agentic: `8ba54598f4da89662474625732095aab847d5d9d` (v0.1.0 at review).
- Historical Harness artifact: `xyeena-harness-v3.1-repo-ready.zip`. Its original bytes and checksums are **not yet available for comparison**.
- Do not treat historical test claims as evidence for the merged tree.

## Current public contracts to preserve

1. Package: `xyeena-agent`; executable names: `xyeena-agent`, `xyeena`.
2. Commands: `init`, `doctor`, `check`, `list`, `resolve`, `eval`, `run-init`, `version`.
3. `init --runtime antigravity|claude|codex|all`; `--dry-run` makes no writes; modified skills are not silently overwritten.
4. Portable skills and native runtime metadata remain installed in documented project locations.
5. `.xyeena/install.json` records installation state; `.xyeena/runs/<run-id>/` is a ledger, not install/config state.
6. Governor, broker, consent, task DAG, protocol and ledger remain authoritative for their existing concerns.
7. No development internals, local state, credentials, or generated artifacts in the published package.

## V3.1 capabilities to reconcile when source is available

Historical package description (not independently verified against the archive):

- Zero-runtime-dependency, project-agnostic harness.
- CLI commands `doctor`, `audit`, `scan`, `verify` work without a prior `init`.
- Missing `.xyeena/config.json` is informational, not an error.
- `init` is optional and must not overwrite existing user configuration silently.
- Candidate structure: `runtime/`, `harness/`, `adapters/`, `profiles/`, `integration/`, `examples/`.
- Historical checks claimed 11 unit tests, zero-config smoke and packed-consumer verification; these must be re-run.

## Canonical merge policy

| Concern | Resolution |
| --- | --- |
| CLI | One `xyeena-agent` package and dispatcher; no duplicate `doctor` implementations |
| Zero-config commands | `doctor`, `audit`, `scan`, `verify` must not require generated config or a previous install |
| Config files | Keep `.xyeena/config.json` for optional harness preferences and `.xyeena/install.json` for install inventory; explicit migrations only |
| Skills | Preserve existing portable skills and native metadata; no blind replacement with harness profiles |
| Runtime integrations | Adapter interfaces should not bypass Xyeena governance or consent |
| Compatibility | Keep existing commands/flags working; document any intentionally changed behavior |
| Packaging | Include only audited runtime/public assets; no private harness material or development files |
| Desktop | Future Xyeena Desktop bridge is a separate integration and not a reason to couple this package to Tauri |

## Required comparison before implementation

1. Recover the original v3.1 ZIP into a disposable workspace, calculate SHA-256, list all paths and package manifests.
2. Check its own `LICENSE` / third-party notices, dependency tree, binaries, scripts, versions and test setup.
3. Diff current `src/cli.mjs`, `src/install.mjs`, `src/doctor.mjs`, `src/runtime.mjs`, schemas and tests against corresponding harness modules.
4. Create a per-module **reuse / adapt / replace / omit** table and identify incompatible public behavior.
5. Migrate one module at a time on a feature branch. Protect current main and maintain a clean rollback path.
6. Update README, changelog, migration notes, and npm package allowlist only after actual behavior is confirmed.

## Acceptance gates (not yet run)

- All existing `npm test`, `npm run check`, `npm run eval`, `npm pack --dry-run` checks pass.
- Harness v3.1 source tests run after reconciliation; add regression tests for each adopted CLI path.
- `doctor`, `audit`, `scan`, `verify` succeed in an empty project with no `.xyeena` directory and do not write files.
- `init --dry-run` is side-effect free; default `init` is non-destructive on modified files.
- Packed-consumer smoke confirms both executable aliases, skills, metadata and all public command behavior.
- Consent and governance cannot be bypassed by harness integrations.
- Package contents contain no `.internal/`, `.dev/`, private evaluations, local logs, keys, or generated runtime state.
- Evidence includes exact commit SHA, commands, test outputs, package file list and required manual gates.
- Do not merge to `main` until implementation and manual acceptance gates pass.

## Blocker

The exact `xyeena-harness-v3.1-repo-ready.zip` archive is needed to merge its implementation faithfully. Do **not** reconstruct missing code from summaries or mark the v3.1 adoption as complete without that source.
