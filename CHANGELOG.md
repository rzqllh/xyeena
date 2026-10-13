# Changelog

## Unreleased — Skills + Harness upgrade

Xyeena remains **one npm package** (`xyeena-agent`) with two independently selectable components. These changes are in the feature branch and are **not yet published** on npm.

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
- `npx` currently resolves npm `0.1.0`, which still uses the legacy installer. Until a new version is published, test the new wizard with `node ./bin/xyeena.mjs init` from the feature branch.
- No Git hooks, root `AGENTS.md`, or unselected skills/guards are silently installed by the new flow.

### Verification evidence (pre-release)

- Windows local: Agentic 45/45, Harness v3.1 15/15, packed consumer PASS, 19 capability manifests PASS, 16/16 evaluation cases PASS.
- Full source integration commit `441dcf4616e751fe4a13e069c7978f3f30c4906e` passed all 7 CI jobs (Windows, Linux, macOS; Node.js 22/24 and skills-ref).
- npm package includes the MIT LICENSE and excludes the former license placeholder.
- Remaining release gates: interactive Windows wizard acceptance, package/version publication workflow, and final post-documentation CI.

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
