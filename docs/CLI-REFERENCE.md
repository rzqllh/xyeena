# Xyeena Rig CLI reference

The npm package is named **`xyeena-agent`** and exposes both `xyeena` and `xyeena-agent` executables. For a reproducible published version, use:

```bash
npx xyeena-agent@0.2.0 help
npx xyeena-agent@0.2.0 version
```

Use `npx xyeena-agent@0.2.0 <command>` for the subcommands listed below. The **Rig** display name is newer than the published 0.2.0 tarball; command names have not been renamed.

## Installation

| Command | Behavior |
| --- | --- |
| `init` | Interactive, selection-first installation |
| `init --components skills --runtime codex --skills xyeena-interface --yes` | Install Skills for Codex, plus mandatory dependencies |
| `init --components harness --guards 00-core --yes` | Install Harness Core guardrails only |
| `init --components all --runtime all --skills all --guards all --dry-run` | Preview full installation without writes |
| `doctor` | Check the existing Agent Skills installation |
| `harness doctor` | Inspect Harness project state independently |

**Non-interactive flags:** `--components skills|harness|all` is required; Skills require `--runtime` and `--skills`, Harness requires `--guards`. Select multiple values with commas or explicitly select `all`. Use `--yes` to approve writes, `--dry-run` to preview, `--dir PATH` to choose a project and `--force` only to deliberately overwrite modified destinations.

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

The public bridge intentionally does not expose upstream Harness `init` or `install-hook`.

## Agent capabilities

| Command | Meaning |
| --- | --- |
| `list` | List packaged skill/capability identifiers |
| `resolve --prompt TEXT --state TRIAGE` | Inspect capability routing |
| `run-init --goal TEXT` | Initialize a run journal in the selected project |

```bash
npx xyeena-agent@0.2.0 resolve --prompt "review auth changes" --state TRIAGE
```

## Compatibility

Do not rename the package to `xyeena-rig` or rename any `xyeena-*` Skill identifiers. There is one npm package, including Harness. Source branding changes appear in a future published version, not retroactively in 0.2.0.

For setup walkthroughs, see [Getting started](GETTING-STARTED.md); for product naming, see [Branding](BRANDING.md).
