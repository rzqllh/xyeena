# Acceptance matrix — enterprise Rig

Evidence status is separate from implementation status.

| ID | Requirement | Proof | State |
| --- | --- | --- | --- |
| A01 | Compact preview never writes | Compact setup test | PENDING CI |
| A02 | One root entry, internal native modules readable | Fixture + host reload smoke | PENDING CI/LIVE |
| A03 | Deduplicate shared Antigravity/Codex skill path | Compact setup test | PENDING CI |
| A04 | Preserve existing third-party skill folders | Compact setup test | PENDING CI |
| A05 | Refuse unowned or edited folders | Compact setup test | PENDING CI |
| A06 | Upgrade requires explicit update and old snapshot backup | Compact setup test | PENDING CI |
| A07 | Global changes constrained to selected home skill root | Compact setup test | PENDING CI |
| A08 | No regression of legacy flat setup | Existing repository test suite | PENDING CI |
| A09 | Compact root can initialize native orchestration | Compact setup test | PENDING CI |
| A10 | Optional providers absent never block native | Enterprise policy test | PENDING CI |
| A11 | Presence of similarly named skill does not imply plugin activation | Candidate-only contract | PARTIAL |
| A12 | Core Harness automatically blocks forbidden write actions | Live adapter failure injection | NOT IMPLEMENTED |
| A13 | Contextual Harness honors user project opt-in | Unit and live host cases | NOT IMPLEMENTED |
| A14 | Simpul real health, dispatch, cancel, timeout | Live MCP acceptance | NOT IMPLEMENTED |
| A14a | Caller-supplied healthy adapter execution or inline fallback, no synthetic worker | test/live-backend.test.mjs | PENDING CI |
| A15 | Native worker health and execution verified | Native smoke | NOT IMPLEMENTED |
| A16 | No uncontrolled nested delegation or unsafe parallel writes | Adversarial tests | NOT IMPLEMENTED |
| A17 | Task completion requires independent verification | Existing runner tests + live | PARTIAL |
| A18 | Five hosts install/enable/reload successfully | Device matrix | NOT RUN |
| A19 | Windows/macOS/Linux Node 22+ matrix | GitHub Actions | PENDING CI |
| A20 | No implied merge, publish or trust change | Integration checks | PENDING CI |

A12–A19 are blocking gates before declaring enterprise-ready.
