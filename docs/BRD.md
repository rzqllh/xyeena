# Veyra v1.0 — Business Requirements Document (BRD)

> **Status:** CANONICAL BASELINE (Wave 0 Complete)
> **Target Audience:** Engineering Leads, Enterprise Auditors, Security Governance
> **Authority:** 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED) — See `docs/OWNER_DECISIONS.md`

---

## 1. Business Drivers & Objectives

Enterprise engineering teams utilizing LLM coding agents encounter four critical operational challenges:
1. **Uncontrolled Hallucination & Code Bloat:** Generative slop, superficial comments, and invented test results degrade repository maintainability.
2. **Context Loss & Workflow Drift:** Compaction drifts cause architectural misalignment and repetition of settled debates.
3. **Platform Fragmentation:** Disparate agent harness setups across Gemini, Codex, and Claude create operational silos.
4. **License & Provenance Risk:** Unchecked copying of external code threatens copyright compliance and introduces unvetted runtimes.

Veyra v1.0 mitigates these risks through:
- **Full Enterprise Governance (DEC-05):** Comprehensive change control, approval workflows, and auditability.
- **Independent Codex Review (DEC-06):** Risk-based second-pass review for critical milestones and architecture shifts.
- **Owner Decisions First (DEC-07):** Authoritative decision register eliminating circular debates.
- **Approved Scope Autonomy (DEC-03, DEC-08):** Autonomous execution confined to approved scope; deviations halted immediately.
- **Strict Superiority Gate & Proxy Discipline (DEC-10..16):** Pre-locked criteria; proxy results never conflated with empirical superiority.
- **Capability-Equivalent Native Support (DEC-17, DEC-35):** Parity across Gemini, Codex, and Claude with zero compulsory background daemons.
- **Controlled Release & Security (DEC-31..34):** Advisory security gate, Stable-only public release, SemVer + migration rollback, and full target host matrix verification.

## 2. Governance & Compliance Requirements

### 2.1 Owner Authority & Decision Provenance
- All architectural and behavioral boundaries are governed by the 35 Canonical Owner Decisions (DEC-01 through DEC-35).
- Upstream references remain strictly `REFERENCE_ONLY` (DEC-27).

### 2.2 Dual Provenance Verification
- Local archive payload integrity verified cryptographically via SHA-256 against manifest (DEC-01).
- Upstream git tree alignment verified via pinned commit SHAs with automatic online recovery (DEC-02).
