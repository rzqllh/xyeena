# Xyeena Rig system design

[Current source and host acceptance (2026-10-26)](../STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

## Boundary model

Xyeena Rig is a portable orchestration and skill toolkit. The host runtime retains authority over tool execution, authentication, user trust and live model sessions.

```text
User / host
    ↓  host trust, native permissions
Skill / plugin inventory → dependency and eligibility resolver
    ↓
Single Xyeena workflow governor
    ↓  optional specialist skills or native fallback
Harness preflight and host-backed execution gates
    ↓  only when real adapter and authority are available
Inline executor / host-native worker / optional Simpul MCP
    ↓
Independent acceptance checker → checkpoint / review / guarded resume
```

## Implementation

| Layer | Files | Contract |
| --- | --- | --- |
| Discovery | `src/skill-hosts.mjs`, `src/workspace-skills.mjs` | Enumerate bounded host locations; distinguish detected from enabled/trusted |
| Arbitration | `src/enterprise-policy.mjs`, `src/orchestrator.mjs` | Route eligible capabilities under one workflow owner |
| Harness | `src/rig-harness-lifecycle.mjs` | Enforce scope and acceptance only when trusted host integration is present |
| Workers | `src/live-backend.mjs` | Probe actual execution readiness; use real worker handles and fail safely |
| Recovery | `src/task-runner.mjs` | DAG/checkpoint, bounded retry, lease control and reconciliation |
| Install | `src/setup*.mjs`, `src/compact-setup.mjs` | Preview, ownership-checked updates, backups and rollback |

Third-party Superpowers and Superior Skills are optional. They supply eligible methodologies or specialist knowledge, not alternate workflow owners. Simpul is a separate optional execution transport whose upstream supervisor is not yet live-accepted.

## Security and correctness invariants

1. Host-discovered content cannot grant authority.
2. Human consent must originate in a trusted host boundary; a self-issued token is insufficient.
3. Unsupported privileged execution fails closed.
4. Concurrent shared writes are serialized unless independent isolation is established.
5. Worker terminal state and identity come from the execution adapter.
6. A model-generated PASS claim or arbitrary evidence file cannot satisfy an independent acceptance criterion.
7. Resume and rollback cannot silently replay unauthorized side effects.
8. Installer operations preserve files without demonstrable Xyeena ownership.

## Deployment limitations

Automated contracts and CLI/sandbox smoke tests pass on supported CI operating systems. Their results are not evidence that each IDE's live tool interception, worker lifecycle and approval dialogs have been exercised. See [Runtime adapters](../RUNTIME-ADAPTERS.md), [Security](../../SECURITY.md) and [Acceptance](ACCEPTANCE_MATRIX.md).
