# Operational task tracker

All eight engineering phases are present in `main` with automated checks. The remaining work concerns live integration and release evidence. States below describe acceptance, not implementation effort.

| ID | Priority | Deliverable | Current state | Completion evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | P0 | Real Simpul execution supervisor integration | LIVE BLOCKED | No live MCP transport (`rzqllh/SubagentBridge`). Native/inline fallback verified. |
| OPS-02 | P0 | Antigravity native host acceptance | LIVE ACCEPTED | Real read-only task `ops02-antigravity-live-read` executed under `xyeena-orchestrate` using host tools; independent verification PASS; subagent delegation PENDING |
| OPS-03 | P0 | Codex native host acceptance | LIVE BLOCKED | Standalone `codex` CLI not installed on host |
| OPS-04 | P0 | Claude Code native host acceptance | LIVE BLOCKED | Standalone `claude` CLI not installed on host |
| OPS-05 | P0 | Gemini CLI native host acceptance | LIVE BLOCKED | Standalone `gemini` CLI not installed on host |
| OPS-06 | P0 | Hermes native host acceptance | LIVE ACCEPTED | Root cause fixed (Windows path space + trailing telemetry); live model execution completed (exit 0, 75k tokens, factual output) |
| OPS-07 | P0 | Trusted host consent and tool interception | CI PASS; LIVE BOUNDARY TESTED | Safe/destructive/network rules verified live; authority injection fails closed; shell hook interception requires guided install |
| OPS-08 | P1 | Acceptance and security review sign-off | CONDITIONAL GO | 323/323 unit tests PASS, 19 caps PASS, 18/18 eval PASS, 15/15 harness PASS, packed consumer PASS, OPS-02 & OPS-06 live accepted |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Candidate ready (sha512 verified, 236 files); publication strictly requires explicit human authorization |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).
