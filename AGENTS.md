# Xyeena Repository Agent Instructions — Reconciled Guidelines

These instructions guide AI agents working in the `rzqllh/xyeena` repository. They do not authorize destructive operations, overwrite host personas, or bypass explicit user consent boundaries.

## Repository State & Architecture Authority

1. **Reconciled Master Plan:** Read [master-plan-141026.md](master-plan-141026.md) and [future roadmap](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md). All 32 owner decisions (DEC-01 to DEC-32) are locked and authoritative. The initial remote reconciliation seed and grill rounds have been completed, verified with 723/723 tests PASS across 75 test suites.
2. **Product Identity:** Xyeena Rig is an **All-in-One Skills + Harness** toolkit. It is **not** a fleet of independent XYN subagents.
3. **Engine:** **Cortex** is the native default intelligence layer (DEC-27). It executes lightweight tasks directly (< 5ms) and routes complex tasks through composite skills, DAG planning, and quality gates.
4. **Settled Decisions:** Technical decisions DEC-01 through DEC-32 have already been decided and implemented/verified. **Do not repeat grill or interrogation loops** for settled architecture and engineering routines.
5. **Existing Agent First & Persona Protection:** Existing host personas and instructions (`.gemini/agents/`, `.agents/personas/`, etc.) are read-only and immutable (DEC-03). Third-party and host tools are respected. Never overwrite or reconfigure user agent personas.
6. **Scope Discipline & Selective Loading:** Small always-on core (L0 budget $\le$ 1,500 tokens). Domain-specific capabilities are lazy-loaded on demand (DEC-04). Trivial micro tasks are strictly exempt from planning ceremony.
7. **Delegated Authority & Human Boundaries:** Execute routine engineering, bug fixes, refactoring, and documentation updates autonomously within approved scope (DEC-31). Escalate only for:
   - High-impact destructive operations (e.g. Git history rewriting, force-pushing, branch deletion).
   - npm package publication or release tagging.
   - Material changes to legal licensing or third-party provenance.
   - Modification of global host configurations outside workspace boundaries.
8. **Installer Safety:** The installer enforces the Hybrid Diff Gate (DEC-26) with baseline ownership checks, requires `--diff-approved-fingerprint` to modify user files, defaults to `copy` on Windows (DEC-29), preserves custom files on uninstall, and verifies automatic rollback.
9. **Evidence First:** Maintain strict epistemic evidence standards (DEC-07, DEC-31, DEC-32). Distinguish between `CONTRACT_ONLY`, `BEHAVIOR_VERIFIED`, `COMPARATIVE_VERIFIED`, and `LIVE_HOST_VERIFIED`. Label host runtime hooks truthfully (`HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`).
