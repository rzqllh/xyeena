# Architecture — capability discovery to verified outcome

## Layers

- **Host:** Antigravity, Codex, Claude Code, Gemini CLI, Hermes. Owns authentication, tool permissions and effective skill loading.
- **Governor:** Xyeena Rig. One controller, one task DAG, one permission/evidence policy.
- **Optional skill providers:** Superior (specialist quality, design), Superpowers (workflow methodology). Skills are not by themselves worker runtimes.
- **Optional worker backend:** Simpul (formerly SubagentBridge) or the host's native subagent system, but only with proved healthy execution adapters. Otherwise inline.
- **Harness:** Core Rig operation boundary must always hold. More project Harness guides remain opt-in; metadata alone is not proof of hook execution.

## Full target flow

1. Resolve runtime, working root, trust and scoped authorization.
2. Discover only host-registered skill/plugin roots (never entire disks).
3. Classify actual availability, disabled state, trust, platform and execution eligibility; unknown does not become enabled.
4. Infer task intent, choose one workflow owner, lazily select smallest relevant specialist set, resolve dependencies and conflicting bootstraps.
5. Apply core Harness gates; activate contextual installed project policy for the task risk.
6. Route inline or to real Simpul/native backend after health and permission checks. Parallelize only safe independent work; writes require proven separate worktree isolation.
7. Dispatch real bounded task context, capture real identifiers/status/cost.
8. Verify tests and evidence independently; no result self-assertions.
9. Commit run ledger and checkpoint; bounded repair or escalation. External actions remain consent-gated.

## Compact layout

Host-visible: `<skills-root>/xyeena-rig/SKILL.md`.

Native modules are nested reference resources under `xyeena-rig/references/skills/xyeena-*/`.
They are **not** independently host-discovered slash skills. The root directs an eligible host to load selected references lazily.

`xyeena setup compact` is opt-in because defaulting this layout, removing old aliases and migrating existing managed installs requires cross-host acceptance. Old flat folders remain untouched.

## Current execution limits

Existing `orchestrate run --yes` starts a new **read-only one-shot** host call with explicit consent; it is not the active IDE conversation. `buildEnterprisePolicy` describes rather than executes actions. `selectSubagentBackend` requires an explicitly healthy and actionable adapter in the supplied availability input; the planner does not create workers. Plugin identity, live Simpul transport and broad Harness runtime enforcement remain pending.
