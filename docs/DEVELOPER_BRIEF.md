# Veyra v1.0 — Developer Brief & Operational Mandates

> **Status:** INTEGRATED CANONICAL BASELINE
> **Authority:** Canonical Owner Decisions DEC-01 through DEC-35 (LOCKED)
> **Target Hosts:** Google Gemini CLI / Antigravity IDE, OpenAI Codex, Anthropic Claude Code

---

## 1. Project Mission & Identity

Veyra v1.0 is an **All-in-One Skills + Harness** toolkit built natively for multi-host AI agents. It is designed to eradicate AI code-slop, eliminate context loss during long workflows, enforce enterprise governance, and provide 19 co-equal engineering skills across all target platforms without requiring third-party background daemon runtimes.

## 2. Core Operational Mandates (DEC-01 s/d DEC-35)

1. **Owner Decisions First (DEC-07):** All implementation, architecture, and behavior adhere strictly to the 35 Locked Owner Decisions. Material ambiguities or scope deviations must be escalated to the Owner.
2. **Approved Scope Autonomy (DEC-03, DEC-08):** Autonomous execution is authorized exclusively within approved scope. Destructive operations, architectural shifts, security changes, or scope expansions require explicit Owner approval.
3. **19 Co-Equal Skills (DEC-09, DEC-35):** All 19 skills operate under identical quality standards across Gemini, Codex, and Claude Code:
   - **Governance:** `veyra-core`, `veyra-context`, `veyra-handoff`
   - **Discovery & Planning:** `veyra-research`, `veyra-grill`, `veyra-plan`, `veyra-architecture`
   - **Engineering:** `veyra-execute`, `veyra-debug`, `veyra-prototype`
   - **Quality & Security:** `veyra-test`, `veyra-review`, `veyra-verify`, `veyra-security`, `veyra-release`
   - **Design & Content:** `veyra-interface`, `veyra-writing`
   - **Meta & Orchestration:** `veyra-skillcraft`, `veyra-orchestrate`
4. **Strict Superiority Gate & Proxy Policy (DEC-10..DEC-16):**
   - Evaluation criteria locked before benchmark execution.
   - Capability-matched comparison against naive baseline, Veyra, upstream reference, and legacy comparator.
   - Proxy evaluations allow conditional release with Owner & Codex approval, carrying status `PROXY_VALIDATED`.
   - Event-driven revalidation required when blocked comparators become executable.
5. **Multi-Host Native Support (DEC-17, DEC-18, DEC-19, DEC-35):**
   - Verified live execution across Gemini, Codex, and Claude Code.
   - Thin CLI installer, workspace-first installation, optional governor, zero compulsory daemons.
   - Transparent sequential fallback when native subagents are absent (DEC-23); no simulated delegation.
6. **Provenance & Release Discipline (DEC-27, DEC-31, DEC-32, DEC-33, DEC-34):**
   - License-aware reuse, bundled runtime dependencies, platform-aware single installer (DEC-28, DEC-29).
   - Advisory Security Gate: All vulnerabilities reported with severity and mitigation (DEC-31).
   - Public release is Stable only (no public Alpha/Beta/RC) under SemVer + Migration (DEC-32, DEC-33).
   - Tiered verification in development; full target host matrix pass mandatory before Stable release (DEC-34).
