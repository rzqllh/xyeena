# Operational task tracker

All eight engineering phases are present in `main` with automated checks. The remaining work concerns live integration and release evidence. States below describe acceptance, not implementation effort.

| ID | Priority | Deliverable | Current state | Completion evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | P0 | Real Simpul execution supervisor integration | LIVE BLOCKED | No live MCP transport (`rzqllh/SubagentBridge`). Native/inline fallback verified. |
| OPS-02 | P0 | Antigravity native host acceptance | INTEGRATION VERIFIED; LIVE PENDING | In-session task execution under `xyeena-orchestrate` PASS; live reload pending separate UI session |
| OPS-03 | P0 | Codex native host acceptance | LIVE BLOCKED | Standalone `codex` CLI not installed on host |
| OPS-04 | P0 | Claude Code native host acceptance | LIVE BLOCKED | Standalone `claude` CLI not installed on host |
| OPS-05 | P0 | Gemini CLI native host acceptance | LIVE BLOCKED | Standalone `gemini` CLI not installed on host |
| OPS-06 | P0 | Hermes native host acceptance | INTEGRATION VERIFIED; LIVE PARTIAL | Hermes v0.22.2+7.g16c5e85 installed & authenticated; session spawned with stream-json; safe toolset result event limitation |
| OPS-07 | P0 | Trusted host consent and tool interception | CI PASS; LIVE PENDING | Safe/destructive/network rules verified live; authority injection fails closed; shell hook interception requires guided install |
| OPS-08 | P1 | Acceptance and security review sign-off | CONDITIONAL GO | 321/321 unit tests PASS, 19 caps PASS, 18/18 eval PASS, 15/15 harness PASS, packed consumer PASS |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Candidate ready (sha512 verified, 236 files); publication strictly requires explicit human authorization |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).
