# Xyeena Rig — Bugs & Refinement Register

**Updated:** 2026-11-07 (Asia/Jakarta). **Default baseline:** main@45b430b272dc6326206885326ab97752d8059a05. Candidate draft PR #70 (v0.5.0) is distinct and unpublished; npm v0.4.1 is the recorded published baseline.

**Status model:** LIVE_BLOCKED/PARTIAL requires exact native-host proof; CI_VERIFIED is source/fixture evidence only; PATCH_DRAFT unmerged; REGRESSION_WATCH is a safety invariant, not evidence of an active exploit; PROPOSED_REFINEMENT is optional. No permission for installation, hooks, extra agents, Simpul activation or npm publication arises from this document.

## P0 — Urgent

### RIG-P0-01 — Antigravity IDE 2.5.5 hook denial not enforced

- **Status:** LIVE_BLOCKED / NATIVE_OBSERVED.
- **Finding/evidence boundary:** Controlled harmless outside-workspace command ran despite a supposedly denying hook. CLI agy 1.4.7 native denial PASS is a separate surface.
- **Reference:** Issue #34: https://github.com/rzqllh/xyeena/issues/34.
- **DoD:** Re-test real IDE hook activation, native deny and consent; if unavailable, fail closed; never claim IDE safe from local hook metadata.

### RIG-P0-02 — Installed hooks, worktree isolation and approval strings do not prove sandboxing

- **Status:** SECURITY_GATE.
- **Finding/evidence boundary:** Host authority is external. A tool can ignore a hook, claimed isolatedWorktrees is not OS confinement, and worker self-approval is invalid.
- **Reference:** SECURITY.md and docs/STATUS.md.
- **DoD:** Independent host negative tests, hash-verified hook runner, no extra path destinations or privilege escalation; retain one governor.

### RIG-P0-03 — npm release environment and human approval not complete

- **Status:** RELEASE_GATE / EXTERNAL.
- **Finding/evidence boundary:** Publishing workflow is release-only, exact tag/main SHA, OIDC/trusted publisher with provenance, but GitHub reviewer and npm-side configs are externally owned.
- **Reference:** Publish workflow: https://github.com/rzqllh/xyeena/blob/main/.github/workflows/publish.yml.
- **DoD:** Verify protected environment/reviewers, registry version absence, exact package contents, then obtain explicit owner authorization before tag/release/publish.

## P1 — High

### RIG-P1-01 — Codex/Claude/Gemini native acceptance absent

- **Status:** LIVE_BLOCKED.
- **Finding/evidence boundary:** Issue #36 records standalone binaries unavailable/unusable on audited Windows host; fake subprocess tests are not native authorization/skill activation.
- **Reference:** Issue #36: https://github.com/rzqllh/xyeena/issues/36.
- **DoD:** Each host: version, trust state, bounded read-only run, native denial, terminal event, cancellation and independent evidence.

### RIG-P1-02 — Hermes Ctrl+C/timeout, real descendant teardown and permission proof

- **Status:** LIVE_PARTIAL.
- **Finding/evidence boundary:** AbortSignal and Windows dummy taskkill smoke are source/OS CI evidence only. Actual Hermes-owned child tree and provider cancellation not verified.
- **Reference:** Issue #37: https://github.com/rzqllh/xyeena/issues/37.
- **DoD:** Observe real Windows Hermes one-shot, cancel, authorization, no false completion and redacted logs. Provider billing hard cap remains operator-owned.

### RIG-P1-03 — v0.5.0 candidate PR #68 conflicts with cleaned main; replacement draft #70

- **Status:** PATCH_DRAFT / CI_VERIFIED.
- **Finding/evidence boundary:** PR #70 built on cleaned main, aligns package, lock, CLI, native plugin metadata; exact-head 9/9 CI PASS. Not merged or npm published.
- **Reference:** PRs #68 and #70: https://github.com/rzqllh/xyeena/pull/68 and https://github.com/rzqllh/xyeena/pull/70; CI https://github.com/rzqllh/xyeena/actions/runs/42319967927.
- **DoD:** Compare proposals, verify published 0.4.1 vs candidate 0.5.0, check pack/consumer, owner approves scope before merge/release.

### RIG-P1-04 — Single governor, delegation authority and worker identity cannot be spoofed

- **Status:** SECURITY_INVARIANT / REGRESSION_WATCH.
- **Finding/evidence boundary:** Source rejects executionReady != true, transport-only supervisor success, caller-asserted isolated worktrees, unsafe multiwriter; fake worker IDs and nested workers cannot authorize tasks.
- **Reference:** SECURITY.md, docs/ORCHESTRATION.md.
- **DoD:** Adversarial tests for forged approval, worker identity, scope, transport shapes, concurrent write isolation and timeouts.

### RIG-P1-05 — Multiple path-bearing tool arguments need explicit review

- **Status:** SECURITY_INVARIANT / REGRESSION_WATCH.
- **Finding/evidence boundary:** A native tool request can write/read multiple destinations; one-target path guards are insufficient. Source added multi-path protections but live host enforcement unverified.
- **Reference:** CHANGELOG.md and issue #34.
- **DoD:** Test multi-destination payloads, hidden/symlink paths, directory/search read targets and native callback actually denies.

### RIG-P1-06 — Shared write lock and process cancellation lifecycle

- **Status:** SECURITY_INVARIANT / REGRESSION_WATCH.
- **Finding/evidence boundary:** A timeout must not release write lock while adapter still alive. OS dummy process tree termination is not universal containment, failure cannot become PASS.
- **Reference:** CHANGELOG.md; issue #37.
- **DoD:** Crash/abort/concurrency, PID ownership and child cleanup regressions with strict no-success after cancellation.

### RIG-P1-07 — Simpul MCP supervisor authenticated worker still unverified

- **Status:** OPTIONAL_LIVE_BLOCKED / NOT_CORE_RELEASE_GATE.
- **Finding/evidence boundary:** Issue #35 is explicitly OPTIONAL; source schema safety, submit_goal PENDING or transport ping do not verify worker run.
- **Reference:** Issue #35: https://github.com/rzqllh/xyeena/issues/35.
- **DoD:** Only if opt-in: real supervised read-only goal, verified worker, terminal proof, cancellation and scope. No installation or activation by default.

### RIG-P1-08 — Token usage budget is settled after provider execution, not a spending hard cap

- **Status:** REGRESSION_WATCH.
- **Finding/evidence boundary:** Missing/malformed/negative/nonfinite totals must fail closed; no automatic retry with greater budget. Do not market ResourceBudgetLedger as provider-enforced billing prevention.
- **Reference:** Issue #37 and docs/STATUS.md.
- **DoD:** Test limits/overflow/duplicates, robust accounting, error/sanitization, separate operator billing settings.

### RIG-P1-09 — Native plugin host activation differs from installer copying files

- **Status:** RELEASE_GATE.
- **Finding/evidence boundary:** setup check reports inventory but not host load/permission intercept; skill paths differ for Antigravity, Codex, Gemini, Claude, Hermes.
- **Reference:** Issues #34 and #36.
- **DoD:** Per-host version, exact activation/trust, read-only positive/negative test, no Always Allow or foreign hook overwrite.

### RIG-P1-10 — OIDC trusted publisher, GitHub environment reviewers and fresh consumer install must be proven externally

- **Status:** RELEASE_GATE.
- **Finding/evidence boundary:** Workflow YAML alone not proof setting exists, and CI success on source not proof published artifact matches approved SHA.
- **Reference:** publish.yml and docs/STATUS.md.
- **DoD:** Verify vendor settings, immutable tag/main check, no long-lived token fallback, npm registry before/after authorized publication.

## P2 — Medium

### RIG-P2-01 — 9/9 cross-platform CI source success is not native-host acceptance

- **Status:** CI_VERIFIED / LIVE_OPEN.
- **Finding/evidence boundary:** Draft #70 passed Linux/Windows/macOS source jobs. Real IDE interception and actual host login remain blocked/partial.
- **Reference:** Run https://github.com/rzqllh/xyeena/actions/runs/42319967927.
- **DoD:** Keep source PASS separate from live BLOCKED; record independent exact-host evidence.

### RIG-P2-02 — Codex JSONL terminal and Claude/Gemini response shape validation

- **Status:** REGRESSION_WATCH.
- **Finding/evidence boundary:** Partial, reordered or denied terminal events and malformed token accounting must not become VERIFIED, even with process exit 0.
- **Reference:** CHANGELOG.md, docs/RUNTIME-ADAPTERS.md.
- **DoD:** Fixture negative JSONL/JSON, denied native tool and huge output.

### RIG-P2-03 — ops preflight installed runner hash versus real native enforcement

- **Status:** REGRESSION_WATCH.
- **Finding/evidence boundary:** SHA-256 hash and exact hook registration were hardened against tamper/extra hooks; no live IDE proof.
- **Reference:** Issue #34; docs/ANTIGRAVITY-GUIDED.md.
- **DoD:** Keep hostEnforcement UNVERIFIED until host-triggered negative test; verify tamper, symlink, disabled hook.

### RIG-P2-04 — Windows paths with spaces, symlinks, host-mutated hooks and uninstall

- **Status:** REGRESSION_WATCH.
- **Finding/evidence boundary:** Hook installer must preserve other user hook groups/config/ignore; paths on Windows need native process acceptance, not CLI-only string matching.
- **Reference:** docs/ANTIGRAVITY-GUIDED.md; docs/GLOBAL-INSTALL.md.
- **DoD:** Native workspace with spaces + preserved foreign hooks + rollback/ownership tests.

### RIG-P2-05 — npm v0.4.1 is published baseline, source contains unreleased changes, PR #70 says v0.5.0

- **Status:** DOC_RELEASE_DRIFT.
- **Finding/evidence boundary:** Using 'latest' CLI/install without registry check can misrepresent available features. Source version and docs should be labeled separately.
- **Reference:** docs/STATUS.md; PR #70.
- **DoD:** Keep published install pinned 0.4.1 until release approval, align all candidate metadata, verify registry.

### RIG-P2-06 — Simpul protocol cancellation/budget/source boundary only fixture verified

- **Status:** OPTIONAL_GAP.
- **Finding/evidence boundary:** Adapter must reject missing executionReady and malformed status and not leak supervisor error details; live worker unavailable.
- **Reference:** Issue #35.
- **DoD:** Optional, read-only native supervisor acceptance if operator enables; never promote to mandatory release gate.

### RIG-P2-07 — Packed npm consumer checks are not host permission checks

- **Status:** ACCEPTANCE_OPEN.
- **Finding/evidence boundary:** npm pack dry-run and CLI smoke validate bundle/tooling, not native plugin trust or host hooks. Installation changes local filesystem.
- **Reference:** docs/STATUS.md and package.json.
- **DoD:** Fresh sandboxed consumer install test + approval for actual host installation, preserving license and uninstall.

### RIG-P2-08 — Host stderr/error sanitization and stdout/stderr byte caps

- **Status:** SECURITY_INVARIANT.
- **Finding/evidence boundary:** Source hardening exists; new host errors can still include private paths/tokens and huge output.
- **Reference:** SECURITY.md; CHANGELOG.md.
- **DoD:** Adversarial secret-looking fixtures, stdout/stderr byte caps, no raw external error or false success.

### RIG-P2-09 — Avoid parallel governing workflows and duplicate review authority

- **Status:** GOVERNANCE.
- **Finding/evidence boundary:** Rig maintains one controller. Third-party skills may contribute selective methods, not independent governing approval or hooks.
- **Reference:** docs/ORCHESTRATION.md.
- **DoD:** Document arbitration, dedupe reviews, require owner approval for tool/hooks and new agent installations.

### RIG-P2-10 — Internal eval scores cannot substitute independent task verification

- **Status:** ACCEPTANCE_OPEN.
- **Finding/evidence boundary:** Agent preview/mock response can simulate completion, but a genuine task result needs external check and release evidence.
- **Reference:** docs/EVALS.md, docs/STATUS.md.
- **DoD:** Link input, executed check, code/ref SHA and independently observed outcome.

## P3 — Light

### RIG-P3-01 — Version help and setup UX distinguish published/source/installed

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** Xyeena branding vs xyeena-agent package, 0.4.1 baseline and unreleased 0.5.0 candidate must be clear.
- **Reference:** README.md and docs/STATUS.md.
- **DoD:** Expose three version fields, no 'latest release' before npm proof.

### RIG-P3-02 — Beginner installation dry-run and consent language

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** Scope global/workspace, copy vs symlink and host support differ. UI should not imply setup performs actual AI auth.
- **Reference:** docs/GETTING-STARTED.md, docs/GLOBAL-INSTALL.md.
- **DoD:** Readable dry-run preview and safe rollback, clear approvals, no hidden hook mutation.

### RIG-P3-03 — Retired internal docs must remain retired

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** Main documentation cleanup intentionally removed internal handoff material. Re-import from candidate PR would revive stale information.
- **Reference:** PR #70 and docs/STATUS.md.
- **DoD:** Keep active public links healthy; historical docs belong in Git history.

### RIG-P3-04 — Missing origin/main diff should not present full clean verification

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** HEAD fallback may miss committed change coverage; source has warnings and should preserve 'incomplete' signal.
- **Reference:** CHANGELOG.md.
- **DoD:** Expose diff base status and require real base before confident verification.

### RIG-P3-05 — Host acceptance/version matrix needs dates

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** Antigravity CLI 1.4.7 and IDE 2.5.5 are historical Oct observations; vendor updates can change behavior.
- **Reference:** docs/STATUS.md.
- **DoD:** Attach exact version/date/OS for each acceptance test; do not inherit as current.

### RIG-P3-06 — CI/docs status should be minimal and evidence-first

- **Status:** PROPOSED_REFINEMENT.
- **Finding/evidence boundary:** '9/9 PASS' refers to source checks only, not host safety. Owners need separate pending checklist.
- **Reference:** docs/STATUS.md; PR #70.
- **DoD:** Show SOURCE_PASS, NATIVE_BLOCKED/PARTIAL, EXTERNAL_PENDING, OWNER_APPROVAL prominently.

## Gate ownership

Mandatory native gates: [Antigravity IDE #34](https://github.com/rzqllh/xyeena/issues/34), [Codex/Claude/Gemini #36](https://github.com/rzqllh/xyeena/issues/36), [Hermes #37](https://github.com/rzqllh/xyeena/issues/37). [Simpul #35](https://github.com/rzqllh/xyeena/issues/35) is optional and must not block core Rig release. Source CI [9/9 successful](https://github.com/rzqllh/xyeena/actions/runs/42319967927) is not permission for tag, plugin install, deployment or publishing.
