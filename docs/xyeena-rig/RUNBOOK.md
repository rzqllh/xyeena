# Operations Runbook

Use this guide for source installation, migration, recovery, and release preparation. [Support status](../STATUS.md) distinguishes published 0.4.1 from newer source features and records host limitations.

---

## 1. Validate a Source Checkout

Run the complete local verification suite on the exact candidate:

```sh
npm ci
npm test
npm run check
npm run eval
npm run test:harness
npm run test:consumer
npm pack --dry-run
```

A source test does not establish live IDE enforcement or provider-side spending limits.

---

## 2. Inspect an Existing Workspace

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

---

## 3. Safe Transactional Installation & Migration

Use the new transactional conditional installer (DEC-26, DEC-29) from source:

```sh
# Pratinjau rencana transaksi
node bin/xyeena.mjs install --runtime antigravity --scope workspace --dry-run

# Eksekusi instalasi aman (default copy di Windows)
node bin/xyeena.mjs install --runtime antigravity --scope workspace --yes

# Periksa status Cortex engine
node bin/xyeena.mjs cortex status
```

Installer safety rules:
- Files modified by users are strictly locked against overwrites, even with `--force`. To replace, review the diff and supply `--diff-approved-fingerprint <FINGERPRINT>`.
- Mode defaults to `copy` on Windows; symlink/junction requires explicit `--mode symlink`.
- Safe uninstall (`node bin/xyeena.mjs uninstall --runtime antigravity --scope workspace --yes`) only removes official unmodified files and preserves custom user files.
- Staging failures trigger automatic atomic rollback.

Legacy compact setup remains supported for source workflows:

```sh
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes
```

Do not delete a host's entire `.agents`, `.gemini`, `.claude`, or `.hermes` directory; it can contain unrelated data.

---

## 4. Hooks and Host Acceptance

Follow [Guided hooks](../ANTIGRAVITY-GUIDED.md) for preview, installation, diagnostics, and owned-runner upgrades. A registered or enabled hook does not prove execution. `runnerIntegrity: MATCH` checks a local marker; that marker can be edited by the same OS user.

The recorded Antigravity CLI 1.4.7 observations cover specific consent and deny interactions. IDE 2.5.5 hook enforcement remains blocked. Confirm native behavior on the intended host before relying on a permission boundary.

---

## 5. Cancellation and Recovery

Source `host run`, `sdk run`, and `orchestrate run` forward Ctrl+C/SIGTERM cancellation to the owned adapter. Cancellation requests termination; it does not confirm remote billing stopped or every descendant exited. On Windows, source cleanup attempts to terminate the owned process tree and can fall back to direct-child termination. Check actual host state before retrying.

Inspect the local `.xyeena/runs/` journal and task evidence before resuming interrupted work. Reconcile any uncertain file write or external side effect first. Do not replay a destructive action merely because its completion receipt is missing. A timed-out shared-workspace write can retain its lock until the adapter settles.

---

## 6. Budget Rejection

Hermes response limits check reported usage after execution. A message such as `Hermes one-shot token budget exceeded` rejects the result after the provider may already have completed the billable call. Review provider usage and task scope. Do not automatically raise `--token-limit` or retry; use provider-side spending controls for billing protection.

---

## 7. Release Preparation

Use the checklist in [STATUS.md](../STATUS.md). Review the declared host scope, exact candidate tests, package contents, versions, publisher configuration, and required reviewers. Obtain final owner approval before tagging or publishing. The optional Simpul integration has its own acceptance scope and does not establish native Rig readiness.
