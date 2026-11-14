# Xyeena Future Roadmap — Upstream Reuse, Composite Skills, Personality, and Host Alignment

**Recorded:** 2026-11-14  
**Status:** PLANNED / NOT IMPLEMENTED / CONDITIONAL  
**Master gate:** [master-plan-141026.md](../../master-plan-141026.md)  
**Trigger:** Owner-initiated Xyeena audit after local/remote source alignment; grill before architecture/code changes.  
**Scope:** Xyeena Rig Skills + Harness only. Not the XYN subagents product.

## A. Design goals and reasons for the pivot

The goal is a powerful, dependable Xyeena that earns quality from real upstream implementations instead of mimicking their names with shallow handcrafted procedures. The decision is to **prefer verified upstream source reuse when permitted** and adapt it into Xyeena-specific capability compositions.

Do not assume upstream code is perfect or every test is portable. Source-level contract, license provenance, integration tests and benchmarks are necessary. Reuse and adaptation may outperform rewriting, but can also import coupling, security hazards and dependency bloat. Select on evidence.

**Do not activate this roadmap just because an AI agent encounters it.** The remote source and the developer desktop are currently not aligned. The owner explicitly requested future planning and later audit-driven questions.

### A1. What changes from the previous rebuild

| Previous approach | Target approach |
| --- | --- |
| Behavior reimplementation from summaries | Prefer original licensed source and workflows, adapt rather than mimic |
| Native-only/zero dependencies as an absolute | Zero required *external frameworks* for the base kernel where feasible; justified optional dependencies per feature |
| Handler existence treated as parity | Output- and workflow-level comparable tests against pinned upstream |
| Monolithic artificial composite prompt | Targeted skill loading, orchestration contracts and measured budgets |
| Xyeena agent personas | Host-owned agents remain; personality traits are a skills/harness overlay |
| Future credits without provenance | Provenance + required license notices **before public code redistribution**; launch acknowledgement may follow |

### A2. Nonnegotiable boundaries

- Only one Xyeena governor; no competing Superpowers, Konoha or other framework control loops.
- Preserve host-agent identities, user personas, tool permissions, higher-priority instructions and current local working changes.
- No full security audit without an explicit request for a comprehensive audit; a diff/PR audit is scoped.
- Context-aware Anti-Slop applies during and after work; no mandatory heavyweight scans on greetings or small changes.
- No fabricated QA, independent subagent, tokenizer, performance, tool-call or host acceptance claims.
- All third-party components get trust review before their hooks, scripts, MCP servers or dependencies run.
- Avoid global host mutation without owner authorization; use workspace-scoped dry-run when appropriate.
- Local memory isolation, rollback, bounded concurrency and consent protect user state.

## B. Source map — research to reuse

The original RE-01–RE-30 source locks from the local blueprint remain the only authority for exact pinned SHAs. This document adds future evaluation scope, not new unverified version claims.

| ID | Source | Integration candidates | Notes |
| --- | --- | --- | --- |
| RE-01 | [obra/superpowers](https://github.com/obra/superpowers) | Brainstorming, plans, execution, TDD, systematic debugging, subagent delegation, review | Preserve tested workflow semantics; host-independent wrappers |
| RE-02 | [KodekaTeam/superior-skills](https://github.com/KodekaTeam/superior-skills) | Domain engineering, deep module, architecture, review, quality | Read each skill and helper/test |
| RE-03 | [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) | Copy, UI, code, human, mobile and deterministic linting | Preserve context; avoid false-positive blanket wordlists |
| RE-04 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Lean change discipline, adaptive effort, scoped review | No forced voice/persona |
| RE-05 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | Efficient context, surgical tools, verify-and-stop | Recheck license at chosen SHA; no cloud gateway mandatory |
| RE-06 | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | Finding/schema validators, coverage-ledger methodology | Full audit explicit-only; OS sandbox required for unsafe workflows |
| RE-07 | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Design critique, UX craftsmanship, critique/build/refine | Apache-2.0 reported; verify original license |
| RE-08 | Matt Pocock Skills | Question-frontier grilling, engineering and TS patterns | Resolve exact upstream path in source locks |
| RE-09 | Hallmark | Distinctive layout/art direction and design QA | Resolve exact upstream path/license before reuse |
| RE-10 | Taste Skill Family | Intentional visual direction and references | Respect split repos and individual file licensing |
| RE-11 | UI UX Pro Max | Visual profiles, responsive patterns, token palettes | Check data/catalog rights per file |
| RE-12 | [anthropics/skills](https://github.com/anthropics/skills) | Agent Skills conventions and selected skill processes | **Mixed per-skill licenses**; some source-available terms differ |
| RE-13 | Vercel Agent Skills | Frontend/Next.js and agent tooling | Verify exact repository |
| RE-14 | GSAP Skills | Motion design practices | GSAP software license and skill-repo license are different questions |
| RE-15 | Trail of Bits Skills | Secure development/testing methods | Check CC BY-SA or file-specific terms; do not treat as MIT |
| RE-16 | Supabase Agent Skills | Data/auth methodology | Verify SDK/version-specific practices |
| RE-17 | Google DESIGN.md | Systematic design specs | Inspect exact repo/asset licensing |
| RE-18 | Awesome DESIGN.md | References and example design docs | Repo license may not cover linked materials |
| RE-19 | Gemini Superpowers Antigravity | Host-specific skill conventions | Avoid mandatory external governance |
| RE-20 | [rzqllh/xyeena](https://github.com/rzqllh/xyeena) | Rig harness, adapters, workflows, tests, migration | Original baseline, not an external dependency |
| RE-21..30 | Normative UX/engineering/security foundations | WCAG 2.2, HIG, Material, color/UX, memory, software quality | Cite applicable official text, do not copy normative standards wholesale |
| **RE-31** | **[andycungkrinx91/konoha](https://github.com/andycungkrinx91/konoha)** | MCP orchestration, SQLite FTS5, bounded retrieval, QA, delegation/approval | License Apache-2.0; inspect actual source and tests before reuse |

### B1. Konoha RE-31 inspection record (reference, not adoption)

Observed on 2026-11-14 in master at SHA **9789bdd1d57d5f7a39a58406105e36127ffdb35b**; package.json reports v2.2.21 and Node >=24. Repo LICENSE is Apache-2.0, copyright 2026 Andy Setiyawan. README describes:
- LangGraph orchestration, specialist agent routing and human gates.
- SQLite FTS5 skill retrieval, bounded file I/O and context-limited MCP calls.
- QA Playwright E2E and Zero-AI-Slop gates.
- Local memory, checkpoint and cross-host MCP integration.
- Optional search, external binaries and developer UI features.

**Compatibility caution:** Konoha declares significant dependencies and its AGENTS.md mandates its own governor, RTK/Semble/MCP and human gates. **Never import its AGENTS.md mandate verbatim into Xyeena or force those tools on Xyeena users.** Extract/compose only authorized components that pass independent compatibility and security tests. Preserve Konoha and dependency copyright and notices. Benchmark retrieval claims locally; README marketing metrics are not independent parity evidence.

## C. Composite skill architecture

A composite skill is a **single user-facing workflow contract** with multiple licensed methods behind it. Source implementation is pinned and tracked. Do not load all upstream SKILL.md files or force multiple agent governors. The host agent runs the selected skills under its own permissions.

### C1. First candidate: /xyeena-design (tentative name)

**Composition:** Hallmark + Impeccable + Taste + UI UX Pro Max + Anti-Slop; optionally GSAP/Apple HIG/WCAG references when relevant.

**Proposed pipeline:**
1. **Intent/input:** Gather artifact type, target platform, user goal, existing design constraints, content hierarchy, branding, accessibility and acceptance criteria. For simple tasks, infer safe defaults and avoid excessive questions.
2. **Direction:** Hallmark-style distinctive art direction and anti-generic aesthetic principles; ensure concept is coherent before code.
3. **System:** Derive palette, typography scale, spacing/radius, components, layout states and responsive rules with original source-backed methods.
4. **Craft:** Apply Impeccable construction/critique/iteration where relevant. Keep visual language intentional rather than universal templates.
5. **Implementation:** Use framework-adapted engineering method appropriate to existing stack; preserve existing code and design-system contracts.
6. **During-work checks:** Contextual Anti-Slop, usability, layout overflow, accessible naming, motion preferences, color contrast and state completeness.
7. **Post-work acceptance:** UI screenshots at meaningful breakpoints, interaction/keyboard/focus checks, WCAG 2.2 target sizing (minimum 24 CSS px **with spacing/equivalent/inline/user agent exceptions**, enhanced 44 CSS px), objective requirements plus human taste rubric.
8. **Evidence closure:** Distinguish actual screenshot/Playwright results from textual reasoning. Show residual gaps; do not claim pixel-perfect quality without observation.

**Conflict policy:** owner spec > relevant accessibility/safety > actual codebase design tokens > chosen art direction > optional reference styles. If source heuristics conflict, choose based on task and user decision, not deterministic averaging. No forced emoji/gradient/glassmorphism. Composite skill should improve measurable output vs standalone approaches on a shared test set, not just claim it.

### C2. Other candidates

- **/xyeena-plan:** Superpowers plans plus Superior architecture and Ponytail smallest-correct-change. Exit: bounded executable steps, dependencies, evidence, risks, owner decisions.
- **/xyeena-execute:** TDD/debugging methodology plus engineering standards and surgical edit discipline. Exit: real changed behavior + regression tests, no fabricated tool success.
- **/xyeena-debug:** Reproduce → isolate → root cause → fix → verify, no speculative sweeping refactor.
- **/xyeena-review:** Read-only first; dual-axis review, relevant Anti-Slop and Impeccable design critique. No code modifications without scoped authorization.
- **/xyeena-security:** Scoped source review default; full repo audit only upon explicit comprehensive audit request; threat modeling and validators follow source evidence.
- **/xyeena-orchestrate:** Native task DAG/controller, Konoha-inspired bounded retrieval and event gates, host-native workers first and single-agent fallback.
- **/xyeena-research:** Source evidence, freshness, counterexamples, provenance, citations and uncertainty.
- **/xyeena-qa:** Fixture strategy, meaningful tests, real browser/e2e where supported, independent review only when actually run.
- **/xyeena-writing:** Audience-sensitive writing and contextual Anti-Slop without forced artificial voice.

Each command remains a proposal; actual skill path, subcommand naming and aliases require owner review.

### C3. Composition contract (required)

Each composite defines: ID, layer, purpose, explicit and negative triggers, inputs, outputs, source SHAs/files, license provenance, ordered steps, optional steps, conflict policy, consent level, tool needs, budget, fallback, acceptance tests, false-positive limits and support status.

Functional parity is not a checklist of upstream feature names. Run:
- Upstream baseline on the same input (where legally/safely feasible).
- Xyeena composition on the same input/environment.
- Scored criteria: correctness, usable design, accessibility, regressions, operator effort, context/token cost, latency, safety.
- Blind or independent expert review where feasible.
- Record regressions; do not guarantee the composite always beats an individual source.

## D. Behavioral Personality Layer (NOT a new agent system)

Xyeena's own personality is expressed as **methodological behaviors**, not fictional character cosplay. Source from the separate XYN project only after obtaining/inspecting actual persona definitions; do not infer from names.

| Trait family | Desired effect | Guardrail |
| --- | --- | --- |
| Investigative skeptic | Verifies claims, challenges weak assumptions | Not reflexively negative |
| Strategic planner | Sees dependencies, trade-offs and scope | Does not overplan tiny tasks |
| Design craft and taste | Refuses generic UI without evidence | Honors accessibility and user style |
| Precision engineer | Small safe edits, deterministic test evidence | Avoids premature abstraction |
| Root-cause debugger | Reproduces and isolates issues | Avoids invented explanations |
| Security caution | Models trust boundaries and consent | Doesn't launch full audits unsolicited |
| Independent quality reviewer | Tests output against criteria | Does not invent reviewer execution |
| Human writing | Natural language, user-context tone | No roleplay, patronizing fillers |
| Adaptive orchestration | Chooses least costly working route | Never overrides host/user agent authority |

**Never copy:** XYN names, portraits, backstories, inter-character relationships, system prompts with authority claims, private records, agent profiles or host config. **May transform after review:** abstract decision habits, skeptical review posture, output quality rubrics, tone boundaries and step-selection preferences.

Implementation: per-domain trait metadata + small task overlay; no separate personality runtime, no mandatory subagent spawning, no source persona rewriting. Acceptance: tasks route different trait mixes without new agent identities, keep user persona intact, are legible and show measured prompt overhead.

## E. Cross-host alignment and identity preservation

Observed by owner: ChatGPT Desktop built-in subagents are still used, and Hermes/Gemini appear out of sync. This must not be "fixed" by overwriting user/higher-level personas.

Audit on the **actual** target host:
1. Determine installed Xyeena source, version, executable path and scope (workspace/global).
2. Check which AGENTS.md, GEMINI.md, CLAUDE.md, skill entrypoints and hooks the host loads, if any.
3. Compare runtime capabilities with the released/desktop source and pinned docs. Record what is static-only.
4. Distinguish "skill discoverable" from "kernel active", "permission enforced", and "subagent invoked".
5. Verify existing-agent-first overlay via genuine invocation and ephemeral boundaries, if host supports it.
6. Check duplicate outdated Xyeena skill registrations or prior Rig framework governors.
7. Use controlled user-approved setup and rollback, not hidden global edits.
8. Publish a host capability matrix with supported/degraded/unavailable/not-tested, test date, platform and evidence.

**ChatGPT Desktop caveat:** project repository files cannot automatically rewrite ChatGPT built-in subagents or host identity; integration is limited to features actually exposed by the app. Do not claim otherwise. Different hosts may intentionally retain their own agents even when using Xyeena skills.

## F. Conditional installer and legacy migration

Owner-approved target behavior:
- No existing Xyeena at selected host+scope → fresh install.
- Legacy Xyeena or older owned version → safe transactional replacement.
- Same valid version → idempotent no-op.
- Same corrupted version → verified repair.
- Newer version → refuse silent downgrade.
- Foreign/unknown files → preserve, report and ask.
- Partial failed install → recover from receipt/journal.

Implementation must have discover → inspect ownership → plan and dry-run → validate artifact → backup → staged replace → integrity verification → commit or verified rollback. File ownership is path+receipt+checksum-aware, not inferred from a broad .agents or .gemini directory. Windows junctions, symlinks, locked files, interruptions, concurrency and data migration are critical fixtures.

Preserve memory, credentials, custom skills, existing personas, user rules, unrelated hooks, local .gitignore and other host configurations. Separate package-manager installation from agent skill registration. The package and skill must not both install competing governors.

No actual user-machine uninstall/replacement is authorized by this future plan. Test in disposable directories first. Use documented skills.sh conventions as compatibility input, not an unreviewed dependency.

## G. Provenance, credit, licensing and dependencies

Use [provenance template](UPSTREAM_PROVENANCE_TEMPLATE.md). **Every file copied/modified** needs source URL, exact commit SHA, original path, destination, license, copyright, modification notice, original tests and Xyeena tests. Record generated assets/models separately.

Broad guidance:
- **MIT:** retain copyright and permission notice with distributions.
- **Apache-2.0:** include license; mark modified files prominently; preserve relevant copyright/patent/trademark/attribution notices, and applicable upstream NOTICE. Its patent/trademark clauses are not interchangeable with MIT.
- **Anthropic Skills:** directory-specific terms; some source-available documentation skills are not Apache-2.0.
- **Trail of Bits:** check CC and file-specific terms, especially if adapting text.
- **Non-code assets:** images/fonts/videos/artwork can have separate rights; repository-wide LICENSE may not cover them.
- No reliance on a claimed license from an older tag when copying a newer commit.
- Dependencies: version pin/lock, install-time scripts, transitive licensing, size, platform support, SBOM where appropriate and optionality.
- Clear sections for REFERENCE ONLY vs DERIVED/MODIFIED vs DIRECT REUSE vs COMPOSITE. Research inspiration alone does not imply a derivative work.

**Owner's desired public shout-out may happen at launch or afterward**, but legally required attribution and license files must be in the first public commit/tarball that redistributes source.

## H. Acceptance / QA gates

**Gate H0 Alignment:** local/remote source and original master plan reconciled; no silent force-push and no lost user changes.

**Gate H1 Owner grill:** source selection, license strategy, initial composites, personality boundaries, host support/installer and release decisions recorded with explicit approvals. Max five substantive decisions per round.

**Gate H2 Source/legal audit:** every actual reused component has verifiable SHA, license, notices and source tests. No blind copy-paste from reference dumps or README claims.

**Gate H3 Composite parity:** comparative input, rubric, recorded tool evidence, defects and regression suite. Target measurable gains, not universal claims.

**Gate H4 Behavioral personality and host:** no persona overwrite; no competing governor; live host activation evidence where supported; graceful degradation otherwise.

**Gate H5 Installer:** transactional replacement, 3rd-party preservation, rollback, idempotence, memory protection, Windows/macOS/Linux scope clearly bounded.

**Gate H6 Package/release:** actual packed tarball includes skills, licenses and notices; source docs truthful; full security audit not auto-triggered; no secret leakage; brand/version publication require separate approval.

## I. Owner decision frontier (grill questions, do not answer for owner)

The next authorized audit should present 3–5 at a time, with concise trade-offs, based on actual source and version observations:

1. Source selection: **direct copy/vendor vs adaptation vs optional external dependency** for Hallmark/Impeccable and other methods? Suggest per-component rather than all-or-nothing.
2. First composite: /xyeena-design vs /xyeena-plan or another; how much visual/lint/style strictness?
3. License mode: allow Apache-2.0 source + notices inside MIT root product, or restrict to specific compatible implementations? Confirm asset treatment.
4. XYN-derived traits: which source definitions are approved to examine; which styles to exclude; how forceful should design critiques be?
5. Host priorities: AGY/Gemini/Hermes/Codex/Claude/ChatGPT Desktop order; workspace vs global defaults, allowed setup changes?
6. Konoha integration: retrieval and QA only, or optional orchestration runtime; is Node >=24 acceptable for optional module?
7. Distribution: npm + skills.sh convention, command names, compatibility with original Rig, version strategy and brand?
8. Existing installation cleanup: which receipts and legacy files are owned, and which data formats must survive?
9. Evaluation: which representative benchmark tasks represent owner expectations, and what score thresholds matter?
10. Rollout: one scoped composite pilot or broad simultaneous integration; release sequencing?

Default if owner has not answered = **NO IMPLEMENTATION**, only read-only source analysis and safe planning.

## J. Execution order after approvals

1. Reconcile GitHub and local desktop branch/commit/blueprint/master plan; do not overwrite missing local files.
2. Source and licensing inventory for RE-01–RE-31, identify legally reusable code and tests.
3. Establish baseline from real upstream test suites and current Xyeena behavior.
4. Owner grill, record accepted decisions.
5. Implement one approved composite pilot and verified source-level integration (initial candidate /xyeena-design).
6. Run comparative QA and critical usability/accessibility/security/false-positive checks.
7. Add remaining approved composites progressively; protect L0 size and fallback behavior.
8. Integrate behavioral trait layer after source approval, with a strict no-subagent boundary.
9. Verify host alignment and P08 installer with actual compatible hosts and safe filesystem fixtures.
10. Prepare notices, docs, source map, release notes and version/brand gate. Request explicit publication consent.

**Release criterion:** reproducible source provenance + tested behavior + real host evidence + legally complete package + owner-approved rollout. Do not call an untested composition "parity verified".
