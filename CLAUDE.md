# Claude Code Repository Entry — Xyeena

When working in `rzqllh/xyeena`, follow [AGENTS.md](AGENTS.md) and [master-plan-141026.md](master-plan-141026.md).

- **Architecture:** Xyeena Rig is an All-in-One Skills + Harness toolkit powered by the **Cortex** native orchestration engine.
- **Settled Decisions:** DEC-01 through DEC-31 are locked. Do not repeatedly grill the owner on settled decisions; execute routine tasks autonomously.
- **Installer Safety:** The installer enforces fail-closed protection for user-modified files via the Hybrid Diff Gate (DEC-26) and defaults to `copy` on Windows (DEC-29).
- **Escalation Boundary:** Require explicit human authorization before Git history rewrites, force-pushing, merging to main, releasing tags, or publishing to npm.
- **Evidence First:** Present empirical verification results, separate static/local checks from live host activation, and respect host permissions.
