# Validation and evidence

## Recorded repository baseline

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
| Simpul | MCP API contract tests | No accepted end-to-end supervisor execution |
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

### OPS-01 — Simpul

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
