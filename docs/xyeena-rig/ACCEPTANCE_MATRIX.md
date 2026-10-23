# Acceptance matrix

Acceptance IDs A01–A33 (plus A14a) remain stable; related rows are grouped to keep this public-facing matrix readable. See the [requirements matrix](REQUIREMENTS_TRACEABILITY.md) and [validation record](EVIDENCE.md). A CI result is not a live-host verdict.

| Acceptance ID | Criterion | Status | Qualification |
| --- | --- | --- | --- |
| A01–A10 | Compact installer, ownership and native availability | CI PASS | File/contract tests |
| A11 | Skill presence is not native activation | PARTIAL | Live plugin state pending |
| A12–A13 | Harness core and contextual guide behavior | CI PASS; LIVE PENDING | Host tool interception not universal |
| A14 | Simpul dispatch, lifecycle and cancellation | CONTRACT PASS; LIVE BLOCKED | Upstream supervisor unavailable |
| A14a | Conditional adapter selection and inline fallback | CI PASS | Real live adapter still needed |
| A15–A17 | Native workers, isolation and independent task verification | CI PASS; LIVE PENDING | Host acceptance pending |
| A18 | Five-host reload and activation | LIVE PENDING | Configured host observations required |
| A19–A20 | Cross-platform CI and explicit external-action safety | CI PASS | Source validation only |
| A21–A24 | Provider discovery, dependency resolution and fallback | CI PASS; LIVE PENDING | Host plugin activation not proven |
| A25 | Per-action Harness interception and worker boundaries | CI PASS; LIVE PENDING | Native hooks not yet accepted everywhere |
| A26–A30 | Budget, recovery, consent, migration and rollback | CI PASS | Contract checks; exercise real host flows |
| A31 | Real five-host execution acceptance | LIVE PENDING | Physical/native runtime tests |
| A32 | Security negative tests | CI PASS | Not a penetration-test certification |
| A33 | Release artifact and approval | PENDING | Candidate only; npm 0.5.0 not published |

**Release blocking:** A14 (live Simpul where advertised), A18/A31 (native host acceptance), A25 (effective privileged-operation interception) and A33 (authorized publication), together with any unresolved material security findings. Restricted use may omit optional Simpul execution but must not claim it is operational.
