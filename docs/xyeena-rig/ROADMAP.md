# Roadmap — Unified Enterprise Rig

**Baseline:** `origin/main` commit `4f0fa5e`, `v0.4.1` (2026-10-23).  
**Target:** Enterprise-Ready Xyeena Rig, independently verified and ready for authorized release (`0.5.0`).  
**Status:** All engineering phases P01–P08 completed and verified.

---

## 1. Enterprise Phase Roadmap

| Phase | Branch | Objective & Key Capabilities | Requirements | Acceptance | Status |
| --- | --- | --- | --- | --- | --- |
| **P01** | `feat/rig-enterprise-p01-discovery` | Unified skill discovery across 5 runtimes, plugin enumeration, provenance, collision precedence, and dependency closure | R01, R02 | A11, A18, A21, A22 | **CI_PASS** ([PR #18](https://github.com/rzqllh/xyeena/pull/18)) |
| **P02** | `feat/rig-enterprise-p02-skill-orchestration` | Superpowers & Superior arbitration, single governor (`xyeena-rig`), deduplicated roles, 8-case native parity fallback | R03, R04 | A10, A23, A24 | **CI_PASS** ([PR #19](https://github.com/rzqllh/xyeena/pull/19)) |
| **P03** | `feat/rig-enterprise-p03-harness` | Executable Harness enforcement, `HarnessExecutionGate`, workspace containment, non-escalation, Allow Once / Deny / Question | R05, R10 | A12, A13, A25, A28 | **CI_PASS** ([PR #20](https://github.com/rzqllh/xyeena/pull/20)) |
| **P04** | `feat/rig-enterprise-p04-subagents` | Simpul FastMCP adapter, host-native subagent adapter, `ResourceBudgetLedger`, unisolated write serialization, fallback priority | R06, R07, R08 | A14, A14a, A15, A16, A26 | **INTEGRATION_VERIFIED; LIVE_BLOCKED** ([PR #21](https://github.com/rzqllh/xyeena/pull/21)) |
| **P05** | `feat/rig-enterprise-p05-recovery` | `DurableCheckpointStore` atomic save/load, smart resume suggestion, unconsumed worker result reclaiming, anti-loop breaker | R08, R09, R10 | A16, A17, A26, A27, A28 | **CI_PASS** ([PR #22](https://github.com/rzqllh/xyeena/pull/22)) |
| **P06** | `feat/rig-enterprise-p06-installer` | Compact installer lifecycle, ownership-aware 19-skill migration, user notes preservation, slash aliases index, rollback journal | R11, R12 | A05, A06, A08, A29, A30 | **CI_PASS** ([PR #23](https://github.com/rzqllh/xyeena/pull/23)) |
| **P07** | `feat/rig-enterprise-p07-hardening` | Adversarial prompt-injection resistance, null-byte path defense, secret credential sanitization, anti-recursion depth guard | R13, R14 | A18, A19, A20, A31, A32 | **FIXTURE_PASS; LIVE_BLOCKED** ([PR #24](https://github.com/rzqllh/xyeena/pull/24)) |
| **P08** | `feat/rig-enterprise-p08-release` | Enterprise release candidate, documentation sync, package verification, independent QA verdict, and release runbook | R15 | A19, A20, A33 | **CONDITIONAL_GO** ([PR #25](https://github.com/rzqllh/xyeena/pull/25)) |

---

## 2. Release Gates Summary

- **G0 — Scope:** Explicit runtime, workspace, consent, dry run, and third-party preservation -> **MET** (P01, P06).
- **G1 — Inventory:** Observed and enabled/trusted states distinct; provenance tracked -> **MET** (P01).
- **G2 — Execution:** Verified adapter, capabilities, and non-escalating worker boundaries -> **MET** (P03, P04).
- **G3 — Reliability:** Durable checkpoints, unconsumed result reclaiming, anti-loop breakers -> **MET** (P05).
- **G4 — Security & Hardening:** Red-team tests, path traversal defense, secret sanitization -> **MET** (P07).
- **G5 — Release Packaging:** Tarball smoke, consumer install, reproducibility, and release candidate verdict -> **MET** (P08).
