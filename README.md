# Xyeena

Xyeena is a modular, context-activated capability system for coding agents. It is designed to work as a portable Agent Skills repository and as runtime-native plugin metadata for Antigravity, Claude Code, and Codex.

It is not a monolithic prompt. The system separates:

- a small behavioral kernel (`xyeena-core`),
- machine-readable capability contracts (`capability.json`),
- a deterministic resolver/governor/consent/ledger library,
- focused skills that load only when relevant,
- role contracts for manager/executor/auditor-style orchestration,
- runtime metadata for Antigravity, Claude Code and Codex.


## Install with npx

From the root of the project where you want Xyeena available:

```bash
npx xyeena-agent init
```

This installs portable skills to both:

```text
.agents/skills/   # Antigravity + Codex-compatible project skills
.claude/skills/   # Claude Code project skills
```

Install one runtime only:

```bash
npx xyeena-agent init --runtime antigravity
npx xyeena-agent init --runtime claude
npx xyeena-agent init --runtime codex
```

Inspect without writing:

```bash
npx xyeena-agent init --dry-run
npx xyeena-agent doctor
```

Xyeena does not silently overwrite modified skill files. Use `--force` only after reviewing local changes.

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

Native agent role definitions live under `agents/` and are installed to documented Antigravity/Claude project-agent locations. The runtime-neutral broker and task-DAG implementation live in `src/broker.mjs` and `src/task-graph.mjs`; runtime-native agent definitions can evolve without changing the capability domain model.

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
npm run check
npm run eval
npm pack --dry-run
```

CI also runs `skills-ref validate` against each skill.

## Before publishing this fork/repository

Configure the repository owner first:

```bash
npm run configure:repo -- --owner YOUR_GITHUB_USERNAME --repo xyeena
```

Then inspect `package.json`, `.claude-plugin/`, `.codex-plugin/`, and marketplace metadata before publishing.


## License

MIT. See `NOTICE.md` for research influences and attribution policy.

## Architecture docs

See `docs/ARCHITECTURE.md`, `docs/CAPABILITY-CONTRACT.md`, `docs/ORCHESTRATION.md`, `docs/RUNTIME-ADAPTERS.md`, and `docs/EVALS.md` for the technical contracts behind the package.
