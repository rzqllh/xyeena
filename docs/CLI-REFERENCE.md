# Xyeena Rig CLI reference

The npm package is named **`xyeena-agent`** and exposes both `xyeena` and `xyeena-agent` executables.

```bash
npx xyeena-agent@latest help
npx xyeena-agent@latest version
```

Use `npx xyeena-agent@latest <command>` for the subcommands listed below. Command names remain compatible.

## Beginner setup

The recommended public command for humans is simply `npx --yes xyeena-agent setup`. It asks for scope, runtime, preset, mode, optional project Harness, and confirmation.

| Flag | Values | Default / notes |
| --- | --- | --- |
| `--scope` | `workspace`, `global` | Workspace for noninteractive backward compatibility; wizard asks explicitly |
| `--mode` | `copy`, `symlink` | Copy |
| `--runtime` | `antigravity`, `gemini`, `codex`, `claude`, `hermes`, comma-separated | Required noninteractively |
| `--preset` | `essential`, `balanced`, `complete` | Essential |
| `--harness` | `none`, `essential`, `full` | None; **global scope requires none** |
| `--dry-run` | no value | Preview with no writes |
| `--yes` | no value | Explicit confirmation for unattended changes |
| `--update` | no value | Back up and replace existing packaged conflicts |

Workspace copy retains the v0.3.0 install/rollback behavior. Symlinks use a home-persistent content snapshot, not npm cache; previous Xyeena-managed links can be updated with `--update`. The portable global/symlink method does not currently support the workspace-copy rollback journal and must be manually restored from the displayed backup directory.

For exact native global destinations and setup examples: [Global installation guide](GLOBAL-INSTALL.md), [Windows beginner guide](INSTALL-WINDOWS-PEMULA.md).

## Conflict inspection and post-install health

| Command | Effect |
| --- | --- |
| `setup diff --runtime HOST --preset PRESET --file PATH` | Bounded local text diff for one listed conflicting file; read-only |
| `setup --runtime HOST --preset PRESET --replace-files PATH[,PATH] --dry-run` | Preview specifically selected conflict updates |
| `setup --runtime HOST --preset PRESET --replace-files PATH[,PATH] --yes` | Back up then replace only selected conflicts |
| `setup backups` | List recent backup IDs; old journal-less backups marked as manual recovery |
| `setup rollback --id ID --dry-run` | Integrity-check preview without modifying files |
| `setup rollback --id ID --yes` | Explicit safe restore only if no subsequent file edits occurred |
| `setup check --runtime HOST` | Report local skill eligibility and host detection clues; not live activation |

Rollback journaling is available for *new* installations through the updated installer. Backups created by older candidates without a journal are not automatically restored; recovery remains manual. The rollback command does not remove entire skill directories or touch unrelated third-party skills. All commands respect project path and symlink safeguards.

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
