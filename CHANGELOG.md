## [0.3.0] - Release candidate (not published)

- Add portable skill orchestration and per-host skill inventory for Antigravity, Codex, Claude Code, Gemini CLI, and Hermes.
- Add novice-safe `xyeena setup` wizard, Essential/Balanced/Complete presets, optional Harness, conflict-aware reinstallation, bounded file diffs, per-file update, explicit dry-run/confirmation, rollback journal and read-only post-install check.
- Add optional restricted host SDK/CLI one-shot execution, skill routing previews, workflow hints, cache/invalidation, evidence-gated tasks, and local run ledger.
- Preserve existing package name, 19 skill IDs, 41 Harness guardrails, and `init`/previous CLI behavior.
- Runtime execution is host-dependent and does not imply full autonomous write permissions or verified live IDE dispatch.
- Publish only when CI, package consumer smoke, and explicit release acceptance have been completed.

## Unreleased (v0.3.0 candidate, PR #12)

- Additive portable orchestration for Antigravity, Codex, Claude Code, Gemini CLI and Hermes; existing Skills, Harness and original install defaults preserved.
- Inventory installed skills by host and trust/platform eligibility, zero-token AUTO workflow inference, bounded metadata cache, duplicate-shadow safety, external/nested Hermes and named profile support.
- Unified `xyeena orchestrate preview|run` entrypoint. Real model calls are explicit and limited to read-only one-shot host adapters, not active IDE sessions; model output is REVIEW_REQUIRED without independent proof.
- Optional privacy-constrained `--record` journal for recovery, with no automatic resume, provider approval or write-enabled autonomy.
- Add independent `verifyEvidence` gate to task graph, cross-platform CLI/SDK CI and host-acceptance checklist. Production publish and native in-session end-to-end verification remain pending.

# Changelog

## [Unreleased]

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
- Public surface audit, redesign plans, and release-day bump ledger in `docs/audit/`.
- Isolated `site/` and `docs/audit` from the npm publication tarball via `package.json` files configuration.
- Removed marketing buzzwords and unnecessary punctuation across public CLI wizard prompts and documentation.
- Clarified non-TTY error diagnostics in CLI selection to explicitly guide users toward `--guards` for CI Harness workflows.
- Linked capability-contract, orchestration, and runtime-adapters specifications in `docs/ARCHITECTURE.md`.

- Adopt **Xyeena Rig** as the developer-tooling product identity under the Xyeena parent brand ([PR #4](https://github.com/rzqllh/xyeena/pull/4)).
- Rebrand human-facing CLI/setup text, source plugin display labels and npm package description while preserving the package name `xyeena-agent`, CLI aliases, Skill IDs and installed file paths.
- Refresh public documentation with [Getting started](docs/GETTING-STARTED.md), [CLI reference](docs/CLI-REFERENCE.md) and reconciled release records.
- First Rig-branded npm release candidate: version `0.2.1` aligns npm, CLI, lockfile and native plugin manifest versions; historical `0.2.0` remains unchanged.

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
