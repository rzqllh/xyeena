# Acceptance matrix — enterprise Rig

Evidence status is separate from implementation status.

| ID | Requirement | Proof | State |
| --- | --- | --- | --- |
| A01 | Compact preview never writes | Compact setup test | CI PASS |
| A02 | One root entry, internal native modules readable | Fixture + host reload smoke | CI PASS; LIVE PENDING |
| A03 | Deduplicate shared Antigravity/Codex skill path | Compact setup test | CI PASS |
| A04 | Preserve existing third-party skill folders | Compact setup test | CI PASS |
| A05 | Refuse unowned or edited folders | Compact setup test | CI PASS |
| A06 | Upgrade requires explicit update and old snapshot backup | Compact setup test | CI PASS |
| A07 | Global changes constrained to selected home skill root | Compact setup test | CI PASS |
| A08 | No regression of legacy flat setup | Existing repository test suite | CI PASS |
| A09 | Compact root can initialize native orchestration | Compact setup test | CI PASS |
| A10 | Optional providers absent never block native | Enterprise policy test | CI PASS |
| A11 | Presence of similarly named skill does not imply plugin activation | Candidate-only contract | PARTIAL |
| A12 | Core Harness automatically blocks forbidden write actions | Live adapter failure injection | NOT IMPLEMENTED |
| A13 | Contextual Harness honors user project opt-in | Unit and live host cases | NOT IMPLEMENTED |
| A14 | Simpul real health, dispatch, cancel, timeout | Live MCP acceptance | NOT IMPLEMENTED |
| A14a | Caller-supplied healthy adapter execution or inline fallback, no synthetic worker | test/live-backend.test.mjs | CI PASS |
| A15 | Native worker health and execution verified | Native smoke | NOT IMPLEMENTED |
| A16 | No uncontrolled nested delegation or unsafe parallel writes | Adversarial tests | NOT IMPLEMENTED |
| A17 | Task completion requires independent verification | Existing runner tests + live | PARTIAL |
| A18 | Five hosts install/enable/reload successfully | Device matrix | NOT RUN |
| A19 | Windows/macOS/Linux Node 22+ matrix | GitHub Actions | CI PASS |
| A20 | No implied merge, publish or trust change | Integration checks | CI PASS |

| A21 | Effective per-host plugin/skill inventory with provenance and real trust/disabled status | Five host adapters + untrusted/disabled fixtures | VERIFIED |
| A22 | Deterministic capability matching, dedup, dependency closure and bounded context load | Collision/missing dependency/no-token scenarios | VERIFIED |
| A23 | Both Superpowers and Superior enabled without double lifecycle/governor/subagent | arbitrateWorkflow single governor & deduplication test suite | VERIFIED |
| A24 | Live native parity fallback covers none/one/both unavailable and trust failure cases | NATIVE_EQUIVALENCE & adaptiveFallback 8-case test suite | VERIFIED |
| A25 | Core Harness gates on every tool and delegated worker, contextual project opt-in | Blocked-write/disabled-guides live failure injection | NOT IMPLEMENTED |
| A26 | Enforced resource budget: token, cost, concurrency, cancellations and provider fallback | Controlled budget exhaustion/usage ledger tests | NOT IMPLEMENTED |
| A27 | Crash-safe DAG checkpoint/recovery and idempotent non-destructive resume | Killed worker, repeated request, interrupted write tests | NOT IMPLEMENTED |
| A28 | Independently verifiable completion and native Allow Once/Deny/Answer Questions policy | Real host permission fixtures and reviewer separation | PARTIAL — adapter policy only |
| A29 | Owner-aware 19-skill migration retains compatible aliases, user edits and third-party skills | Old version upgraded on five real hosts | NOT IMPLEMENTED |
| A30 | Automatic uninstaller and rollback reconstruct original state after faults | Multi-target failure/restart/tampering tests | NOT IMPLEMENTED |
| A31 | Host-native activation and execution on five hosts (not filesystem presence alone) | Recorded five-host acceptance packet | NOT RUN |
| A32 | Supply-chain, prompt-injection, plugin spoof, symlink, credential and race security suite | Automated negative suite + independent security review | NOT COMPLETE |
| A33 | Consumer npm release artifact/version/docs verifiable before authorized publication | npm pack/install smoke, release verdict, provenance | NOT IMPLEMENTED |

A12–A18 and A21–A33 (as applicable) are blocking integration/release gates before declaring enterprise-ready. Each R01–R15 is mapped in [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md).
