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
