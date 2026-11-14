# Xyeena Repository Agent Instructions — Future-Plan Discovery

These are repository-local guidance instructions. They **do not** authorize changes, override higher-priority host instructions, change existing agents/personas or activate any third-party tools.

## On owner-initiated Xyeena audit / source-alignment / release-readiness review

1. Read [master-plan-141026.md](master-plan-141026.md) and [future roadmap](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md), as well as current code and existing accepted decisions. The master-plan file is a **remote reconciliation seed** until an original desktop copy is inspected and merged.
2. First verify desktop-local vs remote git branch/HEAD, ancestry, diffs, working tree, blueprint and P08 results. **Remote/local alignment is a prerequisite for activating the future plan.** A matching branch name alone is not evidence.
3. If NOT aligned: report the exact mismatch and safe fetch/merge/reconcile steps; DO NOT execute future-plan implementation, copy upstream code, open PR, rewrite local master plan, force-push or alter installed host agents.
4. If aligned: compare actual source to plan, give a succinct evidence-based gap assessment, then **GRILL THE OWNER** with up to **5 prioritized material decisions** per round. Include options, recommendation, trade-offs, and explicit consent boundary. Record APPROVED/REJECTED/DEFERRED decisions. Do not assume unanswered choices are approvals.
5. Only after explicit owner approval for the relevant work may implementation proceed; preserve license/NOTICE and source-level provenance of reused files. No automated npm publish, deployment, global host changes or third-party installer.
6. If the task is unrelated to this future-plan audit, do **not** interrogate the user about the roadmap or load large reference dossiers unnecessarily.

The owner wants Xyeena as **Skills + Harness**, not named XYN subagents. Support existing-agent-first, selective skill loading, evidence-based verification, and full security audit explicit-only. The future roadmap includes /xyeena-design source composition, Konoha RE-31 and behavioral personality traits without character names. Files on GitHub cannot guarantee automatic reading by every AI platform: explicitly inspect them when repository audit is requested.
