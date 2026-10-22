# Xyeena Rig — enterprise orchestration workstream

Owner: Xyeena Rig. Repository: rzqllh/xyeena.
This directory is the single, versioned source of truth for Rig enterprise integration. The chat backlog R01–R15 must remain synchronized with [requirements traceability](REQUIREMENTS_TRACEABILITY.md), existing E task IDs and A acceptance IDs; a feature is not complete merely because its design is recorded.

| Artifact | Purpose |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | Phase order and dependencies |
| [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) | **Chat R01–R15 ↔ task/acceptance crosswalk and omission checklist** |
| [TASK_TRACKER.md](TASK_TRACKER.md) | Delivery task status and scope |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Workflow, harness, provider and execution boundaries |
| [ACCEPTANCE_MATRIX.md](ACCEPTANCE_MATRIX.md) | Testable outcome and live-host gate |
| [RISK_REGISTER.md](RISK_REGISTER.md) | Operational and security risks |
| [EVIDENCE.md](EVIDENCE.md) | Evidence of claims and unverified areas |
| [RUNBOOK.md](RUNBOOK.md) | Preview, install, test and recovery commands |

## Invariants

1. Xyeena Rig owns the task workflow; there is only one governor per run.
2. Superior, Superpowers and Simpul are optional. Missing providers never block Xyeena native fallback.
3. Skill discovery is read-only and never confers trust, permission or model activation.
4. Rig core authorization/scope/evidence boundaries are always required; project-specific Harness remains opt-in.
5. Real workers and independently checked evidence are required for worker and VERIFIED claims.
6. No silent takeover of user skills, host trust settings, hooks or permission controls.
7. Local-first deterministic routing; no required API tokens or unnecessary auto-parallelism.

## Delivery posture

This initial implementation adds an opt-in compact installer, provider candidate policy and backend selection policy. The existing flat installer is preserved. **Enterprise-wide integration is not complete.** See acceptance and tracking before treating this as a release approval.
