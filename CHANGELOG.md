# Changelog

All versions listed as released refer to published npm artifacts. Repository source changes are not published until a matching release is authorized.

## Unreleased — source after 0.4.1 (updated 2026-10-26)

- Added native Antigravity `PreToolUse` interception, fail-closed file/command decisions and explicit host-activation reporting. Windows Antigravity CLI 1.4.7 successfully showed native `force_ask` with user cancellation and a separate one-shot `deny` blocking a harmless command. **Antigravity IDE 2.5.5 remains LIVE BLOCKED** for hook enforcement.
- Repaired the Windows CLI hook launcher to resolve relative to `.agents/` without quoted paths. Added an opt-in five-minute callback diagnostic, exact-match single-use automatic-deny probe, and a backed-up runner-only upgrade that preserves host-mutated event configuration.
- Updated public status, runtime matrices, release gates and documentation consistency checks; CI is not a substitute for native host evidence. See [dated source/host status](docs/STATUS.md) and [OPS evidence](docs/xyeena-rig/EVIDENCE.md).
- **No `0.5.0` release, tag or npm publication has been authorized.** The npm `0.4.1` baseline recorded in this repository does not include unreleased source additions.

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
