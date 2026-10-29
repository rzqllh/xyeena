# Operations runbook

Use this guide for source installation, migration, recovery, and release preparation. [Support status](../STATUS.md) distinguishes published 0.4.1 from newer source features and records host limitations.

## Validate a source checkout

```sh
npm ci
npm test
npm run check
npm run eval
npm run test:harness
npm run test:consumer
npm pack --dry-run
```

Run checks on the exact candidate. A source test does not establish live IDE enforcement or provider-side spending limits.

## Inspect an existing workspace

```sh
node bin/xyeena.mjs ops preflight --dir .
```

Preflight reads executable hints, hook registration, and owned-runner integrity. It does not launch a model or prove a host loaded a hook. Missing or modified state is a diagnostic result, not permission to reinstall over user changes.

For an older or modified Windows checkout, inspect `git worktree list`, then create a separate source worktree instead of resetting the user's files:

```powershell
git fetch origin
git worktree list
git worktree add --detach .tmp\rig-ops-preflight origin/main
node .tmp\rig-ops-preflight\bin\xyeena.mjs ops preflight --dir .
```

Choose another unused directory if that path exists. Remove only the clean worktree created for the check when finished. The [Windows preflight helper](../../scripts/windows-acceptance-pack.ps1) performs a bounded source-prerequisite workflow; its report is not native host acceptance.

## Install and migrate owned skills

Preview changes first:

```sh
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes
node bin/xyeena.mjs setup check --runtime codex
```

Compact setup is source functionality newer than the published baseline. Review destination ownership, backup records, and conflicts. Use the managed migration, rollback, or uninstall interface for the selected installation. Do not delete a host's entire `.agents`, `.gemini`, `.claude`, or `.hermes` directory; it can contain unrelated data.

## Hooks and host acceptance

Follow [Guided hooks](../ANTIGRAVITY-GUIDED.md) for preview, installation, diagnostics, and owned-runner upgrades. A registered or enabled hook does not prove execution. `runnerIntegrity: MATCH` checks a local marker; that marker can be edited by the same OS user.

The recorded Antigravity CLI 1.4.7 observations cover specific consent and deny interactions. IDE 2.5.5 hook enforcement remains blocked. Confirm native behavior on the intended host before relying on a permission boundary.

## Cancellation and recovery

Source `host run`, `sdk run`, and `orchestrate run` forward Ctrl+C/SIGTERM cancellation to the owned adapter. Cancellation requests termination; it does not confirm remote billing stopped or every descendant exited. On Windows, source cleanup attempts to terminate the owned process tree and can fall back to direct-child termination. Check actual host state before retrying.

Inspect the local `.xyeena/runs/` journal and task evidence before resuming interrupted work. Reconcile any uncertain file write or external side effect first. Do not replay a destructive action merely because its completion receipt is missing. A timed-out shared-workspace write can retain its lock until the adapter settles.

## Budget rejection

Hermes response limits check reported usage after execution. A message such as `Hermes one-shot token budget exceeded` rejects the result after the provider may already have completed the billable call. Review provider usage and task scope. Do not automatically raise `--token-limit` or retry; use provider-side spending controls for billing protection.

## Release preparation

Use the checklist in [STATUS.md](../STATUS.md). Review the declared host scope, exact candidate tests, package contents, versions, publisher configuration, and required reviewers. Obtain final owner approval before tagging or publishing. The optional Simpul integration has its own acceptance scope and does not establish native Rig readiness.
