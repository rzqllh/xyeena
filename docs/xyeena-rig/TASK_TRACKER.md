# Enterprise task tracker

Status means observed repository implementation, not generic product readiness.

| ID | Priority | Task | State | Source/evidence |
| --- | --- | --- | --- | --- |
| E01-01 | P0 | Compact single root skill with internal Xyeena modules | CODED | src/compact-setup.mjs |
| E01-02 | P0 | Dry-run, explicit confirmation, duplicate host path handling | CODED | test/compact-setup.test.mjs |
| E01-03 | P0 | Ownership, tamper protection, idempotent backup upgrade | CODED | test/compact-setup.test.mjs |
| E01-04 | P1 | Automatic legacy migration + restore/uninstall CLI | TODO | Requires migration journal and safety tests |
| E02-01 | P0 | Compact native orchestrator fallback | CODED | src/orchestrator.mjs |
| E02-02 | P1 | Superior/Superpowers candidate detection | VERIFIED | src/enterprise-policy.mjs, test/enterprise-policy.test.mjs |
| E02-03 | P0 | Host-native plugin/extension inventory and verification | VERIFIED | src/skill-hosts.mjs, src/workspace-skills.mjs |
| E02-04 | P1 | Semantic local skill match / deterministic fallback | VERIFIED | src/workspace-skills.mjs, test/workspace-skills.test.mjs |
| E04-01 | P0 | Superpowers bootstrap/lifecycle arbitration | VERIFIED | src/enterprise-policy.mjs, arbitrateWorkflow |
| E05-01 | P0 | Always-core declarative policy, contextual proposals | VERIFIED | src/enterprise-policy.mjs, src/rig-harness-lifecycle.mjs |
| E05-02 | P0 | Executable Harness pre/post tool enforcement | VERIFIED | HarnessExecutionGate, preToolGate, postToolGate |
| E06-01 | P0 | Verified-only Simpul/native backend preference, inline fallback | VERIFIED | src/enterprise-policy.mjs, selectSubagentBackend |
| E06-02 | P0 | Real Simpul MCP transport / recovery / cancellation | VERIFIED | createSimpulMcpAdapter, submit_goal, get_task_evidence |
| E06-04 | P0 | Real-adapter-only dispatch contract, bounded execution and independent verification | VERIFIED | src/live-backend.mjs; test/live-backend.test.mjs |
| E06-03 | P0 | Native IDE subagent live invocation and isolation | VERIFIED | createNativeSubagentAdapter, real workerId, non-nested |
| E07-01 | P0 | Independent evidence verification on task graph | VERIFIED | src/task-runner.mjs, postToolGate evidence checks |
| E07-02 | P1 | Cross-host checkpoint, replay, loop breaker | PARTIAL | Existing guided + ledger |
| E08-01 | P0 | CI test/pack/consumer matrix | PASS (source head de2deacc) | GitHub Actions run 39867943667: 9/9 jobs green |
| E08-02 | P0 | Actual five-host reload/activation acceptance | BLOCKED | Needs configured test machines |

## Chat-to-engineering reconciliation (R01–R15)

The full 1:1 status and acceptance crosswalk lives in [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md). The entries below close documentation gaps surfaced by the audit; they are **not completed features**.

| ID | Priority | Additional tracked work | State | Why open |
| --- | --- | --- | --- | --- |
| E01-05 | P1 | Legacy slash aliases/skill-ID compatibility after compact migration; collision-safe cutover | TODO | R11 / A29 — live host compatibility |
| E01-06 | P1 | Owned uninstaller and automated rollback/restore with fault-injection tests | TODO | R12 / A30 — rollback journal, recovery |
| E02-05 | P0 | Enumerate plugin/extension registries and effective host trust, enablement, provenance, platform, precedence | VERIFIED | R01 / A21 — pluginLocations & workspace-skills discovery |
| E02-06 | P0 | Capability dedup, dependency composition, conflict resolver, deterministic minimal skill load | VERIFIED | R02 / A22 — closure check, collision precedence & shadowed list |
| E04-02 | P0 | Superior specialist policy vs Superpowers lifecycle/bootstrap; no overlapping workflow owners | VERIFIED | R03 / A23 — arbitrateWorkflow single-governor and deduplication tests |
| E04-03 | P0 | Native parity fallback when third-party provider missing, disabled, unhealthy or untrusted | VERIFIED | R04 / A24 — NATIVE_EQUIVALENCE, nativeFallbackForSkill, all 8 provider cases |
| E05-03 | P0 | Harness gates propagate to workers and revalidate before each write/tool action | VERIFIED | R05 / A25 — delegateWorker non-escalation & audit test |
| E06-05 | P0 | Hard per-run token/cost/concurrency limits and provider usage accounting | VERIFIED | R08 / A26 — ResourceBudgetLedger limit enforcement tests |
| E07-03 | P0 | Durable task DAG checkpoints, idempotent resume/lease, bounded retry, crash cleanup across hosts | TODO | R09 / A27 — kill/restart/fault injection |
| E07-04 | P0 | Real host permission/verification evidence chain with independent auditor | VERIFIED | R10 / A28 — Allow Once/Deny/Answer Questions and boundary tests |
| E08-03 | P1 | Full red-team/security, plugin spoofing and multi-runtime end-to-end test suite | TODO | R14 / A32 — threat/test matrix |
| E08-04 | P1 | Release notes, npm artifact verification, version bump, signed verdict, authorized publish | TODO | R15 / A33 — no release without signoff |

The CI PASS in E08-01 covers repository source and packed smoke only; E08-02, E08-03 and E08-04 remain distinct release gates. Never mark an E item COMPLETE from an R checkbox alone.
