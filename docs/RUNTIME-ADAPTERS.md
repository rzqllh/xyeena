# Runtime adapters and supported hosts

Xyeena Rig supports five agent hosts for skill packaging, inventory and routing. Their native trust and activation models differ. A filesystem-compatible installation is **not** proof of live host integration.

| Host | Workspace skill roots | Typical global skill roots | Integration status |
| --- | --- | --- | --- |
| Antigravity | `.agents/skills/` | `~/.gemini/config/skills/` | Skill inventory, guided-hook installer, optional SDK one-shot; native live validation required |
| Codex | `.agents/skills/` | `~/.agents/skills/` | Skill inventory and read-only one-shot path; host authority remains native |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` | Skill inventory and restricted one-shot path |
| Gemini CLI | `.gemini/skills/` or `.agents/skills/` | `~/.gemini/skills/` | Inventory and Plan-mode one-shot path |
| Hermes | `.hermes/skills/` or `.agents/skills/` | `~/.hermes/skills/` | Inventory and safe headless path; project skill trust is host-controlled |

Paths vary with host version, platform and profile configuration; use `skills matrix` and `setup check` for observed roots.

## Native plugin metadata

The repository includes `plugin.json`, `.claude-plugin/`, `.codex-plugin/`, and `.agents/plugins/`. Marketplace recognition, effective enablement, and execution privileges require independent validation in the respective host.

## Headless execution

The orchestration and host-run commands start new sessions using restricted host modes. They do not attach to an existing conversation. Optional Antigravity SDK execution needs a separate Python SDK and credentials. Always review provider cost, scope, sandboxing, and approval policies before running a model.

## Harness and worker availability

Harness operation gates are a reusable library boundary. For privileged actions, the host must provide a trusted approval and interception mechanism; unavailable integrations remain fail-closed. Simpul protocol support does not imply the remote supervisor can execute work. The caller must verify real worker lifecycle, cancellation and evidence.

See [Installation](GETTING-STARTED.md), [Architecture](ARCHITECTURE.md) and [Security](../SECURITY.md).
