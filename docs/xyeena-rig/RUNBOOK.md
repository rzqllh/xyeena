# Operations runbook

Requirements: Node.js 22.14+, a Git checkout for source-only capabilities, and appropriate host permissions. Use isolated workspaces for migration or acceptance testing.

## Validate source

```sh
npm ci
npm test
npm run check
npm run eval
npm run test:harness
npm run test:consumer
npm pack --dry-run
```

Review the full CI result on the **exact commit** being approved. Do not treat a local or fixture result as live-host acceptance.

## Install compact skills from source

```sh
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes
node bin/xyeena.mjs setup check --runtime codex
```

This affects only the selected skill roots and leaves third-party skills in place. Host activation must be checked separately. Global scope changes user-owned paths; preview before accepting.

## Migrating existing Xyeena skills

Use the source library's `previewLegacyMigration` before `applyLegacyMigration`. Migrate only demonstrably owned and unmodified items, inspect the backup journal, and preserve unknown user files.

Before performing any restore, inspect its migration ID and the current files. `rollbackLegacyMigration` and `uninstallCompactSetup` refuse unowned targets. Prefer the documented CLI for supported workflows; direct library entry points are advanced APIs that may evolve between releases.

Never remove a host's entire `.agents`, `.gemini`, `.claude`, or `.hermes` directory.

## Running checks and agents

`verify` runs project-defined scripts; `audit` and `scan` inspect project state. `orchestrate preview` is read-only; `orchestrate run --yes` starts a new restricted one-shot model session rather than changing the active IDE conversation.

Privileged actions remain disabled if host approval or interception cannot be validated. Use the host's real permissions. Do not manufacture approvals, worker identities or evidence.

## Recovery

Check the local `.xyeena/runs/` journal for an interrupted run. Inspect task status and evidence before a resume. A previous write, external API call or destructive action must not be automatically replayed solely because its result was not recorded. Protect backup, session and evidence files from source control.

## Release

1. Verify all automated checks and recorded approval gates on the intended release commit.
2. Complete configured-host live acceptance and dependent Simpul supervisor verification, or document a restricted release scope.
3. Inspect `npm pack --dry-run` and verify the package contents.
4. Update the package and lockfile version together; validate plugin metadata consistency.
5. Obtain separate authorization for GitHub Release/tag and npm publication.
6. Use the repository's Trusted Publisher pipeline and verify the published artifact against source.

**Current status:** `0.5.0` is not published. No release tag or npm command is implied by this runbook. See [Task tracker](TASK_TRACKER.md).
