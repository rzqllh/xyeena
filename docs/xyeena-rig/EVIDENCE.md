# Validation and evidence

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

## Current reconciled evidence — 2026-10-26

The last verified integrated source checkpoint before this scope patch is [main `184e2d9`](https://github.com/rzqllh/xyeena/commit/184e2d9abb7385a670c22b53898a29cff7d6e769), including the PowerShell 5.1 fix (PR #53). PR #50 shared write fencing and rejection of caller-asserted worktree isolation passed 9/9 final-head CI ([run 40272104829](https://github.com/rzqllh/xyeena/actions/runs/40272104829)) before merging. PR #49 native cancellation and diagnostic hardening passed 9/9 final-head CI ([run 40271504759](https://github.com/rzqllh/xyeena/actions/runs/40271504759)) before merging. PR #48 bounded Simpul MCP results and sanitized external errors; its final branch head passed 9/9 CI ([run 40270947152](https://github.com/rzqllh/xyeena/actions/runs/40270947152)) before merging. PR #47 source budget-input hardening passed 9/9 final-head GitHub CI jobs ([run 40270476537](https://github.com/rzqllh/xyeena/actions/runs/40270476537)) before merging. PR [#44](https://github.com/rzqllh/xyeena/pull/44) (native worker diagnostic redaction) and PR [#45](https://github.com/rzqllh/xyeena/pull/45) (workspace write-lock queue cleanup) each passed **9/9** checks on their final PR head. Earlier CI result and live-acceptance history remain as separately dated records below; no new host acceptance is implied.

The **2026-10-26 native Antigravity CLI 1.4.7** session showed both an explicit Xyeena `force_ask` reason with human refusal and, separately, a host-enforced one-shot `deny` against harmless `git status --short`. The CLI returned the exact diagnostic error, the command produced no successful output, and the temporary probe was cleared. This closes **only the scoped CLI test**, not the general permissions boundary, native IDE support or other hosts.

Previous numeric test totals below (317, 321, 327), previous unmerged source hashes and earlier statements such as "CLI auto-deny pending" are **historical snapshots of the dates they were recorded**, not the current acceptance verdict. The current source's release baseline remains repo-recorded npm `0.4.1`; `0.5.0` has not been authorized/published.

## Recorded repository baseline (historical snapshot; not latest main)

- **Repository:** [rzqllh/xyeena](https://github.com/rzqllh/xyeena)
- **Integrated source baseline:** `main` at [`aade0a69242bea989101588953be781110372530`](https://github.com/rzqllh/xyeena/commit/aade0a69242bea989101588953be781110372530)
- **Automated CI:** [GitHub Actions run 39925231442](https://github.com/rzqllh/xyeena/actions/runs/39925231442) — successful Windows, macOS and Ubuntu checks on Node.js 22.14 and 24, plus package/SDK contract jobs.
- **Recorded post-merge local validation:** 317 tests passed; `npm ci`, `npm run check`, `npm run eval`, `npm run test:harness`, `npm run test:consumer` and `npm pack --dry-run` passed at the integrated baseline.
- **Published package:** `xyeena-agent@0.4.1`. Additional source features are unreleased.

These references document a historical passing commit; they do not assert that later changes have been independently validated. Consult CI on the current commit before approval.

## Verification classes

| Class | Recorded evidence | Limitation |
| --- | --- | --- |
| Code and contracts | Repository tests, skills manifests, Harness and adapter tests | Tests may use fixtures |
| Packaging | Tarball/consumer smoke | Not a new published npm version |
| Cross-platform | GitHub Actions jobs | Not a live IDE acceptance session |
| Optional Simpul bridge (separate project) | MCP adapter contract fixtures only | Excluded from RIG-native acceptance/release; no supervisor LIVE PASS claimed |
| Host approvals and hooks | Boundary tests, fail-closed behavior | Live host interception and user-approval provenance still pending |

No new `0.5.0` tag or npm publication has been authorized. Never treat a model status message or file-size check as independent proof of acceptance.

## Additional live evidence

Each completed operational gate should record its environment, exact commit, host/tool version, test procedure, outcome, security limitations and sanitized evidence reference. See [Task tracker](TASK_TRACKER.md) and [Acceptance](ACCEPTANCE_MATRIX.md).

## OPS Live Acceptance Session — 2026-10-25 (Antigravity host)

**Session host:** Antigravity IDE (active, this agent session).
**Commit under test:** `ee12a6b` (origin/main — docs cleanup, 4 commits ahead of aade0a6).
**Isolated worktree:** `.tmp/ops-live-acceptance` (detached HEAD at ee12a6b).

### Baseline re-verification on ee12a6b

| Script | Result |
| --- | --- |
| `npm test` | **321 / 321 PASS** |
| `npm run check` | **PASS** (19 capabilities + runtime manifests) |
| `npm run eval` | **18 / 18 PASS** |
| `npm run test:harness` | **15 / 15 PASS** |
| `npm pack --dry-run` | **PASS** (236 files, 167.4 kB — reduced from 247 because retired docs were excluded) |

321 tests (4 new docs-surface tests vs 317 at P08 merge).

### OPS-02 — Antigravity live in-session task execution

Preview and gate APIs were invoked from an Antigravity session. A separate read-only in-session tool smoke is recorded below; neither proves that every IDE tool call is intercepted by Xyeena:

- **Governor:** `/xyeena-orchestrate` (detected, eligible).
- **Selected skills:** `["xyeena-orchestrate", "writing-skills"]` (state: VERIFY).
- **hostExecutionAvailable:** `true`.
- **Task:** `ops02-live-001` — "Verify Xyeena skill inventory", scope: `{readOnly: true, operationClass: "safe"}`.
- **Harness pre-tool gate:** `ALLOW` (rule: `core-safety`, actionType: `read`).
- **Inventory:** 43 skills detected, including 15 Superpowers (`dispatching-parallel-agents`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-superpowers`, `verification-before-completion`, `writing-plans`, etc.).
- **Preview field:** `LIVE_IN_SESSION` was self-recorded during a preflight-only session; it is **not** evidence of completed task execution. Historical artifact reclassified as `TASK_UNEXECUTED; REVIEW_REQUIRED`.
- **Evidence artifact:** `.tmp/ops-live-acceptance/sandbox-ops02/ops02-evidence.json`.
- **Status: LIVE_PARTIAL (live smoke passed; full native host acceptance pending)** — in-session API execution and skill resolution confirmed. Full native host acceptance requires independent verification of subagent dispatch, native IDE prompts, and multi-agent supervisor interception.

### OPS-07 — Harness security gate live tests

| Test | Operation | Decision | Evidence |
| --- | --- | --- | --- |
| Safe read (within workspace) | `read_file ./README.md` | ALLOW | `rule: core-safety, blocked: false` |
| Destructive write (outside workspace) | `write_file /etc/passwd` | DENY | `Workspace boundary violation: target is outside workspace root` |
| External connection | `http_request https://example.com` | DENY | `blocked: true` |
| Attacker-supplied approval callback | `createTrustedHostApprovalAuthority({ approvalBridge: () => ({approved:true}), hostBoundarySecret: "attacker" })` | BLOCKED | `ERR_HOST_BOUNDARY_UNAUTHENTICATED` |
| Missing env secret | `createTrustedHostApprovalAuthority` with no `XYEENA_HOST_BOUNDARY_SECRET` | BLOCKED | `ERR_HOST_BOUNDARY_UNAUTHENTICATED` |

Shell command returned ALLOW in observation-only mode (harness uninstalled in the test worktree).

**Status: CI_PASS; LIBRARY_GATE_TESTED; HOST_INTERCEPTION_PENDING.** The API boundary checks were invoked by the agent explicitly; they did not demonstrate automatic interception of the Antigravity host tools. Native host authorization and shell/tool interception still require observed host-side tests.

### OPS-06 — Hermes live detection, fix, and verified execution

- **Binary:** `<user-local-bin>/hermes.exe` (Windows path: `C:\Users\<user>\AppData\Local\hermes\bin\hermes.exe`) — version `v0.22.2+7.g16c5e85`.
- **Auth:** Authenticated provider session configured.
- **Root cause analysis:**
  1. Process launch: On Windows, `windowsVerbatimArguments: true` was inadvertently enabled on native `.exe` binaries whose path contained spaces (e.g. `C:\Users\Example User\...`). This prevented Node from quoting the path, causing Windows `CreateProcess` to split the path at the space and fail with exit code 1 (`<user-with-space>\AppData\Local\hermes\bin\hermes.exe is not a hermes command.`).
  2. Protocol parsing: In `stream-json` mode, Hermes CLI emits a trailing telemetry line (`session_id: <id>`) after JSON events. The JSONL parser attempted to parse this line as JSON, throwing `Hermes CLI returned invalid JSONL`.
- **Source fix & hardening:**
  - `src/portable-cli-adapter.mjs`: `portableLaunchPlan` explicitly sets `windowsVerbatimArguments: false` for native `.exe` executables, reserving `true` strictly for `cmd.exe` shims (`.cmd`/`.bat`).
  - `decodeResponse`: tolerates documented non-JSON trailing telemetry footers matching `/^session_id:\s*[A-Za-z0-9_.-]+$/` while strictly failing closed on any other unexpected non-JSON output.
  - Error event detection: detects structured error events (`event.type === 'error'`, `event.type === 'turn.failed'`) and fails closed even if subsequent result events exist.
  - Stderr sanitization: eliminates raw child stderr interpolation into thrown error messages; uses `classifyStderr()` allowlist returning only high-level diagnostic codes (`COMMAND_NOT_FOUND`, `AUTH_REQUIRED`, `RATE_LIMITED`) to prevent leaking auth tokens, passwords, or machine-specific file paths.
  - Adversarial regression tests added in `test/portable-cli-adapter.test.mjs` verifying strict parsing, error event rejection, and stderr leak prevention (327 tests total, all passing).
- **Live verification (Smoke):**
  - Command: `node ./bin/xyeena.mjs host run --runtime hermes --goal "Sebutkan nama proyek dan cabang git aktif" --yes`.
  - Exit code: 0.
  - Tokens: 75,361 total tokens recorded.
  - Model outcome: Factually identified project as `xyeena`, working directory `_active/xyeena`, active branch `ops/live-acceptance-evidence-2026-10-25`, and accurately declined shell execution.
- **Token Accounting & Budget Analysis:**
  - Reported usage: the Hermes terminal event was reported as `tokens.total = 75,361`. Whether this includes cache reads or represents the cumulative full host session was not independently confirmed from sanitized provider usage breakdown.
  - Cost explanation: a large system/tool context and multiple internal steps are possible contributors, but exact token categories, cache accounting and model behavior were not established by this acceptance evidence.
  - **Budget limitation:** `xyeena host run` constructs `createPortableHostAdapter` directly and does **not** connect this invocation to `ResourceBudgetLedger`. The ledger's default `tokenLimit = 200000` is not proof of a ceiling enforced on this Hermes invocation. Actual provider usage, cost and budget enforcement for the portable CLI remain unverified and require a separate acceptance test.
- **Status: LIVE_PARTIAL (live smoke passed; full native host acceptance pending)** — real model call executed, terminal `{type: "result", exit_code: 0}` event parsed, factual evidence returned and verified. Full native host acceptance requires multi-turn execution, tool invocation, interrupt/cancellation, and independent verification outside self-authored output.

### OPS-03, OPS-04, OPS-05 — Host CLI detection on this Windows device

Detection method: `Get-Command codex, claude, gemini -ErrorAction SilentlyContinue` and `where.exe codex; where.exe claude; where.exe gemini`. Global npm: `npm list -g --depth=0`. All returned empty.

- **OPS-03 (Codex):** LIVE_BLOCKED. No standalone `codex` CLI binary installed on host.
- **OPS-04 (Claude Code):** LIVE_BLOCKED. No `claude` binary.
- **OPS-05 (Gemini CLI):** LIVE_BLOCKED. No `gemini` binary.

Exact prerequisites: install `npm i -g @openai/codex` (OPS-03), `npm i -g @anthropic-ai/claude-code` (OPS-04), `npm i -g @google/generative-ai-cli` or equivalent (OPS-05), then authenticate.

### Historical OPS-01 — optional Simpul integration, NOT a RIG-native acceptance gate

SubagentBridge workspace access blocked by agent policy. No live MCP transport. Adapter code present in `src/live-backend.mjs`. Fallback chain (Simpul → native → inline) CI_PASS.

**Status: LIVE_BLOCKED.** Prerequisite: authorized and running Simpul MCP transport from `rzqllh/SubagentBridge`.

## Live Execution Closure Session — 2026-10-25

**Orchestrator:** `xyeena-orchestrate`  
**Host:** Antigravity IDE (active agent session)  
**Evaluated Branch:** `ops/live-acceptance-evidence-2026-10-25`  

### Evidence Correction (Task 1)
- Corrected `.tmp/ops-live-acceptance/sandbox-ops02/ops02-evidence.json`: historical record was previously misclassified as `VERIFIED` based on preview/preflight alone. Updated to `PREFLIGHT_PASS; TASK_UNEXECUTED` with `status: REVIEW_REQUIRED`.

### Real Antigravity In-Session Execution (Task 2)
- Task ID: `ops02-antigravity-live-read`
- Task input: "Audit repository license, public documentation links, and current head commit hash"
- Loaded orchestration instructions: `skills/xyeena-orchestrate/SKILL.md` loaded and verified.
- Real host tools invoked:
  1. `view_file` on `LICENSE`: verified MIT License, Copyright (c) 2026 Xyeena contributors.
  2. `run_command` with `git rev-parse HEAD`: verified commit `19e05fab98bec1f9a9cedd8138d17b6b6167a94d`.
  3. `view_file` on `README.md`: verified package description and reference links.
- Effective skills used: `xyeena-orchestrate`, `xyeena-verify`, `xyeena-debug`.
- Subagent delegation: Marked `PENDING` (no native subagent runner tool exposed in this agent session; no simulated execution).
- Task outcome: read-only `view_file` and `run_command` observations were checked for internal consistency in the same Antigravity session. No separate independent execution checker or full host tool-interception trace was supplied; full native acceptance remains pending.
- **Status: LIVE_PARTIAL (live smoke passed in-session; full native host acceptance pending)**.

### Harness Boundary Classification (Task 4)
- **Unit / API gates:** CI_PASS (automated tests in `test/rig-harness-lifecycle.test.mjs` and `test/security-hardening.test.mjs`).
- **Harness library API calls:** `preToolGate()` returned ALLOW for a read and DENY for out-of-scope writes/network calls when invoked directly from the IDE session. These results are **not** proof of automatic interception of actual IDE tool invocations.
- **Host-mediated approval:** The caller-created authority negative test produced `ERR_HOST_BOUNDARY_UNAUTHENTICATED` in the library. A real host approval dialog associated with a Xyeena-gated privileged action has not been independently demonstrated.
- **Transparent shell command interception:** LIVE_PENDING (requires project-level `xyeena guided install`).



## Source changes pending operational live validation

The code in the pending feature PR adds the opt-in Antigravity native `PreToolUse` hook and bounds Hermes CLI `--max-turns` with a configured reported-token settlement ceiling. CI tests cover simulated hook payloads, workspace write deny, symlink target rejection, fresh confirmation for shell, invalid payload fail-closed, and missing/oversized Hermes usage. These are contract tests, **not** an assertion that the user's actual Antigravity hook installation has been enabled or a guarantee that no Hermes tokens are spent beyond the ceiling. The commit must pass CI and be reviewed before these capabilities are considered integrated.

## OPS-07 native IDE negative observation — 2026-10-25 (Windows, Antigravity IDE 2.5.5)

- **Surface:** Antigravity IDE version 2.5.5, Windows 11 x64; real agent native `run_command` invocations.
- **Installed configuration:** workspace `.agents/hooks.json` contains `xyeena-rig-guided.PreToolUse` with `matcher: "*"`, `guided status` returned `installed=true`, `enabled=true`. The managed runner includes a documented `deny` outcome for out-of-workspace working directories.
- **First empirical test:** native `run_command` executed `git status --short` inside workspace with exit 0. No host permission dialog observed by the user.
- **Negative safety test:** native `run_command` executed PowerShell `Get-Location` with `Cwd` set to the **parent of the trusted workspace**; exit code 0 and output pointed to that parent. Expected Xyeena decision was `deny`. No Xyeena error or native prompt appeared.
- **Verdict:** **HOST_BOUNDARY_UNENFORCED_OBSERVED** for this live IDE session; **OPS-07 IDE LIVE_BLOCKED**. The evidence does not isolate whether hook dispatch was absent or the IDE discarded its decision. Test tools were read-only; no privileged mutation was attempted.
- **Documentation conflict:** [official lifecycle hooks](https://www.antigravity.google/docs/hooks) describe IDE support; [independent August 2026 forum reproduction](https://discuss.ai.google.dev/t/do-antigravity-ide-2-0-actually-execute-plugin-hooks-pretooluse-posttooluse-or-is-that-cli-only-right-now/176814) reports CLI callbacks operating while earlier IDE/desktop builds did not invoke them. Those earlier reports are corroboration, not an official limitation statement for v2.5.5.
- **Source follow-up (pending PR):** `guided status` reports filesystem installation separately from `hostEnforcement: UNVERIFIED`; an opt-in five-minute `guided probe` logs bounded callback receipt only. A receipt, unit tests, and running direct JavaScript are **not** acceptance evidence for native policy enforcement.
- **Safety:** until a host-enforced negative test is independently witnessed, Xyeena must never claim the IDE is protected by the hook or grant privileged capabilities based on its installation state.

## Antigravity CLI Windows native hook launch failure — 2026-10-25

- The user's native Antigravity CLI `/hooks` menu listed the workspace `xyeena-rig-guided` `PreToolUse` matcher. This proves host discovery, **not** callback execution or policy enforcement.
- A requested tool call with `Cwd` was rejected by the live CLI tool schema (`additional properties 'Cwd' not allowed`), so it never reached the hook.
- A subsequent valid tool call emitted `jsonhook__xyeena-rig-guided_PreToolUse_0_0` execution failure: Windows reported the quoted `"C:\Program Files\nodejs\node.exe"` token was not recognized. The hook process failed before it could return `deny` or `force_ask`. No claim is made that Node.js is absent from the user's machine.
- Pending feature PR replaces the Windows installed command with quote-free workspace-relative `node .xyeena/hooks/antigravity-guided.mjs EVENT`. Native CLI prompt/deny acceptance remains **LIVE_PENDING** until tested on a real `agy` session after a managed upgrade. `Cwd` mismatch is a host CLI schema compatibility difference and should not be retried in tests.

- **Later live CLI failure, 2026-10-25:** After quote-free hook command installation, native `agy` again aborted a `run_command` with `MODULE_NOT_FOUND` because it resolved `node .xyeena/hooks/antigravity-guided.mjs` relative to `<workspace>/.agents/` instead of workspace root, producing `<workspace>/.agents/.xyeena/hooks/antigravity-guided.mjs`. The script existed at `<workspace>/.xyeena/hooks/antigravity-guided.mjs`; this is a command-working-directory mismatch, not proof of a missing script or broken Node installation.
- **Updated correction (pending live acceptance):** Windows launcher is `node ../.xyeena/hooks/antigravity-guided.mjs EVENT`, with a regression executing the exact installed command from an actual `.agents` working directory, including paths under a directory containing spaces. This correction is not proof of live `agy` enforcement until the user retests in CLI.

## 2026-10-25 CLI /hooks configuration integrity conflict

- After disabling the global Coucou hook in `agy`, a read-only `git status --short` executed and reported a modified `.gitignore`. No Xyeena `force_ask` dialog was reported, but host activation is not proven and Xyeena's enabled state may have been changed by `/hooks`.
- An explicit `guided probe start --dir . --yes` failed with `Managed hook group was changed; refusing overwrite`. `guided probe status` then returned `NOT_STARTED`, as expected because no diagnostic window was ever created. The exact field changed in `hooks.json` has **not** been inspected; attributing it to the Coucou toggle would be speculative.
- Follow-up branch adds read-only status reporting for managed group drift and nested event-level enablement with no secret-bearing config values. Installer/probe start still refuse to overwrite or proceed on unreviewed modifications. Do not weaken integrity protections merely to force the probe.

## 2026-10-25 focused diagnosis — managed event drift

- User ran the new read-only `guided status` command at PR #29 commit `e72b223`. It returned `installed:true`, `enabled:true`, `managedIntegrity:MODIFIED`, `runnerIntegrity:MATCH`, `changedManagedFields:["SessionStart","PostInvocation"]`, `preToolUseRegistered:true`, `preToolUseEnabled:true`, `hostEnforcement:UNVERIFIED`, and `probe:NOT_STARTED`.
- These field-level results **do not reveal the modified values** or their author. In particular, we have not confirmed whether the `/hooks` menu, host migration, or another actor modified the group.
- Follow-up implementation permits a user-approved five-minute read-only callback probe when the **entire expected `PreToolUse` subtree**, its enablement, the owner manifest, and the installed runner's hash all match. Drift in unrelated event types is preserved; installer and uninstall integrity guards are **unchanged**. Extra or altered `PreToolUse` hooks continue to block probe start.
- Live callback and enforcement remain unverified until a new `agy` native test is observed; the new CLI behavior has CI coverage but must not be confused with host acceptance.

## OPS-07 native CLI callback observation — 2026-10-25

- **Host:** Windows 11, Antigravity CLI `agy 1.4.7`, workspace-local `xyeena-rig-guided` hook; global Coucou hook had been disabled for isolation.
- **Probe created:** `guided probe start --dir . --yes` returned `AWAITING_CALLBACK`, probe ID `f291d885-69e7-4f0a-a85d-40b188d61505`, expiring after five minutes.
- **Real native run:** immediately afterward, the user started `agy`, issued `git status --short`, and the agent executed the command successfully with output `M .gitignore`. The user did not report seeing a fresh native approval prompt.
- **Probe read-back:** `CALLBACK_OBSERVED_UNATTESTED`; `observation.toolName = run_command`, `observation.decision = force_ask`. This tightly corroborates actual CLI runner execution during the native tool call, but the record is **locally forgeable** and does not attest enforcement.
- **Observed distinction:** `CLI_CALLBACK_OBSERVED` (high confidence, corroborated temporal native test) is **not** `CLI_CONSENT_ENFORCED`. The tool visibly completed after a `force_ask` decision; no host-native approval step is evidenced in the transcript. No proof of native `deny` exists.
- **Output contract:** official [Hooks docs](https://www.antigravity.google/docs/hooks) explicitly specify `force_ask` as a supported `PreToolUse.decision` which prompts regardless of cached permissions, so no response-schema modification is justified by this observation.
- **Next unresolved confounder:** inspect only the current CLI `toolPermission` / `agentMode` settings and interactive approval preset before classifying this as a host enforcement defect. A community [Antigravity CLI hook implementation report](https://github.com/thomas-chong/agy-cli-jev-auto-mode) claims `always-proceed` can bypass `force_ask`; that is third-party evidence, **not confirmation** of this user's configuration. Any further safety acceptance requires a witnessed native prompt or controlled non-destructive deny with settings documented.
- **No privileged work allowed on hook trust alone**, and no change to user-owned `.gitignore`, Coucou state, native permissions or local secrets was made by this repository change.

## OPS-07 CLI fresh consent and user cancellation — 2026-10-26

- **Host/evidence:** screenshot of `agy 1.4.7` on Windows. Native `run_command` proposed `git status --short`. Approval UI explicitly displayed `Reason: Xyeena: review shell command; host sandbox and fresh user consent required` with `Yes`, `Yes and always allow`, and `No, cancel` choices.
- **User action and outcome:** user selected **No, cancel**. Subsequent screenshot shows `Ran (git status --short) failed`, `User declined the tool call`, and `Interrupted · What should Antigravity CLI do instead?`. Command was **not executed** in this attempt.
- **Acceptance:** real native `force_ask`-attributed approval UI and user-decline cancellation **OBSERVED / PASS for this attempt**. No claim about the host's behavior on all commands, automatic `deny`, or Antigravity IDE.
- **Confounder:** immediately preceding screenshots also show a **temporary project-level `asklist (1)` rule `command(git status)`**, added deliberately to test host-native permissions. Thus the test does not isolate the Xyeena hook as the sole source of prompting even though the modal contains Xyeena's specific reason. Need repeat after removing **only this temporary rule** (do not alter Shared/Global rules or Coucou configuration).
- **Clean isolation criterion:** after removing that Project Ask rule, submit a fresh native `run_command git status --short`, require explicit Xyeena reason and a prompt, select `No, cancel`, and observe cancellation. If confirmed, mark **CLI HOOK FORCE_ASK+USER CANCEL PASS (isolated)**; native IDE and hook's automatic `deny` remain separate.

## OPS-07 native CLI force_ask + user decline — isolated live attempt, 2026-10-26

- **Environment:** Antigravity CLI `agy 1.4.7` on Windows; workspace-local `xyeena-rig-guided` `PreToolUse`, matcher `*`, registered runner `node ../.xyeena/hooks/antigravity-guided.mjs PreToolUse`. Previously observed explicit callback `run_command → force_ask`.
- **Isolation procedure:** the user was instructed to delete only the temporary Project `asklist` rule `command(git status)` before repeating the controlled tool invocation. Their next screenshot captures this repeat, but **does not itself show the restored Project asklist(0)**. Treat the absence of the temporary Ask rule as **reported by sequence, not independently reverified**.
- **Native permission modal:** while the agent proposed read-only `git status --short`, the CLI displayed `Reason: Xyeena: review shell command; host sandbox and fresh user consent required` and offered `No, cancel`. This directly attributes the request to the Xyeena hook.
- **Actual user action:** user selected `4. No, cancel`; the resulting CLI screenshot shows `Ran (git status --short) failed`, `User declined the tool call`, and `Interrupted · What should Antigravity CLI do instead?`. No command output was returned for this attempt.
- **Verdict:** **CLI 1.4.7 REAL FORCE_ASK PROMPT + USER DENIAL ACCEPTED** for this scoped interaction (with temporary Ask-rule deletion not independently pictured). This is a **real native runtime observation**, distinct from local fixtures or a forged callback log.
- **Separate unresolved safety gates:** Xyeena-generated unconditional `deny` was **not** demonstrated on the CLI; Antigravity IDE 2.5.5 remains **LIVE_BLOCKED** for native interception. Avoid describing OPS-07 as universally complete. Do not execute actual out-of-scope file writes to probe denial.

## OPS-07 optional automatic deny acceptance harness — source PR (not live-tested)

- Proposed follow-up provides a five-minute one-shot `guided probe deny-start` that returns `deny` for an exact, read-only `git status --short` tool call. It does not attempt any out-of-workspace write or change host permissions.
- `PreToolUse` exact ownership/hash checks remain mandatory before arming; unrelated host config drift does not trigger an installer write. A denied callback is recorded locally without command arguments, but such a local record is not host attestation.
- Source/CI verification establishes only simulation of the documented native response contract. **Real `agy 1.4.7` acceptance must observe the host block the command and report the Xyeena diagnostic deny reason.** An accepted command is a failure. No claim about IDE support or general command sandboxing.

## Guarded runner-only update for OPS-07 negative acceptance

- The user has a legitimately drifted managed group (`SessionStart` removed; `PostInvocation` appeared) while `PreToolUse` remained exact and the installed runner matched its owner manifest. The installer correctly refused an unsafe overwrite.
- Follow-up PR adds read-only `guided runner-preview` and explicit `guided runner-upgrade --yes` to safely introduce the one-shot automatic-deny runner without resetting `.agents/hooks.json`. Requires exact enabled PreToolUse, untampered old runner, and a Git-ignored backup directory. Only the runner and its manifest script hash are updated.
- Still no native `agy` automatic-deny result. CLI auto-deny remains **PENDING** until a real native tool call is blocked and observed by the user.

## OPS-07 native CLI auto-deny live acceptance — 2026-10-26

**Environment:** Windows PowerShell workspace `xyeena`, Antigravity CLI `agy 1.4.7`, real `run_command` request. This is user-supplied native execution evidence, not a fixture.

**Upgrade evidence:** PR #30 isolated worktree source at `9933640`. `guided runner-preview` reported `changed:true` and `configPreserved:true`; `runner-upgrade --yes` returned `backupCreated:true` and `runnerIntegrity:MATCH`. Subsequent `guided status` showed `installed:true`, `enabled:true`, `managedIntegrity:MODIFIED` for unrelated `SessionStart`/`PostInvocation` drift, `runnerIntegrity:MATCH`, `preToolUseExact:true`, `preToolUseEnabled:true`, `probeEligible:true`. The user's trace does not include a binary diff of `.agents/hooks.json`, but the installer response states that its config was preserved.

**Probe:** `guided probe deny-start --dir . --yes` returned `AWAITING_CALLBACK`, `testMode:deny-safe-command`, probe ID `cff11e83-481a-406d-bd0c-78396f7bd842`, expiry `2026-10-26T01:31:09.062Z`. Within that window a new native CLI session was asked to call `run_command` with `git status --short` exactly once.

**Decisive host output:** `Ran (git status --short) failed` and `Encountered error in tool execution: tool call denied by pre-tool hook: Xyeena: native deny diagnostic blocked read-only git status`. The host returned no successful command output and explicitly attributed the cancellation to a pre-tool hook. This is independent host-visible corroboration beyond the forgeable local receipt.

**Probe read-back:** `CALLBACK_OBSERVED_UNATTESTED` with `toolName:run_command`, `decision:deny`, `testMode:deny-safe-command`. Subsequent `guided probe clear --dir . --yes` returned `cleared:true`. The probe's own `hostEnforcement:UNVERIFIED` remains deliberately unverified by software, because an on-disk receipt cannot authenticate CLI enforcement on its own. Human-reviewed acceptance is separate.

**Verdict:** **OPS-07 CLI 1.4.7 scoped native automatic deny LIVE PASS**, in addition to previously observed `force_ask` prompt and `No, cancel` live pass. The tested command is an exact, harmless, read-only tool call. This is **not** an OS sandbox, not proof of all-policy enforcement, not proof of real out-of-workspace write containment, and **not** acceptance of Antigravity IDE 2.5.5 (previously bypassed interception). No unapproved npm publication.

## OPS-01 Simpul FastMCP contract safety patch — source-only (2026-10-26)

- **Upstream source inspection:** `rzqllh/SubagentBridge/subagentbridge/server.py` declares `submit_goal(goal, workspace_path=None, model=None, execute=False)`. It does **not** accept `scope` or `permissions` arguments. The server also exposes a separate `execute_run`, but finding this source does not attest a deployed, supervised, safe worker lifecycle.
- **Prior local adapter discrepancy:** Xyeena sent extra `scope`/`permissions` fields and could treat caller flags `enforceWriteScope`/`supportsPermissionEnforcement` as sufficient for write-capable delegation. That was neither contract compatible nor a trusted authorization boundary.
- **Patch:** the adapter submits only exact signature fields, rejects all non-explicit-read-only scopes and attempted permissions overrides, and keeps `executionReady:false` even when `get_model_usage` succeeds. The adapter does **not** invoke `execute_run`. FastMCP structured/text outputs are size/type/error-checked; tests cover malformed results and forged permission flags.
- **Verdict:** engineering contract and negative tests only. **OPS-01 LIVE BLOCKED** until a real authenticated Simpul supervisor completes a bounded task with independent evidence and verified cancellation. No source-level test is counted as live worker acceptance.

## Latest public blockers — 2026-10-26

RIG-native live gates have distinct traceable GitHub issues: [#34 Antigravity IDE](https://github.com/rzqllh/xyeena/issues/34), [#36 Codex/Claude/Gemini CLI](https://github.com/rzqllh/xyeena/issues/36), and [#37 Hermes native cancellation/host authorization](https://github.com/rzqllh/xyeena/issues/37). Separately [#35 optional Simpul supervisor](https://github.com/rzqllh/xyeena/issues/35) has **no RIG-native release gate status**. These do **not** imply their requirements have been met. Repo-native source hardening is complete through PR #33; end-to-end host actions remain unavailable from CI.

## Host one-shot cancellation and SDK stream limits — source verification (2026-10-26)

- Portable Gemini/Hermes/Codex/Claude and Antigravity SDK adapters accept optional programmatic `AbortSignal`; pre-aborted work cannot spawn a child. In-flight abort returns a typed cancellation error and **requests direct-child termination**.
- Both adapters enforce total received byte ceilings rather than repeatedly accumulating unbounded strings. The SDK stderr byte ceiling had previously been unreachable due to truncation before counting; this is now covered with a negative test. Unexpected SDK worker-provided error text no longer enters exception messages.
- Unit tests model held processes, abort, large stdout/stderr and redaction; they do not attest process-tree teardown, Windows OS behavior, a real CLI Ctrl+C flow, or provider billing caps. **OPS-06 remains LIVE PARTIAL** ([#37](https://github.com/rzqllh/xyeena/issues/37)).

## CLI SIGINT/SIGTERM wiring — source-only, 2026-10-26

- `host run`, `sdk run` and `orchestrate run` now wrap actual native execution in a scoped `AbortController`, forward its signal through `executeOrchestration` and the one-shot adapters, and remove SIGINT/SIGTERM listeners after completion/failure.
- Unit tests validate abort propagation, pre-aborted rejection, listener cleanup and no self-reported `VERIFIED`. This does **not** attest native Ctrl+C behavior on the Windows target host or successful descendant process-tree shutdown; OPS-06 [#37](https://github.com/rzqllh/xyeena/issues/37) remains LIVE PARTIAL.

## Read-only operator preflight and real fixture subprocesses — CI only, 2026-10-26

- A new `ops preflight` source command inspects host command candidates, local hook metadata and unresolved acceptance issues without running CLI host tools, MCP, providers or hooks. The output removes workspace/user absolute paths and any raw hook commands or secrets.
- The read-only safety tests include missing, invalid, linked and oversized local manifests and verify no filesystem writes. Command presence remains distinct from actual host activation.
- Cross-platform `host run`/orchestration smoke tests use real native OS subprocesses that emit **simulated provider JSON**, testing invocation, stdin, output parsing, token settlement and failure handling without real AI accounts or calls. These fixtures do **not** close #34–#37.

## Reconciled source execution checkpoint — 2026-10-26

GitHub `main` source: [`c84f7c456f12ec71826c32e58088ddc85df54d49`](https://github.com/rzqllh/xyeena/commit/c84f7c456f12ec71826c32e58088ddc85df54d49) (after merged PRs #39–#42). Those four PR final source heads each passed 9/9 GitHub Actions jobs, with real native Windows/macOS/Linux process-spawn fixtures in #41 (simulated provider JSON only). Source-only cancellation and preflight functions in #39–#42 are not a live user-host acceptance test; all issue #34–#37 gates remain open until independent native observations.

## Source security/queue regressions — 2026-10-26

The final PR #44 commit added adversarial invalid worker ID tests to confirm that rejected identifiers carrying secret-like tokens or local paths do not appear in thrown error messages. The final PR #45 commit added regression cases for FIFO write-lock ownership, repeated release, a new acquisition after queue drainage, and independent workspace keys. **CI 9/9 per final head**; these remain source checks, not live host tests.

### PR #48 source-only scope

Simpul's structured/direct/text MCP payloads are bounded and untrusted transport/submission errors are redacted. Exact PR-head CI must be checked separately. This does not provide a connected authenticated supervisor, live cancellation, or independent evidence receipt.

### PR #49 source-only native cancellation

Negative tests address pre-aborted worker dispatch, listener cleanup, cooperative cancel rejection and error redaction. No live Windows native host or authenticated model call was made by this PR; exact final-head CI is required before source acceptance.

### PR #50 shared-write timeout regression

Source test simulates a still-running write whose cancel callback acknowledges before the actual write settles. A second shared write must not begin before settlement. This test is not real host/process-tree termination evidence; the exact PR CI must be checked before merge.

### Read-only Windows operator handoff (source script)

scripts/windows-acceptance-pack.ps1 creates a temporary source worktree and redacted preflight JSON outside the user checkout. It compares git-status snapshots. CI current-source mode performs an offline Windows smoke test without fetching, invoking model providers or treating hook inventory as native activation. The output verdict is SOURCE_PREFLIGHT_PASS_LIVE_PENDING, never LIVE PASS. Human-host approvals remain pending.

## Operator source-preflight result and scope reconciliation — 2026-10-26

The Windows PowerShell 5.1 acceptance pack running source `184e2d9abb73` returned `SOURCE_PREFLIGHT_PASS_LIVE_PENDING` with checkout unchanged. Its earlier JSON included a Simpul supervisor field despite the separate project's optional status. This is a **report-scope defect**, not evidence of working Simpul. The newer RIG preflight contract enumerates native host gates #34/#36/#37 only; tests assert the optional supervisor name/issue and billing-hard-cap claim are not included. Source checks cannot close these live gates.

## Exact native hook registration diagnostic — source regression

Adversarial fixtures now distinguish the intended single Antigravity `PreToolUse` command from a decoy shell echo containing its name, extra hook entries, mismatched timeout and disabled entries. Cross-platform canonical Windows and POSIX shapes are exercised without invoking any host tool. This prevents an incorrect **registration hint**, not a native host bypass. Antigravity IDE 2.5.5 remains LIVE BLOCKED until witnessed in-IDE denial.

## Antigravity native read path negative fixture — source only

The source `PreToolUse` handler previously returned `allow` for all read tools solely based on tool name; that could not establish trusted workspace containment. Regression fixtures now exercise read targets inside/outside the workspace, symlink escape, missing/invalid paths, unrecognized alternate location arguments, foreign workspace identity and the actual installed Node hook runner JSON contract. Any source PASS remains distinct from a witnessed native IDE host denial; #34 does not close from CI.

## Owned Windows child-tree cancellation — controlled CI only

A source helper now requests `taskkill.exe /PID <child.pid> /T /F` without a shell for Windows children created by RIG's portable or SDK adapter. Invariants: `child.pid` must be a positive bounded integer from the owned spawn handle; missing/invalid/exited PID never enters taskkill arguments, failure falls back to best-effort direct kill, and no untrusted diagnostics appear. Source negative fixtures exercise both adapters and mock failure modes; Windows CI additionally runs a disposable Node dummy parent/grandchild with a heartbeat and expects that heartbeat to stop. This smoke must not be confused with native Hermes cancellation, Ctrl+C host signal receipt or provider-billing proof on the operator's system. OPS-06/#37 stays LIVE PARTIAL.
