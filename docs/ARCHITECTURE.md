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

## 3. Cross-Domain Methodology Integration (DEC-32)

Superpowers and Anti-Slop are established as **cross-domain methodologies** spanning all 9 functional domains within Cortex:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CORTEX WORKFLOW GOVERNOR                        │
│                                                                        │
│   Superpowers (Universal Workflow)  │  Anti-Slop (Contextual Quality) │
│   • Brainstorming & Discovery       │  • Code comment hygiene         │
│   • Multi-Phase Architecture Plans  │  • Robotic copywriting audit    │
│   • TDD & Systematic Debugging      │  • WCAG 24px/44px touch targets │
│   • Evidence-Based Verification     │  • Mobile layout overflow check │
│   • Host-Native Subagent Delegation │  • Research fluff & noise check │
│                                                                        │
│  Applicable Domains:                                                   │
│  Core • Quality • Thinking • Engineering • Design • Security           │
│  Coordination • Knowledge • Extensibility • Delivery                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Superpowers as Universal Workflow Methodology:**
   - Contributes disciplined problem-sizing, phased planning, test-driven execution, and verification before completion across any domain (engineering, research, design, documentation, release).
   - Cortex remains the sole controller; Superpowers never takes over orchestration or injects redundant subagents.
2. **Anti-Slop as Universal Contextual Quality Methodology:**
   - Evaluates context-specific output quality across code, prose, layout, research citations, and security reports.
   - Evaluates domain-relevant criteria rather than blindly stripping words; does not act as a mandatory generative step on trivial micro-tasks.
3. **Execution Principle: Universal Applicability, Selective Execution:**
   - **Responsibility Boundaries:** Cortex is the exclusive workflow governor, router, and budget allocator. Superpowers provides methodology procedures; Anti-Slop provides evaluative quality gates. Neither acts as an independent background daemon.
   - **Trigger Contracts:** Positive triggers activate structured phases for complex or explicit requests (`/xyeena-*`, `/tdd`, `/antislop`). Negative triggers strictly exempt Tier-0 micro tasks, greetings, and trivial syntax lookups from overhead.
   - **Token Budget & Lazy Loading:** L0 Kernel $\le$ 1,500 tokens (actual 535–616); Tier-0 micro tasks $< 500$ tokens total; L1 context methods, L2 composites, and Behavioral Trait Overlays (~50–120 tokens) load strictly on demand.
   - **Precedence & Fallback:** Explicit user skill selection > Workspace rules > Repository conventions > Global defaults. All composites degrade to internal inline execution if subagents are unsupported.
   - **Evidence & Verification Boundary:** Fresh terminal/execution evidence is required before completion claims (DEC-31/32). Self-certified claims fail closed. Live host IDE hook enforcement remains unverified (`LIVE_BLOCKED`).

---

## 4. Core Architectural Invariants

1. **Single Workflow Governor (DEC-02, DEC-32):** Cortex is the sole workflow governor. Third-party skills (e.g. Superpowers, Superior, Anti-Slop) contribute methodology or specialist review, never competing control loops.
2. **Existing-Agent-First (DEC-03):** Host persona files (e.g. `.gemini/agents/`) are strictly read-only and never modified or replaced.
3. **L0 Kernel Budget Bound (DEC-04):** Core kernel prompt overhead is bounded $\le$ 1,500 tokens (empirically measured between 535 and 616 tokens).
4. **Contextual Quality / Anti-Slop (DEC-05, DEC-32):** Pure mathematical relative luminance contrast calculations (WCAG AA 4.5:1 / 3:1), regex comment hygiene, and contextual tone review without blanket wordlists blocking legitimate code keywords.
5. **Fail-Closed Security (DEC-06, DEC-14):** Scoped security reviews are passive; full security audits require explicit user command. Missing credentials or unverified host boundaries fail closed.
6. **Installer Safety Gate (DEC-26, DEC-29):** Files modified by users cannot be overwritten—even with `--force`—without explicit `--diff-approved-fingerprint`. Windows mode defaults to `copy`. Uninstall preserves custom files.

---

## 5. Validation Boundaries

Source validation comprises:
- Programmatic test suite: **687 / 687 PASS** across 74 test suites (`npm test`), including 17 P17 specialized platform intelligence tests, 21 P16 engineering intelligence & design closure tests, 12 P15 design intelligence tests, 12 P14 comparative validation tests, and 16 cross-domain composite tests.
- Manifest & contract validation: 19 packaged skills + 64 capability contracts (`npm run check`).
- Packed consumer smoke: tarball extraction and multi-host installation verification (`npm run test:consumer`).
- Vendored harness rules: 15 / 15 PASS (`npm run test:harness`).

Consult [Runtime Adapters](RUNTIME-ADAPTERS.md), [Security Policy](../SECURITY.md), and [Status](STATUS.md) for current host-native boundary evidence.
