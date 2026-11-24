# Veyra v1.0 — Host and Platform Verification (Corrected)

**Scope:** OS/Node CI validates code, not real AI agent sessions.

| Platform | Node versions | Evidence | Status |
| --- | --- | --- | --- |
| Ubuntu | 20, 22, 24 | GitHub Actions 45299915880 | CI_PASS |
| macOS | 20, 22, 24 | GitHub Actions 45299915880 | CI_PASS |
| Windows | 20, 22, 24 | GitHub Actions 45299915880 | CI_PASS |

84/84 Node tests passed on that commit.

| Agent host | Available evidence | Native E2E status |
| --- | --- | --- |
| Gemini / Antigravity | CLI version reported; 8/8 direct Node integration tests | NOT_RUN |
| Codex CLI | No authentic native session tool trace | NOT_RUN |
| Claude Code | No authentic native session tool trace | NOT_RUN |

A real host PASS requires an agent prompt and recorded tool-use/tool-result events from the host itself. A version check, function import, synthetic receipt, or documentation assertion does not count.

**Release:** REVIEW_READY / STABLE_RELEASE_BLOCKED. Signed local process receipts and opt-in hook adapter have passed Node tests; no native agent hook or end-to-end skill activation has been observed. Historical A/B/C percentages remain retracted.

See qualification/RELEASE-GATE-DECISION.md and qualification/LIVE-HOST-RUNBOOK.md.
