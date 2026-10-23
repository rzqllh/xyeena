# Requirements traceability

The identifiers R01–R15 name functional and operational contracts. Test execution and live host acceptance are reported separately; all requirements are **not** described as fully live-accepted.

| ID | Requirement | Phase | Evidence level |
| --- | --- | --- | --- |
| R01 | Inventory of host-installed skills/plugins and trust states | P01 | CI validated; host activation separate |
| R02 | Deterministic dependency closure and routing | P01 | CI validated |
| R03 | Single-governor Superpowers/Superior coordination | P02 | CI validated |
| R04 | Native fallback when optional providers are unavailable | P02 | CI validated; live paths pending |
| R05 | Scope, consent and Harness operation boundaries | P03 | CI validated; host interception pending |
| R06 | Authenticated Simpul worker lifecycle | P04 | Protocol validated; execution blocked |
| R07 | Host-native subagent lifecycle and isolation | P04 | Contract validated; live host pending |
| R08 | Adaptive executor and budget limits | P04 | CI validated |
| R09 | Durable DAG checkpoint and guarded recovery | P05 | CI validated |
| R10 | Independent evidence and per-action authorization | P03/P05 | CI validated; live host pending |
| R11 | Owner-aware legacy skill migration | P06 | CI validated |
| R12 | Backup, rollback and uninstall safety | P06 | CI validated |
| R13 | Live activation across five hosts | P07 | Fixtures validated; live pending |
| R14 | Adversarial/security negative testing | P07 | CI validated; live scope pending |
| R15 | Versioned, reviewed and authorized release | P08 | Candidate; publication pending |

Each requirement maps to detailed acceptance conditions in [ACCEPTANCE_MATRIX.md](ACCEPTANCE_MATRIX.md). Operational blockers and evidence owners live in [TASK_TRACKER.md](TASK_TRACKER.md).
