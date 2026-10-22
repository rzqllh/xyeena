# Enterprise task tracker

Status means observed repository implementation, not generic product readiness.

| ID | Priority | Task | State | Source/evidence |
| --- | --- | --- | --- | --- |
| E01-01 | P0 | Compact single root skill with internal Xyeena modules | CODED | src/compact-setup.mjs |
| E01-02 | P0 | Dry-run, explicit confirmation, duplicate host path handling | CODED | test/compact-setup.test.mjs |
| E01-03 | P0 | Ownership, tamper protection, idempotent backup upgrade | CODED | test/compact-setup.test.mjs |
| E01-04 | P1 | Automatic legacy migration + restore/uninstall CLI | TODO | Requires migration journal and safety tests |
| E02-01 | P0 | Compact native orchestrator fallback | CODED | src/orchestrator.mjs |
| E02-02 | P1 | Superior/Superpowers candidate detection | CODED | src/enterprise-policy.mjs |
| E02-03 | P0 | Host-native plugin/extension inventory and verification | TODO | Needs per-host adapter |
| E02-04 | P1 | Semantic local skill match / deterministic fallback | TODO | Never mandatory paid inference |
| E04-01 | P0 | Superpowers bootstrap/lifecycle arbitration | TODO | Must avoid two governors |
| E05-01 | P0 | Always-core declarative policy, contextual proposals | CODED | src/enterprise-policy.mjs |
| E05-02 | P0 | Executable Harness pre/post tool enforcement | TODO | One-shot runner currently read-only |
| E06-01 | P0 | Verified-only Simpul/native backend preference, inline fallback | CODED | src/enterprise-policy.mjs |
| E06-02 | P0 | Real Simpul MCP transport / recovery / cancellation | TODO | Integration absent |
| E06-03 | P0 | Native IDE subagent live invocation and isolation | TODO | SDK delegation is a separate one-shot |
| E07-01 | P0 | Independent evidence verification on task graph | PARTIAL | Existing src/task-runner.mjs |
| E07-02 | P1 | Cross-host checkpoint, replay, loop breaker | PARTIAL | Existing guided + ledger |
| E08-01 | P0 | CI test/pack/consumer matrix | PENDING | Await PR CI results |
| E08-02 | P0 | Actual five-host reload/activation acceptance | BLOCKED | Needs configured test machines |
