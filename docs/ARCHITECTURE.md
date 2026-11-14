# Architecture

[Current source and host acceptance (2026-10-26)](STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

Xyeena Rig is an All-in-One Skills & Harness toolkit with **Cortex** as its native default orchestration intelligence layer. The architecture enforces separation of concerns across discovery, permission authority, intent routing, transactional installation, and evidence-grounded verification.

---

## 1. System Layers

| Layer | Primary Modules | Responsibility |
| :--- | :--- | :--- |
| **Intelligence (Cortex)** | `src/core/cortex.mjs`, `src/core/router.mjs`, `src/core/budget.mjs` | Default orchestration engine (DEC-27); resolves prompts to capability sets, decides execution tiers, and dispatches handlers |
| **Capability Registry** | `src/core/default-registry.mjs`, `src/core/registry.mjs`, `src/methods/` | Houses all 64 native capability contracts with concrete executable handlers across 9 functional domains |
| **Transactional Installer** | `src/installer/transaction.mjs`, `src/installer/decision-flow.mjs`, `src/installer/ownership.mjs` | Safe conditional installation (DEC-26, DEC-29); Hybrid Diff Gate, user modification lock, Windows copy default, and atomic rollback |
| **Inventory & Discovery** | `src/skill-hosts.mjs`, `src/workspace-skills.mjs` | Bounded host skill discovery, workspace vs global precedence, plugin provenance, and dependency closure |
| **Harness v3.1** | `src/rig-harness-lifecycle.mjs`, `src/harness.mjs`, `harness/` | Opt-in project guardrails, scope verification, contextual guidance, and pre/post-execution checks |
| **Task Execution & DAG** | `src/task-runner.mjs`, `src/task-graph.mjs`, `src/runtime/task-dag.mjs` | Bounded DAG execution, crash recovery, exclusive per-run locking with monotonic fence tokens, and anti-loop breakers |
| **Artifact Governance** | `src/runtime/artifact-governance.mjs` | Contextual persistence (DEC-30); atomic writing with automatic timestamp deduplication to prevent accidental overwrites |
| **Epistemic Evidence** | `src/core/evidence.mjs` | Strict evidence classification into CONTRACT_ONLY, BEHAVIOR_VERIFIED, COMPARATIVE_VERIFIED, and LIVE_HOST_VERIFIED (DEC-31) |

---

## 2. Control and Data Flow

```text
User Request / Prompt
       ↓
Cortex Intent & Domain Classification (router.mjs)
       ↓
Tier Decision:
  ├── TIER_0_MICRO (< 5ms, direct single-skill execution, zero ceremony)
  └── TIER_1_STANDARD / TIER_2_DEEP (composite skills, DAG execution, quality gates)
       ↓
Capability Resolution & Dependency Closure (resolver.mjs)
       ↓
Supporting Capability Budget Check (budget.mjs: maxSupporting <= 5)
       ↓
Handler Dispatch (default-registry.mjs / cortex.dispatch)
       ↓
Execution Boundary:
  ├── Inline / Local Native Methods (src/methods/*)
  ├── Host-Native Execution (Antigravity, Gemini, Codex, Claude, Hermes)
  └── Guarded External Delegation (Simpul MCP read-only / SDK bridge)
       ↓
Artifact Governance (atomic persistence only when requested/warranted)
       ↓
Epistemic Evidence Classification & Checkpoint State Persistence
```

---

## 3. Core Architectural Invariants

1. **Single Workflow Governor (DEC-02):** Cortex is the sole workflow governor. Third-party skills (e.g. Superpowers, Superior) contribute methodology or specialist review, never competing control loops.
2. **Existing-Agent-First (DEC-03):** Host persona files (e.g. `.gemini/agents/`) are strictly read-only and never modified or replaced.
3. **L0 Kernel Budget Bound (DEC-04):** Core kernel prompt overhead is bounded $\le$ 1,500 tokens (empirically measured between 535 and 616 tokens).
4. **Contextual Quality / Anti-Slop (DEC-05):** Pure mathematical relative luminance contrast calculations (WCAG AA 4.5:1 / 3:1), regex comment hygiene, and contextual tone review without blanket wordlists blocking legitimate code keywords.
5. **Fail-Closed Security (DEC-06, DEC-14):** Scoped security reviews are passive; full security audits require explicit user command. Missing credentials or unverified host boundaries fail closed.
6. **Installer Safety Gate (DEC-26, DEC-29):** Files modified by users cannot be overwritten—even with `--force`—without explicit `--diff-approved-fingerprint`. Windows mode defaults to `copy`. Uninstall preserves custom files.

---

## 4. Validation Boundaries

Source validation comprises:
- Programmatic test suite: **605 / 605 PASS** across 47 test suites (`npm test`).
- Manifest & contract validation: 19 packaged skills + 64 capability contracts (`npm run check`).
- Packed consumer smoke: tarball extraction and multi-host installation verification (`npm run test:consumer`).
- Vendored harness rules: 15 / 15 PASS (`npm run test:harness`).

Consult [Runtime Adapters](RUNTIME-ADAPTERS.md), [Security Policy](../SECURITY.md), and [Status](STATUS.md) for current host-native boundary evidence.
