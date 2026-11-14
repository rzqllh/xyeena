# Xyeena Rig System Design

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

---

## 1. Boundary Model

Xyeena Rig is a portable orchestration and skill toolkit powered by the **Cortex** native intelligence engine. The host runtime retains authority over tool execution, authentication, user trust and live model sessions.

```text
User / Host Session
     ↓ (host trust, native permissions)
Skill / Plugin Inventory → Dependency and Eligibility Resolver
     ↓
Cortex Native Workflow Governor (Single Controller)
     ↓ (routes to 64 native capability contracts or composite skills)
Harness Preflight and Host-Backed Execution Gates
     ↓ (only when real adapter and authority are available)
Inline Executor / Host-Native Worker / Optional Simpul MCP
     ↓
Independent Acceptance Checker → Checkpoint / Review / Guarded Resume
```

---

## 2. Implementation Modules

| Layer | Files | Contract |
| :--- | :--- | :--- |
| **Intelligence** | `src/core/cortex.mjs`, `src/core/router.mjs` | Cortex default intelligence engine; intent classification and handler dispatch |
| **Capabilities** | `src/core/default-registry.mjs`, `src/methods/` | 64 native capability contracts with bound executable handlers across 9 domains |
| **Discovery** | `src/skill-hosts.mjs`, `src/workspace-skills.mjs` | Enumerate bounded host locations; distinguish detected from enabled/trusted |
| **Arbitration** | `src/enterprise-policy.mjs`, `src/orchestrator.mjs` | Route eligible capabilities under one workflow owner |
| **Harness** | `src/rig-harness-lifecycle.mjs`, `src/harness.mjs` | Enforce scope and acceptance only when trusted host integration is present |
| **Workers** | `src/live-backend.mjs` | Probe actual execution readiness; use real worker handles and fail safely |
| **Recovery** | `src/task-runner.mjs`, `src/runtime/checkpoint.mjs` | DAG/checkpoint, bounded retry, lease control, and reconciliation |
| **Installer** | `src/installer/transaction.mjs`, `src/installer/ownership.mjs` | Hybrid Diff Gate (DEC-26), Windows copy default (DEC-29), backups, and safe rollback |
| **Governance** | `src/runtime/artifact-governance.mjs` | Adaptive persistence (DEC-30); atomic write deduplication |

Third-party Superpowers and Superior Skills are optional. They supply eligible methodologies or specialist knowledge, not alternate workflow owners. Simpul is a separate optional execution transport whose upstream supervisor is not yet live-accepted.

---

## 3. Security and Correctness Invariants

1. Host-discovered content cannot grant authority.
2. Human consent must originate in a trusted host boundary; a self-issued token is insufficient.
3. Unsupported privileged execution fails closed.
4. Concurrent shared writes are serialized unless independent isolation is established.
5. Worker terminal state and identity come from the execution adapter.
6. A model-generated PASS claim or arbitrary evidence file cannot satisfy an independent acceptance criterion.
7. Resume and rollback cannot silently replay unauthorized side effects.
8. Installer operations preserve files without demonstrable Xyeena ownership and lock user-modified files against overwrites.

---

## 4. Deployment Limitations

Automated contracts and CLI/sandbox smoke tests pass on supported CI operating systems. Their results are not evidence that each IDE's live tool interception, worker lifecycle and approval dialogs have been exercised. See [Runtime Adapters](../RUNTIME-ADAPTERS.md), [Security](../../SECURITY.md), and [Status](../STATUS.md).
