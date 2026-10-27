# Changelog

- Clarify Hermes one-shot overage failures with sanitized numeric `Hermes-reported tokens` and the configured post-run acceptance limit. Explicitly identify settlement as *after* provider execution, not spend prevention. Contract + real dummy subprocess CLI tests assert no provider output or private session identifiers are disclosed; no additional native cancellation acceptance.

- Tighten provider result settlement: require explicit successful Claude Code JSON terminal envelope without permission denial, require nonempty Hermes/Gemini/Claude reports, and reject invalid/negative/overflowed Gemini/Claude token accounting rather than treating it as valid usage. CI fixture only; host compatibility requires native tests.

- Require explicit review of all path-bearing destinations in native Antigravity write payloads; deny additional outside-workspace destinations and avoid misleading single-target approvals. Source-level only.

- Fail closed on Codex JSONL partial or reordered turns: require a terminal `turn.completed` after the final agent message and ignore invalid/overflowing token totals. Regression tests cover successful OS exits without host-completion evidence; no native acceptance implied.

- Fail closed on backend delegation unless `executionReady === true`; never grant multi-writer selection from caller-asserted `isolatedWorktrees` (source policy + adversarial regression).

- Harden npm release pipeline: explicit stable GitHub Release only, exact current-main commit/tag/version check, no legacy commit-message publishing, no long-lived token fallback, official OIDC trusted publishing with provenance. External environment-reviewer and npm-side setup still required; no release performed.

- Close out repository-side source work with one RIG-only native acceptance handoff: safe IDE negative probe, unavailable standalone CLI hosts, Hermes live cancel boundary, and explicit human npm release authorization. This adds **no** new host PASS.

- Make `ops preflight` distinguish exact hook registration from owned installed runner SHA-256 integrity. Tamper, missing marker, oversize and symlink fixtures fail probe eligibility; no native-host enforcement claim.

- Windows one-shot adapter cancellation now requests `taskkill /PID <owned-child-pid> /T /F` on the spawned child process tree with strict PID validation, no shell and direct-child fallback; controlled dummy descendant CI smoke is **not** real provider/IDE LIVE acceptance.

- Harden Antigravity `PreToolUse`: read-only host tools no longer bypass workspace containment by name; explicit outside/symlink paths deny, ambiguous locations require fresh host approval. Includes adversarial source/installed-runner fixtures; no IDE native enforcement claim.

- Source-only Antigravity diagnostic hardening: exact canonical single-hook registration matching replaces filename substring checks; decoy commands, extra hooks and disabling are regression-tested. IDE native enforcement remains unverified.

- Scope correction: `ops preflight` and Windows evidence pack now report only RIG-native host gates (#34/#36/#37); optional Simpul supervisor readiness and provider-side billing caps are no longer mixed into core release acceptance. Tests assert machine-readable project/scope fields and no Simpul gate leakage. Core adapter behavior is unchanged.

All versions listed as released refer to published npm artifacts. Repository source changes are not published until a matching release is authorized.

## Unreleased — source after 0.4.1 (updated 2026-10-26)

- Fix source preflight on Windows PowerShell 5.1: normal Git fetch/worktree stderr progress no longer aborts the script under strict error preference. Add a real Windows legacy-shell Git fetch/worktree CI smoke; no live host permission acceptance is claimed.

- Add a Windows PowerShell read-only operator preflight and Windows CI smoke for redacted prerequisites, preserving user working trees without invoking AI, installing hooks or asserting native LIVE PASS. Source only; no npm release.

- Retain a shared-workspace write lock when cancellation/timeout occurs until the underlying adapter invocation settles. Cancel acknowledgements are not proof of stopped writes; a stuck adapter deliberately blocks subsequent writes rather than permit unsafe overlap (PR #50, source-only).

- Reject pre-aborted native worker execution, remove completed-run abort listeners, handle rejected cancellation promises and avoid echoing untrusted runner failure text (PR #49; cooperative, source-only cancellation).

- Bound all Simpul MCP result object forms to 64 KiB UTF-8 JSON and redact untrusted transport/submission errors (PR #48, source-only; does not demonstrate a live supervisor).

- Harden `ResourceBudgetLedger` against negative/non-finite/coerced provider usage, budget overflow and duplicate active worker IDs. With a ledger attached, Simpul now rejects missing/malformed accounting instead of treating it as zero usage. This is post-run accounting, **not** a provider-enforced spending cap. (PR #47 merged; source-only, not published to npm.)

- Added native Antigravity `PreToolUse` interception, fail-closed file/command decisions and explicit host-activation reporting. Windows Antigravity CLI 1.4.7 successfully showed native `force_ask` with user cancellation and a separate one-shot `deny` blocking a harmless command. **Antigravity IDE 2.5.5 remains LIVE BLOCKED** for hook enforcement.
- Repaired the Windows CLI hook launcher to resolve relative to `.agents/` without quoted paths. Added an opt-in five-minute callback diagnostic, exact-match single-use automatic-deny probe, and a backed-up runner-only upgrade that preserves host-mutated event configuration.
- Updated public status, runtime matrices, release gates and documentation consistency checks; CI is not a substitute for native host evidence. See [dated source/host status](docs/STATUS.md) and [OPS evidence](docs/xyeena-rig/EVIDENCE.md).
- **No `0.5.0` release, tag or npm publication has been authorized.** The npm `0.4.1` baseline recorded in this repository does not include unreleased source additions.

- Make `setup check --runtime antigravity` find the actual `agy` Antigravity CLI executable on PATH while preserving the separation from Antigravity IDE activation. Report detected command names only; executable presence does not prove hooks are invoked. Reject directory/nonexecutable false-positive hints.

- Correct Simpul FastMCP adapter to send only arguments accepted by upstream `submit_goal(goal, workspace_path, model, execute=False)`. Disallow write-capable or ambiguous scopes regardless of caller-authored permission flags; report submission-only status honestly and parse bounded SDK call-tool response wrappers without promoting transport health into execution readiness. Simpul live delegation remains BLOCKED.

- Add programmatic `AbortSignal` cancellation to portable CLI and Antigravity SDK one-shot adapters, checked before process start and during execution. Enforce actual received stdout/stderr byte ceilings and avoid surfacing arbitrary provider/worker error contents. Direct-child termination remains best effort and full descendant teardown still needs live Windows acceptance.

- Wire Ctrl+C/SIGINT and SIGTERM from source CLI `host run`, `sdk run` and `orchestrate run` (including `--record`) into the previously added one-shot AbortSignal handlers; remove signal listeners when each run ends. Native OS process-tree teardown is still unverified.

- Add source-only `ops preflight` read-only command to summarize redacted host executable hints, hook registration presence and pending native acceptance issues without invoking AI, MCP, or hook scripts. Reject linked/oversized hook files, and never infer activation from a configuration file.
- Expand cross-platform CLI fixture tests: real OS subprocesses emulate Gemini/Hermes JSON output and error/budget behavior without AI accounts or network. These do not close live host acceptance.

- Redact untrusted, malformed host-returned worker identity values from rejection messages, retaining strict format/placeholder checks; prevent secrets or private paths from being echoed to logs.

- Fix workspace write-lock queue tail cleanup to remove the correct map entry only when no newer waiter owns it; preserve FIFO and idempotent release. This avoids indefinite retention of released workspace keys during long-lived orchestration.

## Earlier unreleased implementation work

- Add opt-in compact skill installation, ownership-aware migration and restore workflows.
- Extend host skill/plugin discovery, dependency closure, provider arbitration and native fallback.
- Add guarded execution adapter interfaces, authorization and verification contracts, budget controls and durable task recovery.
- Include contract tests and cross-platform source validation while retaining separate live-acceptance gates for host interception and the Simpul supervisor.
- Consolidate maintained product documentation and release-readiness records; retire obsolete planning material.

## [0.4.1] - Installer status and routing corrections

- Global copy installation now verifies matching packaged skills for each selected AI host separately; reports real paths and counts without claiming native AI activation.
- Beginner wizard installs Global skills with Copy automatically; workspace setup offers Copy/Symlink. Explicit global symlink remains available for advanced CLI usage.
- Router no longer treats `suites` as the `ui` signal or `author` as `auth`; architecture refactoring prompts are recognized.
- Regression tests added for three-host global installation, partial/conflicting files, wizard simplification, and routing collisions.

## [0.4.0] - Global and symlink setup

- One-command beginner installation: location (global/workspace), host selection, preset, copy or symlink, final preview/consent.
- Global user skills installed into native per-host directories, without writing into the current workspace.
- Durable immutable skill snapshot in user-home store for workspace/global symlinks (Windows junctions); npx cache deletion does not break links.
- Conflict-safe upgrades of Xyeena-managed links, with backups; foreign symlinks and tampered store rejected.
- Workspace Harness remains opt-in and project-scoped. Global mode never pretends to activate Harness globally.
- Public README, CLI reference, Windows beginner and global/symlink guides updated.

## [0.3.0] - 2026-10-21

- Portable skill orchestration and per-host inventory for Antigravity, Codex, Claude Code, Gemini CLI and Hermes.
- Beginner setup wizard, Essential/Balanced/Complete presets, optional project Harness, backed-up upgrades, per-file diffs, rollback journal and host checks.
- Restricted one-shot adapters, guarded task routing and evidence-gated completion.
- All existing 19 Skills, 41 Harness guardrails and historical init commands preserved.

## 0.2.2 (2026-10-18): Antigravity Intelligent Guided hooks and task recovery

- **Antigravity Intelligent Guided hooks:** Workspace-scoped opt-in lifecycle hooks (`SessionStart`, `PreInvocation`, `PostToolUse`, `Stop`) for Antigravity IDE without daemons or background processes.
- **Smart task suggestion and explicit binding:** Session start discovers unfinished runs in the current workspace; explicit binding delivers a bounded task capsule once to that conversation.
- **Stop checkpoints:** Automatically records an INCOMPLETE checkpoint with Git revision and worktree digest when bound runs stop.
- **Failure loop detection:** Tracks consecutive tool failures by hash and provides diagnostic hints without persisting command arguments or raw errors.
- **Local privacy boundary:** All session binding and fingerprint state is isolated under `.xyeena/guided/` with a nested `.gitignore`.
- **CLI management:** Added `xyeena guided preview|install|status|list|resume|bind|unbind|uninstall` commands with safety backups in `.xyeena/backups/antigravity`.

## 0.2.1 (2026-10-15): Xyeena Rig branding and documentation

- Adopt **Xyeena Rig** as the developer-tooling product identity under the Xyeena parent brand ([PR #4](https://github.com/rzqllh/xyeena/pull/4)).
- Rebrand human-facing CLI/setup text, source plugin display labels and npm package description while preserving the package name `xyeena-agent`, CLI aliases, Skill IDs and installed file paths.
- Refresh public documentation with [Getting started](docs/GETTING-STARTED.md), [CLI reference](docs/CLI-REFERENCE.md) and reconciled release records.
- First Rig-branded npm release candidate: version `0.2.1` aligns npm, CLI, lockfile and native plugin manifest versions; historical `0.2.0` remains unchanged.
- Static landing page in `site/` with zero runtime dependencies, light/dark theme support, accessible contrast, and 1-click install command copy.
- Comprehensive non-TTY `--help` and `-h` support for all CLI subcommands (`init`, `doctor`, `harness`, `audit`) returning exit code 0.
- Maintained documentation, CLI references and release communications were updated.
- Website assets remain separate from the npm distribution tarball.
- Removed marketing buzzwords and unnecessary punctuation across public CLI wizard prompts and documentation.
- Clarified non-TTY error diagnostics in CLI selection to explicitly guide users toward `--guards` for CI Harness workflows.
- Linked capability-contract, orchestration, and runtime-adapters specifications in `docs/ARCHITECTURE.md`.


## 0.2.0: Skills + Harness upgrade

Xyeena remains **one npm package** (`xyeena-agent`) with two independently selectable components. This release makes Skills and Harness independently selectable through the same package.

### Added

- Interactive selection-first `init` wizard: Skills, Harness, or explicitly All; selection of runtimes, skills, and Harness guardrail groups before confirmation.
- 41 original Harness v3.1 guardrail documents across 11 categories, project profile/configuration templates, adapters and a bundled runnable verification engine.
- Zero-config Harness diagnostics and explicit `audit`, `scan`, `risk`, `changed`, `adapters`, and `verify` commands.
- Required skill dependencies are previewed before installation; incremental installations preserve the existing inventory.
- Vendored Harness regression tests and a packed npm consumer smoke test for selective installation.

### Changed

- **CLI migration:** `xyeena init` no longer implicitly installs all skills. The new wizard requires explicit choices; non-interactive installs require `--components` plus applicable `--runtime`, `--skills`, or `--guards`, and `--yes` for writes.
- Existing Agentic `doctor` behavior stays separate from `xyeena harness doctor`.
- Harness verifier reports `INCOMPLETE` rather than a passing result when no project-native check executed; writing evidence is opt-in.
- Source and notices consolidated under MIT with the integrated upstream v3.1 snapshot kept private as an npm subpackage.

### Upgrade notes

- Automation invoking `npx xyeena-agent init --runtime ...` must use the new explicit flags after the upgrade is published.
- For the selection-first wizard, use `xyeena-agent@0.2.0` or later. The older `0.1.0` package continues to use the legacy installer.
- No Git hooks, root `AGENTS.md`, or unselected skills/guards are silently installed by the new flow.

### Release validation

- Windows local: Agentic 45/45, Harness v3.1 15/15, packed consumer PASS, 19 capability manifests PASS, and 16/16 evaluation cases PASS.
- Cross-platform CI: Windows, macOS, and Linux with Node.js 22/24 and Agent Skills reference validation.
- Published package inventory checks verify 41 guardrails, bundled MIT LICENSE, and exclusion of unexpected private build artifacts.

---


## 0.1.0

- Initial public architecture.
- Machine-readable capability registry and context-activated resolver.
- Workflow governor, consent engine, evidence ledger, context packs and message protocol.
- Portable Agent Skills for core judgment, grilling, research, planning, debugging, testing,
  verification, review, architecture, interface design, security, release, handoff, skill authoring,
  and orchestration.
- Antigravity, Claude Code and Codex plugin metadata.
- Zero-runtime-dependency `npx xyeena-agent` installer and diagnostics.
- Deterministic resolver/governor/ledger/installer evals.

Behavioral model evals across every supported model/runtime are not claimed by this release.
