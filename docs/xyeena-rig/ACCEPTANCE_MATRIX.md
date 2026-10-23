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
| A12 | Core Harness automatically blocks forbidden write actions | HarnessExecutionGate pre-tool destructive & workspace boundary blocking | VERIFIED |
| A13 | Contextual Harness honors user project opt-in | inspectRigHarness physical guide detection & activation tests | VERIFIED |
| A14 | Simpul real health, dispatch, cancel, timeout | createSimpulMcpAdapter test suite with FastMCP candidate signatures | INTEGRATION_VERIFIED; LIVE BLOCKED (upstream supervisor pending) |
| A14a | Caller-supplied healthy adapter execution or inline fallback, no synthetic worker | test/live-backend.test.mjs | CI_PASS |
| A15 | Native worker health and execution verified | createNativeSubagentAdapter runner test suite (real runner IDs, no fabricated IDs) | INTEGRATION_VERIFIED |
| A16 | No uncontrolled nested delegation or unsafe parallel writes | noNestedDelegation enforcement & unisolated write serialization | CI_PASS |
| A17 | Task completion requires independent verification | Existing runner tests + postToolGate evidence checks | CI_PASS |
| A18 | Five hosts install/enable/reload successfully | Physical multi-device matrix | LIVE_PENDING |
| A19 | Windows/macOS/Linux Node 22+ matrix | GitHub Actions | CI_PASS |
| A20 | No implied merge, publish or trust change | Integration checks | CI_PASS |

| A21 | Effective per-host plugin/skill inventory with provenance and real trust/disabled status | Five host adapters + untrusted/disabled fixtures | INTEGRATION_VERIFIED |
| A22 | Deterministic capability matching, dedup, dependency closure and bounded context load | Collision/missing dependency/no-token scenarios | CI_PASS |
| A23 | Both Superpowers and Superior enabled without double lifecycle/governor/subagent | arbitrateWorkflow single governor & deduplication test suite | CI_PASS |
| A24 | Live native parity fallback covers none/one/both unavailable and trust failure cases | NATIVE_EQUIVALENCE & adaptiveFallback 8-case test suite | CI_PASS |
| A25 | Core Harness gates on every tool and delegated worker, contextual project opt-in | HarnessExecutionGate ancestor canonicalization & consumable token tests | CI_PASS |
| A26 | Enforced resource budget: token, cost, concurrency, cancellations and provider fallback | ResourceBudgetLedger upfront ceiling tests & safe adapter fallback | CI_PASS |
| A27 | Crash-safe DAG checkpoint/recovery and idempotent non-destructive resume | DurableCheckpointStore resume test suite & unconsumed result reclaiming | CI_PASS |
| A28 | Independently verifiable completion and native Allow Once/Deny/Answer Questions policy | HarnessExecutionGate single-use consumable token & interactive tests | CI_PASS |
| A29 | Owner-aware 19-skill migration retains compatible aliases, user edits and third-party skills | resolveSkillAlias, previewLegacyMigration & applyLegacyMigration test suites | CI_PASS |
| A30 | Automatic uninstaller and rollback reconstruct original state after faults | uninstallCompactSetup & rollbackLegacyMigration journal restore test suites | CI_PASS |
| A31 | Host-native activation and execution on five hosts (not filesystem presence alone) | Recorded five-host activation fixtures; physical device reloads remain BLOCKED | FIXTURE_PASS; LIVE_BLOCKED |
| A32 | Supply-chain, prompt-injection, plugin spoof, symlink, credential and race security suite | test/security-hardening.test.mjs automated negative and security suite | CI_PASS |
| A33 | Consumer npm release artifact/version/docs verifiable before authorized publication | npm pack/consumer smoke, release verdict CONDITIONAL GO, documentation synced | INTEGRATION_VERIFIED |

A12–A18 and A21–A33 (as applicable) are blocking integration/release gates before declaring enterprise-ready. Each R01–R15 is mapped in [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md).
