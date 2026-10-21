# Xyeena Rig

**Equip your agent. Guard your project.**

Xyeena Rig combines modular **Agent Skills** with an opt-in project **Harness** for coding agents. It gives agents bounded scope, safer operations, verifiable evidence, and automated repository checks. Built for solo developers and engineering teams using **Antigravity**, **Claude Code**, and **Codex**. Zero runtime dependencies.

```bash
npx xyeena-agent@latest init
```

| Component | What it adds | Selection |
| --- | --- | --- |
| **Skills** | 19 portable capabilities for planning, execution, review, debugging, UI craft, security, and orchestration | Opt-in |
| **Harness** | 41 guardrail documents across 11 groups, project profiling, and runnable audit/scan/verification commands | Opt-in |
| **All** | Skills + Harness combined | Explicit selection only |

Supported agent runtimes: **Antigravity**, **Claude Code**, and **Codex**. Project detection covers Node/Next.js, Python, static web, monorepos, and Git workflows.

---

## Quick links

- [Getting started](docs/GETTING-STARTED.md): Requirements, interactive setup, and selective installation.
- [CLI reference](docs/CLI-REFERENCE.md): Commands, flags, and safety contracts.
- [Brand naming](docs/BRANDING.md): Relationship between Xyeena Rig, Xyeena Notch, and Xyn.
- [Architecture](docs/ARCHITECTURE.md) · [Changelog](CHANGELOG.md) · [Security](SECURITY.md).

---

## Product identity

**Xyeena Rig** is the developer-tooling arm under the **Xyeena** brand. Rig is distributed through the single npm package `xyeena-agent`.

- **Xyeena Rig:** Portable Agent Skills + optional project Harness, published on npm as `xyeena-agent`.
- **Xyeena Notch:** A separate Windows desktop companion application, maintained in its own repository (`rzqllh/xyeena-notch`).
- **Xyn (The Lion Guardian):** The Xyeena mascot identity; not shipped in the Rig npm package.

**Compatibility:** The package name `xyeena-agent`, CLI commands `xyeena` and `xyeena-agent`, skill IDs (`xyeena-*`), plugin IDs, `.xyeena/` paths, and configuration contracts remain unchanged.

---

## Installation and setup

Run from the root directory of your target project:

```bash
npx xyeena-agent@latest init
```

Requires Node.js 22.14 or newer and an interactive terminal.

The interactive wizard asks you to select:

1. **Components:** Skills, Harness, or All.
2. **For Skills:** Target runtime(s) and specific skills.
3. **For Harness:** Guardrail group(s), such as Design, Engineering, Quality, or Security.
4. **Confirmation:** Reviews selected items and mandatory skill dependencies before writing files.

Nothing is preselected. Canceling writes zero files. **All** is available only through explicit selection.

### Non-interactive installation (CI)

CI and automation must pass explicit component flags and `--yes`:

```bash
# Skills for Codex (xyeena-core is automatically included as a dependency)
npx xyeena-agent@latest init --components skills --runtime codex --skills xyeena-interface --yes

# Harness only: Core and Security guardrails
npx xyeena-agent@latest init --components harness --guards 00-core,60-security --yes

# Explicit opt-in for all components
npx xyeena-agent@latest init --components all --runtime all --skills all --guards all --yes

# Dry-run preview without writing to disk
npx xyeena-agent@latest init --components all --runtime all --skills all --guards all --dry-run
```

### Installer safeguards

- **No silent installation:** Every component requires explicit selection.
- **Dependency preview:** Mandatory skill dependencies are resolved and printed before installation.
- **Overwrite protection:** Modified destination files are preserved unless `--force` is passed.
- **Safe cancellation:** Exiting early writes zero files.
- **Root protection:** Does not touch root `AGENTS.md` or Git hooks without consent.

### Project files created

| Selection | Project-level destination |
| --- | --- |
| Skills for Codex / Antigravity | `.agents/skills/` |
| Skills for Claude Code | `.claude/skills/` |
| Selected Harness groups | `.xyeena/config.json`, `.xyeena/profile.md`, `.xyeena/harness/guides/` |
| Installation inventory | `.xyeena/install.json` |

---

## Installed-skill routing preview (development)

Xyeena now includes opt-in, read-only discovery and routing for installed project and global Agent Skills, including third-party skills. These commands are available from a source checkout of this development branch (not yet the published npm release):

```bash
node bin/xyeena.mjs skills discover --runtime antigravity
node bin/xyeena.mjs route --runtime antigravity --prompt "systematic debugging of a regression" --state DEBUG
```

Native Antigravity can automatically invoke relevant skills without manual slash commands. The routing CLI only **previews** routes and never invokes the model.

An additional optional SDK bridge makes a **real one-shot read-only agent call** via the official Python Antigravity SDK; it is **not** connected to an already-running IDE conversation. This requires a separately installed SDK and API credentials, and can consume provider tokens:

```sh
node bin/xyeena.mjs sdk preview --goal "Review unit test failures"
node bin/xyeena.mjs sdk run --goal "Review unit test failures" --yes
```

The task runner library requires a real host adapter and independent evidence. The SDK bridge always returns `REVIEW_REQUIRED`, never automatically marks a model answer verified. Native IDE worker dispatch remains unvalidated. See [Intelligent skill routing](docs/INTELLIGENT-ROUTING.md).

## Antigravity Guided hooks

Workspace-level hooks are an optional, separately approved install. They suggest possible unfinished work, and explicitly bound conversations receive a bounded capsule and checkpoint support without automatic execution or permission changes. See [Guided hooks](docs/ANTIGRAVITY-GUIDED.md).

    xyeena guided preview
    xyeena guided install --yes

## Harness commands

Run from any Git repository to inspect project state or check risks without configuring the Harness first:

```bash
npx xyeena-agent@latest harness doctor  # Harness diagnostics
npx xyeena-agent@latest audit           # Read-only findings against active adapters
npx xyeena-agent@latest scan            # Repository scan; exits nonzero on blockers
npx xyeena-agent@latest risk            # Classify change risk against base branch
npx xyeena-agent@latest changed         # Inspect changed files against base branch
npx xyeena-agent@latest adapters        # Inspect active project adapters
npx xyeena-agent@latest verify          # Execute native project check scripts
```

`xyeena doctor` inspects Agent Skills installation. `xyeena harness doctor` inspects Harness configuration and Git status.

**Verification is not passive:** `verify` executes available project scripts. When no meaningful check ran, it reports **INCOMPLETE**, not an invented PASS. Evidence files are written only when `--evidence` is passed and stay under the Git-ignored `.harness/evidence/` directory.

---

## Upgrading from xyeena-agent 0.1.0

- `xyeena init` changed from a legacy all-skills installer to a selection-first wizard.
- CI scripts must pass `--components`, `--runtime` / `--skills` / `--guards`, and `--yes`.
- Harness source is bundled directly inside `xyeena-agent`. There is no separate Harness package.

See the [Changelog](CHANGELOG.md), [Installation guide](docs/GETTING-STARTED.md), and [CLI reference](docs/CLI-REFERENCE.md).

---

## Native plugin layouts

This repository contains native plugin metadata:

- **Antigravity:** Root `plugin.json` + `skills/` + `rules/`.
- **Claude Code:** `.claude-plugin/plugin.json` + `skills/`.
- **Codex:** `.codex-plugin/plugin.json` + `skills/`, plus `.agents/plugins/marketplace.json`.

---

## Core lifecycle

```text
TRIAGE
  ├─ low risk / clear ───────────────> EXECUTE
  ├─ unknown / ambiguous ────────────> DISCOVER → GRILL / RESEARCH / PROTOTYPE
  └─ substantial / high risk ───────> DEFINE → PLAN

EXECUTE → VERIFY → REVIEW → RELEASE → CLOSE
    │         │        │
    └─fail→ DEBUG      └─changes→ EXECUTE
```

---

## Included capabilities

List all packaged capabilities:

```bash
npx xyeena-agent@latest list
```

Capabilities include core context, frontier grilling, primary-source research, technical prototyping, planning, debugging, testing, verification, independent review, architecture, UI craft, security, release, handoff, skill authoring, and orchestration.

Resolve capability activation against a prompt:

```bash
npx xyeena-agent@latest resolve --prompt "grill me on auth architecture" --state DISCOVER
npx xyeena-agent@latest resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx
```

---

## UI craft philosophy

`xyeena-interface` combines a disciplined design process with an anti-generic quality filter. It does not prescribe a house style. It shapes hierarchy and interaction before visual polish, verifying the result across keyboard navigation, responsive viewports, and WCAG AA contrast. The reference guide lives at `skills/xyeena-interface/references/design-craft.md`.

---

## Orchestration

Xyeena uses a manager-controlled DAG rather than an unconstrained agent mesh. Only the governor owns topology. Workers do not recursively spawn arbitrary workers. Tasks are immutable units with dependencies; messages are typed envelopes; large outputs become persistent artifacts.

Run journal initialization:

```bash
npx xyeena-agent@latest run-init --goal "Ship reader anchor regression fix"
```

---

## Development

Requires Node.js 22.14+.

```bash
npm ci
npm test
npm run test:harness
npm run test:consumer
npm run check
npm run eval
npm pack --dry-run
```

---

## License

MIT. See `NOTICE.md` for research influences and attribution policy.
