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
| OPS-06 | P0 | Hermes native host acceptance | LIVE PARTIAL; SOURCE CANCELLATION HARDENED | Hermes live one-shot smoke observed previously; source accepts AbortSignal and requests direct-child kill with bounded output, while max-turns and post-run token settlement remain. Actual descendant teardown, native Windows signal delivery and provider-side spend caps still need live verification (source CLI cancellation listeners now forward SIGINT/SIGTERM) ([issue #37](https://github.com/rzqllh/xyeena/issues/37)) |
| OPS-07 | P0 | Trusted host consent and tool interception | CLI 1.4.7 FORCE_ASK + USER CANCEL + SCOPED AUTO-DENY LIVE PASS; IDE 2.5.5 LIVE BLOCKED | Real native CLI force_ask modal showed Xyeena reason and honored user No/cancel. Separately, native `run_command git status --short` returned `tool call denied by pre-tool hook: Xyeena: native deny diagnostic blocked read-only git status` during time-limited exact-match probe; local receipt recorded deny and was cleared. Broad tool-policy/OS sandbox and IDE enforcement are NOT accepted ([issue #34](https://github.com/rzqllh/xyeena/issues/34)) |
| OPS-08 | P1 | Acceptance and security review sign-off | CONDITIONAL GO; CLI BOUNDARY PASS (SCOPED) | PRs #39–#42 final heads each passed 9/9 CI jobs (Windows, macOS, Linux, packaging and contracts), including real dummy-provider process smoke. Earlier live Windows agy 1.4.7 consent/cancel and safe auto-deny observed. Full IDE/multi-host native sign-off remains pending |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Repo-recorded published npm baseline 0.4.1; prior candidate's sha512/236-file evidence is historical and not provenance for current main. No 0.5.0 release or npm action without explicit human authorization |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).

## Final source hardening record — 2026-10-26

PR [#44](https://github.com/rzqllh/xyeena/pull/44) and PR [#45](https://github.com/rzqllh/xyeena/pull/45) were merged after 9/9 CI checks each. Worker-ID error redaction and workspace write-lock map cleanup are source fixes. The external acceptance blockers OPS-01/02/03/04/05/06/07 remain as listed; do not reclassify them on the strength of CI.

## Source P1 follow-up — PR #47

Budget-ledger input validation and fail-closed Simpul settlement address a source-integrity defect in OPS-06/accounting. Negative and malformed data regressions are covered by automated tests. This has no effect on the independent OPS-06 real provider/Windows cancellation gate or OPS-01 authenticated supervisor gate. PR #47 merged at `77c1d583` after 9/9 final-head CI PASS (run 40270476537).

## Adapter privacy follow-up — PR #48

A Simpul MCP response-shape and error-redaction hardening patch prevents oversized JSON objects and external transport secrets from crossing the adapter diagnostics boundary. Source regression tests are not proof of authenticated supervisor execution; OPS-01 stays LIVE BLOCKED.
