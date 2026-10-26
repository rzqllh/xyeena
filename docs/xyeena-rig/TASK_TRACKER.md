# Operational task tracker

All eight engineering phases are present in `main` with automated checks. The remaining work concerns live integration and release evidence. States below describe acceptance, not implementation effort.

| ID | Priority | Deliverable | Current state | Completion evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | P0 | Real Simpul execution supervisor integration | LIVE BLOCKED | No live MCP transport (`rzqllh/SubagentBridge`). Native/inline fallback verified. |
| OPS-02 | P0 | Antigravity native host acceptance | LIVE PARTIAL | In-session read-only task `ops02-antigravity-live-read` executed under `xyeena-orchestrate`; live smoke PASS; native subagent delegation and independent host gate PENDING |
| OPS-03 | P0 | Codex native host acceptance | LIVE BLOCKED | Standalone `codex` CLI not installed on host |
| OPS-04 | P0 | Claude Code native host acceptance | LIVE BLOCKED | Standalone `claude` CLI not installed on host |
| OPS-05 | P0 | Gemini CLI native host acceptance | LIVE BLOCKED | Standalone `gemini` CLI not installed on host |
| OPS-06 | P0 | Hermes native host acceptance | LIVE PARTIAL | Hermes live one-shot smoke observed previously; source now bounds tool turns and rejects reported usage above token limit post-run; native cancellation and provider-side hard spend remain pending |
| OPS-07 | P0 | Trusted host consent and tool interception | CLI 1.4.7 FORCE_ASK + USER CANCEL LIVE PASS; AUTO-DENY PENDING; IDE 2.5.5 LIVE BLOCKED | Real native CLI modal showed Xyeena force_ask reason; user selected No and tool failed with `User declined the tool call`. The temporary Project Ask rule was to be removed before repeat; absence not separately screenshot-verified. CLI automatic deny still untested; IDE hook was not enforced in prior live test |
| OPS-08 | P1 | Acceptance and security review sign-off | CONDITIONAL GO | 327/327 unit tests PASS (including adversarial parser/stderr tests), 19 caps PASS, 18/18 eval PASS, 15/15 harness PASS, packed consumer PASS; OPS-02 & OPS-06 live smoke verified |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Candidate ready (sha512 verified, 236 files); publication strictly requires explicit human authorization |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).
