# Claude Code Repository Entry — Xyeena

When working in `rzqllh/xyeena`, follow [AGENTS.md](AGENTS.md) and [master-plan-141026.md](master-plan-141026.md).

- **Architecture:** Xyeena Rig is an All-in-One Skills + Harness toolkit powered by the **Cortex** native orchestration engine (DEC-27).
- **Settled Decisions:** DEC-01 through DEC-32 are locked and verified (723/723 tests PASS). Do not repeatedly grill the owner on settled decisions; execute routine engineering tasks autonomously under DEC-31.
- **Existing Agent First:** Personas on host disk are immutable and respected (DEC-03).
- **Installer Safety:** The installer enforces fail-closed protection for user-modified files via the Hybrid Diff Gate (DEC-26) and defaults to `copy` on Windows (DEC-29).
- **Escalation Boundary:** Require explicit human authorization before Git history rewrites, force-pushing, merging to main, releasing tags, or publishing to npm.
- **Evidence First:** Present empirical verification results, separate static/local checks from live host activation, and respect host permissions.
