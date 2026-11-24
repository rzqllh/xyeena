# Veyra v1.0 — Qualification Evidence

**Status:** REVIEW_READY / STABLE_RELEASE_BLOCKED
**Current source qualification:** 2026-11-24, branch veyra-review

- Node regression: 84/84 PASS on GitHub Actions (45299915880).
- Platform matrix: 9/9 PASS for Ubuntu, macOS and Windows, Node 20/22/24.
- Runtime evidence: local signed command receipt journal with cross-process verification, expiry check, and restricted claim classification. This does not certify agent execution.
- Optional hooks: Gemini BeforeTool, Claude/Codex PreToolUse adapters and policy examples, not installed or activated automatically.
- Historical 8/8 integration harness checks do not count as native Gemini E2E. Gemini, Codex and Claude remain NOT_RUN in acceptable native host traces.
- Historical A/B/C comparative scores are RETRACTED. Local function scores only.
- Upstream: 21 pinned object presence checks reported from local cache, but file contents and archive correspondence have not been independently reproduced.
- Legal: Owner selected proprietary free-to-use distribution; formal third-party redistribution obligations are not independently closed.

See [release decision](RELEASE-GATE-DECISION.md) and [runtime contract](../docs/VEYRA-RUNTIME-CONTRACT.md).
