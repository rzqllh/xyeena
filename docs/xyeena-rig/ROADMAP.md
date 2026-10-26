# Capability roadmap

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

The eight engineering phases are integrated into `main`. Source implementation and automated verification are distinct from operational release acceptance.

| Phase | Requirements | Delivered capability | Acceptance state |
| --- | --- | --- | --- |
| P01 — Discovery | R01–R02 | Host skill/plugin inventory, provenance, collisions and dependency closure | CI validated |
| P02 — Routing | R03–R04 | Single governor, external skills arbitration and native fallback | CI validated |
| P03 — Harness | R05, R10 | Execution gates, scope checks, consent contracts and verifier interfaces | CI validated; scoped Antigravity CLI 1.4.7 native force_ask/deny PASS; IDE and other hosts pending/blocked |
| P04 — Delegation | R06–R08 | Native/inline worker contracts, readiness probing, budgets; separately optional Simpul adapter | Native/inline contracts CI validated; optional external supervisor not live-accepted |
| P05 — Recovery | R09–R10 | Checkpoints, guarded resume, concurrency control and bounded retries | CI validated |
| P06 — Packaging | R11–R12 | Compact install, legacy migration, managed backups and rollback | CI validated |
| P07 — Hardening | R13–R14 | Cross-platform tests, negative cases and multi-host fixtures | CI validated; scoped agy native negative/consent acceptance PASS; full multi-host acceptance pending |
| P08 — Release | R15 | Packaging and release-readiness documentation | Source after repo-recorded npm 0.4.1 is unreleased; 0.5.0 publication not authorized |

## Operational release gates

1. **Host acceptance:** exercise installation, reload, actual invocation, authorization and safe failure on each declared host. Track unsupported host capabilities explicitly.
2. **RIG-native delegation:** validate actual host-owned worker execution, authorization, cancellation and independent verification. A separate, opt-in Simpul supervisor is **not** a core release gate.
3. **Approval and interception:** verify host-sourced human approval and the actual interception boundary for privileged actions, or keep those actions disabled.
4. **Release qualification:** reconcile acceptance criteria, security review and package provenance for the exact release commit.
5. **Publication:** authorize a semantic version, tag/release and npm Trusted Publisher workflow only after preceding gates close.

Outstanding **RIG-native** live acceptance is tracked in [IDE #34](https://github.com/rzqllh/xyeena/issues/34), [other CLIs #36](https://github.com/rzqllh/xyeena/issues/36), and [Hermes #37](https://github.com/rzqllh/xyeena/issues/37). Optional cross-project Simpul interface [#35](https://github.com/rzqllh/xyeena/issues/35) is tracked separately and cannot block the native RIG release. No numeric completion percentage is assigned to pending live gates. See [Task tracker](TASK_TRACKER.md), [Acceptance](ACCEPTANCE_MATRIX.md) and [Validation](EVIDENCE.md).

## Source-to-operator checkpoint — 2026-10-26

PRs #47–#50 harden budget arithmetic, bounded Simpul response/error transport, native cancellation lifecycle, and conservative shared write serialization/fencing. The read-only PowerShell source preflight does not resolve native host acceptance issues #34–#37 or authorize npm 0.5.0 publication.

## Native acceptance operator handoff

The remaining native-host evidence gates and strict source-only release boundary are consolidated in [NATIVE_ACCEPTANCE_HANDOFF.md](NATIVE_ACCEPTANCE_HANDOFF.md). Simulator/source CI is not an IDE permissions sign-off. Optional Simpul integration is outside core release acceptance.
