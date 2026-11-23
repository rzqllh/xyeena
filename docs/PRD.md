# Veyra v1.0 — Product Requirements Document (PRD)

> **Status:** CANONICAL BASELINE (Wave 0 Complete)
> **Target Release:** v1.0.0 (Stable Only — DEC-32)
> **Product Identity:** All-in-One Skills + Harness Toolkit for Multi-Host AI Agents
> **Authority:** 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED) — See `docs/OWNER_DECISIONS.md`

---

## 1. Executive Summary

Veyra v1.0 delivers an integrated developer harness and a suite of 19 co-equal engineering skills designed to operate natively across Google Gemini / Antigravity IDE, OpenAI Codex, and Anthropic Claude Code. It unifies enterprise-grade governance, deterministic evidence gates, and cross-domain engineering intelligence with zero compulsory background daemons (DEC-18, DEC-22).

## 2. Core Capabilities & Architecture

### 2.1 Native Intent Discovery & Optional Governor (DEC-18, DEC-21, DEC-22)
- Native skill discovery based on task intent with explicit skill override capability.
- Native collaboration and optional governor: No mandatory background daemons or runtime locks.
- Transparent sequential fallback when native subagents are absent (DEC-23); zero simulated delegation.

### 2.2 19 Co-Equal Skills Across 6 Domains (DEC-09, DEC-35)
All 19 skills adhere to identical quality standards across all three target hosts:
- **Governance:** `veyra-core`, `veyra-context`, `veyra-handoff`
- **Discovery & Planning:** `veyra-research`, `veyra-grill`, `veyra-plan`, `veyra-architecture`
- **Engineering:** `veyra-execute`, `veyra-debug`, `veyra-prototype`
- **Quality & Security:** `veyra-test`, `veyra-review`, `veyra-verify`, `veyra-security`, `veyra-release`
- **Design & Content:** `veyra-interface`, `veyra-writing`
- **Meta & Orchestration:** `veyra-skillcraft`, `veyra-orchestrate`

### 2.3 Strict Superiority Gate & Proxy Policy (DEC-10..DEC-16)
- Evaluation criteria, thresholds, and metrics locked before benchmark runs (DEC-11).
- Capability-matched A/B/C testing against naive baseline, Veyra, upstream references, and legacy comparator (DEC-12).
- Proxy evaluation permitted only when native comparator is unexecutable (DEC-13).
- Proxy acceptance requires Owner approval and independent Codex review, tagged `PROXY_VALIDATED` (DEC-14).
- Conditional release permitted with transparent disclosures; event-driven revalidation enforced when blockers clear (DEC-15, DEC-16).

### 2.4 Multi-Host Native Architecture & Deployment (DEC-17, DEC-19, DEC-20, DEC-28, DEC-29, DEC-30)
- Verified native support on Gemini/Antigravity, Codex, and Claude Code (DEC-17).
- Workspace-first installation (DEC-19) via single platform-aware installer (DEC-29).
- Safe update, conflict preview, backup, rollback, and owned-file-only uninstall (DEC-20).
- Bundled runtime dependencies with online-first verification (DEC-28, DEC-30).

### 2.5 Security, Verification & Release Lifecycle (DEC-31, DEC-32, DEC-33, DEC-34)
- Advisory Security Gate: All vulnerabilities reported with severity and mitigation (DEC-31).
- Public release is Stable only (no public Alpha/Beta/RC) with verified criteria and Owner approval (DEC-32).
- Semantic Versioning + reversible migration documentation and rollback protection (DEC-33).
- Tiered verification during development; full matrix verification mandatory before Stable release (DEC-34).
