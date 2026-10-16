# Xyeena Rig

**Equip your agent. Guard your project.**

Xyeena Rig helps coding agents work with clearer scope, safer operations, stronger evidence, and repeatable project checks. It combines modular **Skills** for agent behavior with an optional **Harness** for project-level guardrails and verification. Use either component or both; installation does not silently select everything.

| Component | What it adds | Optional? |
| --- | --- | --- |
| **Skills** | 19 portable capabilities for planning, implementation, review, debugging, UI/UX, security, release and orchestration | Yes |
| **Harness** | 41 focused guardrail documents across 11 groups, project profile/configuration, and runnable audit/scan/verification commands | Yes |
| **All** | Skills + Harness together | Explicit selection only |

Supported skill targets: **Antigravity**, **Claude Code**, and **Codex**. Project detection in the Harness covers common Node/Next.js, Python, static, monorepo, and Git-based workflows. Rig uses no mandatory runtime npm dependencies.

## Product identity

**Xyeena Rig** is the developer-tooling product under the broader **Xyeena** brand. Rig is the same, single npm package as before: `xyeena-agent`. It is **not** a new or separate package.

- **Xyeena Rig:** portable Agent Skills + optional project Harness, distributed through npm.
- **Xyeena Notch:** a separate Windows desktop companion application, maintained in its own repository.
- **Xyn — The Lion Guardian:** the Xyeena mascot identity; not shipped in the Rig npm package.

**Compatibility:** the npm package `xyeena-agent`, executable names `xyeena` / `xyeena-agent`, skill IDs, plugin IDs, `.xyeena/` data paths, and existing configuration contracts remain unchanged. The historical `0.2.0` npm tarball retains its original presentation. The `0.2.1` release line includes Rig-branded package metadata, CLI help, and public documentation. See [Branding and naming](docs/BRANDING.md).

> **Version compatibility:** The selective installer is available in **`xyeena-agent@0.2.0` and later**; the **Rig** brand is included in version `0.2.1`. Version `0.1.0` used a legacy installer that could install all skills by default. Before running installation, verify the package version with `npx xyeena-agent version`; use `npx xyeena-agent@0.2.1 init` for a version-pinned Rig setup after `0.2.1` is published.

## Public documentation

- [Getting started](docs/GETTING-STARTED.md) — requirements, interactive setup, and selective installation.
- [CLI reference](docs/CLI-REFERENCE.md) — commands, flags, and safety.
- [Brand naming](docs/BRANDING.md) — Xyeena Rig, Xyeena Notch, and Xyn.
- [Architecture](docs/ARCHITECTURE.md) · [Changelog](CHANGELOG.md) · [Security](SECURITY.md).

**Release line:** `xyeena-agent@0.2.1` carries the **Xyeena Rig** brand in the npm README, CLI help and package metadata once published. [See versions on npm](https://www.npmjs.com/package/xyeena-agent?activeTab=versions). Previous [v0.2.0](https://github.com/rzqllh/xyeena/releases/tag/v0.2.0) remains unchanged; releasing `0.2.1` requires the separate GitHub Release/npm publishing workflow.

## Getting started

Run from the directory of the project where Xyeena should be installed:

```bash
npx xyeena-agent@0.2.1 init
```

Requires Node.js 22.14+ and an interactive terminal. For CI or non-interactive scripts, use the explicit flags below.

The interactive setup asks you to choose:

1. **Components:** Skills, Harness, or All.
2. **For Skills:** supported agent runtime(s) and the exact skills you need.
3. **For Harness:** guardrail group(s), such as Design, Engineering, Quality, or Security.
4. **Review and confirm:** see the selected items and mandatory skill dependencies before any project files are written.

Nothing is preselected. You can cancel without changing project files. **All** is available but never the implicit default.

### Explicit commands for automation

CI or non-interactive terminals must specify their selections. An installation requires `--yes`; dry-run does not.

```bash
# Selected Skills for Codex (xyeena-core is a required dependency)
npx xyeena-agent init --components skills --runtime codex --skills xyeena-interface --yes

# Harness only, limited to Core and Security guardrails
npx xyeena-agent init --components harness --guards 00-core,60-security --yes

# All components, agent targets, skills and guardrail groups (explicit opt-in)
npx xyeena-agent init --components all --runtime all --skills all --guards all --yes

# Preview without writing files
npx xyeena-agent init --components all --runtime all --skills all --guards all --dry-run
```

The installer automatically includes only **required** skill dependencies, reports them, and refuses to overwrite modified destination files unless you explicitly choose `--force`. Existing selections can be extended without erasing previous installation inventory.

### Files created

| Selection | Project-level installation |
| --- | --- |
| Skills for Codex / Antigravity | `.agents/skills/` |
| Skills for Claude Code | `.claude/skills/` |
| Selected Harness groups | `.xyeena/config.json`, `.xyeena/profile.md`, `.xyeena/harness/guides/` |
| Installation inventory | `.xyeena/install.json` |

Selected orchestration capabilities may install native agent roles; Xyeena does **not** silently replace root `AGENTS.md` or existing Git hooks. Harness diagnostic commands do not require installing project configuration first.

## Antigravity Guided hooks

Workspace-level hooks are an optional, separately approved install. They suggest possible unfinished work, and explicitly bound conversations receive a bounded capsule and checkpoint support without automatic execution or permission changes. See [Guided hooks](docs/ANTIGRAVITY-GUIDED.md).

    xyeena guided preview
    xyeena guided install --yes

## Harness commands

Run from a Git repository to inspect project state or check risks without configuring the Harness first:

```bash
npx xyeena-agent harness doctor  # Harness diagnostics
npx xyeena-agent audit           # Read-only findings
npx xyeena-agent scan            # Read-only scan; nonzero on blockers
npx xyeena-agent risk            # Explain change risk
npx xyeena-agent verify          # Explicitly run supported project-native checks
```

`xyeena doctor` still provides the original **Agentic installation diagnostics**. The Harness variant is `xyeena harness doctor`.

**Verification is not passive:** `verify` can run available project scripts. When no meaningful check ran, it reports **INCOMPLETE**, not a false PASS. Evidence files are generated only when requested via `--evidence` and live under the Git-ignored `.harness/evidence/` directory. Audit and scan do not modify project files. Harness `init` and Git-hook installation are not exposed through the unified CLI; installation remains opt-in through Xyeena's selection workflow.

## Upgrade from xyeena-agent 0.1.0

- `xyeena init` changes from its legacy all-skills installer to a **selection-first wizard**; scripts that depended on the old default must be updated.
- Non-interactive installation must pass `--components` and the appropriate `--runtime` / `--skills` / `--guards` with `--yes`.
- Existing Agentic commands, skill registry and governance concepts remain available. Harness functionality adds commands without replacing `xyeena doctor`.
- The Harness source is bundled inside the same `xyeena-agent` npm package. There is **no separate Harness npm install**.
- Check changed files and run `npm run test:consumer` before publishing or automating the new package.

See the [changelog](CHANGELOG.md), [installation guide](docs/GETTING-STARTED.md), [CLI reference](docs/CLI-REFERENCE.md) and [Harness adoption record](docs/HARNESS-V3.1-IMPORT-PLAN.md).

## Native plugin repository layouts

The repository itself contains native plugin metadata:

- Antigravity: root `plugin.json` + `skills/` + `rules/`.
- Claude Code: `.claude-plugin/plugin.json` + `skills/`.
- Codex: `.codex-plugin/plugin.json` + `skills/`, plus `.agents/plugins/marketplace.json`.

The npx installer intentionally uses project-level Agent Skills for the most portable path. Native marketplace/plugin installation can be added after the repository URL is configured and validated in each runtime.

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

The governor chooses the shortest defensible route. A typo does not need a planning ceremony; an authentication migration does.

## Included capabilities

Run:

```bash
npx xyeena-agent list
```

Major capabilities include core judgment/context, Full GRILL, primary-source research, disposable technical prototyping, planning, debugging, testing, verification, independent review, architecture, UI/UX craft, security, release, handoff, skill authoring and dynamic orchestration.

Resolve a prompt locally to inspect activation:

```bash
npx xyeena-agent resolve --prompt "grill gua soal auth architecture" --state DISCOVER
npx xyeena-agent resolve --prompt "redesign dashboard UI" --path src/Dashboard.tsx
```

## UI/UX philosophy

`xyeena-interface` combines a design process with an anti-generic quality filter. It does not prescribe a house style. It inspects real product context, shapes hierarchy and interaction before polish, and verifies the rendered result across critical interactions, responsive states and human/accessibility concerns. The detailed craft reference lives at `skills/xyeena-interface/references/design-craft.md`.

## Orchestration: modular and dynamic

Xyeena uses a manager-controlled DAG rather than an agent mesh. Only the governor owns topology. Workers do not recursively spawn arbitrary workers. Tasks are immutable units with dependencies; messages are small and typed; large outputs are artifacts; contradictory results are reconciled through evidence.

Native agent role definitions live under `agents/` and are installed to documented Antigravity/Claude project-agent locations **when the relevant orchestration capability is selected**. The runtime-neutral broker and task-DAG implementation live in `src/broker.mjs` and `src/task-graph.mjs`; runtime-native agent definitions can evolve without changing the capability domain model.

## Persistent state

The library supports append-only run journals and derived snapshots under `.xyeena/runs/<run-id>/`. The ledger tracks claims, decisions, tasks, artifacts, messages, consent and workflow state. Context packs can be compiled per role so auditors do not inherit executor rationale and researchers do not receive irrelevant implementation chatter.

Initialize a run:

```bash
npx xyeena-agent run-init --goal "Ship reader anchor regression fix"
```

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

CI also runs `skills-ref validate` against each skill.

## License

MIT. See `NOTICE.md` for research influences and attribution policy.

## Architecture docs

See `docs/ARCHITECTURE.md`, `docs/CAPABILITY-CONTRACT.md`, `docs/ORCHESTRATION.md`, `docs/RUNTIME-ADAPTERS.md`, and `docs/EVALS.md` for the technical contracts behind the package.
