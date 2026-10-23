# Phase P04 Evidence: Simpul & Native Subagent Integration

**Phase ID:** P04  
**Scope:** R06, R07, R08 — Simpul MCP Adapter Contract, Host-Native Subagent Adapter, Resource Budget Ledger, Parallel Write Worktree Isolation, Non-Nested Spawning  
**Base Branch:** `feat/rig-enterprise-p03-harness` (commit `3dfae86`)  
**Feature Branch:** `feat/rig-enterprise-p04-subagents`  
**Target PR Base:** `feat/rig-enterprise-p03-harness`  
**Date:** 2026-10-23  
**Status:** VERIFIED  

---

## 1. Summary of Changes

1. **Simpul MCP Adapter (`createSimpulMcpAdapter` in `src/live-backend.mjs`):**
   - Connects to Simpul (SubagentBridge) FastMCP candidate control plane (aligned with upstream PR #2 & #3).
   - Probes server health, verifies capabilities (`noNestedDelegation: true`, `supportsWrites: true`, `supportsParallel: true`).
   - Invokes `submit_goal` with `{ goal, workspace_path, model }` (no client-fabricated run_id or policy_revision). Receives server-assigned `run_id` and initial `SUBMITTED`/`PENDING` state.
   - Polls run status using `get_run(run_id)`.
   - Fetches evidence via `get_task_evidence({ run_id, task_id })`.
   - Queries `get_model_usage` to account for token/micro-cost consumption.
   - Cleans up and aborts failed/cancelled tasks via `cancel_run(run_id)`.
   - Enforces human-in-the-loop security architecture: no synthetic autonomous self-approval tool exists over MCP.
   - Upstream candidate does not yet autonomously execute workers to completion; classified as INTEGRATION_VERIFIED; LIVE_BLOCKED.

2. **Host-Native Subagent Adapter (`createNativeSubagentAdapter` in `src/live-backend.mjs`):**
   - Implements host runner interface for Antigravity / Gemini / Claude / Codex environments.
   - Requires real host runner worker IDs from `runner.spawn()`; rejects synthetic/fabricated strings.
   - Probes host availability and declares capabilities (`supportsWrites`, `supportsParallel`) via `runner.status()`.
   - Supports clean worker cancellation and process termination via host cancellation API.
   - Enforces non-nested execution and Harness policy propagation.

3. **Resource Budget Ledger (`ResourceBudgetLedger` in `src/live-backend.mjs`):**
   - Enforces token ceilings (`tokenLimit`), micro-cost limits (`costLimitMicro`), and concurrency ceilings (`maxConcurrency`).
   - Performs upfront budget checking via `checkBudget()` before task dispatch, preventing over-budget executions upfront.
   - Tracks active worker count and audits usage history per task.

4. **Parallel Write Worktree Isolation Enforcement (`dispatchScopedTask`):**
   - Enforces that write tasks (`readOnly: false`) without verified worktree isolation (`isolatedWorktrees !== true`) are strictly serialized (`parallelism = 1`).
   - Only isolated worktrees may execute parallel writes.

5. **Test Suite Expansion (`test/live-backend.test.mjs`):**
   - Unit test suites verifying `createSimpulMcpAdapter` probe, execution, evidence collection, and cancellation.
   - Unit test suites verifying `createNativeSubagentAdapter` probe, execution, host runner worker IDs, and cancellation.
   - Unit test suites verifying `ResourceBudgetLedger` upfront token and concurrency limit enforcement.

---

## 2. Verification Evidence

### Automated Test Runs
- `npm test`: **252 / 252 PASS** (0 failed, 0 skipped)
- `npm run check`: **PASS** (19 capabilities + runtime manifests verified)
- `npm run eval`: **PASS** (18/18 evaluated scenarios)
- `npm run test:harness`: **PASS** (15/15 harness contracts)
- `npm run test:consumer`: **PASS** (workspace copy + user-global symlink installs from npm tarball)
- `npm pack --dry-run`: **PASS** (241 files, 178.0 kB packed size)

---

## 3. Requirements & Acceptance Matrix Status

- **R06:** INTEGRATION_VERIFIED; LIVE_BLOCKED (E06-02; A14) — Real Simpul FastMCP adapter contract with health probe, goal dispatch (`submit_goal`), run query (`get_run`), evidence retrieval (`get_task_evidence`), and `cancel_run`. Live execution blocked pending upstream execution supervisor.
- **R07:** INTEGRATION_VERIFIED (E06-03; A15, A16) — Host-native subagent adapter with real host runner worker IDs, non-nested delegation, capability probing, and cancellation cleanup.
- **R08:** CI_PASS (E06-01, E06-04, E06-05; A14a, A16, A26) — ResourceBudgetLedger upfront limit checks enforce token/cost/concurrency ceilings; unisolated writes serialized.

---

## 4. Remediation Record (Commit d530e5c)

- **Simpul Contract Alignment:** Aligned parameter signatures with SubagentBridge FastMCP candidate (`submit_goal(goal, workspace_path, model)`, `get_run`, `get_task_evidence(run_id, task_id)`, `cancel_run(run_id)`). Eliminated invented run IDs.
- **Host Runner Worker IDs:** Eliminated `native-${task.id}-...` fabricated IDs; requires real host runner worker identity and cancellation API.
- **Upfront Budget Ceilings:** `checkBudget()` blocks over-budget tasks before execution starts.
- **CI Verification:** GitHub Actions run [39891855092](https://github.com/rzqllh/xyeena/actions/runs/39891855092) — **9/9 jobs PASS** across Windows, macOS, Ubuntu on Node 22.14 & 24.

