# Evidence ledger

Date: 2026-10-23.
Repository main baseline: 91b2506a209bc645dc2b66603ab3b43dfb084e48.
Branch: feat/rig-enterprise-orchestration.

## Audited source baseline

- Package version `0.4.1`, 19 bundled native skills.
- Host-specific bounded filesystem discovery in `src/workspace-skills.mjs`, lexical routing, not an inventory of every native plugin.
- `orchestrate run` requires provider consent and creates a new read-only one-shot call, not active IDE dispatch.
- Project Harness and Guided Hooks are separate opt-in installations, not universal tool enforcement.
- `AgentBroker` has a no-adapter placeholder state that must not be treated as an executed worker.

## Changed source

- `src/compact-setup.mjs`: compact installation, ownership marker, safe managed update and backup.
- `src/enterprise-policy.mjs`: candidate providers, Harness policy description, verified-only backend selection.
- `src/cli.mjs` and `src/orchestrator.mjs`: compact setup, native fallback, and read-only Harness preflight.
- `src/live-backend.mjs`: actual-adapter-only conditional dispatcher (requires caller-supplied live Simpul/native adapters, not an installed connector).
- `test/compact-setup.test.mjs` and `test/enterprise-policy.test.mjs`.

## Validation record

Tests and CI results must be attached here after the PR is opened. No live plugin activation, IDE worker dispatch or Simpul integration has been verified as part of this code. Distinguish green unit tests from the remaining enterprise release gates.

## CI regression addressed

The first PR CI run had 213 passing unit tests and one macOS failure caused by the platform's canonical `/private/var` temporary path alias. The assertion was corrected to compare against `fs.realpathSync(home)`. A new commit also adds a Rig read-only Harness preflight and multi-target compact-install compensation. Subsequent CI results must be recorded separately; the original run was not fully green.

## Packed-install regression coverage

CI now includes a Windows npx GitHub tarball smoke for compact preview (no writes), confirmed compact installation, and compact governor detection by `setup check`. This is filesystem/CLI acceptance, not proof of live IDE skill activation.

## CI verification — final source commit de2deacc (2026-10-23)

- [GitHub Actions CI run](https://github.com/rzqllh/xyeena/actions/runs/39867943667) for commit `de2deacca3adc7dc021475a5497acbd5284a66a2`: **9/9 jobs successful**.
- OS/runtime matrix: Windows, macOS and Ubuntu on Node.js 22.14.0 and Node.js 24.
- Other jobs: Skills reference validation, standalone SDK worker contract, and Windows GitHub-tarball `npx` consumer smoke (including compact install and health check).
- CI success covers source/test/packed CLI contracts, **not** live activation in Antigravity/Codex/Claude/Gemini/Hermes, Simpul MCP, or write-capable Harness hooks.
- Enterprise release gate remains open; PR #17 is draft and not merged/published.

## Requirements mapping audit — 2026-10-23

A comparison of the chat backlog R01–R15 with the existing E task tracker and A acceptance matrix found the **broad phases present**, but no one-to-one crosswalk and missing explicit subtasks for provenance, conflict resolution, native parity, write-capable Harness, cost/resource limits, durable recovery, authorization propagation, legacy compatibility/restore, red-team testing and npm release readiness. The omissions are now tracked in `REQUIREMENTS_TRACEABILITY.md`, added E work items and A acceptance gates. This is **documentation completeness**, not code or runtime completion. Branch CI must be re-evaluated for the new documentation commit; previous 9/9 result applies to source HEAD `c9f1080` only.

## Phase P01 verification — Unified Skill Discovery (2026-10-23)

- Branch: `feat/rig-enterprise-p01-discovery`, Base: `main` (4f0fa5e).
- Scope: R01, R02; Acceptance A11, A18, A21, A22; Tasks E02-03, E02-04, E02-05, E02-06.
- Changes: `src/skill-hosts.mjs`, `src/workspace-skills.mjs`, `src/skill-cache.mjs`, test suites.
- Results:
  - `npm test`: 232/232 PASS (all tests green).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p01.md`.

## Phase P02 verification — Superpowers, Superior & Native Parity (2026-10-23)

- Branch: `feat/rig-enterprise-p02-skill-orchestration`, Base: `feat/rig-enterprise-p01-discovery` (eb57905).
- Scope: R03, R04; Acceptance A10, A11, A23, A24; Tasks E02-02, E04-01, E04-02, E04-03.
- Changes: `src/enterprise-policy.mjs`, `src/orchestrator.mjs`, `test/enterprise-policy.test.mjs`.
- Results:
  - `npm test`: 240/240 PASS (20 unit tests in policy/orchestrator, +8 provider cases).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p02.md`.

## Phase P03 verification — Automatic Harness Enforcement (2026-10-23)

- Branch: `feat/rig-enterprise-p03-harness`, Base: `feat/rig-enterprise-p02-skill-orchestration` (61b4fc2).
- Scope: R05, R10; Acceptance A12, A13, A25, A28; Tasks E05-01, E05-02, E05-03, E07-01, E07-04.
- Changes: `src/rig-harness-lifecycle.mjs`, `test/rig-harness-lifecycle.test.mjs`.
- Results:
  - `npm test`: 249/249 PASS (12 unit tests in harness lifecycle, +9 executable enforcement tests).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p03.md`.

## Phase P04 verification — Simpul & Native Subagent Integration (2026-10-23)

- Branch: `feat/rig-enterprise-p04-subagents`, Base: `feat/rig-enterprise-p03-harness` (3dfae86).
- Scope: R06, R07, R08; Acceptance A14, A14a, A15, A16, A26; Tasks E06-01, E06-02, E06-03, E06-04, E06-05.
- Changes: `src/live-backend.mjs`, `test/live-backend.test.mjs`.
- Results:
  - `npm test`: 252/252 PASS (10 unit tests in live-backend, +3 backend/budget tests).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p04.md`.

## Phase P05 verification — Reliability, DAG, Recovery & Budget (2026-10-23)

- Branch: `feat/rig-enterprise-p05-recovery`, Base: `feat/rig-enterprise-p04-subagents` (8babeca).
- Scope: R08, R09, R10; Acceptance A16, A17, A26, A27, A28; Tasks E07-02, E07-03.
- Changes: `src/task-runner.mjs`, `test/task-runner.test.mjs`.
- Results:
  - `npm test`: 257/257 PASS (16 unit tests in task-runner, +5 recovery/anti-loop tests).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p05.md`.

## Phase P06 verification — Compact Installer & Safe Migration (2026-10-23)

- Branch: `feat/rig-enterprise-p06-installer`, Base: `feat/rig-enterprise-p05-recovery` (acb8e5b).
- Scope: R11, R12; Acceptance A05, A06, A08, A29, A30; Tasks E01-04, E01-05, E01-06.
- Changes: `src/compact-setup.mjs`, `test/compact-setup.test.mjs`, `docs/xyeena-rig/evidence-p06.md`.
- Results:
  - `npm test`: 261/261 PASS (10 unit tests in compact-setup, +4 installer/migration tests).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p06.md`.

## Phase P07 verification — Security, Hardening & Live Acceptance Fixtures (2026-10-23)

- Branch: `feat/rig-enterprise-p07-hardening`, Base: `feat/rig-enterprise-p06-installer` (931ac54).
- Scope: R13, R14; Acceptance A18, A19, A20, A31, A32; Tasks E08-02, E08-03.
- Changes: `src/rig-harness-lifecycle.mjs`, `test/security-hardening.test.mjs`, `docs/xyeena-rig/evidence-p07.md`.
- Results:
  - `npm test`: 267/267 PASS (6 unit tests in security-hardening, +6 adversarial/hardening tests).
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS.
- Verdict: VERIFIED. Full phase evidence recorded in `docs/xyeena-rig/evidence-p07.md`.

## Phase P08 verification — Enterprise Release Candidate & Verification (2026-10-23)

- Branch: `feat/rig-enterprise-p08-release`, Base: `feat/rig-enterprise-p07-hardening` (476069b).
- Scope: R15; Acceptance A19, A20, A33; Task E08-04.
- Changes: `docs/xyeena-rig/PR_INDEX.md`, `docs/xyeena-rig/ROADMAP.md`, `docs/xyeena-rig/ARCHITECTURE.md`, `docs/xyeena-rig/RUNBOOK.md`, `docs/xyeena-rig/evidence-p08.md`.
- Results:
  - `npm test`: 267/267 PASS.
  - `npm run check`: PASS.
  - `npm run eval`: PASS (18/18).
  - `npm run test:harness`: PASS (15/15).
  - `npm run test:consumer`: PASS.
  - `npm pack --dry-run`: PASS (244 files, 185.7 kB).
- Recommended Version: `0.5.0`.
- Release Decision: CONDITIONAL GO (ready for sequential PR merge). Full phase evidence recorded in `docs/xyeena-rig/evidence-p08.md`.
