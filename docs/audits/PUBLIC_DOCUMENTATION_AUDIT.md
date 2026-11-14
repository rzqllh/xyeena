# P11 — Public Documentation Audit & Rewrite Report

**Date:** 2026-11-14
**Scope:** Complete repository documentation review across all 28 maintained documents against actual source code, CLI implementation, and 31 locked owner decisions.

---

## 1. Documentation Review Summary

All 28 maintained public documents have been audited against the actual source implementation (`src/cli.mjs`, `src/core/default-registry.mjs`, `src/installer/transaction.mjs`, `src/runtime/artifact-governance.mjs`). Inaccuracies, stale assumptions, duplicated links, and documentation drift have been systematically corrected.

| Document | Pre-Audit Condition | Post-Audit Status | Key Changes Made |
| :--- | :--- | :--- | :--- |
| `README.md` | Stale v0.4 description; no mention of Cortex or 64 capability contracts; installer safety missing | **REWRITTEN** | Added Cortex as native default intelligence layer; documented 19 packaged skills vs 64 native capability contracts; detailed transactional installer (DEC-26/DEC-29) and adaptive governance (DEC-28/DEC-30); maintained npm v0.4.1 baseline distinction. |
| `docs/README.md` | Incomplete navigation; missing links to bugs & future roadmaps | **REWRITTEN** | Reorganized into 4 logical sections (Guides, Architecture, Operations, Future); added links to `docs/bugs&refinement/` and `docs/future/`. |
| `docs/ARCHITECTURE.md` | Outdated component table omitting Cortex, transactional installer, and artifact governance | **REWRITTEN** | Added Cortex intelligence layer, 64 capability contracts across 9 domains, transactional installer engine, adaptive artifact governance, and L0 kernel budget invariants. |
| `docs/CAPABILITY-CONTRACT.md` | Minimal 24-line stub; lacked inventory of 64 capabilities and epistemic tiers | **REWRITTEN** | Comprehensive inventory of all 64 capabilities in 9 functional domains; detailed machine schema (`capability.json`); defined the 4 epistemic evidence tiers (DEC-07/DEC-31). |
| `docs/CLI-REFERENCE.md` | Missing new transactional commands (`install`, `uninstall`, `repair`, `cortex status`, `cortex inspect`) | **REWRITTEN** | Added complete syntax for `xyeena install`, `uninstall`, `repair`, `cortex status`, `cortex inspect`, `resolve`, and diff approval flags matching `src/cli.mjs`. |
| `docs/STATUS.md` | Accurate historical test assertions but lacked P00–P10.2 rebuild outcomes | **REWRITTEN** | Preserved all mandatory test assertions (`Antigravity CLI 1.4.7`, `Antigravity IDE 2.5.5`, `LIVE BLOCKED`, `LIVE PARTIAL`, issues 34/36/37); added verified rebuild metrics (605/605 PASS, 64 capabilities bound, installer safety). |
| `docs/BRANDING.md` | Omitted Cortex engine; unclear role of Axioven | **REWRITTEN** | Clarified brand hierarchy: Xyeena (Brand), Xyeena Rig (Product), Cortex (Engine), `xyeena-agent` (Package), Axioven (Historical rebuild codename). |
| `docs/EVALS.md` | Contained duplicate link `[Support and release status](../STATUS.md)` in footer | **REWRITTEN** | Removed duplicate markdown link; updated layered evaluation table with current 605 PASS test metrics and contract validation checks. |
| `docs/xyeena-rig/ARCHITECTURE.md` | Omitted Cortex and 64 capability contracts | **REWRITTEN** | Modernized system design diagram and implementation table; preserved core security invariants. |
| `docs/xyeena-rig/RUNBOOK.md` | Lacked instructions for new transactional installer | **REWRITTEN** | Added transactional install/repair/uninstall procedures; preserved required phrases (`git worktree add --detach`, `ops preflight --dir`). |
| `CHANGELOG.md` | Ended at historical 2026-10-26 unreleased changes | **REWRITTEN** | Added comprehensive `## Unreleased — P00-P10.2 Rebuild Foundation (2026-11-14)` entry documenting Cortex, 64 capabilities, installer safety, and governance. |
| `NOTICE.md` | Claimed original implementation without vendoring | **VERIFIED** | Verified accurate; confirms research influences and establishes that upstream source has NOT yet been vendored locally (Grill Round 1–2). |
| `SECURITY.md` | Policy on trust models and sandboxing boundaries | **VERIFIED** | Verified accurate; reinforces fail-closed enforcement and epistemic evidence requirements. |
| `CONTRIBUTING.md` | Guide for project contributors | **VERIFIED** | Verified accurate; aligns with PR submission standards, code checks, and verification requirements. |
| `master-plan-141026.md` | Reconciled master architecture and strategic roadmap | **RECONCILED** | Locked DEC-01 to DEC-31; established Cortex default; integrated upstream roadmap pointer and provenance ledger. |
| `AGENTS.md` | Guidance for repository AI agents | **RECONCILED** | Aligned with settled decisions; removed repetitive grill loops; reinforced delegated authority boundaries. |
| `CLAUDE.md` | Claude Code CLI entrypoint | **RECONCILED** | Mirrors settled architectural decisions, evidence standards, and delegated scope boundaries. |
| `GEMINI.md` | Gemini CLI & Antigravity entrypoint | **RECONCILED** | Mirrors settled architectural decisions, evidence standards, and delegated scope boundaries. |
| `docs/GETTING-STARTED.md` | Beginner guide | **VERIFIED** | Verified accurate; maintains npm v0.4.1 baseline and points to source runbook for rebuild features. |
| `docs/INSTALL-WINDOWS-PEMULA.md` | Indonesian Windows beginner guide | **VERIFIED** | Verified accurate; explains Copy vs Symlink and Windows junction safety (DEC-29). |
| `docs/GLOBAL-INSTALL.md` | Global installation and host paths | **VERIFIED** | Verified accurate; details per-host directories across Antigravity, Gemini, Codex, Claude, Hermes. |
| `docs/INTELLIGENT-ROUTING.md` | Routing and skill candidates | **VERIFIED** | Verified accurate; aligns with Cortex router and single governor principle (DEC-02/DEC-27). |
| `docs/ORCHESTRATION.md` | Task model and recovery | **VERIFIED** | Verified accurate; aligns with DAG runner and checkpointer (DEC-08/DEC-12). |
| `docs/RUNTIME-ADAPTERS.md` | Host adapters and limits | **VERIFIED** | Verified accurate; documents host skill roots and one-shot cancellation (DEC-14/DEC-17). |
| `docs/ANTIGRAVITY-GUIDED.md` | Guided hooks and probe | **VERIFIED** | Verified accurate; details native denial probe and runner integrity (DEC-24). |
| `docs/bugs&refinement/README.md` | Index for repository defect tracking | **VERIFIED** | Links to active defect tracking and resolution ledgers. |
| `docs/bugs&refinement/FINDINGS.md` | Historical P0–P3 defect findings ledger | **VERIFIED** | Verified resolution of historical issues through P00–P10.2 rebuild foundation. |
| `docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md` | Comprehensive upstream integration roadmap | **VERIFIED** | Documents planned All-in-One integration phases, selective upstream reuse, and provenance boundaries. |

*(Note: `docs/future/UPSTREAM_PROVENANCE_TEMPLATE.md` provides the reusable provenance ledger template supporting `XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md`).*

---

## 2. Link Integrity Verification

Ran programmatic link checker `test/public-docs.test.mjs`:
- **Result:** 4 / 4 PASS (Duration ~109ms).
- Zero broken relative markdown links across all 28 maintained documents.
- Zero retired internal dossiers reintroduced into `docs/xyeena-rig/`.
