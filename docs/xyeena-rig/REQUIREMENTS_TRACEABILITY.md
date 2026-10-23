# Requirements traceability

The identifiers R01–R15 name functional and operational contracts. Test execution and live host acceptance are reported separately; all requirements are **not** described as fully live-accepted.

| ID | Requirement | Engineering tasks | Phase | Evidence level |
| --- | --- | --- | --- | --- |
| R01 | Inventory of host-installed skills/plugins and trust states | E02-03, E02-05 | P01 | CI validated; host activation separate |
| R02 | Deterministic dependency closure and routing | E02-04, E02-06 | P01 | CI validated |
| R03 | Single-governor Superpowers/Superior coordination | E02-02, E04-01, E04-02 | P02 | CI validated |
| R04 | Native fallback when optional providers are unavailable | E02-01, E04-03 | P02 | CI validated; live paths pending |
| R05 | Scope, consent and Harness operation boundaries | E05-01, E05-02, E05-03 | P03 | CI validated; host interception pending |
| R06 | Authenticated Simpul worker lifecycle | E06-02 | P04 | Protocol validated; execution blocked |
| R07 | Host-native subagent lifecycle and isolation | E06-03 | P04 | Contract validated; live host pending |
| R08 | Adaptive executor and budget limits | E06-01, E06-04, E06-05 | P04 | CI validated |
| R09 | Durable DAG checkpoint and guarded recovery | E07-02, E07-03 | P05 | CI validated |
| R10 | Independent evidence and per-action authorization | E07-01, E07-04 | P03/P05 | CI validated; live host pending |
| R11 | Owner-aware legacy skill migration | E01-04, E01-05 | P06 | CI validated |
| R12 | Backup, rollback and uninstall safety | E01-03, E01-06 | P06 | CI validated |
| R13 | Live activation across five hosts | E08-02 | P07 | Fixtures validated; live pending |
| R14 | Adversarial/security negative testing | E08-03 | P07 | CI validated; live scope pending |
| R15 | Versioned, reviewed and authorized release | E08-01, E08-04 | P08 | Candidate; publication pending |

Each requirement maps to detailed acceptance conditions in [ACCEPTANCE_MATRIX.md](ACCEPTANCE_MATRIX.md). Operational blockers and evidence owners live in [TASK_TRACKER.md](TASK_TRACKER.md).
