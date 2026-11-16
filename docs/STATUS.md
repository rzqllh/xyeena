# Support and Release Status

This page separates the published baseline, newer source features, and recorded host observations. Documentation cleanup does not establish new runtime acceptance.

---

## 1. Published Baseline vs Rebuild Source

| Item | Status |
| :--- | :--- |
| **GitHub release** | [v0.4.1](https://github.com/rzqllh/xyeena/releases/tag/v0.4.1) |
| **npm baseline recorded by the repository** | `xyeena-agent@0.4.1`; recheck the registry before publishing a new version |
| **Source version** | `0.4.1` in `package.json`, with additional unreleased changes |
| **Rebuild Foundation Status** | P00–P17 Rebuild, Cross-Domain Methodology, Design, Engineering, Specialized Platform Intelligence, Blocker Remediation & Final End-to-End Acceptance Suite completed with **723 / 723 tests PASS** across 75 suites on feature branch |
| **Planned 0.5.0** | Limited-public release candidate readiness; all 32 upstream sources resolved with evidence; no new publication is performed by this documentation change |
| **Final publication** | Requires final owner approval, exact candidate checks, and publishing configuration |

Run source-only examples with `node bin/xyeena.mjs` from the intended checkout. Do not assume commands added after the 0.4.1 release exist in its npm package. Node.js 22.14+ is required.

---

## 2. Rebuild Foundation Acceptance Status (P00–P17 & Final Closure)

The local rebuild on `feat/rebuild-foundation-p00` establishes the following verified components:
- **Capability Coverage:** 64 native capability contracts bound to concrete executable handlers (`BEHAVIOR_VERIFIED`: 64/64, `CONTRACT_ONLY`: 0).
- **Golden Scenarios & Comprehensive Suites:** 7 comparative golden scenarios plus P14 8 comparative domain scenarios, P15 Design Intelligence suite, P16 Engineering Intelligence suite, P17 Specialized Platform Intelligence suite, 18 Final End-to-End Acceptance Scenarios, and 17 Adversarial Blocker Remediation Scenarios verified with **723 / 723 tests PASS** across 75 test suites.
- **Installer Safety:** Verified against defined adversarial scenarios (user modification diff lock, corrupted manifest fail-closed, safe uninstall preserving custom files, exclusive lock contention protection, TOCTOU prevention, `destinationIdentity` binding, selective per-file consent, symlink boundary checks, atomic rollback on mid-operation failure, consent fingerprints, copy-to-symlink conversion protection even with `--force`).
- **Complete Upstream Source Disposition (RE-01 through RE-32):**
  - **Superpowers (RE-01)** (`obra/superpowers` v7.0.1, SHA `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`, MIT): Phased planning with context brainstorming, TDD red-green-refactor invariant, 4-phase systematic debugging, dual-axis review, epistemic verification gate, inline ledgered rulings.
  - **Superior Skills (RE-02)** (`KodekaTeam/superior-skills`, SHA `3735e084d4ab310605bd945b53c674c87d2d7dbf`, MIT): Deep module seams, interface depth ratios ($LOC / Methods$), Clean Architecture boundaries, code-as-documentation, dual-axis review.
  - **Anti-Slop (RE-03)** (`miqdadbadjuber/anti-slop`, SHA `b1cdf87d49b1653293d58424516fd80394008345`, MIT): Context-aware copywriting audit (exempting quoted text, code blocks, blockquotes, and formal prose options), code comment hygiene (preserving architectural WHY/NOTE comments, stripping banners/narration/vague TODOs), visual anti-slop (with user override awareness for intentional gradients/glass/pills), WCAG AA/AAA targets, and mobile layout bounds.
  - **Ponytail (RE-04)** (`DietrichGebert/ponytail`, SHA `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`, MIT): Smallest-correct-change heuristic, lean diffs, anti-overengineering debt ledger (`shortcut: <limit>, <when to upgrade>`), adaptive effort scaling (lite/full/ultra).
  - **Caveman (RE-05)** (`JuliusBrussee/caveman`, SHA `b4ee71d557d96e3cbc14f88fa6e953a1362865f5`, Apache-2.0 / MIT): Context economy, verbatim technical payload preservation, verify-and-stop discipline (smallest sufficient proof set), safe refactoring boundaries.
  - **Cloudflare Security Audit (RE-06)** (`cloudflare/security-audit-skill`, SHA `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`, MIT): Machine-readable finding schema, source-to-sink trace validation, duplicate finding suppression, scoped diff review default.
  - **Impeccable (RE-07)** (`pbakaus/impeccable`, Apache-2.0): 4 surface modes (`Persuade`, `Operate`, `Read`, `Experience`), "The brief wins", refinement preservation vs redesign replacement.
  - **Matt Pocock Skills (RE-08)** (`mattpocock/skills`, SHA `5863806dd4e15c63174bee4e7515a4256792ecfa`, MIT): Question-frontier grilling (design tree decision modeling), to-spec technical specification synthesis, to-tickets tracer bullets with expand-contract for wide refactors.
  - **Hallmark (RE-09)** (`togethercomputer/hallmark`, MIT): The Floor enforcement (never transition all, no layout animation thrashing, :focus-visible, reduced motion, overflow-x: clip) with explicit waivers on record.
  - **Taste Skill (RE-10)** (`Leonxlnx/taste-skill`, MIT): Page vs App Screen dual-mode separation, quiet operational borders on dashboards, substance over thin restraint.
  - **UI UX Pro Max (RE-11)** (`nextlevelbuilder/ui-ux-pro-max`, MIT): 3-tier design token architecture, WCAG AA/AAA targets (4.5:1 / 24px vs 7:1 / 44px).
  - **Anthropic Skills (RE-12)** (`anthropics/skills`): Standard SKILL.md progressive disclosure structure and discovery paths (`REFERENCE_ONLY`).
  - **Vercel Agent Skills (RE-13)** (`vercel/agent-skills`, MIT): Next.js App Router boundaries, server/client component boundaries, bundle optimizations, SSR safety (`REFERENCE_ONLY`).
  - **Official GSAP Skills (RE-14)** (`greensock/gsap-skills`, SHA `aed9cfd3277740755f6bfc1155c7aa645403b760`, MIT): Motion performance (compositor transforms vs layout thrashing), React animation lifecycle cleanup (`useGSAP`/`ctx.revert`), SSR safety, non-mandatory stack respect.
  - **Trail of Bits Skills (RE-15)** (`trailofbits/skills`, SHA `149d7b21f4067765b82e67029730b42d228ef4b4`, CC BY-SA 4.0): Clean-room security invariants, GitHub Actions workflow security audit, false-positive pattern-match rejection without copying protected text.
  - **Supabase Agent Skills (RE-16)** (`supabase/agent-skills`, SHA `c9be0e931b7930f7d02126d04774d904c381e7d7`, MIT): Row Level Security tenant isolation evaluation (truthfully distinguishing static check pass `STATIC_CHECK_PASS` from live query receipts `RLS_LIVE_ISOLATION_VERIFIED` via authorized `LiveDatabaseAdapter` with connection provenance, separating heuristic syntax risk `SUSPECTED_CROSS_TENANT_POLICY_RISK` from verified empirical cross-tenant row access `EMPIRICALLY_OBSERVED_CROSS_TENANT_ACCESS`), cross-tenant leak checks, service-role key exposure detection, safe PostgreSQL transactional migrations (Expand-Migrate-Contract).
  - **Google DESIGN.md (RE-17)** & **Awesome DESIGN.md (RE-18)**: 3-tier token hierarchy (`sys.*`, `ref.*`, `comp.*`) and design system reference benchmarks (`REFERENCE_ONLY`).
  - **Gemini Superpowers / Antigravity Host (RE-19)**: Native tool declarations, schema validation, and discovery conventions (`REFERENCE_ONLY`).
  - **Normative Foundations (RE-21..30)**: W3C WCAG 2.2 relative luminance mathematics, Apple HIG tap targets, Material Design 3, POSIX paths, RFC specifications.
  - **Konoha (RE-31)** (`andycungkrinx91/konoha`, SHA `9789bdd1d57d5f7a39a58406105e36127ffdb35b`, Apache-2.0): Bounded retrieval (max results, byte budget, path boundary), index corruption recovery, MCP manifest vs dispatcher parity, task-scoped memory isolation.
  - **Huashu Design (RE-32)** (`alchaincyf/huashu-design` v3.3.0, SHA `e8d1148a80d5a281d4247cffe320add3df017928`, MIT): 3 visual directions exploration, standalone interactive HTML prototype specifications with isolation quarantine, truthful capability reporting (PDF/PPTX/video require optional host dependencies).
- **XYN Architectural Trait Synthesis:** Locally inspected from `xyn-evidence-verification`, `xyn-qa-audit`, and `xyn-orchestrate`. Incorporates Maker-Checker separation, empirical claim boundaries, adversarial testing, and single governor invariant without copying fictional characters, personas, or names (`XYN_ARCHITECTURAL_PRINCIPLES_SOURCE_INSPECTED_LOCAL`).
- **Cortex Live Activation:** Configured in workspace host files; dynamic runtime binding is reported honestly as **`HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`**. Cortex remains the exclusive single governor with zero foreign control loops.

---

## 3. Recorded Host Support

These observations were recorded on Windows on 2026-10-26 and 2026-10-27. They describe those host versions and interactions, not every installation or later vendor version.

| Host | Recorded evidence | Remaining limitation |
| :--- | :--- | :--- |
| **Antigravity CLI 1.4.7** | Native `PreToolUse` `force_ask`, user cancellation, and a scoped automatic deny for a harmless read-only command | Arbitrary privileged operations, OS containment, and other host versions remain unverified |
| **Antigravity IDE 2.5.5** | A tool ran despite an expected hook denial | **LIVE BLOCKED** for native hook enforcement; installation is not enforcement |
| **Hermes** | Bounded one-shot execution reached post-run token accounting | **LIVE PARTIAL**; real cancellation and provider-side spend limits remain unverified |
| **Codex, Claude Code, Gemini CLI** | Source adapters and protocol fixtures | Native acceptance remained unverified in the recorded environment |

### 3.1 Fresh Environment Detection (2026-11-15)

Observations verified on Windows environment with Node.js v24.22.1 and Git v2.54.0:
- Host CLI binaries (`antigravity`, `gemini`, `claude`, `codex`, `hermes`) are not installed in global system PATH (`NOT_TESTED (LOCAL CLI ABSENT)`).
- Antigravity workspace integration operates via local `.gemini/` skill discovery (`HOST CONFIGURED / CLI NOT IN PATH / LIVE ACTIVATION UNVERIFIED`).

A writable diagnostic receipt is not independent proof that a host loaded a hook. `hostEnforcement: UNVERIFIED` remains appropriate until a real host observation supports a narrower statement. A fixture using fake provider responses is not an authenticated provider test.

---

## 4. Source Safety Boundaries

- Read-only discovery and preview commands do not start a model session.
- One-shot execution requires consent. Source cancellation requests termination; it does not prove descendant processes or remote billing have stopped.
- Token limits validate reported usage after provider execution. They are not hard provider spending caps. Do not automatically retry with a larger budget after a rejection.
- Workspace writes stay serialized. A timed-out write may retain its lock until the adapter settles; recovery may be required.
- Unknown or incomplete backend readiness cannot authorize execution. A caller-asserted isolated worktree is not proof of OS containment.
- Guided hooks depend on the host loading and enforcing them. Missing support must not silently become permission to execute.

Read [Security](../SECURITY.md), [Runtime Adapters](RUNTIME-ADAPTERS.md), and [Guided Hooks](ANTIGRAVITY-GUIDED.md) before enabling execution.

---

## 5. Outstanding Host Acceptance Gates

The native Rig release scope tracks these open requirements:
- [#34: Antigravity IDE hook enforcement](https://github.com/rzqllh/xyeena/issues/34). A CLI result cannot substitute for an IDE result.
- [#36: Codex, Claude Code, and Gemini CLI](https://github.com/rzqllh/xyeena/issues/36). Record native activation, authorization, completion, and failure behavior on the intended host.
- [#37: Hermes cancellation and budget behavior](https://github.com/rzqllh/xyeena/issues/37). Confirm actual process termination and distinguish result rejection from provider spending controls.

Simpul is a separate optional integration. Its [interface issue #35](https://github.com/rzqllh/xyeena/issues/35) does not define the core Rig host scope. Do not close live requirements using simulated results.

---

## 6. Preparing a Release

1. Choose and document the supported host scope. Keep unsupported enforcement paths unavailable.
2. Run source tests, validation, evals, vendored harness tests, and the packed-consumer smoke on the exact candidate (`npm test`, `npm run check`, `npm run pack:check`, `npm run test:consumer`, `npm run test:harness`).
3. Inspect `npm pack --dry-run`; exclude credentials, sessions, logs, and internal handoffs while retaining required licenses and product skills.
4. Verify package, plugin, and release versions together. Check that the candidate npm version has not already been published.
5. Verify the npm trusted publisher and required environment reviewers in the external services. Workflow YAML alone does not prove those settings exist.
6. Obtain final owner approval before a tag, GitHub Release, or npm publication. Verify the published artifact against the approved source.

The [operations runbook](xyeena-rig/RUNBOOK.md) covers migration, recovery, source preflight, and native acceptance. [Contributing](../CONTRIBUTING.md) describes development checks. Source CI and live host acceptance are separate evidence classes.
