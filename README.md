# Xyeena Rig

**Equip your agent. Guard your project.**

Xyeena Rig combines modular **Agent Skills** with an opt-in project **Harness** for coding agents. It gives agents bounded scope, safer operations, verifiable evidence, and automated repository checks. Built for solo developers and engineering teams using **Antigravity**, **Claude Code**, **Codex**, **Gemini CLI**, and **Hermes**. Zero runtime dependencies.

## Install in one command

Install **Node.js 22.14+** once, then open PowerShell, Terminal or your IDE terminal:

```sh
npx --yes xyeena-agent setup
```

The wizard asks four human-friendly questions. **No flags, GitHub URL, Git command or npm global install required.**

1. **Where?** Global (all your projects, recommended) or this workspace only.
2. **Which AI?** Antigravity, Codex, Gemini CLI, Claude Code and/or Hermes Agent.
3. **How many skills?** Essential, Balanced, or Complete (all 19). Dependencies are included.
4. **Installation method?** Copy (simplest) or Symlink (one durable shared source). For workspace installations, choose optional Harness (none, essential or full). Finally preview the exact paths and confirm.

The default global install writes **only to your own AI user directories**, never system-wide or administrator directories. A global skill can be used from any workspace. **Harness is project-scoped**, so its guards are not silently made global.

### Quick reference for advanced or automated setups

```powershell
# Global for all projects — inspect then install
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --dry-run
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --yes

# Global with durable symlinks for more than one AI host
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "gemini,hermes" --preset balanced --dry-run
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "gemini,hermes" --preset balanced --yes

# This project only, symlinked; local Harness is optional
npx --yes xyeena-agent setup --scope workspace --mode symlink --runtime codex --preset essential --yes
```

On Windows symlink mode uses **directory junctions** where supported. It copies source skills first to `~/.xyeena/skill-store/v<VERSION>/`, so links remain usable even if npm deletes its temporary `npx` cache. A new npm version uses a new immutable skill-store snapshot; previous managed links can be updated with `--update` after review and backup.

**Existing skills remain untouched by default.** Conflicts are listed before installation. `--update` explicitly backs up and replaces conflicting files/managed links; unrecognized symlinks and modified store entries are refused. Workspace copy installation and legacy `xyeena init` remain compatible.

Learn more in [Global install and symlink guide](docs/GLOBAL-INSTALL.md), [Windows setup for beginners (Indonesian)](docs/INSTALL-WINDOWS-PEMULA.md), or [CLI reference](docs/CLI-REFERENCE.md).

**Boundaries:** Xyeena installs skill files. It does not install or authenticate the AI app, bypass native workspace trust, auto-run a model, or prove a skill was activated in an IDE chat.

---

## Recoverable installation: diff, selective upgrade, rollback, and host check

Installer also supports **reviewing a single conflicting file**, **updating only that conflict**, and a **guarded rollback journal** for new installations:

```powershell
# This checks local files only, does not call a model:
npx --yes xyeena-agent@0.3.0 setup check --runtime antigravity
# Preview differences against one packaged file:
npx --yes xyeena-agent@0.3.0 setup diff --runtime antigravity --preset complete --harness full --file ".agents/skills/xyeena-orchestrate/SKILL.md"
# Replace just that file; other custom files remain untouched:
npx --yes xyeena-agent@0.3.0 setup --runtime antigravity --preset complete --harness full --replace-files ".agents/skills/xyeena-orchestrate/SKILL.md" --dry-run
npx --yes xyeena-agent@0.3.0 setup --runtime antigravity --preset complete --harness full --replace-files ".agents/skills/xyeena-orchestrate/SKILL.md" --yes

# For installations created with rollback journals:
npx --yes xyeena-agent@0.3.0 setup backups
npx --yes xyeena-agent@0.3.0 setup rollback --id BACKUP_ID --dry-run
npx --yes xyeena-agent@0.3.0 setup rollback --id BACKUP_ID --yes
```

Older backup directories created before rollback journaling are listed but require **manual restore**; automatic rollback refuses them. Rollback also refuses when files have changed after installation, preserving the user's later edits. Rollback removes only files created by that specific setup run and restores backed-up originals, never deletes an entire skill directory. The host check reports filesystem inventory, not verified native IDE activation.

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
# Optional: add --delegate for SDK-managed read-only subagents (extra provider usage)
```

The task runner library requires a real host adapter and independent evidence. The SDK bridge always returns `REVIEW_REQUIRED`, never automatically marks a model answer verified. Native IDE worker dispatch remains unvalidated. See [Intelligent skill routing](docs/INTELLIGENT-ROUTING.md).

## Portable skill discovery: Gemini CLI and Hermes

The same `xyeena-orchestrate` skill can now be installed explicitly for **Gemini CLI** and **Hermes** in addition to Antigravity, Codex and Claude. The modular registry scans actual skill files from each host; it never fabricates unavailable skills. In Hermes, untrusted project skills remain ineligible for routing.

```bash
node bin/xyeena.mjs skills matrix
node bin/xyeena.mjs route --runtime hermes --prompt "investigate failing tests"
node bin/xyeena.mjs init --components skills --runtime gemini,hermes --skills xyeena-orchestrate --yes
```

Historical `--runtime all` installs to the original three hosts only; `--runtime all-supported` opts into all five. The SDK execution bridge remains an independent, opt-in **Antigravity-only** path. Gemini CLI and Hermes currently use native skill loading by their respective hosts, not a validated programmatic worker-dispatch adapter. See [Runtime adapters](docs/RUNTIME-ADAPTERS.md) and [Intelligent routing](docs/INTELLIGENT-ROUTING.md).

## Portable headless execution (experimental, opt-in)

Gemini CLI and Hermes can be invoked with the same goal, with actual host-specific skill routing and an explicit model-call gate:

```sh
node bin/xyeena.mjs host preview --runtime hermes --goal "Review test failures"
node bin/xyeena.mjs host run --runtime hermes --goal "Review test failures" --yes
node bin/xyeena.mjs host run --runtime gemini --goal "Investigate a regression" --yes
```

Only a host with a detected, eligible `xyeena-orchestrate` can run. Hermes uses its `safe` toolset and preloads selected skill names. Gemini CLI uses headless JSON with `--approval-mode plan` (subject to that CLI's native policy support). The CLI never passes `--yolo`. Outputs remain `REVIEW_REQUIRED`; users must configure and authenticate the actual AI runtime separately. **These calls start fresh CLI turns; they do not inject into an existing IDE/Telegram session.**

## Unified Orchestrator v0.3.0 (development)

One command chooses only skills **actually detected** for the requested host, and one explicit command starts a restricted agent call:

```sh
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Review the failing tests"
node bin/xyeena.mjs orchestrate run --runtime codex --goal "Review the failing tests" --yes --record
# Supported hosts: antigravity, codex, claude, gemini, hermes.
```

The orchestrator automatically infers a conservative workflow state from Indonesian/English task language with zero model tokens; `--state REVIEW|DEBUG|...` overrides it explicitly. The `/xyeena-orchestrate` installed skill remains the conversational entry point where the host recognizes that command. Inside native host conversations, Xyeena asks the agent to discover and activate installed skills using the host's own interface. The CLI command starts a **new one-shot session**, not the currently open IDE or Telegram conversation.

All `orchestrate run` paths are read-only and ask for explicit model-call consent. They recheck skill availability immediately before dispatch and report `REVIEW_REQUIRED` for model summaries. Hermes project skills need native trust. Codex uses a read-only sandbox; Claude uses `--bare --add-dir . --permission-mode plan`; Gemini CLI uses Plan mode; Antigravity uses the optional Python SDK. None of this silently enables workspace writes or publishes artifacts. Provider credentials and real host acceptance are separate requirements.

Optional `--record` creates a local Xyeena run journal that Guided Resume can discover later; it records the supplied goal, selected skill names, status and token count, not the model's response. No work is resumed automatically.

A bounded in-process `SkillInventoryCache` is available for long-running integrations. It invalidates on skill-directory, metadata and Hermes config changes, with no watcher process or persistent cache files.

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
