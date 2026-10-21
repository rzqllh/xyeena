# Get started with Xyeena Rig

**Xyeena Rig** combines portable Agent Skills and an optional project Harness in a single npm package. You choose **Skills**, **Harness**, or **both**; installation never silently selects every component.

- **npm package:** [`xyeena-agent`](https://www.npmjs.com/package/xyeena-agent)
- **Included:** 19 Agent Skills; 41 Harness guardrails across 11 groups.
- **Targets:** Antigravity, Claude Code, Codex, Gemini CLI, Hermes.
- **Branding note:** Version `0.2.1` introduces Xyeena Rig display names. Technical package and CLI identifiers remain compatible.

## Requirements

Node.js **22.14 or newer**, npm/npx, and write access to a project directory. Use an interactive terminal for the wizard; CI must use explicit flags.

## Beginner setup — one command, all projects

```sh
npx --yes xyeena-agent setup
```

Choose **Global** to make skills available across every project in the selected AI host, or **Workspace** to limit them to this project. Then select your AI host(s), Essential/Balanced/Complete skill preset, **Copy or Symlink** method, and review all paths before confirming. Workspace setup additionally supports opt-in Harness; global setup installs skills only.

Copy places independent files in each native host folder. Symlink creates durable user-home links to `~/.xyeena/skill-store/v<VERSION>` — never into disposable npm/npx caches. On Windows, the installer uses folder junctions.

For beginner screenshots-independent instructions see [Windows guide](INSTALL-WINDOWS-PEMULA.md). For native global host paths, limitations and symlink upgrades see [Global and Symlink install](GLOBAL-INSTALL.md).

Example read-only preview, followed by explicit install:

```powershell
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "antigravity,gemini" --preset complete --dry-run
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "antigravity,gemini" --preset complete --yes
```

The original workspace-copy flow (`setup --runtime ...`) and advanced `init` are still supported. AI accounts, native trust and model permissions are not modified.

## Interactive setup (advanced / legacy)

From the target project directory:

```bash
npx xyeena-agent@latest init
```

The wizard asks for components (Skills / Harness / All), selected runtimes and Skills, selected Harness guardrail groups, and final confirmation. It shows required skill dependencies before installation. Nothing is preselected; cancellation writes no files.

## Explicit installation (including CI)

```bash
# Skills only for Codex; xyeena-core is included if required.
npx xyeena-agent@latest init --components skills --runtime codex --skills xyeena-interface --yes

# Harness only: Core and Security.
npx xyeena-agent@latest init --components harness --guards 00-core,60-security --yes

# Both components, expressly requested.
npx xyeena-agent@latest init --components all --runtime all --skills all --guards all --yes

# Preview all selections without writing files.
npx xyeena-agent@latest init --components all --runtime all --skills all --guards all --dry-run
```

To target another project directory, add `--dir PATH`. Non-interactive installation requires `--components`, the associated `--runtime` and `--skills` for Skills, `--guards` for Harness, and `--yes` for writes.

## Updating an existing Xyeena installation

When a previous `SKILL.md` differs from the release package, the new `setup` wizard shows the conflict instead of aborting unexpectedly. Choose **keep custom** (default) to install only missing files, or **backup and replace** to save originals in `.xyeena/backups/` before refreshing Xyeena-owned files.

Non-interactive usage:

```powershell
npx --yes xyeena-agent@0.4.0 setup --runtime antigravity --preset complete --harness full --update --dry-run
npx --yes xyeena-agent@0.4.0 setup --runtime antigravity --preset complete --harness full --update --yes
```

Without `--update`, customized files remain unchanged. No third-party skills are deleted. `--force` is deliberately rejected by beginner setup; use `--update` for recoverable replacements.

## Installed files

| Selection | Project-level output |
| --- | --- |
| Skills (Antigravity/Codex) | `.agents/skills/` |
| Skills (Claude Code) | `.claude/skills/` |
| Harness | `.xyeena/config.json`, `.xyeena/profile.md`, `.xyeena/harness/guides/` |
| Installation inventory | `.xyeena/install.json` |

Only required skill dependencies are added. Native agent definitions and rules are installed only when selected capabilities call for them. The installer does not silently replace root `AGENTS.md`, install Git hooks, or overwrite modified files. Repeated installs preserve selections; a user-modified destination requires an intentional `--force` to override.

## Diagnostics without installation

```bash
npx xyeena-agent@latest harness doctor
npx xyeena-agent@latest audit
npx xyeena-agent@latest scan
npx xyeena-agent@latest risk
```

`audit` and `scan` do not modify the project. `verify` is different: it explicitly executes available project-native checks. If no meaningful check ran, the result is **INCOMPLETE**, not PASS.

## Upgrading from 0.1.0

Version 0.1.0 used a legacy installer that could select every Skill by default. Version 0.2.0 changes this to explicit selection. Update automation using `--runtime` alone to include `--components`, `--skills` and `--yes` as appropriate. Harness is not a separate npm package; the existing `xyeena` command, Skill IDs (`xyeena-*`) and `.xyeena/` paths are still supported.

See the [CLI reference](CLI-REFERENCE.md), [brand guide](BRANDING.md), [architecture](ARCHITECTURE.md), and [security policy](../SECURITY.md).
