# Capability roadmap

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

The eight engineering phases are integrated into `main`. Source implementation and automated verification are distinct from operational release acceptance.

| Phase | Requirements | Delivered capability | Acceptance state |
| --- | --- | --- | --- |
| P01 — Discovery | R01–R02 | Host skill/plugin inventory, provenance, collisions and dependency closure | CI validated |
| P02 — Routing | R03–R04 | Single governor, external skills arbitration and native fallback | CI validated |
| P03 — Harness | R05, R10 | Execution gates, scope checks, consent contracts and verifier interfaces | CI validated; scoped Antigravity CLI 1.4.7 native force_ask/deny PASS; IDE and other hosts pending/blocked |
| P04 — Delegation | R06–R08 | Simpul/native adapter contracts, readiness probing, resource budgets | CI validated; Simpul supervisor blocked |
| P05 — Recovery | R09–R10 | Checkpoints, guarded resume, concurrency control and bounded retries | CI validated |
| P06 — Packaging | R11–R12 | Compact install, legacy migration, managed backups and rollback | CI validated |
| P07 — Hardening | R13–R14 | Cross-platform tests, negative cases and multi-host fixtures | CI validated; scoped agy native negative/consent acceptance PASS; full multi-host acceptance pending |
| P08 — Release | R15 | Packaging and release-readiness documentation | Source after repo-recorded npm 0.4.1 is unreleased; 0.5.0 publication not authorized |

## Operational release gates

1. **Host acceptance:** exercise installation, reload, actual invocation, authorization and safe failure on each declared host. Track unsupported host capabilities explicitly.
2. **Simpul:** validate a deployed, authenticated supervisor that actually executes a task from submission through terminal status and cancellation; protocol-only coverage is insufficient.
3. **Approval and interception:** verify host-sourced human approval and the actual interception boundary for privileged actions, or keep those actions disabled.
4. **Release qualification:** reconcile acceptance criteria, security review and package provenance for the exact release commit.
5. **Publication:** authorize a semantic version, tag/release and npm Trusted Publisher workflow only after preceding gates close.

No numeric completion percentage is assigned to pending live gates. See [Task tracker](TASK_TRACKER.md), [Acceptance](ACCEPTANCE_MATRIX.md) and [Validation](EVIDENCE.md).
