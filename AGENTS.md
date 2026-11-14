# Xyeena Repository Agent Instructions — Reconciled Guidelines

These instructions guide AI agents working in the `rzqllh/xyeena` repository. They do not authorize destructive operations, overwrite host personas, or bypass explicit user consent boundaries.

## Repository State & Architecture Authority

1. **Reconciled Master Plan:** Read [master-plan-141026.md](master-plan-141026.md) and [future roadmap](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md). All 31 owner decisions (DEC-01 to DEC-31) are locked and authoritative.
2. **Product Identity:** Xyeena Rig is an **All-in-One Skills + Harness** toolkit. It is **not** a fleet of independent XYN subagents.
3. **Engine:** **Cortex** is the native orchestration intelligence layer (DEC-27). It is active by default on supported host integrations, executing lightweight tasks directly (< 5ms) and routing complex tasks through composite skills, DAG planning, and quality gates.
4. **Settled Decisions:** Technical decisions DEC-01 through DEC-31 have already been decided and implemented/verified. **Do not repeat grill or interrogation loops** for settled architecture and engineering routines.
5. **Delegated Authority:** Execute routine engineering, bug fixes, refactoring, and documentation updates autonomously within approved scope. Escalate only for:
   - High-impact destructive operations (e.g. Git history rewriting, force-pushing, branch deletion).
   - npm package publication or release tagging.
   - Material changes to legal licensing or third-party provenance.
   - Modification of global host configurations outside workspace boundaries.
6. **Installer Safety:** The installer enforces the Hybrid Diff Gate (DEC-26) with baseline ownership checks, requires `--diff-approved-fingerprint` to modify user files, defaults to `copy` on Windows (DEC-29), preserves custom files on uninstall, and verifies rollback.
7. **Evidence First:** Maintain strict epistemic evidence standards (DEC-31). Distinguish between `CONTRACT_ONLY`, `BEHAVIOR_VERIFIED`, `COMPARATIVE_VERIFIED`, and `LIVE_HOST_VERIFIED`. Label host runtime hooks truthfully (`HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`).
