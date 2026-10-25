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
- **Status: INTEGRATION_VERIFIED** — in-session API execution confirmed. The current Antigravity session is itself proof that the host loads and routes through xyeena-orchestrate.

### OPS-07 — Harness security gate live tests

| Test | Operation | Decision | Evidence |
| --- | --- | --- | --- |
| Safe read (within workspace) | `read_file ./README.md` | ALLOW | `rule: core-safety, blocked: false` |
| Destructive write (outside workspace) | `write_file /etc/passwd` | DENY | `Workspace boundary violation: target is outside workspace root` |
| External connection | `http_request https://example.com` | DENY | `blocked: true` |
| Attacker-supplied approval callback | `createTrustedHostApprovalAuthority({ approvalBridge: () => ({approved:true}), hostBoundarySecret: "attacker" })` | BLOCKED | `ERR_HOST_BOUNDARY_UNAUTHENTICATED` |
| Missing env secret | `createTrustedHostApprovalAuthority` with no `XYEENA_HOST_BOUNDARY_SECRET` | BLOCKED | `ERR_HOST_BOUNDARY_UNAUTHENTICATED` |

Shell command returned ALLOW (observation-only mode — harness not installed in test worktree). This is the documented `LIVE_PENDING` condition for live tool interception.

**Status: CI_PASS (automated). Boundary enforcement and authority injection attack both fail closed — confirmed live. Live shell-command interception: LIVE_PENDING (requires `xyeena guided install` in the target project).**

### OPS-06 — Hermes live detection and invocation

- **Binary:** `C:\Users\Hafizh Rizqullah\AppData\Local\hermes\bin\hermes.exe` — version `v0.22.2+7.g16c5e85`.
- **Auth:** Nous Portal logged in (exp 2026-10-25 15:16 WIB), OpenAI Codex OAuth logged in.
- **`host preview --runtime hermes`:** Ready, `requestedSkills: ["xyeena-orchestrate"]`, 47 skills detected.
- **`host run --runtime hermes --yes`:** Hermes session `20261025_143357_f4c3ff` spawned. Used `web_search` tool. Produced stream-json JSONL. No `{type:"result"}` event emitted under `--toolsets safe` (safe toolset excludes `skills_list` and `terminal` — by design).
- **Root cause:** Xyeena JSONL parser requires `{type:"result", exit_code:0}` termination event. Hermes `safe` toolset does not emit this. Adapter correctly raises an error instead of fabricating success.
- **Status: INTEGRATION_VERIFIED; LIVE_PARTIAL** — Hermes host confirmed installed and authenticated. CLI adapter and task dispatch functional. Final result event not received under safe toolset restriction.

### OPS-03, OPS-04, OPS-05 — Host CLI detection on this Windows device

Detection method: `Get-Command codex, claude, gemini -ErrorAction SilentlyContinue` and `where.exe codex; where.exe claude; where.exe gemini`. Global npm: `npm list -g --depth=0`. All returned empty.

- **OPS-03 (Codex):** LIVE_BLOCKED. No `codex` binary. Hermes has Codex OAuth but no standalone Codex CLI.
- **OPS-04 (Claude Code):** LIVE_BLOCKED. No `claude` binary.
- **OPS-05 (Gemini CLI):** LIVE_BLOCKED. No `gemini` binary.

Exact prerequisites: install `npm i -g @openai/codex` (OPS-03), `npm i -g @anthropic-ai/claude-code` (OPS-04), `npm i -g @google/generative-ai-cli` or equivalent (OPS-05), then authenticate.

### OPS-01 — Simpul

SubagentBridge workspace access blocked by agent policy. No live MCP transport. Adapter code present in `src/live-backend.mjs`. Fallback chain (Simpul → native → inline) CI_PASS.

**Status: LIVE_BLOCKED.** Prerequisite: authorized and running Simpul MCP transport from `rzqllh/SubagentBridge`.

