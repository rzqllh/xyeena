# Acceptance matrix

This matrix retains each acceptance ID individually for auditable traceability. **CI PASS** refers to source/contract tests; **LIVE PENDING** and **LIVE BLOCKED** indicate separate operational gates. The evidence record is [EVIDENCE.md](EVIDENCE.md).

| ID | Acceptance criterion | Status | Evidence / limitation |
| --- | --- | --- | --- |
| A01 | Compact preview never writes | CI PASS | Read-only fixture |
| A02 | One discoverable compact skill entry | CI PASS; LIVE PENDING | Native reload pending |
| A03 | Deduplicate shared host skill root | CI PASS | Installer fixture |
| A04 | Preserve third-party skill folders | CI PASS | Installer fixture |
| A05 | Reject unowned or modified targets | CI PASS | Tamper-negative test |
| A06 | Require explicit managed upgrade/backup | CI PASS | Upgrade tests |
| A07 | Constrain global installation to user root | CI PASS | Path safety fixtures |
| A08 | Keep legacy installation compatible | CI PASS | Consumer regression |
| A09 | Load compact governor reference | CI PASS | Workspace fixture |
| A10 | Native operation without optional providers | CI PASS | Fallback tests |
| A11 | Distinguish skill presence from activation | PARTIAL; LIVE VERIFIED | Antigravity session confirms skill discovery + in-session execution; plugin live reporting verified |
| A12 | Core Harness operation boundaries | CI PASS; LIVE BOUNDARY TESTED | Safe read (ALLOW), outside workspace write (DENY), external HTTP (DENY) verified live |
| A13 | Contextual project Harness opt-in | CI PASS | Guide selection tests |
| A14 | Simpul dispatch/cancel/timeout lifecycle | CONTRACT PASS; LIVE BLOCKED | Upstream supervisor unavailable; native fallback active |
| A14a | Verified adapter or safe inline fallback | CI PASS | Adapter tests |
| A15 | Native worker lifecycle and health | CONTRACT PASS; LIVE PENDING | Host-issued handles in live runtime pending |
| A16 | Bound recursion and shared writes | CI PASS | Concurrency fixtures |
| A17 | Independent verification before completion | CI PASS | Checker contract; real criteria vary |
| A18 | Five-host activation and reload | LIVE PARTIAL (2/5) | Antigravity verified in-session, Hermes executed live; Codex/Claude/Gemini blocked by missing binaries |
| A19 | Cross-platform Node and packaging CI | CI PASS | Windows, macOS, Linux source CI |
| A20 | Explicit merge/publish/trust permissions | CI PASS | Source safety tests |
| A21 | Host/plugin provenance and trust inventory | CI PASS; LIVE PENDING | Host state must be checked natively |
| A22 | Capability and dependency closure | CI PASS | Resolver tests |
| A23 | Single governor for optional providers | CI PASS | Arbitration fixtures |
| A24 | Native fallback across provider combinations | CI PASS; LIVE PENDING | Eight test scenarios; host acceptance pending |
| A25 | Per-tool Harness authorization/worker scope | CI PASS; LIVE BOUNDARY VERIFIED | Pre-tool gate verified live in sandbox; shell hook interception requires guided project install |
| A26 | Budget and concurrency enforcement | CI PASS | Ledger and dispatcher fixtures |
| A27 | Checkpoint and crash-safe recovery | CI PASS | Recovery/fencing tests |
| A28 | Consent and evidence boundary | CI PASS; LIVE AUTHORITY VERIFIED | Attacker approval injection blocked with ERR_HOST_BOUNDARY_UNAUTHENTICATED; env secret enforced |
| A29 | Ownership-aware legacy migration | CI PASS | Migration smoke tests |
| A30 | Uninstall and rollback integrity | CI PASS | Restore/fault tests |
| A31 | Real five-host integration acceptance | LIVE PARTIAL (2/5) | Antigravity + Hermes live on Windows host; 3 CLIs uninstalled |
| A32 | Security regression and adversarial suite | CI PASS | Not an independent penetration test |
| A33 | Release artifact/provenance and publication | CONDITIONAL GO | Package candidate verified (sha512, 236 files); v0.5.0 publication requires separate human authorization |


**Release blockers:** real host authorization/interception (A12/A18/A25/A28/A31), Simpul execution when advertised as a live backend (A14), final release authorization (A33), and any unresolved material security risk. Limited use can exclude Simpul, but must state that limitation.
