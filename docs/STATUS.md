# Source and release status

**Evidence reviewed: 2026-10-26 (Asia/Jakarta).** This page describes the public Xyeena Rig repository and the recorded Windows acceptance session; it is not a promise that every host has been tested.

## Source versus published npm

| Surface | Verified source state | Release boundary |
| --- | --- | --- |
| GitHub `main` | Verified source checkpoint [`d1b29c2`](https://github.com/rzqllh/xyeena/commit/d1b29c279df0434ce420f3b9c2a6c7f67eaa9234), through merged PR #58; [post-merge CI](https://github.com/rzqllh/xyeena/actions/runs/40290814931) successful | Repository source is not automatically npm-published |
| npm `xyeena-agent` | `0.4.1` is the last published baseline **recorded by this repository** | Registry cannot be authoritatively rechecked from this audit; verify the registry before a future release |
| Candidate `0.5.0` | Not published, tagged, or authorized by the user | A future publication requires explicit human approval |
| CI | PR #31, #32, #33, #38–#45 (implemented PR numbers) each passed 9/9 GitHub CI jobs at their final PR heads | CI is source/packaging assurance, not live host enforcement |

The package version remains `0.4.1` in `package.json`. Features implemented after that release—including compact skill setup, expanded adapters, native `PreToolUse` integration and new probe/runner commands—are **source-only until an authorized npm release**. Use `node bin/xyeena.mjs` from a source checkout, not `npx xyeena-agent@0.4.1`, when following source-only instructions. Node.js 22.14+ is required.

## Host acceptance as observed

| Host / boundary | Evidence | Status |
| --- | --- | --- |
| **Antigravity CLI `agy 1.4.7` (Windows)** | Native `PreToolUse` callback observed; `force_ask` displayed Xyeena-specific approval reason and user `No, cancel` blocked the tool; a separate one-shot `deny` returned `tool call denied by pre-tool hook: Xyeena: native deny diagnostic blocked read-only git status` without executing `git status --short`. Probe was cleared after test. | **LIVE PASS for those specific CLI consent/deny interactions** |
| **Antigravity IDE `2.5.5` (Windows)** | A native read-only tool was permitted despite an expected workspace-boundary hook denial; no native Xyeena approval dialog. | **LIVE BLOCKED** — installation does not enforce IDE security |
| **Hermes** | Previous one-shot Windows host run and budget post-run checks. Hard provider spend and native cancellation unproven. | **LIVE PARTIAL** |
| **Codex / Claude Code / Gemini CLI** | Source adapters and fixtures; corresponding standalone binaries unavailable in recorded Windows acceptance environment. | **LIVE BLOCKED / untested on that host** |

**Scope of PASS:** The CLI test used one exact, harmless read-only command and a user-canceled command. It is not proof of OS sandboxing, arbitrary privileged writes, multi-host enforcement, IDE hooks, or universally safe execution. `guided status` deliberately reports `hostEnforcement: UNVERIFIED` because a writable local diagnostic receipt does not independently authenticate a host. The separately witnessed native CLI tool rejection is the acceptance evidence.

The Antigravity CLI may modify `SessionStart` and `PostInvocation` in the managed group. Guided status reports this as `managedIntegrity: MODIFIED`; only the exact, enabled `PreToolUse` event and matching runner are probe-eligible. A guarded `runner-upgrade` updates the owned runner and manifest script hash with backup, preserving host-managed `.agents/hooks.json`, unrelated hooks, and the user's `.gitignore`. No global permissions are silently granted.

## Read-only host command discovery

The source `setup check --runtime antigravity` now checks `agy` as the native CLI executable in addition to any `antigravity` binary. This corrects a false negative seen on machines where only `agy` is on PATH. Results identify command candidates without launching a model and **do not change** the host acceptance matrix above: a discovered binary is not proof that either the CLI session is active or the IDE enforces hooks.

## Optional cross-project worker integration (outside RIG-native acceptance)

Simpul is a **separate workspace and optional MCP transport**. The adapter remains in source for opt-in compatibility, with execution readiness unverified; its authenticated supervisor lifecycle is **not** part of core RIG acceptance or a blocker for a RIG-native release. RIG preflight does not probe or enumerate Simpul. The [historical interface issue #35](https://github.com/rzqllh/xyeena/issues/35) is tracked separately.

## Programmatic one-shot cancellation (source-only)

Portable host and Antigravity SDK adapters now accept `adapter.executeTask(task, {signal: abortController.signal})`; a pre-aborted signal prevents child launch, and an in-flight cancellation rejects the operation and requests direct-child termination (and, in updated unreleased source, an owned Windows process-tree termination request). Received stdout/stderr byte caps are enforced, and raw SDK worker error messages are no longer echoed as exception details. These are **source-level API and CI guarantees only**; the `host run` CLI has not been wired to an operator-supplied AbortSignal. Descendant teardown, Windows native process ownership and provider-side hard spend limits remain unverified in live sessions (see [#37](https://github.com/rzqllh/xyeena/issues/37)).

## CLI signal propagation (source-only)

The latest source CLI wraps actual `host run`, `sdk run` and `orchestrate run` execution in temporary SIGINT/SIGTERM listeners, forwarding an `AbortSignal` to the owned native adapter. Preview commands do not start such a session, and handlers are removed after each operation. A Ctrl+C requests cancellation; it is not a guarantee that a Windows process tree, model-provider request, or billing has stopped. Signal delivery through the actual terminal and native descendant teardown remain [live acceptance #37](https://github.com/rzqllh/xyeena/issues/37).

## Latest source-only work checkpoint — 2026-10-26

- [PR #39](https://github.com/rzqllh/xyeena/pull/39): programmatic host/SDK cancellation, byte-accurate output limits and sanitized worker errors
- [PR #40](https://github.com/rzqllh/xyeena/pull/40): CLI Ctrl+C/SIGTERM forwarding for `host run`, `sdk run` and `orchestrate run`
- [PR #41](https://github.com/rzqllh/xyeena/pull/41): real OS subprocess smoke with **fake** provider protocol responses, not an authenticated provider test
- [PR #42](https://github.com/rzqllh/xyeena/pull/42): read-only, redacted host prerequisites and issue links

All four passed their GitHub CI matrices (9/9 each) and were merged. **No wider live-host, IDE interception, Simpul supervisor, Windows process-tree teardown or npm release acceptance is implied.**

## One-command RIG-only local preflight (newer source, not npm 0.4.1)

```sh
node bin/xyeena.mjs ops preflight --dir .
```

This read-only report is designed as the prerequisite inventory for the operator handoff: it shows available command names (not installation paths), minimal Xyeena hook structure, local runner file presence, and the three RIG-native acceptance issue links (#34, #36, #37), excluding optional worker integration. It does not invoke `agy`, Python, Hermes, Codex, Claude, Gemini, Simpul, the installer, network calls, or user-approval dialogs. It makes **no new live PASS claims** and does not print tool command lines or credential values. Missing native evidence remains blocked.

**For a local checkout with uncommitted edits or older source:** do not pull/reset it to run the new command. Instead fetch `origin` and use a fresh detached Git worktree under ignored `.tmp/`, invoke that worktree's `bin/xyeena.mjs` against the actual workspace with `--dir .`, and remove only the temporary worktree after the acceptance process is complete. See the [safe operator runbook](xyeena-rig/RUNBOOK.md).

## Outstanding live acceptance — public issue tracker

The remaining **core RIG** work needs target-host runtime observations or external dependencies, not more simulated PASS labels:

- [#34 — Antigravity IDE native hook boundary](https://github.com/rzqllh/xyeena/issues/34): IDE 2.5.5 did not enforce an expected Xyeena decision; CLI results cannot substitute
- [#36 — Codex / Claude Code / Gemini CLI native acceptance](https://github.com/rzqllh/xyeena/issues/36): binaries unavailable on the recorded test machine
- [#37 — Hermes real cancellation and provider-side budget evidence](https://github.com/rzqllh/xyeena/issues/37): one-shot smoke passed previously, broader limits untested

These tickets are not finished work; only independent observations on a running host can close them.

## What remains before a wider release

- Verify real native IDE interception or explicitly document IDE as unsupported for security enforcement; do not infer support from vendor docs or a successful install.
- Complete host-specific authorization, skill activation, worker lifecycle and negative tests for the other declared runtimes, where practical.
- Recheck npm registry, package inventory and provenance for the exact candidate; receive explicit approval before any tag, GitHub Release or npm publication.

For the audit trail see [OPS tracker](xyeena-rig/TASK_TRACKER.md), [acceptance matrix](xyeena-rig/ACCEPTANCE_MATRIX.md), [live evidence](xyeena-rig/EVIDENCE.md), [security policy](../SECURITY.md), and [guided hooks](ANTIGRAVITY-GUIDED.md).

**Change discipline:** this status is dated evidence. Update it only when independent CI or host observations change; historical figures and demonstrations stay in their dated evidence sections.

## Latest source safety fixes — 2026-10-26

- [PR #44](https://github.com/rzqllh/xyeena/pull/44) removes untrusted host-returned worker IDs from error diagnostics while retaining fail-closed rejection of malformed/placeholder IDs.
- [PR #45](https://github.com/rzqllh/xyeena/pull/45) corrects workspace write-lock tail cleanup (FIFO queue ownership and idempotent release). Previously, the retained map's promise and cleanup comparison could never match, leaving stale entries.

Both were merged into the audited source checkpoint and passed **9/9** GitHub checks on their final PR heads. No additional native host, Simpul or billing acceptance is implied.

## Post-run budget accounting hardening (PR #47, source change)

A focused source patch now validates non-negative safe-integer budget limits, estimates, provider usage and distinct active worker IDs. It also refuses unreported or malformed Simpul usage when a ledger is attached, rather than silently settling it as zero. Adversarial tests cover negative/nonfinite/coerced quantities and arithmetic overflow. This is a post-run settlement check; it does **not** impose a provider-side spending cap or confer Simpul LIVE PASS. PR #47 merged as `77c1d583` after its exact final head passed 9/9 CI jobs (run 40270476537). No new native-host acceptance is implied.

## MCP response privacy follow-up (PR #48)

The source adapter now bounds legacy direct-object and structured FastMCP responses to 64 KiB of UTF-8 JSON (as with text responses) and avoids reflecting untrusted MCP transport/submission error details. Negative tests cover oversized multibyte content, malformed results and credential-like error strings. PR #48 passed 9/9 final-head CI jobs (run 40270947152) and merged as dc96a79c; authenticated supervisor execution (issue #35) is still **LIVE BLOCKED**.

## Native runner cancellation and diagnostic integrity (PR #49, source-only)

The native subagent adapter refuses pre-aborted signals before host dispatch, removes per-run cancellation listeners after completion and absorbs rejected cooperative cancel requests without unhandled rejections. It also redacts host-returned status, execution, crash and cancellation error details. Tests exercise cancellation after completion, abort during wait and synthetic credential-like errors. No Windows process-tree or provider-side termination assertion follows from these tests; issue #37 remains LIVE PARTIAL.

## Fail-closed shared-write timeout fencing (PR #50)

If a shared-workspace write adapter times out but its invocation remains unsettled, the dispatcher now retains the write lock until that invocation actually settles. An acknowledged cancellation alone does not release the write fence. A stuck adapter may therefore block subsequent writes until supervisor recovery or process restart; this deliberate fail-closed tradeoff prevents falsely assuming writes have stopped. Source negative tests are not evidence of Windows descendant teardown or trusted host fencing.

## Integrated concurrency and operator handoff — 2026-10-26

PR #49 passed 9/9 final-head checks (run 40271504759), merged as a27b4db1. PR #50 passed 9/9 final-head checks (run 40272104829), merged as 2c2f0cea. PR #50 also treats a caller's isolatedWorktrees flag as unverified: all writes are serialized until trusted host isolation exists. These are source CI results, not native process ownership, arbitrary privileged write interception, Antigravity IDE enforcement, authenticated Simpul execution or provider billing acceptance.

A read-only Windows PowerShell handoff is provided at scripts/windows-acceptance-pack.ps1. It uses a unique temporary detached source worktree, verifies existing working tree status remains unchanged, and writes one redacted JSON report outside the project. No model call, hook install, supervisor execution, npm publication or new LIVE PASS occurs. The Windows CI exercises its current-source smoke mode. Issues #34–#37 still require native host evidence.

## Windows 5.1 preflight compatibility correction

The original PowerShell acceptance preflight could fail during an otherwise successful `git fetch` when Git progress on stderr was promoted to `NativeCommandError` under `ErrorActionPreference=Stop`. The source fix temporarily handles native Git stderr and validates its actual exit code, including owned-worktree cleanup. CI now tests the full detached-worktree path in Windows PowerShell 5.1. This only repairs prerequisite collection; issues #34–#37 retain their native acceptance statuses.

## RIG scope correction and local Windows evidence (2026-10-26)

The user ran the read-only Windows PowerShell 5.1 pack on `184e2d9abb73` successfully: `SOURCE_PREFLIGHT_PASS_LIVE_PENDING`, original checkout unchanged, Node v22.19.0. This is operator-provided source preflight output, not independently witnessed native host interception or permission enforcement. Subsequent RIG-native reports deliberately exclude the separate Simpul supervisor and provider billing hard-cap promises. Remaining host evidence gates are #34, #36, and #37; release draft [#52](https://github.com/rzqllh/xyeena/pull/52) remains unapproved for merge or publication.

## Preflight hook matching hardening (source-only)

`ops preflight` now treats registration as a **syntactic exact-match** of the managed Antigravity `PreToolUse` command and its single-event shape/timeout, rather than accepting unrelated commands that merely contain the runner filename or event string. Disabled groups/hook entries cannot be mistaken for enabled registration. Tampered/extra callbacks are reported as not exactly registered and require human review; the tool does not modify them. Even exact local registration is **not IDE interception evidence**; issue #34 stays LIVE BLOCKED.

## RIG-native read tool workspace containment (source-only)

The Antigravity `PreToolUse` source policy no longer automatically allows file/directory/search reads by tool name alone. When the host payload exposes the documented primary target (`AbsolutePath`, `DirectoryPath`, `SearchDirectory`, `SearchPath`), a target outside the canonical trusted workspace or through an escaping symlink returns `deny`; a verified in-workspace target may return `allow` without overriding native host restrictions. Missing/unrecognized or additional location fields return `force_ask` rather than silently expanding access. This is a **source policy**, not proof that Antigravity IDE 2.5.5 loads or enforces its hooks; #34 remains LIVE BLOCKED.

## Windows owned subprocess tree cleanup — source and CI only

Portable CLI and Antigravity Python SDK one-shot adapters now request Windows `taskkill.exe /PID <owned-child-pid> /T /F` for cancellation, timeout or output overflow. The PID comes **only** from the child process spawned by the adapter; no free-form PID or shell invocation is accepted. Non-Windows, missing PID, or failed taskkill paths fall back to direct-child kill. Tests cover synthetic owned PID validation and a controlled dummy child/grandchild on a GitHub Windows CI runner. The adapter still rejects cancellation immediately; the termination request is **best effort, asynchronous and not a completion receipt**. An arbitrary real provider CLI may have detached grandchildren and may continue remote billing; the owner's live Ctrl+C/host acceptance (#37) remains PENDING.

## Read-only managed hook runner integrity (source)

The RIG native preflight now reports `runnerIntegrity` (`MATCH`, `MODIFIED`, `UNOWNED`, `INVALID_MANIFEST`, or `MISSING_OR_UNTRUSTED`) and `probeEligible`. `MATCH` means the installed runner bytes match the locally stored owned-manifest SHA-256; it is **not** a signed host attestation. Merely finding the exact `PreToolUse` command or runner file is no longer enough for a positive probe eligibility hint. Any modified, unowned, oversize or symlinked runner is excluded. No auto-repair, remote call or native IDE acceptance occurs. Host enforcement remains `UNVERIFIED`.

## Final repository-side handoff — 2026-10-26

The consolidated [RIG-native acceptance handoff](xyeena-rig/NATIVE_ACCEPTANCE_HANDOFF.md) specifies a narrowly safe in-IDE deny test, separate native host requirements, and the human-only release boundary. It is a **plan for obtaining evidence**, not a new live PASS. The original Windows read-only preflight remains a source prerequisite; local-owned SHA-256 marker matching does not prove IDE hook execution.

**Source checkpoint verdict:** SOURCE_READY / LIVE_PENDING / RELEASE_NOT_AUTHORIZED. The native release gates are #34 (IDE), #36 (Codex/Claude/Gemini), and #37 (Hermes), with the separately optional Simpul integration #35 excluded from core gating. The draft [0.5.0 candidate PR #52](https://github.com/rzqllh/xyeena/pull/52) was based on an earlier source baseline and must be refreshed/audited if publication is later authorized. No tag, npm publish, or installation on the operator's machine has occurred.

## Enterprise publication pipeline hardening — source only

The npm publication workflow now requires an explicitly published stable GitHub Release with a `v<package-version>` tag pointing **exactly** to the current `main` SHA, a previously unpublished npm version, and the npm OIDC trusted-publishing path. Legacy main-push message triggers and long-lived npm token fallback have been removed. It declares a GitHub environment named `npm-publish`, but **the presence of an environment in workflow YAML does not prove that Settings → Environments has required reviewers configured**. Registry trusted-publisher configuration, required reviewers, tag protection, and human release authorization are external pending steps; no publish is being run. See [native and release handoff](xyeena-rig/NATIVE_ACCEPTANCE_HANDOFF.md).

## Fail-closed delegation eligibility and write serialization

Policy-only backend selection now requires positive, explicit execution readiness instead of treating absent readiness as true. External and native backends with incomplete probes remain unavailable; safe inline fallback continues. Parallel write eligibility is capped at one regardless of caller-asserted `isolatedWorktrees`; no independent host containment has been proven. Negative source tests cover both boundary cases. This is not native execution evidence or an acceptance closure for #34/#36/#37.

## Codex JSONL terminal-evidence hardening — 2026-10-27 (source only)

The portable Codex one-shot adapter previously accepted an `item.completed/agent_message` as an executed report when the child exited with OS status 0, even if no `turn.completed` followed. It now requires a successful terminal `turn.completed` **after** the final agent message, rejects interrupted/reordered/event-error streams and prevents earlier turn completions from certifying a new partial turn. Invalid, negative or overflowing token counts remain unavailable rather than becoming settled totals. Adversarial fixtures exercise all cases. This does **not** authenticate real Codex host execution or satisfy native issue #36; only actual host evidence can close it.

## Additional native write destinations (source-only)

The guided hook no longer treats an in-scope `TargetFile` as proof that additional path-bearing write parameters are safe. Explicit out-of-workspace alternate destinations are denied; ambiguous/multiple destinations require expanded native approval language. Adversarial tests exercise all three managed write tool types. No standalone IDE LIVE PASS is implied.

## One-shot provider result integrity (source-only)

Claude Code `--output-format json` now requires an explicit `type: result`, `subtype: success`, `is_error: false`, a nonempty final text and no nonempty `permission_denials`. A process exit code 0 alone is no longer accepted as complete evidence. Gemini rejects a nonempty `error` field and treats missing, negative, coerced or overflowing per-model token counters as **unknown**, not a fabricated settled zero. Claude usage counters likewise require safe nonnegative integers and no overflow. Hermes must return a nonempty final text and valid typed JSONL events. These checks require **actual native host compatibility evidence (#36/#37)** before declaring live acceptance; source mocks are not a live test.

## Hermes operator one-shot token ceiling observation — 2026-10-27

On native Windows, the operator ran a bounded Hermes one-shot through source RIG (`--max-turns 1`, `--token-limit 5000`, `--timeout-ms 45000`). The host response reached post-run accounting and the CLI rejected it with `Hermes one-shot token budget exceeded`, meaning Hermes reported a valid total above 5000 after a successful terminal result. The original CLI intentionally emitted no model output but did not show the safe numeric reported total; a source-only diagnostic improvement now includes the **Hermes-reported** token count and the configured post-run limit on rejection without exposing model text, private paths or credentials. No exact real count was retained from the earlier run. This is **not** a hard provider spend limit, a live cancellation test, or full Hermes acceptance; #37 remains LIVE PARTIAL. Do not automatically retry with a larger budget.
