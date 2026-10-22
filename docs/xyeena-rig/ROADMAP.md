# Roadmap — unified enterprise Rig

Baseline: main 91b2506a209bc645dc2b66603ab3b43dfb084e48, 2026-10-23.
Code present does not mean live validated.

| Phase | Outcome | Dependencies | Current |
| --- | --- | --- | --- |
| RIG-E00 | Repository-scoped design, risk, acceptance and evidence tracking | None | DONE |
| RIG-E01 | Opt-in compact setup, preserved legacy, managed backup upgrade | E00 | CODED; CI pending |
| RIG-E02 | Deterministic per-host skill discovery, router, native fallback | E00 | PARTIAL; compact path coded |
| RIG-E03 | Host-native plugin/extension enumeration, effective trust & disabled state | E02 | TODO |
| RIG-E04 | Superior/Superpowers workflow arbitration, single controller | E03 | TODO |
| RIG-E05 | Core + contextual Harness with real pre/post operation enforcement | E02 | PARTIAL, declarative only |
| RIG-E06 | Live Simpul and host-native subagent health, dispatch, cancellation | E05 | TODO |
| RIG-E07 | Task graph orchestration, cost budgets, isolation, evidence, recovery | E06 | PARTIAL (existing runner) |
| RIG-E08 | Automated migration/rollback, multi-host acceptance, release gate | E01-E07 | TODO |

## Required gates

- G0 — Scope: explicit runtime, workspace, consent, dry run and third-party preservation.
- G1 — Inventory: observed and enabled/trusted are distinct states; unknown stays unknown.
- G2 — Execution: verified adapter, capability and permission before real spawn or tool action.
- G3 — Verification: independent evidence, scoped tests, non-recursive repair.
- G4 — Release: all OS CI jobs, consumer smoke and real host activation accepted.

Do not accelerate E06 by generating synthetic worker identities, or E05 by equating policy metadata to an installed hook.
