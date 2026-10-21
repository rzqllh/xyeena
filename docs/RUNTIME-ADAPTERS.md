# Xyeena Rig runtime adapters

Rig keeps portable capability semantics separate from host packaging.

## Antigravity

Portable project skills install under `.agents/skills/`. Xyeena also installs a project rule under `.agents/rules/xyeena-core.md` so the kernel behavior is available without a slash command. The source repository includes a root `plugin.json` so it can evolve as a native Antigravity plugin.

## Claude Code

Portable project skills install under `.claude/skills/`. The source repository includes `.claude-plugin/plugin.json` and marketplace metadata for native-plugin packaging.

## Codex

Portable project skills install under `.agents/skills/`. The source repository includes `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`, following the same high-level shape used by current Codex plugin repositories.

## Policy

The npm installer is the conservative cross-runtime path. Native plugin manifests are shipped as source metadata, but each native marketplace flow should be dogfooded in that runtime before being advertised as verified.

## Gemini CLI (opt-in)

Gemini CLI loads workspace skills from `.gemini/skills/` or the cross-tool alias `.agents/skills/`, and global skills from `~/.gemini/skills/` or `~/.agents/skills/`. The alias takes precedence at the same scope. Only skills explicitly installed by the user are copied to `.gemini/skills/`. Native host approval and enabling remain under Gemini CLI control.

## Hermes Agent (opt-in)

Hermes loads project skills from `.hermes/skills/` and `.agents/skills/` inside the nearest Git repository, and profile skills from `~/.hermes/skills/`. It also supports category-nested skills and `skills.external_dirs` in `~/.hermes/config.yaml`. A project must be trusted by Hermes before its skills are available; Xyeena reports untrusted candidates but excludes them from routing. The user must manage trust through `hermes skills trust`, not through Xyeena.

These new hosts are added to the **selective installer** only. Historical `--runtime all` continues targeting Antigravity, Claude, and Codex. Use `--runtime all-supported` to explicitly opt into all five runtimes. Discovery and routing are available before installing anything.
