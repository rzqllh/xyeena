# Veyra v1.0 — Architecture Specification

> **Status:** CANONICAL BASELINE (Wave 0 Complete)
> **System Category:** Multi-Host Agent Harness & Skills Architecture
> **Authority:** 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED) — See `docs/OWNER_DECISIONS.md`

---

## 1. System Topology & Layers

Veyra v1.0 is organized into four distinct architectural tiers:

```
+-------------------------------------------------------+
|                   HOST RUNTIME TIER                   |
|   Gemini / Antigravity  |  OpenAI Codex  | Claude Code|
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+
|             NATIVE ADAPTER & DISCOVERY TIER           |
|   Intent-Based Discovery (DEC-21) | Explicit Override |
|   Thin CLI Installer (DEC-18)     | Workspace-First   |
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+
|          NATIVE COLLABORATION & GOVERNOR TIER         |
|   Native Collaboration (DEC-22)   | Optional Governor |
|   Sequential Fallback (DEC-23)    | No Fake Subagents |
|   Portable Checkpoint (DEC-24)    | Safe Recovery     |
+-------------------------------------------------------+
                           |
+-------------------------------------------------------+
|               19 CO-EQUAL SKILLS LAYER                |
|   Governance (3)         | Discovery & Planning (4)   |
|   Engineering (3)        | Quality & Security (5)     |
|   Design & Content (2)   | Meta & Orchestration (2)   |
+-------------------------------------------------------+
```

## 2. Invariant Architecture Principles

1. **Native Intent Discovery & Collaboration (DEC-21, DEC-22):** Skills are discovered via task intent with explicit override. Collaboration uses host-native capabilities with an optional governor. No foreign background daemons or compulsory locks.
2. **Transparent Sequential Fallback (DEC-23):** When native host subagents are absent, tasks fall back transparently and sequentially. Fabricating subagent swarms or simulated delegation is strictly prohibited.
3. **Multi-Host Parity & Native Context (DEC-17, DEC-24, DEC-35):** Full capability equivalence across Gemini, Codex, and Claude Code supported by native host context and a lightweight portable checkpoint (`CHECKPOINT.md`).
4. **Strict Superiority Gate & Proxy Discipline (DEC-10..16):** Pre-locked criteria; capability-matched evaluation; proxy exceptions requires Owner and Codex sign-off (`PROXY_VALIDATED`).
5. **Safe Packaging, Bundles & Rollback (DEC-18, DEC-20, DEC-28, DEC-29):** Thin CLI with selective install, platform-aware bundles for Windows/macOS/Linux, conflict preview, and automated rollback preserving local edits.
6. **Dual Provenance Architecture (DEC-01, DEC-02):**
   - **Archive Payload Integrity:** Local file payload verified 100% via SHA-256 against manifest.
   - **GitHub Commit Alignment:** Exact pinned commit SHAs in `references/upstreams.lock.json` with online recovery.
7. **SemVer & Reversible Migration (DEC-33):** Breaking changes strictly managed via major releases, migration documentation, and verified rollback procedures.
8. **Tiered Verification & Full Host Matrix (DEC-34):** Verification progresses through development tiers (L1 static -> L2 unit/contract -> L3 integrated behavior -> L4 live host). Full matrix pass across all target hosts is mandatory prior to Stable release.
