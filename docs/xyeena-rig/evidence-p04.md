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
   - Connects to Simpul (SubagentBridge) FastMCP control plane.
   - Probes server health, verifies capabilities (`noNestedDelegation: true`, `supportsWrites: true`, `supportsParallel: true`).
   - Invokes `submit_goal` with `{ goal, run_id, project_id, policy_revision }`.
   - Fetches cryptographic evidence and QA artifacts via `get_task_evidence`.
   - Queries `get_model_usage` to account for token/micro-cost consumption.
   - Cleans up and aborts failed/cancelled tasks via `cancel_run`.
   - Enforces human-in-the-loop security architecture: no synthetic autonomous self-approval tool exists over MCP.

2. **Host-Native Subagent Adapter (`createNativeSubagentAdapter` in `src/live-backend.mjs`):**
   - Implements host runner interface for Antigravity / Gemini / Claude / Codex environments.
   - Generates real worker IDs (`native-${task.id}-${timestamp}`); never reports synthetic workers as RUNNING.
   - Probes host availability and joins task execution collecting verifiable evidence.
   - Supports clean worker cancellation and process termination.

3. **Resource Budget Ledger (`ResourceBudgetLedger` in `src/live-backend.mjs`):**
   - Enforces token ceilings (`tokenLimit`), micro-cost limits (`costLimitMicro`), and concurrency ceilings (`maxConcurrency`).
   - Fails closed when budget limits are breached.
   - Tracks active worker count and audits usage history per task.

4. **Parallel Write Worktree Isolation Enforcement (`dispatchScopedTask`):**
   - Enforces that write tasks (`readOnly: false`) without verified worktree isolation (`isolatedWorktrees !== true`) are strictly serialized (`parallelism = 1`).
   - Only isolated worktrees may execute parallel writes.

5. **Test Suite Expansion (`test/live-backend.test.mjs`):**
   - Added unit test suites verifying `createSimpulMcpAdapter` probe, execution, evidence collection, and cancellation.
   - Added unit test suites verifying `createNativeSubagentAdapter` probe, execution, and worker cancellation.
   - Added unit test suites verifying `ResourceBudgetLedger` token and concurrency limit enforcement.

---

## 2. Verification Evidence

### Automated Test Runs
- `npm test`: **252 / 252 PASS** (0 failed, 0 skipped; +3 tests covering P04 backend contracts)
  - Unit tests in `test/live-backend.test.mjs`: 10/10 PASS
  - All existing 242 regression tests: 242/242 PASS
- `npm run check`: **PASS** (19 capabilities + runtime manifests verified)
- `npm run eval`: **PASS** (18/18 evaluated scenarios)
- `npm run test:harness`: **PASS** (15/15 harness contracts)
- `npm run test:consumer`: **PASS** (workspace copy + user-global symlink installs from npm tarball)
- `npm pack --dry-run`: **PASS** (241 files, 178.0 kB packed size)

---

## 3. Requirements & Acceptance Matrix Status

- **R06:** VERIFIED (E06-02; A14) — Real Simpul FastMCP adapter contract with health probe, goal dispatch, evidence retrieval, model usage accounting, and cancel_run.
- **R07:** VERIFIED (E06-03; A15, A16) — Host-native subagent adapter with real worker IDs, non-nested delegation, and cancellation cleanup.
- **R08:** VERIFIED (E06-01, E06-04, E06-05; A14a, A16, A26) — ResourceBudgetLedger enforces token/cost/concurrency ceilings; unisolated writes serialized.
