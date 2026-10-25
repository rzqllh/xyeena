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

Executed within this Antigravity agent session using `src/orchestrator.mjs` API directly:

- **Governor:** `/xyeena-orchestrate` (detected, eligible).
- **Selected skills:** `["xyeena-orchestrate", "writing-skills"]` (state: VERIFY).
- **hostExecutionAvailable:** `true`.
- **Task:** `ops02-live-001` — "Verify Xyeena skill inventory", scope: `{readOnly: true, operationClass: "safe"}`.
- **Harness pre-tool gate:** `ALLOW` (rule: `core-safety`, actionType: `read`).
- **Inventory:** 43 skills detected, including 15 Superpowers (`dispatching-parallel-agents`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-superpowers`, `verification-before-completion`, `writing-plans`, etc.).
- **verification:** `LIVE_IN_SESSION`.
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

**Status: CI_PASS; LIVE_BOUNDARY_VERIFIED. Boundary rules and authority injection attack fail closed — confirmed live in sandbox. Transparent host tool/shell interception: LIVE_PENDING (requires `xyeena guided install` in target project).**

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
  - Event accounting semantics: In Hermes CLI `--format stream-json`, `tokens.total` reports cumulative token consumption across all session steps (`input_tokens + output_tokens + cache_read_tokens`).
  - Underlying session execution: For goal `"Sebutkan nama proyek dan cabang git aktif"`, Hermes loaded system instructions and full tool schemas (~32k tokens), performed an inspection step, and synthesized the Indonesian response.
  - Budget enforcement: The 75,361 cumulative token count was evaluated against `ResourceBudgetLedger` in `src/live-backend.mjs` (default ceiling: 200,000 tokens) and verified to remain well within safe resource constraints.
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
- Independent verification: Criteria 1–5 satisfied, task completed with zero file mutations.
- **Status: LIVE_PARTIAL (live smoke passed in-session; full native host acceptance pending)**.

### Harness Boundary Classification (Task 4)
- **Unit / API gates:** CI_PASS (automated tests in `test/rig-harness-lifecycle.test.mjs` and `test/security-hardening.test.mjs`).
- **Antigravity host tool interception:** Tested live in-session. Safe workspace read ALLOW (`core-safety`), traversal outside root write DENIED (`Workspace boundary violation`), external HTTP DENIED (`blocked: true`).
- **Host-mediated human approval:** Host IDE dialog prompts active; attacker authority injection blocked with `ERR_HOST_BOUNDARY_UNAUTHENTICATED`.
- **Transparent shell command interception:** LIVE_PENDING (requires project-level `xyeena guided install`).


