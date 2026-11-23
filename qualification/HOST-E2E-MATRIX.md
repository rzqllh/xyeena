# Veyra v1.0 Native Host End-to-End Verification Matrix

> **Generated:** 2026-11-23T09:01:21.110Z  
> **Status:** `CONDITIONAL_PASS` (1 Live Host Verified, 2 Hosts Not Available Locally)  
> **Authority:** DEC-17 (Multi-Host Compatibility), DEC-34 (Tiered Verification)

---

## 1. Host Availability & Environment Inventory

| Host Environment | Executable / Platform | Detection Status | Evidence Tier | Qualification Result |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini CLI / Antigravity** | `gemini` v0.68.0 on Windows 11 (Node v24) | **AVAILABLE** | `LIVE_HOST_VERIFIED` | **PASS (8/8 Tests)** |
| **OpenAI Codex CLI** | `codex` CLI binary | **NOT DETECTED** | `NOT_RUN_HOST_UNAVAILABLE` | **EXTERNAL_REVIEW_PENDING** |
| **Anthropic Claude Code CLI** | `claude` CLI binary | **NOT DETECTED** | `NOT_RUN_HOST_UNAVAILABLE` | **EXTERNAL_REVIEW_PENDING** |

---

## 2. Gemini / Antigravity E2E Test Execution Summary

| Test ID & Description | Observed Verification Result | Execution Evidence | Status |
| :--- | :--- | :--- | :--- |
| **1. Install Veyra & verify 19 skills** | Installed 76 files across 19 skills; Verification intact: 76 | Local isolated scratch execution | `VERIFIED` |
| **2. Native discovery & skill selection** | Verified 5/5 multi-language intent routings | Local isolated scratch execution | `VERIFIED` |
| **3. Scoped filesystem permissions & fencing** | Allowed in-scope write; blocked out-of-scope config edit and path traversal escape | Local isolated scratch execution | `VERIFIED` |
| **4. Multi-step planning & Kahn-DAG dependency validation** | Valid acyclic plan verified; circular dependency correctly detected and blocked | Local isolated scratch execution | `VERIFIED` |
| **5. Destructive operations approval boundary** | Destructive DELETE requires explicit Owner approval per DEC-08 & DEC-31 | Local isolated scratch execution | `VERIFIED` |
| **6. Context compaction & portable handoff serialization** | Context compressed from 397 to 389 bytes; state resumed accurately (RESUME_TASK: TASK_1 - Run benchmarks) | Local isolated scratch execution | `VERIFIED` |
| **7. Cryptographic execution receipts & forgery defense** | Real process granted LIVE_HOST_VERIFIED with HMAC signature; forged receipt rejected | Local isolated scratch execution | `VERIFIED` |
| **8. Installer safety: preserves user files & modified Veyra files on uninstall** | User file and modified Veyra file preserved; unmodified files cleanly removed | Local isolated scratch execution | `VERIFIED` |

---

## 3. Host Compatibility Boundary Assessment

1. **Gemini CLI / Antigravity:** Fully operational native integration. 19/19 skills discovered via `.agents/skills/` and `skills/`, intents resolved accurately, cryptographic receipts signed with HMAC, and installer rollback protects user data.
2. **OpenAI Codex CLI:** CLI binary is not present in local execution environment. In accordance with operational constraints, no external software or paid subscriptions were installed. Independent review package is prepared for external verification.
3. **Anthropic Claude Code:** CLI binary is not present in local execution environment. Tracked as `NOT_RUN_HOST_UNAVAILABLE`.
