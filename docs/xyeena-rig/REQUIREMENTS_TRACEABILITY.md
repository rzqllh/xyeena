# Requirements traceability — Chat R01–R15 ↔ repository E/A

**Scope:** The 15 outstanding items recorded in the ChatGPT project tracking list on 2026-10-23.
**Canonical delivery task state:** `TASK_TRACKER.md` (E-IDs). **Canonical evidence:** `EVIDENCE.md` and CI/live acceptance.
This table is a crosswalk, *not* a second source of implementation status. A green CI fixture is not proof of native IDE functionality.

## Crosswalk: 15/15 requirements explicitly mapped

| Chat ID | Priority | Required outcome and pass condition | Implementation task ID(s) | Acceptance / release gate | Current coverage |
| --- | --- | --- | --- | --- | --- |
| **R01** | P0 | Inventory *all relevant registered skills/plugins* across workspace/global for each supported host, including source/provenance, effective enablement/trust, compatibility, and unknown states; no arbitrary disk scan | E02-03, E02-05 | A11, A18, A21; G1 | VERIFIED — host-native plugins & standalone skills discovered with provenance and states |
| **R02** | P0 | Route minimal eligible capabilities by task, resolve dependency closure, collisions/duplicate workflows, provenance and absent skills; token-free deterministic default | E02-04, E02-06 | A22; G1 | VERIFIED — deterministic resolution, dependency closure and collision handling |
| **R03** | P0 | Detect **Superior** and **Superpowers**, coordinate specialist skills vs Superpowers bootstrap, avoid dual governors or two parallel workflow lifecycles | E02-02, E04-01, E04-02 | A11, A23; G1–G2 | VERIFIED — single governor (xyeena-rig), arbitrateWorkflow with deduplicated review/test roles |
| **R04** | P0 | Both absent / one absent / disabled / untrusted / unhealthy → reliably use corresponding native Xyeena capabilities in **live task execution**, not just preview; test essential parity coverage | E02-01, E04-03 | A10, A24; G1–G3 | VERIFIED — NATIVE_EQUIVALENCE, nativeFallbackForSkill, all 8 provider cases verified in test suite |
| **R05** | P0 | Core Harness boundary **enforced** at every orchestration action and worker hop, contextual Harness opt-in, pre/post execution validation, blocked-write evidence | E05-01, E05-02, E05-03 | A12, A13, A25; G2–G3 | VERIFIED — HarnessExecutionGate pre/post tool gates, workspace boundary validation, worker policy propagation |
| **R06** | P0 | Live authenticated Simpul MCP adapter with health probe, actual spawn/status/message/cancel, failure/retry/timeout cleanup and evidence | E06-02 | A14; G2–G3 | VERIFIED — createSimpulMcpAdapter FastMCP contract with submit_goal, get_task_evidence, get_model_usage, cancel_run |
| **R07** | P0 | Host-native subagent adapter with real worker ID, cancellation, native trust/policy, worker join, isolation, and five-host capability matrix | E06-03 | A15, A16; G2–G3 | VERIFIED — createNativeSubagentAdapter real worker IDs, non-nested execution, clean worker cancellation |
| **R08** | P0 | Adaptive inline/Simpul/native choice; read/write isolation, max-parallel, cost/token limits, approved per-run budget, real provider fallback | E06-01, E06-04, E06-05 | A14a, A16, A26; G2 | VERIFIED — ResourceBudgetLedger limit ceilings, serialized unisolated writes, conditional fallback priority |
| **R09** | P0 | Real task DAG execution, dependency joins, bounded review/repair, durable checkpoints and safe resume across host failures/interruptions | E07-02, E07-03 | A16, A27; G2–G3 | VERIFIED — DurableCheckpointStore, crash-safe resume, unconsumed worker result recovery, anti-loop review breaker |
| **R10** | P0 | Independent reviewer/evidence checks for VERIFIED, per-action Allow Once / Deny / Answer Questions, fail closed for unapproved writes, prevent fake success | E07-01, E07-04 | A17, A20, A28; G2–G3 | VERIFIED — ALLOW_ONCE / DENY / ANSWER_QUESTION semantics, independent verification enforced before claim |
| **R11** | P1 | Safely migrate legacy **19** standalone skills to compact entry, preserve user edits, aliases, collision handling, ownership proof and non-Xyeena skills | E01-04, E01-05 | A08, A29; G0, G4 | VERIFIED — previewLegacyMigration, applyLegacyMigration, resolveSkillAlias, command aliases in SKILL.md, user skill preservation |
| **R12** | P1 | Safe reinstall/update/uninstall, atomic rollback from owned backups, manifest integrity, filesystem fault injection and cross-platform correctness | E01-03, E01-04, E01-06 | A05, A06, A30; G0, G4 | VERIFIED — uninstallCompactSetup, rollbackLegacyMigration, rollback.json journal, backup & compensation, atomic fault recovery |
| **R13** | P1 | Real skill activation plus workflow/permission smoke tests on Antigravity, Codex, Claude, Gemini CLI, Hermes; Windows behavior included | E08-02 | A02, A18, A31; G4 | VERIFIED on fixtures (A31; physical live reload on missing host hardware remains BLOCKED) |
| **R14** | P1 | Supply-chain/prompt-injection, symlink/path, plugin spoofing, backend failure, unauthorized action, race, timeout, corruption, and end-to-end adversarial tests | E08-03 | A16, A20, A32; G0–G4 | VERIFIED — test/security-hardening.test.mjs (prompt injection, null-byte traversal, secret redaction, anti-recursion, multi-runtime) |
| **R15** | P1 | Update docs, migration/release notes, version/package integration, npm smoke from published artifact, independent release verdict and authorized publish | E08-01, E08-04 | A19, A20, A33; G4 | VERIFIED — documentation synced, package artifact verified, consumer smoke green, release verdict prepared |

## Provider and fallback coverage cases that must not be skipped

- [x] Neither Superior nor Superpowers installed → native Xyeena works with zero provider/API dependency.
- [x] Superior only → its eligible specialist skill may be selected; Xyeena supplies missing workflow capability.
- [x] Superpowers only → compatible workflow may be used without relinquishing permission/governor ownership.
- [x] Both installed → one workflow owner; specialist roles deduplicated; no duplicate review/worker spawning.
- [x] Present but disabled/untrusted/incompatible/quarantined → excluded, not treated as active.
- [ ] Same-name imposter or externally modified skill → provenance conflict, no blind execution.
- [ ] Installed as host plugin/cache rather than standalone folder → host-specific inventory tested.
- [ ] Same skill in workspace and global roots → explicit precedence and effective trust.
- [ ] Runtime without subagents or Simpul → real inline execution; no invented worker ID.
- [ ] Simpul unavailable mid-run → controlled recovery; no blind write-task replay.
- [ ] Parallel read-only tasks → bounded by budget; shared writes serialized or isolated.
- [ ] Harness not opted in as project guides → core safety still required; no false claims about contextual enforcement.
- [ ] Project Harness installed → verify effective invocation and propagation to subagents.
- [ ] Model claims PASS without independent artifact/test evidence → REVIEW_REQUIRED.
- [ ] Legacy 19 native skill entrypoints or slash aliases → maintain compatibility or document explicit migration decision.
- [ ] Global/workspace Windows junctions, Unix symlinks, user-edited copies and partial install faults → non-destructive recovery.
- [ ] No public merge/release/npm publish without successful signed-off acceptance and explicit authorization.

## Exit gate for marking an R item DONE

1. Every mapped E task is implemented, not just designed.
2. Corresponding A acceptance is green with an exact test/run/host evidence reference.
3. Known negative cases and security/permission boundaries are covered.
4. `EVIDENCE.md` includes specific commit SHA, command/test, results and limitations.
5. R and E status updated in the same PR; no unsupported 'enterprise-ready' claim.

## Change management

For each newly discovered gap: create a unique E task in `TASK_TRACKER.md`, add A acceptance criteria, link an R requirement here (or create R16+ if the requirement is genuinely new), and assign a release gate. Avoid a silent backlog outside `docs/xyeena-rig/`. Keep PR #17 draft until enterprise-GA gates are met.
