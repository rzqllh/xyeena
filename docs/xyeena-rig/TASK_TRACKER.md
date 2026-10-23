# Operational task tracker

All eight engineering phases are present in `main` with automated checks. The remaining work concerns live integration and release evidence. States below describe acceptance, not implementation effort.

| ID | Priority | Deliverable | Current state | Completion evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | P0 | Real Simpul execution supervisor integration | BLOCKED | Authenticated submit → worker start → terminal result → cancellation/timeout and evidence |
| OPS-02 | P0 | Antigravity native host acceptance | LIVE PENDING | Reload, skill routing, user approval and real tool-interception observation |
| OPS-03 | P0 | Codex native host acceptance | LIVE PENDING | Skill activation, restricted execution and actual permission boundary |
| OPS-04 | P0 | Claude Code native host acceptance | LIVE PENDING | Host trust, skill invocation, restricted execution and recovery |
| OPS-05 | P0 | Gemini CLI native host acceptance | LIVE PENDING | Skill activation, Plan-mode contract and permission behavior |
| OPS-06 | P0 | Hermes native host acceptance | LIVE PENDING | Trusted workspace, selected skills, safe execution and cancellation |
| OPS-07 | P0 | Trusted host consent and tool interception | LIVE PENDING | Human approval provenance + blocked negative cases on each eligible runtime |
| OPS-08 | P1 | Acceptance and security review sign-off | PENDING | Exact commit and release-artifact evidence; unresolved findings addressed |
| OPS-09 | P1 | Release candidate and npm publication | NOT AUTHORIZED | Versioned immutable release, provenance, registry smoke and separate approval |

## Completion discipline

For each operational item, add the test environment, host version, dated evidence, acceptance verdict, and known limitations to [Validation](EVIDENCE.md) and update [Acceptance](ACCEPTANCE_MATRIX.md). Fixture tests cannot close a live task. Privileged actions must remain fail-closed until a verified host boundary is available.

Engineering coverage: [Requirements R01–R15](REQUIREMENTS_TRACEABILITY.md) and [Roadmap](ROADMAP.md).
