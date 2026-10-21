# Xyeena Rig — Global installation and symlink mode

## One command for beginners

Install Node.js **22.14 or later** from https://nodejs.org. Open any normal terminal, then enter:

~~~sh
npx --yes xyeena-agent setup
~~~

Select:

1. **Global** = your AI can find the skills across all projects. **Workspace** = only this project.
2. Your AI app(s): Antigravity, Gemini CLI, Codex, Claude Code, Hermes Agent.
3. Skills preset: Essential / Balanced / Complete.
4. **Global** uses Copy automatically in the beginner wizard. **Workspace** asks Copy or Symlink and optionally offers project Harness. Both show the exact paths and request confirmation.

No administrator privileges, Git clone, API key, Git hook installation, or environment-variable edits are required for this installer.

**Copy** means each chosen AI directory receives its own skill folders. This is the easiest first-time method and does not depend on any central files.

**Symlink** means every chosen AI directory contains folder links to a shared, **permanent** source at <user home>/.xyeena/skill-store/v<VERSION>/. On Windows, folder links are created as junctions to avoid requiring Developer Mode in typical setups. The installer first copies the actual skill data from the npm package into the durable user-home store. Your npx cache can be cleared later without breaking it.

### Global directories — actual host-specific destinations

| AI host | Global user-scoped location |
| --- | --- |
| Antigravity IDE / app | ~/.gemini/config/skills/ |
| Gemini CLI | ~/.gemini/skills/ |
| OpenAI Codex | ~/.agents/skills/ |
| Claude Code | ~/.claude/skills/ |
| Hermes Agent | ~/.hermes/skills/ or the active HERMES_HOME profile's configured skills.create_dir |

These are **five independent AI host locations**, not one pretend universal folder. Antigravity **CLI** separately uses ~/.gemini/antigravity-cli/skills/ and is not included when you select the Antigravity IDE target. Select the application you actually use. Hermes profiles outside the user home are rejected for safety until explicitly configured within the home. Existing trust, quarantine, disabled-skill and user-provider settings remain under the native AI host's control.

Official provider documentation:
- Antigravity global IDE skills: https://www.antigravity.google/docs/skills?tab=ide
- Gemini CLI user skills: https://geminicli.com/docs/cli/using-agent-skills/

### Terminal examples — optional, not required for beginners

~~~powershell
# Preview a global Antigravity installation
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --dry-run

# Install after reviewing paths
npx --yes xyeena-agent setup --scope global --runtime antigravity --preset complete --yes

# Use symlinks for global Gemini CLI and Hermes (PowerShell: quote comma-separated names)
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "gemini,hermes" --preset complete --dry-run
npx --yes xyeena-agent setup --scope global --mode symlink --runtime "gemini,hermes" --preset complete --yes

# Or symlink to the permanent store for one workspace
npx --yes xyeena-agent setup --scope workspace --mode symlink --runtime antigravity --preset essential --yes
~~~

Omitting --scope / --mode in **non-interactive** commands preserves the old default: workspace + copy. The interactive beginner wizard uses Global → Copy by default, while Workspace offers Copy/Symlink. Global symlink remains an **advanced CLI-only** option using explicit `--scope global --mode symlink`.

### Existing skills, conflicts, and upgrading

- Dry runs and wizard review make no changes.
- An unrelated skill folder is never deleted. If a selected name already exists but differs from the package, Xyeena preserves it by default. To replace it, review and approve --update; the original is backed up before replacement.
- Foreign symlinks/junctions (links not owned by Xyeena) are blocked, even with --update.
- Managed Xyeena symlinks pointing to older version snapshots may be replaced with --update, preserving the previous link target as backup metadata.
- Links and package content are never fetched from an ephemeral npx cache at runtime; links point only to the stable user-home store.
- Workspace Harness files remain **workspace-only**. Global-only installation requires --harness none, because copying guardrail documents to a global directory does not automatically activate project-specific enforcement.
- The existing "setup rollback" journal applies to **workspace copy installations**; portable global/symlink backups are reported separately and should be restored manually after inspection. Do not delete store snapshots while other installed symlinks still reference them.

### Confirm installation

~~~powershell
npx --yes xyeena-agent skills matrix
npx --yes xyeena-agent setup check --runtime antigravity
~~~

The installer now also checks packaged skill contents in each destination after a global install and reports the matching count and path per host. This is **filesystem verification**, not proof of in-session agent activation. Both commands inspect metadata without invoking a model. To confirm the host actually loaded a skill, reopen the AI app and use its native skill listing; in Antigravity check Customizations, in Gemini CLI use /skills list. Native runtime permissions and folder trust are not modified by setup.

### Troubleshooting

| Symptom | Resolution |
| --- | --- |
| npm cannot find xyeena-agent | Verify Node >=22.14 and network access; run npx --yes xyeena-agent version. |
| Windows PowerShell separates runtime names | Put quotes around e.g. "antigravity,codex". |
| Symlink path points somewhere else | The installer refuses foreign links. Inspect them and decide how to migrate manually. |
| Global skill already exists | Default is to keep it. Review --dry-run and choose --update only if you want a backup + replacement. |
| Hermes profile is outside the home | Configure HERMES_HOME/skills.create_dir within your home; no silent writes to external drives. |
| Global skill appears in matrix but not the AI | Reload app and check the native discovery UI, permissions, and version-specific directories. |
| Node.js or AI host not installed | Install Node and the intended AI app separately; Xyeena only installs Skills/Harness. |
