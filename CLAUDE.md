# Claude Code Repository Entry — Xyeena

When working in `rzqllh/xyeena`, follow [AGENTS.md](AGENTS.md) and [master-plan-141026.md](master-plan-141026.md).

- **Architecture:** Xyeena Rig is an All-in-One Skills + Harness toolkit powered by the **Cortex** native orchestration engine (DEC-27).
- **Settled Decisions:** DEC-01 through DEC-32 are locked and recorded (release-candidate CI: 723 pass, 3 skipped, 0 fail on Ubuntu Node 24 across 75 suites). Reconciliation between desktop and remote is resolved; execute routine engineering tasks autonomously under DEC-31 without repeated grill loops.
- **Existing Agent First & Persona Protection:** Personas and agent instructions on host disk (`.gemini/agents/`, `.agents/personas/`, etc.) are read-only and immutable (DEC-03). Never overwrite personas or activate unapproved host hooks.
- **Single Governor:** Cortex is the exclusive workflow governor; third-party methods provide procedures and quality gates, never competing control loops.
- **Installer Safety:** The installer enforces fail-closed protection for user-modified files via the Hybrid Diff Gate (DEC-26) and defaults to `copy` on Windows (DEC-29).
- **Escalation Boundary:** Require explicit human authorization before Git history rewrites, force-pushing, merging to main, releasing tags, or publishing to npm.
- **Evidence First:** Present empirical verification results, separate static/local checks from live host activation, and respect host permission boundaries.
