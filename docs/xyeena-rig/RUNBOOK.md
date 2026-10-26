# Operations runbook

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

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

## Antigravity native PreToolUse hook

**Live status update (2026-10-26):** On Windows, `agy 1.4.7` displayed the Xyeena `force_ask` prompt and honored user cancellation, and a separate temporary exact-match `deny` was enforced by the CLI. The probe was cleared. IDE 2.5.5 has an observed host-hook bypass and must not be treated as security-protected. Full testimony and limitations are in [EVIDENCE.md](EVIDENCE.md) and [public status](../STATUS.md).

Run `node bin/xyeena.mjs guided preview --dir .` and inspect the proposed `PreToolUse` group before installation. The `guided install --yes` workflow preserves unrelated hook groups and takes managed backups. The policy returns only `allow`, `force_ask` or `deny`: it never bypasses existing host user-approval rules.

The hook rejects write targets outside the trusted workspace and symlinked file targets; commands require a fresh user decision, but may have shell-internal side effects beyond what a pre-hook can inspect. **No OS sandbox guarantee** is provided. Native IDE hook enablement, consent prompts, and deny results must be verified on a real installed host, not a simulated stdin event.

## Hermes headless usage budget

Portable Hermes one-shot sessions now default to at most 2 native tool-calling turns, with a response acceptance ceiling of 50,000 reported tokens. To adjust per invocation from current source:

```sh
node bin/xyeena.mjs host run --runtime hermes --goal "Review README" --max-turns 2 --token-limit 50000 --yes
```

Hermes `--max-turns` caps iteration count. The token ceiling is a **settlement check after the provider has completed**, not provider-side hard spend enforcement. Missing or excessive `tokens.total` makes Xyeena reject the result with a typed error. Avoid treating this as a billing cap; configure provider-side spending limits and use bounded timeouts. The separate `ResourceBudgetLedger` is not automatically applied to the `host run` CLI. [Hermes CLI reference](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/cli-commands.md).
