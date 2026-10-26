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
| A11 | Distinguish skill presence from activation | PARTIAL; LIVE SMOKE | Host skill inventory and read-only in-session task observed; native plugin activation telemetry not independently proven |
| A12 | Core Harness operation boundaries | CI PASS; CLI FORCE_ASK + SCOPED AUTO-DENY LIVE PASS; IDE LIVE BLOCKED | CLI 1.4.7 honored Xyeena reason for human consent and canceled on No; separately blocked native read-only git status command with exact Xyeena pre-tool deny reason. IDE 2.5.5 previously did not enforce interception |
| A13 | Contextual project Harness opt-in | CI PASS | Guide selection tests |
| A14 | Simpul dispatch/cancel/timeout lifecycle | CONTRACT PASS; LIVE BLOCKED | Upstream supervisor unavailable; native fallback active |
| A14a | Verified adapter or safe inline fallback | CI PASS | Adapter tests |
| A15 | Native worker lifecycle and health | CONTRACT PASS; LIVE PENDING | Host-issued handles in live runtime pending |
| A16 | Bound recursion and shared writes | CI PASS | Concurrency fixtures |
| A17 | Independent verification before completion | CI PASS | Checker contract; real criteria vary |
| A18 | Five-host activation and reload | LIVE PARTIAL (2/5 live smoke) | Antigravity and Hermes live smoke verified on Windows host; Codex/Claude/Gemini LIVE BLOCKED by missing binaries; full native host acceptance pending |
| A19 | Cross-platform Node and packaging CI | CI PASS | Windows, macOS, Linux source CI |
| A20 | Explicit merge/publish/trust permissions | CI PASS | Source safety tests |
| A21 | Host/plugin provenance and trust inventory | CI PASS; LIVE PENDING | Host state must be checked natively |
| A22 | Capability and dependency closure | CI PASS | Resolver tests |
| A23 | Single governor for optional providers | CI PASS | Arbitration fixtures |
| A24 | Native fallback across provider combinations | CI PASS; LIVE PENDING | Eight test scenarios; host acceptance pending |
| A25 | Per-tool Harness authorization/worker scope | CI PASS; CLI SCOPED FORCE_ASK/AUTO-DENY LIVE PASS; IDE LIVE BLOCKED | Native CLI confirmed Xyeena approval + cancellation, plus one exact-match read-only auto-deny without command execution. Arbitrary privileged tool paths, worker scopes and IDE enforcement remain unverified |
| A26 | Budget and concurrency enforcement | CI PASS | Ledger and dispatcher fixtures |
| A27 | Checkpoint and crash-safe recovery | CI PASS | Recovery/fencing tests |
| A28 | Consent and evidence boundary | CI PASS; CLI USER CANCEL + SCOPED AUTO-DENY LIVE PASS; IDE LIVE BLOCKED | Native CLI screenshot showed force_ask reason and No cancellation; separate native run blocked exact read-only command with Xyeena pre-tool deny reason. IDE enforcement remains blocked; forged receipt alone is not acceptance |
| A29 | Ownership-aware legacy migration | CI PASS | Migration smoke tests |
| A30 | Uninstall and rollback integrity | CI PASS | Restore/fault tests |
| A31 | Real five-host integration acceptance | LIVE PARTIAL (2/5 live smoke) | Antigravity + Hermes live smoke verified on Windows host; 3 CLIs uninstalled; full native host integration pending |
| A32 | Security regression and adversarial suite | CI PASS | Not an independent penetration test |
| A33 | Release artifact/provenance and publication | CONDITIONAL GO | Package candidate verified (sha512, 236 files); v0.5.0 publication requires separate human authorization |


**Release blockers:** real host authorization/interception (A12/A18/A25/A28/A31), Simpul execution when advertised as a live backend (A14), final release authorization (A33), and any unresolved material security risk. Limited use can exclude Simpul, but must state that limitation.
