# Changelog

## 0.2.0 — Skills + Harness upgrade

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
