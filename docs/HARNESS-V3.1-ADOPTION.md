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

Source archive now inspected and independently verified (original behavior, not merged behavior):

- Zero-runtime-dependency, project-agnostic harness.
- CLI commands `doctor`, `audit`, `scan`, `verify` work without a prior `init`.
- Missing `.xyeena/config.json` is informational, not an error.
- `init` is optional and must not overwrite existing user configuration silently.
- Candidate structure: `runtime/`, `harness/`, `adapters/`, `profiles/`, `integration/`, `examples/`.
- Original archive passed 11/11 unit tests and `npm run smoke` on Node.js 22.16.0. Offline `npm pack` consumer installed successfully; package contained 93 files. SHA-256 of supplied ZIP: `b65f826cabd69d6357fcf84c4fa1d874aeb4f383a7a35db9b5eee573f30fe888`.

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
- `doctor`, `audit`, and `scan` work without `.xyeena` config and are read-only. `verify` also works without prior `init` but writes `.harness/evidence/latest.json` and may execute project scripts; disclose these side effects and ensure evidence is ignored by Git.
- `init --dry-run` is side-effect free; default `init` is non-destructive on modified files.
- Packed-consumer smoke confirms both executable aliases, skills, metadata and all public command behavior.
- Consent and governance cannot be bypassed by harness integrations.
- Package contents contain no `.internal/`, `.dev/`, private evaluations, local logs, keys, or generated runtime state.
- Evidence includes exact commit SHA, commands, test outputs, package file list and required manual gates.
- Do not merge to `main` until implementation and manual acceptance gates pass.

## Blocker

The original Harness v3.1 source ZIP has now been supplied and inspected. Full merge and integration verification remain pending; do not mark v3.1 adoption complete until both suites and the packed consumer pass on the merged tree.

## Source-backed findings: 2026-10-13 (pre-merge)

- Harness package is `@xyeena/harness@3.1.0`; existing Agentic package is `xyeena-agent@0.1.0`. **Both declare the binary name `xyeena`** and implement `init` / `doctor` with different behavior.
- `runtime/xyeena-harness.mjs` supports `audit`, `scan`, `verify`, `prepush`, `risk`, `changed`, `adapters`, and `install-hook`; preserve old CLI commands and route intentionally.
- `verify` invokes project-native npm/pnpm/yarn/bun scripts and writes evidence under `.harness/evidence/latest.json`. It is **not read-only**. In a fresh empty Git repo it exits 0 despite executing zero project-native checks: fix fail-open/pass-reporting semantics and add a regression test.
- `runtime/lib/git.mjs` currently tolerates missing diff base without a clear warning. Resolve valid refs and report fallback rather than quietly evaluating incomplete changes.
- `install-hook` currently overwrites `.git/hooks/pre-push`; replace with non-destructive hook installation, honoring Git worktree hook paths.
- Bundled `LICENSE-NOT-SET.md` explicitly states a license was not chosen for the standalone harness; merge into Agentic MIT requires confirming right to publish the supplied code and preserving third-party obligations.
- Source unit tests and smoke passed, and packed consumer launches. **No claim has been made that the integrated tree passes tests.**

## Recommended conflict resolution

- Keep `xyeena-agent` as the single npm package and `xyeena` / `xyeena-agent` as existing public executables.
- Preserve current `xyeena init` (portable skills installer) and current machine-readable `xyeena doctor` result. Add explicit harness mode (e.g. `xyeena harness init` and `xyeena harness doctor`) to avoid silently changing existing behavior.
- Expose `xyeena audit`, `xyeena scan`, `xyeena verify` as clear aliases, with caveats above.
- Keep optional harness project config in `.xyeena/config.json`, existing install inventory in `.xyeena/install.json`, and append-only run journal in `.xyeena/runs/`.
- Move evidence under a correctly ignored local path; never include runtime evidence in the published npm files.
- First merge should be a bounded compatibility integration. Improve unrelated harness features in separate PRs after original behavior is preserved.
