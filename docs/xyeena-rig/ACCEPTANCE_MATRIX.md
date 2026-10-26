# Acceptance matrix

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

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
| A14 | Optional Simpul transport dispatch/cancel/timeout | CONTRACT PASS; OPTIONAL INTEGRATION — NOT A RIG RELEASE GATE | Upstream supervisor unavailable; opt-in transport cannot be claimed live-ready. RIG-native fallback does not depend on Simpul |
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


**Release blockers:** Antigravity CLI's narrowly tested authorization/deny has live evidence for A12/A25/A28, but IDE 2.5.5 interception and wider host authorization (A18/A31) are still blocked; final release authorization (A33), and unresolved material security risk remain. Optional Simpul integration (A14) is separately gated only if explicitly enabled and advertised; it is **not** required for RIG-native release.

## PR #47 source-only regression boundary

A26 gains negative input, numeric-overflow, and duplicate-worker identity regression cases for budget settlement. Simpul ledger reporting now fails closed when missing/malformed, without treating a provider-side spend cap as implemented. A14/A33 and native LIVE verdicts remain unchanged. PR #47 passed 9/9 CI jobs on its final branch HEAD (run 40270476537); no new live evidence. PR #48 adds bounded-MCP-result/privacy tests, subject to its own CI.

## PR #49 native lifecycle source regression

A15/A26/A28 gain explicit source-level regression cases for abort-before-worker-launch, in-flight cooperative cancellation, late-signal listener disposal and opaque host errors. These checks cannot demonstrate actual process-tree termination or native approval provenance. All previous LIVE statuses remain as documented; verify exact PR CI separately.

## P0 write timeout fence (PR #50)

A16/A27 add a negative regression for shared-workspace write serialization after timed-out adapter execution. On unresolved work, subsequent shared writes remain blocked deliberately. CI PASS for the exact PR head must be verified independently; native process termination remains unverified.

## Integrated source P0 validation and operator preflight

PR #50 final-head GitHub CI [40272104829](https://github.com/rzqllh/xyeena/actions/runs/40272104829) passed 9/9 checks. Unverified isolatedWorktrees caller flags no longer enable parallel writes; unresolved timed-out write adapters retain serialization. The Windows preflight is source-only; A14, A18, A25, A28 and A31 native-host limitations remain. A33 still needs authorized, separately versioned release candidate and provenance evidence.

## RIG-only host acceptance scope (2026-10-26)

Source `ops preflight` and the Windows acceptance JSON enumerate only native RIG host requirements (#34, #36, #37). A14/OPS-01/#35 document an **optional external adapter** and cannot block RIG-native release. Hermes native cancellation and user authorization remain in RIG scope; a separately operated provider billing hard cap is not a RIG-native capability claim. This scope correction does **not** turn any untested native host into LIVE PASS.

## Exact managed hook shape — new source regression

A12/A25/A28 source diagnostics now refuse to report managed PreToolUse registration for commands that only **mention** the runner, multiple command hooks or changed timeout. An enabled, exact local entry still reports `hostEnforcement: UNVERIFIED` and cannot independently satisfy the Antigravity IDE LIVE gate #34.

## Antigravity file read scope source regression

A12/A25/A28 gain fail-closed source tests for read-only Antigravity file/directory/search operations. An explicit out-of-workspace target is denied; missing or alternate host path schema receives `force_ask`; an in-workspace canonical target remains subject to the host's native permission rules. This only guards the **hook when invoked**, not the IDE's registration or invocation of the hook. Native IDE LIVE BLOCKED is unchanged.

## Windows process-tree source regression

A15/A18/A26 gain a Windows-specific owned subprocess tree termination request and controlled OS CI dummy-parent/descendant smoke. Successful dummy process termination is **source/CI smoke only**, not proof of Hermes real Ctrl+C/provider-session cancellation on the operator's Windows host. OPS-06/#37 and A31 remain PARTIAL/PENDING; no unconditional native PASS or billing cap claim.
