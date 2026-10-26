# Operations runbook

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

Requirements: Node.js 22.14+, a Git checkout for source-only capabilities, and appropriate host permissions. Use isolated workspaces for migration or acceptance testing.

## Operator handoff — preserve the existing Windows worktree

The following PowerShell commands are intended only after the source-side patches are merged. They **fetch** a remote commit and add a fresh detached source worktree; they do not reset or overwrite tracked/untracked files, installed hooks, host settings or the modified root `.gitignore`.

```powershell
git fetch origin
git worktree list
git worktree add --detach .tmp\rig-ops-preflight origin/main
node .tmp\rig-ops-preflight\bin\xyeena.mjs ops preflight --dir .
```

Use a different new `.tmp\rig-ops-preflight` directory name if that worktree already exists. Copy only the preflight JSON (which intentionally omits absolute paths/secrets). This is **not** a native permission test; `agy` and IDE workflows still require a separate in-host acceptance operation. No package login/API keys, npm install, `--yes`, or deletion of local hooks are involved. Do not run a destructive external-workspace test to verify containment. After the evidence is captured, `git worktree remove .tmp\rig-ops-preflight` removes only this temporary checkout if clean.

## Safe operator prerequisites (source-only)

From the checkout containing the latest source, run `node bin/xyeena.mjs ops preflight --dir .`. It reads local binary hints and Xyeena hook metadata, prints redacted JSON with remaining acceptance issue links, and leaves all files unchanged. It does not call agents or prove native hook enforcement; operator-run native tests come later. If using an older checkout, use a **separate detached Git worktree** at `origin/main` rather than resetting local edits. The source-only command is not part of npm 0.4.1.

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
2. Complete RIG-native configured-host live acceptance, or document a restricted host-support scope. Optional Simpul supervisor verification belongs to separately enabled integration acceptance and is **not** a prerequisite for core RIG.
3. Inspect `npm pack --dry-run` and verify the package contents.
4. Update the package and lockfile version together; validate plugin metadata consistency.
5. Obtain separate authorization for GitHub Release/tag and npm publication.
6. Use the repository's Trusted Publisher pipeline and verify the published artifact against source.

**Current status:** `0.5.0` is not published. No release tag or npm command is implied by this runbook. See [Task tracker](TASK_TRACKER.md).

## Source CLI cancellation

An operator can attempt to cancel a running **source** `host run`, `sdk run`, or `orchestrate run` with Ctrl+C, which is converted into an AbortSignal and passed to the direct child adapter; the command should not report a completed/verified task afterward. SIGTERM follows the same path, and listeners are scoped to each command. A separate native Windows process-tree and provider billing check is still required ([OPS-06](https://github.com/rzqllh/xyeena/issues/37)). Never treat a source-level cancellation unit test as that live proof.

## Canceling source one-shot adapters

For a direct API caller, pass an `AbortController` signal into `createPortableHostAdapter(...).executeTask(task, {signal})` or `createAntigravitySdkAdapter(...).executeTask(task, {signal})`. Abort before spawning prevents a provider call; abort during execution requests direct-child termination and rejects with `ERR_PORTABLE_CANCELED` or `ERR_SDK_CANCELED`. This is **not the same as CLI cancellation**, guaranteed Windows child-process tree termination, or proof that a provider immediately stops billing. Do not record it as a live OPS-06 acceptance test.

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

## Consolidated Windows PowerShell source preflight

From a current source checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows-acceptance-pack.ps1 -RepoDir .
```

This script fetches origin/main and uses a uniquely named detached temporary Git worktree. It never resets local changes, overwrites existing output, edits installed hooks or contacts model providers. It emits one redacted rig-windows-evidence.json in a new system-temp folder and removes only its own clean temporary worktree without force. The SOURCE_PREFLIGHT_PASS_LIVE_PENDING verdict establishes prerequisites only. Issues #34–#37 require host-verified IDE/CLI/supervisor/provider evidence with explicit human consent.

## Windows PowerShell 5.1 Git progress compatibility (2026-10-26)

The preflight helper now treats Git stderr progress such as `From github.com` and `Preparing worktree` as expected diagnostics, checking actual Git exit status instead of treating PowerShell 5.1 `NativeCommandError` as a failed fetch. A targeted Windows CI smoke exercises `powershell.exe` without `-UseCurrentSource`, covering both temporary source worktree creation and cleanup. No host acceptance, provider spending limit or privileged tool interception is implied.

## RIG-only native acceptance handoff

The Windows evidence pack must report `project: xyeena-rig` and `acceptanceScope: rig-native-hosts`. Its core `remainingGates` are #34 (Antigravity IDE), #36 (Codex/Claude/Gemini), and #37 (Hermes native cancellation/authorization). It does not probe or report Simpul supervisor state or certify provider billing hard caps. The previously recorded Windows preflight for source `184e2d9` succeeded as a read-only **source prerequisite**; it did not validate native IDE interception. Rerunning on the updated source refreshes report scope, not native PASS.

## Preflight exact-match interpretation

`preToolUseRegistered:true` means the inspected workspace manifest contains the exact source-managed single PreToolUse hook invocation and timeout. `preToolUseEnabled:true` additionally requires it not to be disabled. Neither proves the Antigravity IDE or CLI loaded or executed that hook. A modified command, added hook, or mismatch must be diagnosed, not auto-repaired or treated as security enforcement. For native PASS, observe a host-side safe negative interception in the actual IDE.
