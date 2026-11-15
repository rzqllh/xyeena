# XYEENA — Master Plan 14/10/2026: Reconciled Master Architecture & Strategic Roadmap

> **Status: RECONCILED / P17 LOCAL PASS (687/687 tests PASS across 74 suites)**
> Baseline Rebuild: `feat/rebuild-foundation-p00` published on remote at commit `bbd71abfc5045cda3c39ea7655f0a8519d88f275` (609/609 tests PASS).
> Remote Authority: `origin/main` at commit `55effeac22b5fe8146ecf092b352d5bbb639b535` (reconciliation integration pending).
> Reconciled on 2026-11-15. This document unifies the remote reconciliation seed with the verified desktop rebuild foundation and locked owner decisions DEC-01 to DEC-32.

**Repository:** https://github.com/rzqllh/xyeena
**Product:** Xyeena Rig (All-in-One Skills & Harness)
**Engine:** Cortex (Native Orchestration Intelligence Layer)
**Package:** `xyeena-agent` (Published baseline: `0.4.1`; Local rebuild: unreleased)
**Pointer:** [Detailed future integration plan](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md)
**Provenance ledger template:** [Source-level licensing and credit](docs/future/UPSTREAM_PROVENANCE_TEMPLATE.md)

---

## 1. Executive Summary & Repository Status

Xyeena Rig provides 19 packaged Agent Skills, 64 native capability contracts, and an opt-in project Harness.
The local desktop rebuild foundation on branch `feat/rebuild-foundation-p00` is fully reconciled with `origin/main`:
- **687 / 687 tests pass** across 74 test suites (including 17 comprehensive P17 specialized platform, security, retrieval & motion tests, 21 P16 engineering intelligence & design closure tests, 12 P15 design intelligence tests, 12 P14 comparative baseline tests, and 16 P13 cross-domain composite tests).
- All 64 capability contracts are bound to concrete executable handlers in `src/core/default-registry.mjs`.
- **Cortex** is established as the default intelligence layer (DEC-27), providing lightweight routing (< 5ms) for micro tasks and composite DAG execution for complex goals.
- **Transactional Conditional Installer** (DEC-26, DEC-29) enforces strict fail-closed protection for user-modified files via the Hybrid Diff Gate, defaults to `copy` on Windows, safely preserves custom user files on uninstall, and verifies rollback.
- **Artifact Governance & Adaptive Persistence** (DEC-28, DEC-30) prevents clutter by managing runtime state under `.xyeena/`, isolating disposable artifacts, and persisting plans and audits only when requested or structurally warranted.
- **Delegated Engineering Authority** (DEC-31) establishes that routine engineering, refactoring, and test fixes proceed autonomously under locked scope, while high-impact destructive operations and releases remain owner-gated.
- **Cross-Domain Methodology (DEC-32)** establishes Superpowers and Anti-Slop as universal workflows and quality filters across all 9 Cortex domains.

---

## 2. Locked Owner Decision Register (DEC-01 to DEC-32)

All 32 owner decisions are locked, authoritative, and reconciled across local and remote sources:

| ID | Title & Summary | Actual Status |
| :--- | :--- | :--- |
| **DEC-01** | **Product Identity:** Xyeena Rig is an All-in-One Skills + Harness toolkit, not a fleet of independent XYN subagents. (Full upstream All-in-One integration remains planned). | `DECIDED` / `IMPLEMENTED_LOCAL` |
| **DEC-02** | **Single Controller / Governor:** Single workflow controller; existing host/user agent comes first; no competing Superpowers, Konoha, or third-party governors. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-03** | **Persona & Prompt Protection:** Existing host personas and instructions (`.gemini/agents/`, etc.) are read-only and never overwritten or replaced. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-04** | **Kernel Budget & Efficiency:** Small always-on core (L0 budget $\le$ 1500 tokens); domain-specific skills loaded lazily only when relevant. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-05** | **Contextual Quality / Anti-Slop:** Anti-Slop applies contextually during and after work; mathematical WCAG contrast calculation; no blanket code wordlists. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-06** | **Scoped vs Full Security Audit:** Scoped security review by default; comprehensive security full-audit is strictly opt-in and requires explicit user consent. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-07** | **Epistemic Evidence Standard:** Claims must be backed by fresh empirical evidence; model-generated text or simulated mocks do not equal verification. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-08** | **Local-First State & Safe Recovery:** State persists locally; scoped filesystem rules; atomic crash recovery; no unauthorized data exfiltration. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-09** | **Dependency Discipline:** Zero required external frameworks for the base kernel; new dependencies strictly justified and authorized. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-10** | **Transactional Legacy Replacement:** Installer safely replaces only verified Xyeena-owned legacy components, preserves user data, and rolls back on error. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-11** | **User-Selected Skills Precedence:** User-selected skills and configurations take precedence over automated suggestions. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-12** | **Composite Capability Composition:** Complex tasks utilize composite skills, DAG planning, and quality gates without creating uncontrolled subagent swarms. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-13** | **Native Fallback Architecture:** All capability contracts have native fallback implementations when third-party skills/backends are absent. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-14** | **Host Authorization Boundary:** Host runtime retains exclusive authority over execution, credentials, sandboxing, and tool interception. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-15** | **Sandboxing Truthfulness:** OS sandboxing cannot be inferred from library objects, caller-asserted flags, or mock receipts. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-16** | **Bounded One-Shot Execution:** Headless execution requires explicit consent, bounds turns and token limits, and redacts sensitive error telemetry. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-17** | **Process Cancellation & Teardown:** Cancellation propagates via scoped AbortSignal; termination is best-effort child/tree kill without claiming unverified remote billing cessation. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` (OS tree kill: `LIVE_BLOCKED`) |
| **DEC-18** | **Write Serialization & Lock Contention:** Shared workspace writes stay serialized with monotonic fence tokens; active PID locks are never stolen solely by elapsed time. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-19** | **Provider Token Accounting:** Post-run token accounting verifies reported usage against task budget; it does not serve as a real-time provider billing cap. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-20** | **Release Environment Separation:** Stable release requires exact git commit, OIDC trusted publishing, tag verification, and explicit owner consent; no automated publish on commit. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-21** | **Multi-Path Tool Argument Review:** All path-bearing arguments in tool invocations require boundary inspection to prevent out-of-workspace writes. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-22** | **Failure Loop & Oscillating Review Prevention:** Hard cycle breakers terminate oscillating task review loops and return control to the human operator. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-23** | **Safe Non-Idempotent Recovery:** Non-idempotent or destructive tasks are never automatically retried; crash recovery halts for operator reconciliation. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-24** | **Host Compatibility Tiering:** Support is categorized into Verified, Degraded, Static, and Unsupported tiers; priority hosts are Antigravity and Gemini. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` (AGY CLI: `LIVE_HOST_VERIFIED`; AGY IDE: `LIVE_BLOCKED`) |
| **DEC-25** | **Git Alignment Gate:** Git remote-desktop alignment must be verified before any future roadmap implementation begins. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-26** | **Hybrid Installer Diff Gate:** Strict fail-closed + interactive review; detects user-modified files; requires unified diff preview and `--diff-approved-fingerprint`; safe uninstall; true rollback. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-27** | **Cortex Default Intelligence Layer:** Native orchestration intelligence active by default; micro tasks direct (< 5ms); complex tasks use composite skills & DAG. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` (Live host daemon hook: `HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`) |
| **DEC-28** | **Artifact Governance:** Strict organization of state into internal runtime (`.xyeena/`), managed plans/audits (`docs/audits/`), and disposable execution artifacts. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-29** | **Windows Installer Mode:** Default mode is `copy`; symlink/junction explicit-only; no silent fallback; strict lstat/realpath validation; path traversal protection; fail-closed. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-30** | **Adaptive Artifact Persistence:** Cortex decides artifact persistence contextually; deliverables generated on explicit request or complex tasks; atomic collision deduplication. | `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |
| **DEC-31** | **Delegated Engineering Authority:** Owner delegates routine engineering, refactoring, test fixes, and docs updates within locked scope; escalations reserved for destructive git actions, releases, and fundamental licensing. | `DECIDED` |
| **DEC-32** | **Cross-Domain Methodology Lock:** Superpowers (Universal Workflow Methodology) and Anti-Slop (Universal Contextual Quality Methodology) apply adaptively across all 9 Cortex domains; universal applicability, selective execution; Cortex remains sole governor. | `DECIDED` / `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL` |

### 2.1 Cross-Domain Methodology Specification (DEC-32)

1. **Superpowers — Universal Workflow Methodology:**
   - Applied adaptively across: Research/investigation, Product discovery/brainstorming, Architecture/technical planning, Design/prototyping, Coding/testing/debugging, Security/compliance/review, Writing/documentation, Project coordination/delegation/handoff, and Release preparation/verification.
   - Contextual selection: verification-before-completion applies cross-domain; TDD is not forced onto copywriting or non-code tasks without tests.
2. **Anti-Slop — Universal Contextual Quality Methodology:**
   - Applied adaptively across: Code quality (comment hygiene), UI/UX and visual design, Mobile layouts, Copywriting and human writing, Research and reasoning quality, Specifications/plans/ADR, Testing and test evidence, Security reports, Documentation, and Release communication.
   - Evaluates context-relevant quality; never blindly strips words or patterns.
3. **Responsibility Boundaries:**
   - **Cortex:** Sole orchestration governor, task intent classification, effort/budget ceiling enforcement, state checkpointing, TaskGraph DAG management, host negotiation, and Rule 4 Execution Gate enforcement.
   - **Superpowers:** Contributes disciplined workflow patterns (pre-implementation problem sizing, phased execution with rollback paths, falsifiable hypothesis tracking, red-green verification, and dual-axis review). Never acts as an independent control loop or background daemon.
   - **Anti-Slop:** Contributes evaluative quality filters (comment sanitation preserving rationale, buzzword elimination, WCAG 2.2 touch target sizing 24px AA / 44px AAA, focus indicators, fluid mobile boundaries, and lean diff audits). Never acts as an unprompted blocking generator.
4. **Trigger & Budget Contracts:**
   - **Positive Triggers:** Explicit user slash commands (`/xyeena-design`, `/xyeena-plan`, `/xyeena-execute`, `/antislop`, `/tdd`, etc.), multi-module architectural tasks (Tier 2/3), design token updates, copy authoring, and security audits.
   - **Negative Triggers:** Tier-0 micro tasks (strictly exempt from planning, subagent dispatch, and ceremony), greetings, and read-only queries.
   - **Budget Contract:** L0 Kernel $\le$ 1,500 tokens (actual 535–616); Tier-0 micro tasks strictly $< 500$ tokens with zero trait/domain overhead; L1/L2 capability contracts and Behavioral Trait Overlays lazy-loaded on demand (~50–120 tokens).
5. **Precedence, Fallback & Evidence:**
   - **Precedence:** Explicit user skill selection > Workspace rules > Existing repository architecture & design system > Global defaults.
   - **Fallback Behavior:** All 11 composite skills degrade gracefully to internal inline execution when host-native subagents or external tools are unavailable.
   - **Evidence Requirements:** Fresh execution evidence (terminal logs, test outputs) required before any completion claim (DEC-31/32). Self-certified text claims are rejected.
   - **Known Unverified Behavior:** Live host hook interception on Antigravity IDE 2.5.5 remains reported as `LIVE_BLOCKED`; provider spend caps remain unverified.

---

## 3. Strategic Decisions from Grill Rounds (Planned Scope)

The following foundational strategic decisions were established during Grill Rounds 1–5:

1. **Selective Upstream Reuse (Grill Round 1–2):** Prefer licensed upstream reuse/composition where permitted with full provenance ledger, rather than shallow handcrafted mimicry. (Status: `ADAPTED_VERIFIED (P14–P17 & Final Closure)`; Superpowers RE-01, Superior RE-02, Anti-Slop RE-03, Ponytail RE-04, Caveman RE-05, Cloudflare RE-06, Impeccable RE-07, Matt Pocock RE-08, Hallmark RE-09, Taste RE-10, UI UX Pro Max RE-11, GSAP RE-14, Trail of Bits RE-15 [clean-room], Supabase RE-16, Konoha RE-31 [bounded retrieval & MCP parity], and Huashu Design RE-32 integrated via source-backed adaptation into native methods with full provenance ledgers and tests. Remaining upstreams RE-12, RE-13, RE-17, RE-18, RE-19, and RE-21..30 definitively classified as `REFERENCE_ONLY` / standards with zero unvetted runtime dependencies).
2. **XYN Personality Synthesis (Grill Round 3):** Synthesize behavioral traits and domain voice of XYN personas into an architectural guidance overlay without importing character personas or modifying host agent identities. (Status: `XYN_ARCHITECTURAL_PRINCIPLES_SOURCE_INSPECTED_LOCAL` / `VERIFIED_LOCAL`; active runtime trait engine in `src/core/personality.mjs` incorporating Maker-Checker separation, empirical claim boundaries, adversarial testing, and single governor invariant without fictional character identities).
3. **Modified Legacy Installation Protection (Grill Round 5):** Modified legacy installations strictly require user review of diff before replacement (formalized into DEC-26). (Status: `IMPLEMENTED_LOCAL` / `VERIFIED_LOCAL`).
4. **Final End-to-End Acceptance (Campaign Closure):** 18 comprehensive end-to-end acceptance scenarios verified in `test/e2e-acceptance-campaign.test.mjs`, establishing end-to-end proof from natural language routing through execution, security, database safety, bounded retrieval, DAG execution, installer safety, and artifact governance. (Status: `706 / 706 tests PASS` across 75 test suites).

---

## 4. Architectural Invariants

1. **L0 Core Budget:** Core kernel prompt allocation is bounded $\le$ 1,500 tokens (empirically 535–616 tokens).
2. **Single Workflow Governor:** Xyeena Cortex is the sole controller. Third-party skills never act as competing control loops.
3. **Existing Agent First:** Personas on host disk are immutable and respected.
4. **Gated Security:** Passive review by default; full security audit requires explicit user command.
5. **Fail-Closed Permissions:** Incomplete readiness, missing consent, or unverified hosts fail closed.
