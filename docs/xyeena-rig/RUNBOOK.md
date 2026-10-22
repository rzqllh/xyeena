# Operator runbook

Node.js >=22.14.0 required. Work from the repository root.

## Read-only preview

    node bin/xyeena.mjs setup compact --runtime codex --preset complete --dry-run
    node bin/xyeena.mjs skills matrix --local-only
    node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Investigate a regression"

These are diagnostics only. File discovery does not assert skill activation.

## Install a compact workspace entry

    node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes

This exposes one `xyeena-rig/SKILL.md` per unique host root. Existing loose skills, third-party skills, and host settings are unchanged. Restart the host and verify actual loading.

## Managed upgrade

    node bin/xyeena.mjs setup compact --runtime codex --preset balanced --dry-run
    node bin/xyeena.mjs setup compact --runtime codex --preset balanced --update --yes

The original managed folder is kept in `.xyeena/backups/compact/`. Automatic rollback CLI is pending. Manual restore: stop the host, inspect both current and backed-up entry hashes, preserve current files separately and restore the confirmed backup. Never delete an unowned folder.

## Important boundaries

- Do not delete old flat skills before mapping installer ownership.
- Do not infer enabled/trusted Superpowers or Superior plugins solely from filenames.
- Do not activate Simpul or native subagents using a planner response alone.
- Do not claim project Harness guides were installed globally.
- Do not bypass native permission prompts or auto-merge/publish.

## Repository validation

    npm test
    npm run check
    npm run eval
    npm run test:harness
    npm run test:consumer
    npm pack --dry-run

Record exit codes, CI links, regressions, and native host smoke evidence in EVIDENCE.md.
