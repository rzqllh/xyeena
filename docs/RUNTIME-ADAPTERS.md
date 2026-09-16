# Runtime Adapters

Xyeena keeps portable capability semantics separate from host packaging.

## Antigravity

Portable project skills install under `.agents/skills/`. Xyeena also installs a project rule under `.agents/rules/xyeena-core.md` so the kernel behavior is available without a slash command. The source repository includes a root `plugin.json` so it can evolve as a native Antigravity plugin.

## Claude Code

Portable project skills install under `.claude/skills/`. The source repository includes `.claude-plugin/plugin.json` and marketplace metadata for native-plugin packaging.

## Codex

Portable project skills install under `.agents/skills/`. The source repository includes `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`, following the same high-level shape used by current Codex plugin repositories.

## Policy

The npm installer is the conservative cross-runtime path. Native plugin manifests are shipped as source metadata, but each native marketplace flow should be dogfooded in that runtime before being advertised as verified.
