# Xyeena Rig CLI reference

The npm package is named **`xyeena-agent`** and exposes both `xyeena` and `xyeena-agent` executables.

```bash
npx xyeena-agent@latest help
npx xyeena-agent@latest version
```

Use `npx xyeena-agent@latest <command>` for the subcommands listed below. Command names remain compatible.

## Beginner installation (v0.3.0)

| Command | Meaning |
| --- | --- |
| `setup` | Interactive four-step beginner wizard; preview then explicit confirmation |
| `setup --runtime hermes --preset essential --dry-run` | Read-only preview with no model call or project edits |
| `setup --runtime hermes,gemini --preset balanced --harness essential --yes` | Explicit safe local installation |
| `setup --runtime all-supported --preset complete --harness full --dry-run` | Inspect broad installation before consent |

Presets: `essential` (orchestrator + required deps), `balanced` (orchestrator/planning/debugging/review/testing/verification), `complete` (all packaged skills). Harness: `none`, `essential` (three groups), `full` (11 groups). `setup` refuses overwrites of modified skill files and does not support forcing a beginner installation.

**Detailed Windows guide:** [INSTALL-WINDOWS-PEMULA.md](INSTALL-WINDOWS-PEMULA.md).

## Installation

| Command | Behavior |
| --- | --- |
| `init` | Interactive, selection-first installation |
| `init --components skills --runtime codex --skills xyeena-interface --yes` | Install Skills for Codex, plus mandatory dependencies |
| `init --components harness --guards 00-core --yes` | Install Harness Core guardrails only |
| `init --components all --runtime all --skills all --guards all --dry-run` | Preview full installation without writes |
| `doctor` | Check the existing Agent Skills installation |
| `harness doctor` | Inspect Harness project state independently |

**Non-interactive flags:** `--components skills|harness|all` is required; Skills require `--runtime` and `--skills`, Harness requires `--guards`. Select multiple values with commas or explicitly select `all`. Use `--yes` to approve writes, `--dry-run` to preview, `--dir PATH` to choose a project, and `--force` only to deliberately overwrite modified destinations.

## Harness and verification

| Command | Meaning |
| --- | --- |
| `audit` / `harness audit` | Read-only project findings |
| `scan` / `harness scan` | Read-only scan; returns nonzero on blockers |
| `risk` / `harness risk` | Explain change risk |
| `changed` / `harness changed` | Inspect changed files |
| `adapters` / `harness adapters` | Inspect project adapters |
| `verify` / `harness verify` | **Run** supported project-native checks |
| `check --source PATH` | Validate source capability manifests |
| `eval` | Run deterministic capability evaluations |

Harness commands support `--dir PATH` and `--base REF` for Git comparisons; `--evidence` opts in to persistent verification evidence. `audit` and `scan` are read-only. `verify` can execute arbitrary configured project scripts and should only be used on a project you trust. Missing native checks result in **INCOMPLETE**, not an invented PASS.

```bash
npx xyeena-agent@latest changed --base origin/main
npx xyeena-agent@latest adapters
npx xyeena-agent@latest verify --evidence
```

The public bridge intentionally does not expose upstream Harness `init` or `install-hook`.

## Agent capabilities

| Command | Meaning |
| --- | --- |
| `list` | List packaged skill/capability identifiers |
| `resolve --prompt TEXT --state TRIAGE` | Inspect capability routing |
| `run-init --goal TEXT` | Initialize a run journal in the selected project |

```bash
npx xyeena-agent@latest resolve --prompt "review auth changes" --state TRIAGE
```

## Compatibility

Do not rename the package to `xyeena-rig` or rename any `xyeena-*` Skill identifiers. There is one npm package, including Harness. Rig branding shipped in the `0.2.1` release line; it does not change historical `0.2.0`.

For setup walkthroughs, see [Getting started](GETTING-STARTED.md); for product naming, see [Branding](BRANDING.md).
