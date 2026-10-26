# Operational task tracker

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

All eight engineering phases are present in `main` with automated checks. The remaining work concerns live integration and release evidence. States below describe acceptance, not implementation effort.

| ID | Priority | Deliverable | Current state | Completion evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | P0 | Real Simpul execution supervisor integration | LIVE BLOCKED; SOURCE CONTRACT HARDENED | Adapter now follows upstream submit_goal schema with read-only-only submission, bounded MCP result handling and no user-asserted write authorization. A real authenticated supervisor dispatch, completion, cancellation and independent evidence are still absent; native/inline fallback retained |
| OPS-02 | P0 | Antigravity native host acceptance | LIVE PARTIAL | In-session read-only task `ops02-antigravity-live-read` executed under `xyeena-orchestrate`; live smoke PASS; native subagent delegation and independent host gate PENDING |
| OPS-03 | P0 | Codex native host acceptance | LIVE BLOCKED | Standalone `codex` CLI not installed on host |
| OPS-04 | P0 | Claude Code native host acceptance | LIVE BLOCKED | Standalone `claude` CLI not installed on host |
| OPS-05 | P0 | Gemini CLI native host acceptance | LIVE BLOCKED | Standalone `gemini` CLI not installed on host |
| OPS-06 | P0 | Hermes native host acceptance | LIVE PARTIAL; SOURCE CANCELLATION HARDENED | Hermes live one-shot smoke observed previously; source accepts AbortSignal and requests direct-child kill with bounded output, while max-turns and post-run token settlement remain. Actual descendant teardown, CLI/operator cancel behavior and provider-side spend caps still need live verification ([issue #37](https://github.com/rzqllh/xyeena/issues/37)) |
| OPS-07 | P0 | Trusted host consent and tool interception | CLI 1.4.7 FORCE_ASK + USER CANCEL + SCOPED AUTO-DENY LIVE PASS; IDE 2.5.5 LIVE BLOCKED | Real native CLI force_ask modal showed Xyeena reason and honored user No/cancel. Separately, native `run_command git status --short` returned `tool call denied by pre-tool hook: Xyeena: native deny diagnostic blocked read-only git status` during time-limited exact-match probe; local receipt recorded deny and was cleared. Broad tool-policy/OS sandbox and IDE enforcement are NOT accepted ([issue #34](https://github.com/rzqllh/xyeena/issues/34)) |
| OPS-08 | P1 | Acceptance and security review sign-off | CONDITIONAL GO; CLI BOUNDARY PASS (SCOPED) | PR #30 final head passed 9/9 CI jobs across Windows, macOS, Linux, packaging and contracts. Earlier suites documented in dated evidence; live Windows agy 1.4.7 consent/cancel and safe auto-deny observed. Full multi-host and IDE sign-off remain pending |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Repo-recorded published npm baseline 0.4.1; prior candidate's sha512/236-file evidence is historical and not provenance for current main. No 0.5.0 release or npm action without explicit human authorization |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).
