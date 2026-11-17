# Gemini CLI continuity checkpoint — Xyeena v1

> Purpose: keep a source-backed handoff across Gemini CLI chat compaction.
> This file is a *working protocol*, not a proof that a model read it or that v1 passed tests.
> Updated: 2026-11-17. Repo: `rzqllh/xyeena`. Working branch: `feat/v1-skill-system-rebuild`. Draft PR: https://github.com/rzqllh/xyeena/pull/75.

## 1. First action after starting or compacting a session

1. Read `GEMINI.md`, `AGENTS.md`, this file, `docs/v1/IMPLEMENTATION_STATUS.md`, and the affected implementation/test files **from the actual checkout**. These are instructions, not substitutes for inspecting code.
2. Run `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and check the PR/CI for the **exact SHA**. If working branch, files, or HEAD differ from this document, trust current Git state and report the discrepancy; do not discard local changes.
3. Separate `OBSERVED` (logs, tools, changed files), `INFERRED` (analysis), `NOT_VERIFIED`, and `BLOCKED`. Never turn a compaction summary, prior assistant statement, mock, or unit test into a host-execution receipt.
4. Work on the smallest unverified functional gap; write failing regression first if practical; change code only when a concrete issue and proof of improvement exist. Avoid unnecessary frameworks, agents, dependencies, and documentation duplication.
5. At any stopping point, update the implementation ledger with the tested commit, exact command, exit status, evidence location, failing gates, and next smallest task. Do not overwrite earlier evidence.

**Session baseline to verify, not blindly trust:** branch HEAD `d76d1bb0be1b6548291af71f61eda12fee774e0b` had GitHub Actions CI run `43997415344` **success** (nine jobs; Windows/macOS/Ubuntu, npm tests/pack smoke, skills-ref and worker-contract checks). This proves the configured source-level CI for that SHA **only**. Subsequent commits require new checks. The screenshot reporting `V0.5.1_READY_FOR_RELEASE_APPROVAL` is **not v1 host acceptance**.

## 2. Locked owner decisions (GRILL Q1–Q22)

These decisions apply to v1 and supplement DEC-01..DEC-32. Do not ask them again.

| Q | Decision |
|---|---|
| 1 | Every officially supported v1 host requires real `HOST_VERIFIED` before release. |
| 2 | Prefer better real outcomes over copying upstream internals; designs may differ. |
| 3 | External trusted CLI workers may be invoked for genuine execution. |
| 4 | Breaking changes are permitted if they demonstrably improve the architecture. |
| 5 | Use blind benchmarks for correctness, quality, recovery, tokens, and latency. |
| 6 | Target v1 hosts: **Antigravity, Codex, Claude Code, Gemini CLI**. |
| 7 | External CLI allowlist: executable identity, version/hash, per-task permissions, and audit trail. |
| 8 | One agent may implement, review, and verify, but never fabricate independent review. |
| 9 | All 19 skills require positive/negative activation and real execution per host; deep failure/recovery tests for critical skills. |
| 10 | Every benchmark metric must beat baseline; any unqualified regression is NO-GO. |
| 11 | Compare against Xyeena v0.5.1 **and** the strongest relevant upstream. |
| 12 | Minimum improvement: **10% on each eligible metric**, not just a weighted aggregate. |
| 13 | Fault/recovery coverage must include **all 19 skills**, with deeper checks for critical cases. |
| 14 | Final acceptance includes report, genuine tests, logs, changed-file evidence **and an independent recheck**. |
| 15 | Owner permits **automatic merge and release only after every agreed gate passes**; this is not permission to bypass gates now. |
| 16 | Original strict +10% target; qualified solely by Q21 for already-perfect measures. |
| 17 | At least three independent runs for each critical acceptance case. |
| 18 | Host evidence must include genuine logs, task outputs, failure and recovery. |
| 19 | If post-release checks fail, automate rollback where technically feasible. |
| 20 | No overengineering: feature requires real problem, measurable benefit, and a proving test. |
| 21 | Already-perfect metric (e.g. 100% correctness) must remain perfect; other metrics still need +10%. |
| 22 | npm is not fully reversible: halt future distribution, roll back reversible deployments, flag the bad version, and publish a fixed version only after new passing gates. |

**Resolution for Q8/Q14:** same agent doing multiple roles is allowed; final sign-off requires an *independent recheck*, which must not be falsely described as independent if the same context performed it. Use a separate actual checker or a genuinely separate review process with logged evidence. Record `BLOCKED` if unavailable.

**Benchmark rule:** predefine datasets, blind grading, comparable environment, metric direction, eligibility and baseline values. For lower-is-better metrics (tokens, latency, error rates), improvement means reduction; for higher-is-better (correctness, quality, recovery success), improvement means increase. Do not claim a 10% gain from incomparable experiments, ungrounded denominators or scores already at mathematical bounds. Stop for a documented measurement exception rather than inventing one.

**Release rule:** no unconditional publish, tag, merge, deletion, global host mutation, or force-push. The conditional release authorization applies only if all gates are actually satisfied, the target workflow exists with sufficient audit/rollback controls, and no new permission or destructive boundary is crossed. Never improvise a publish command just because CI is green.

## 3. Architecture and provenance boundaries

- One product and **one Cortex governor**; 19 stable `xyeena-*` skill entrypoints. External upstream projects are references, not hidden orchestration runtimes.
- Protect host/user personas, agents, symlinks, credentials, untracked files, and custom skill content. Installer must preserve ownership, safe preview, backups, and rollback. Never quietly rewrite `.agents/personas/`, `.agents/agents/`, `.agents/rules/`, or global configurations.
- Four v1 host gates are separate: Antigravity, Codex, Claude Code, Gemini CLI. Record host, version, OS, tested skill, actual CLI/tool command or native invocation ID, permissions, result, trace, and independent-review evidence. An uninstalled/inaccessible host is `BLOCKED`, not `PASS`.
- RE-01..RE-34 source research includes Superpowers, Superior Skills, Cindy, Orca, UI UX Pro Max, Hallmark, Impeccable, Konoha and others. `REFERENCE_ONLY` is not behavioral parity; verify original licensing before copying.
- Do not infer successful host dispatch from `Cortex.getStatus().status === 'ONLINE'`. The status is scoped to local in-process registry and `nativeHostExecution` is `NOT_PROBED` until real proof.

## 4. Actual implementation checkpoint

Confirmed in PR #75 at `d76d1bb` (read current source before restating):
- 19 skill `SKILL.md` entrypoints rewritten, 19 `references/procedure.md`, trigger fixtures, source structure evaluator, 19 searchable UI design records.
- Cortex rejects blocked/unknown executor outcomes and treats a successful callback as `REVIEW_REQUIRED` / `hostAcceptance: NOT_VERIFIED` rather than true host verification.
- Installer nested ownership cleanup regression and other source-level CI tests exist.
- **Missing:** real 19-skill behavioral evaluation on each of four hosts; cross-host native dispatch identity/cancel/recovery proofs; blind comparative benchmarks with three independent critical runs; complete v0.5.1→v1 host upgrade/rollback; verified automatic release and post-release safety gates.
- v1 is **NO-GO** until these independent conditions pass. Source CI success is not sufficient.

Authoritative source map:
- `docs/v1/SKILL-SYSTEM-REBUILD.md` — v1 architecture scope.
- `docs/v1/IMPLEMENTATION_STATUS.md` — running implementation/evidence ledger.
- `evals/v1-skill-matrix.json` and `evals/v1-trigger-cases.json` — declared coverage and deterministic fixtures (not live results).
- `src/core/cortex.mjs`, `src/eval-v1.mjs`, `src/methods/engineering.mjs` — implementation areas.
- `docs/future/UPSTREAM_INVENTORY.md` — pinned upstream inventory and reference-only dispositions.

## 5. Next practical execution — do not skip host evidence

1. Reconcile local checkout with draft PR #75 and check current CI by exact SHA. Do **not** assume local is up to date or reset user's worktree.
2. Run `npm ci`, `npm test`, `npm run eval:v1:structure`, `npm run test:harness`, `npm run test:consumer`, `npm run check`, `npm run eval`, `npm pack --dry-run` where the environment allows. Record commands/results, not just a generic PASS.
3. Inventory the **actual** four host CLIs, versions, executables/hashes, permission boundaries, and native dispatcher availability, without modifying global settings. Do not substitute a model answer for a real invocation.
4. Prioritize a **single tracer-bullet host execution**: one positive and one negative skill trigger, genuine tool execution, fault injection and recovery, separate verification, full receipt. Then scale to 19 skills × 4 hosts only after this is proven. If a host is unavailable, mark it `BLOCKED` and state what is needed.
5. Add minimal regression/evidence fixtures and advance the ledger. Do not merge or publish before every release/benchmark gate passes.

### Output contract for every Gemini CLI session

```text
CHECKOUT: branch=<name> head=<SHA> dirty=<yes/no>
OBSERVED: <actual tool calls, files, host/version and outputs>
CHANGED: <paths and why>
TESTED: <exact command -> exit status / CI run ID>
HOST_GATES: Antigravity=<status>; Codex=<status>; Claude Code=<status>; Gemini CLI=<status>
BENCHMARK: <baseline, measured result, relative delta for each metric or NOT_RUN>
REMAINING: <specific blockers, no generic "all done">
NEXT: <one smallest concrete and measurable task>
RELEASE: NO-GO unless every target gate has actual supporting evidence
```

### Short recovery prompt (paste after context compaction)

> Resume Xyeena v1 on `feat/v1-skill-system-rebuild`. Read `GEMINI.md`, `AGENTS.md`, and `docs/v1/GEMINI-CONTINUITY.md` **from disk**, then `docs/v1/IMPLEMENTATION_STATUS.md`. Verify branch/HEAD/dirty status and exact-SHA CI before making claims. The prior screenshot concerns v0.5.1, not v1. Apply all Q1–Q22, preserve my local files/personas, inspect code, run real checks, work on one measurable missing functional gate. Do not simulate hosts, reviews, metrics, or release. Finish in the checkpoint output contract and update the evidence ledger only with actual results.
