# Xyeena Rig

**Release candidate (unpublished):** this branch prepares `xyeena-agent@0.5.0` from current RIG source. **Do not install `@0.5.0` from npm yet.** The known published baseline remains `@0.4.1` until registry publication is independently verified. **Scoped public release approved (not yet published):** Antigravity CLI 1.4.7 has narrowly verified native `force_ask`/`deny` behavior; **Antigravity IDE 2.5.5 hook enforcement is not supported or security-verified**. Codex, Claude, Gemini and Hermes native capabilities remain experimental/unverified; Hermes post-run accounting is **not a provider hard budget**. See [0.5.0 release candidate gate](docs/xyeena-rig/RELEASE-CANDIDATE-0.5.0.md).

**Equip your agent. Guard your project.**

Xyeena Rig is a local-first toolkit for developer workflows with coding agents. It packages **19 Agent Skills**, optional project **Harness** guidance and verification tools, skill discovery, and guarded task orchestration. It supports Antigravity, Codex, Claude Code, Gemini CLI, and Hermes through host-specific installation paths. The npm package is `xyeena-agent`; both `xyeena` and `xyeena-agent` are CLI entry points.

[Windows read-only source handoff](scripts/windows-acceptance-pack.ps1) · [Current source & host status](docs/STATUS.md) · [Getting started](docs/GETTING-STARTED.md) · [CLI reference](docs/CLI-REFERENCE.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

**Source concurrency note:** A shared-workspace write canceled by timeout retains its serialization lock until the adapter settles; an unresponsive adapter may intentionally block future writes pending recovery. This is not an OS sandbox or proof of descendant termination.

**Source accounting note:** Current unreleased source development hardens token/cost budget validation, but all usage-based acceptance checks occur *after* provider execution; they do not cap provider billing. [Source and host status](docs/STATUS.md).

**Latest recorded acceptance (2026-10-26):** Antigravity CLI 1.4.7 on Windows honored Xyeena `force_ask`, user cancellation, and a separate narrowly scoped automatic `deny` for a read-only command. Antigravity IDE 2.5.5 did **not** enforce the hook in the observed session. These source features are not automatically part of the separately published npm 0.4.1. [Status and limitations](docs/STATUS.md).

## Install

Requires **Node.js 22.14+**. The interactive setup requires no Git checkout or global npm installation.

```sh
npx --yes xyeena-agent@0.4.1 setup
```

Choose the scope (user-global or current workspace), installed agent hosts, and Essential, Balanced or Complete skill preset. Review the destination paths before confirming. The wizard preserves existing custom files by default. **Installation does not authenticate an AI provider or activate skills in a running IDE.** Reload the selected host and verify its skill inventory separately.

To automate installation, preview the plan first:

```sh
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime codex --preset balanced --dry-run
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime codex --preset balanced --yes
```

The same command accepts `--scope global` and a comma-separated `--runtime` list. Global installation writes to user-owned host directories. Project Harness remains an independent, workspace-scoped opt-in.

### Compact skill layout

The **compact installer is implemented on the repository's `main` branch** and is not represented as part of the separately published `0.4.1` tarball until a subsequent release. It exposes one host-visible `xyeena-rig/SKILL.md` containing references to selected native modules:

```sh
# From a source checkout at the intended workspace:
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes
```

The compact layout coexists with existing standalone skills. Legacy migration, managed upgrades, backup restoration, and uninstallation enforce ownership checks; do not remove an existing skill directory manually. See the [operations runbook](docs/xyeena-rig/RUNBOOK.md).

## What is included

| Capability | Behavior |
| --- | --- |
| **Agent Skills** | 19 portable modules for research, planning, development, debugging, testing, review, security, design and release |
| **Skill discovery** | Bounded inventory of supported workspace/user skill and plugin locations; dependency resolution and deterministic candidate routing |
| **Orchestration** | One Xyeena workflow governor, optional external skills, task-graph and evidence-aware execution interfaces |
| **Project Harness** | Opt-in guardrail guides, audits, risk classification, checks and conditional execution gates |
| **Recovery** | Run journals, checkpoint interfaces, bounded retries, guarded resume and rollback facilities |
| **Runtime integration** | Host-specific skill paths and optional one-shot CLI/SDK adapters; actual host activation remains host-controlled |

**Optional integrations:** Superpowers and Superior Skills may contribute compatible methodologies or specialist skills when installed, enabled and trusted by the host. **Simpul** is an optional worker transport. None is a prerequisite for using Xyeena's native skills. A discovered plugin is not automatically activated or authorized.

### Scope and execution guarantees

Xyeena distinguishes **capability discovery**, **execution eligibility**, and **live host authorization**. These are different states:

- `skills discover` and orchestration previews inspect metadata; they do **not** execute agents.
- `orchestrate run` starts a new, consent-gated **read-only one-shot** session, not a conversation already open in your IDE.
- A verified Harness interface does not imply an active tool-interception hook in every host. Privileged operations fail closed when a trusted host approval or interception boundary is unavailable.
- Simpul adapter protocol checks do not imply its upstream supervisor can execute and finish a live task. A host-native or inline executor must be separately available.
- Task completion requires independent evidence appropriate to its acceptance criteria. Model-authored status text alone is not proof.

Read the [runtime integration matrix](docs/RUNTIME-ADAPTERS.md) and [security boundaries](SECURITY.md) before enabling host execution.

## Common commands

```sh
npx --yes xyeena-agent@0.4.1 setup check --runtime codex
npx --yes xyeena-agent@0.4.1 skills matrix
npx --yes xyeena-agent@0.4.1 list
npx --yes xyeena-agent@0.4.1 audit
npx --yes xyeena-agent@0.4.1 scan
npx --yes xyeena-agent@0.4.1 verify
```

For functionality newer than the currently published package, use a source checkout:

```sh
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Investigate failing tests"
node bin/xyeena.mjs setup compact --runtime codex --preset balanced --dry-run
```

`verify` runs configured project checks and is **not** a read-only operation. See the [CLI reference](docs/CLI-REFERENCE.md) for effects, flags, and examples.

## Supported hosts

| Host | Typical workspace skill root | Notes |
| --- | --- | --- |
| Antigravity | `.agents/skills/` | CLI 1.4.7 scoped hook consent/deny live PASS; IDE 2.5.5 native hook enforcement BLOCKED. `setup check` detects `agy` without assuming IDE activation. [Details](docs/STATUS.md) |
| Codex | `.agents/skills/` | Read-only one-shot adapter available |
| Claude Code | `.claude/skills/` | Host permissions and skill activation remain native |
| Gemini CLI | `.gemini/skills/` / `.agents/skills/` | Native trust and Plan-mode behavior apply |
| Hermes | `.hermes/skills/` / `.agents/skills/` | Trusted-workspace and profile settings apply |

Global paths, precedence rules and caveats are documented in [Runtime adapters](docs/RUNTIME-ADAPTERS.md) and [Global installation](docs/GLOBAL-INSTALL.md).

## Read-only host acceptance preflight (newer source only)

From a current source checkout, `node bin/xyeena.mjs ops preflight --dir .` returns redacted executable hints, local hook registration/runner presence and links to **RIG-native host** live gates (#34, #36, #37). It deliberately excludes optional Simpul supervisor state and provider billing acceptance, which belong to separate scopes. It **does not** run a model, execute host tools, authenticate MCP, request permission, or assert native hook enforcement. It is not included in the repository-recorded npm 0.4.1 release. See [source/host acceptance](docs/STATUS.md).

## Development and validation

```sh
npm ci
npm test
npm run check
npm run eval
npm run test:harness
npm run test:consumer
npm pack --dry-run
```

Repository CI tests source and packaging on Windows, macOS and Linux with Node.js 22 and 24. [Native host acceptance handoff](docs/xyeena-rig/NATIVE_ACCEPTANCE_HANDOFF.md) distinguishes CI from in-IDE and other host evidence. These checks are not substitutes for live acceptance on all five agent hosts.

The last published baseline **recorded by this repository** remains **`0.4.1`** (registry verification required before release); the post-merge source includes additional unreleased capabilities. The [release-readiness record](docs/xyeena-rig/ACCEPTANCE_MATRIX.md) distinguishes automated pass criteria from pending live validation. No `0.5.0` publication is implied by the source code.

## Contributing, security and licensing

Issues and pull requests: [GitHub repository](https://github.com/rzqllh/xyeena). Report security issues privately as described in [SECURITY.md](SECURITY.md). The source is MIT-licensed; retain [NOTICE.md](NOTICE.md) and upstream licenses when redistributing code. Xyeena Notch and other Xyeena products are separate projects.
