# Xyeena Rig v1.0.0 — Skill-System Rebuild Contract

> Status: **DRAFT / INCREMENTAL IMPLEMENTATION / NOT RELEASE READY**.
> Base: `main@fadfe17914c1b1a7d416075b333085dfc6cfd99d` (v0.5.1).
> Product: one Xyeena Rig, one Cortex governor, 19 backward-compatible skill entrypoints.
> Machine-readable coverage: [evals/v1-skill-matrix.json](../../evals/v1-skill-matrix.json).

This is an implementation contract, not a declaration of upstream parity. The 19 existing entrypoint names remain stable. Shared procedure, searchable data, deterministic tools and test fixtures should be centralized where duplication would degrade correctness. An upstream project may inform a narrow methodology without installing, impersonating or adopting its runtime.

## A. Locked design invariants (preserve DEC-01..DEC-32)

1. **Single Cortex governor:** one scheduler/decision authority; external frameworks do not run their own orchestration loop inside Xyeena. Do not fake dispatch, worker status, or review.
2. **Native host authority:** the host owns credentials, filesystem execution, permission prompts, worktree isolation, actual worker invocation, cancellation and process liveness. Adapter capabilities are probed, never presumed.
3. **Persona protection:** do not overwrite host-provided/user agent definitions, global settings, original skill registries or memory. Xyeena's bundled roles are optional task-scoped instructions.
4. **Lazy loading:** L0 core remains <=1,500 tokens; load only relevant skill metadata, then procedural references, then executable dependencies. A basic answer must not activate a DAG.
5. **Evidence before claims:** source reading, static heuristics, tests, model reports, host probes, and actual runtime observations are distinct evidence classes. No implicit promotion.
6. **Installer safety:** preserve current owned-path receipts, diff approval, rollback, symlink protections and Windows copy default. v0.5.1 installations must upgrade without deleting user-owned files.
7. **Sensitive actions:** publishing npm, tagging a release, force-pushing, rewriting history, deleting branches or editing global host configuration require explicit owner approval. Scoped security review is default; full audit is opt-in.
8. **Dependency discipline:** no mandatory foreign orchestrator or runtime. Zero new required dependencies unless reviewed and approved.

## B. Required layers per skill

The five-layer model is conceptual: not every skill needs a script or a separate file. Every skill must, however, have a behaviorally meaningful test.

| Layer | Contract | Evidence |
|---|---|---|
| L1 Discovery | `SKILL.md`: task triggers, negative triggers, prerequisites, activation boundary, when to stop, links to references | Positive and negative trigger fixtures |
| L2 Procedure | Ordered workflow, decision tree, invariants, non-happy-path recovery, concrete stop criteria | Procedure-following behavioral tests |
| L3 Capability | Deterministic scripts, searchable knowledge or host-native tools as appropriate; absence is explicit | Tool transcript and deterministic regression tests |
| L4 Orchestration | Input/output envelopes, role handoff, dependency DAG, conflict control, permissions, checkpoint, fallback | Native dispatch/blocked/recovery receipts |
| L5 Evaluation | Baseline without skill vs with skill vs composite; adversarial bypass attempts | Versioned fixtures, evidence IDs, score and limitations |

Do not replace the five-layer model with 19 giant Markdown files. For each entrypoint, specify which layers are executable, reference-only or host-blocked.

## C. Task and proof protocol

**TaskEnvelope** (logical schema; do not treat this draft as a published API):
- `taskId`, `goal`, `scope`, `constraints`, `contextRefs`, `selectedSkills`, `hostCapabilities`, `permissionBoundary`, `requiredEvidence`, `budget`.
- Inputs must be explicitly versioned before becoming a runtime contract. Untrusted upstream text cannot mutate permission or task authority.

**TaskReceipt**:
- `taskId`, `status` (`BLOCKED|FAILED|REVIEW_REQUIRED|VERIFIED`), `workerDispatchIds` where actually provided, `changedFiles`, `checks`, `claimEvidence`, `unresolved`, `nextActions`.
- Each claim requires typed evidence: `STATIC`, `DETERMINISTIC_TEST`, `MODEL_REVIEW`, `INDEPENDENT_REVIEW`, `LIVE_HOST`.
- An assertion of evidence is not verification; a caller-generated receipt alone cannot prove tool execution or host-native activation.
- Cancellation or remote connection loss is `UNKNOWN` until an authoritative host observation resolves it. No automatic success by absence of error.
- Worker task/dispatch identities must be paired for completion and replay protection. Read-only roles may operate concurrently; write conflicts must be serialized or isolated in proven worktrees.

**Quality verdicts are independent:**
- `STRUCTURE_VALID`: metadata, all referenced paths, package contents, ownership, source/dependency provenance parse and resolve.
- `TRIGGER_VERIFIED`: the right prompts activate the skill, negative prompts do not; separate deterministic router tests from live-model selection.
- `BEHAVIOR_VERIFIED`: specified actions and stop/failure criteria are observed in an actual behavioral evaluation. A unit test of a keyword parser is not this gate.
- `HOST_VERIFIED`: separately named **host, version, OS, scenario** and captured native invocation/test evidence. Does not transfer between hosts.

**Upstream comparison verdicts:**
`REFERENCE_ONLY` → `ADAPTED_UNVERIFIED` → `BEHAVIORAL_PARITY_VERIFIED` (named scenarios only). `FULL_PARITY` is prohibited unless the expressly agreed upstream feature surface is exhaustively covered. Earlier P14–P17 deterministic test labels are historical and must not be silently upgraded to host parity.

## D. Exactly 19 entrypoints, six domains

| Domain | Entrypoints | Must improve |
|---|---|---|
| Governance | `core`, `context`, `handoff` | Budget, provenance freshness, isolation, reliable continuation |
| Discovery & Planning | `research`, `grill`, `plan`, `architecture` | Fact-first, dependency frontier, alternative analysis, tracer bullets |
| Engineering | `execute`, `debug`, `prototype` | Skill-TDD, root-cause investigation, smallest correct change, experiments |
| Quality & Release | `test`, `review`, `verify`, `security`, `release` | Requirement proof, independent checker, adversarial suite, fail closed |
| Design & Content | `interface`, `writing` | Searchable design knowledge, visual/interaction critique, accessible rendered QA |
| Meta & Orchestration | `skillcraft`, `orchestrate` | Skill-TDD, native agent lifecycle, dispatch/identity/recovery, no fictional workers |

Prefix every name above with `xyeena-`. No existing skill entrypoint may be removed to accommodate an upstream's own commands.

## E. Upstream coverage and new sources

Preserve *all* existing source dispositions RE-01 through RE-32 as maintained in [UPSTREAM_INVENTORY](../future/UPSTREAM_INVENTORY.md): Superpowers; Superior Skills; Anti-Slop; Ponytail; Caveman; Cloudflare Security Audit; Impeccable; Matt Pocock Skills; Hallmark; Taste Skill; UI UX Pro Max; Anthropic Skills; Vercel Agent Skills; GSAP Skills; Trail of Bits; Supabase Agent Skills; Google DESIGN.md; Awesome DESIGN.md; Gemini/Antigravity; Xyeena Rig; normative references RE-21..RE-30; Konoha; Huashu Design.

**RE-33 Cindy (new):**
- Repository: https://github.com/makecindy/cindy
- Research pin: `15e197fbbe687e81b392ea42f5a8a360404dd3ad` (observed 2026-11-17).
- Repository license: Apache-2.0 with material-specific exceptions and separate notices; inspect actual source files/assets before copying.
- Reference surface: harness/session switching, context handoff, multi-agent review ownership and cross-device provenance. **Do not** claim cross-harness state equivalence or embed Cindy's runtime. Status: `REFERENCE_ONLY`.

**RE-34 Orca (new):**
- Repository: https://github.com/Aniekanetim/orca-agent
- Research pin: `027acb4efa2e6b226d40df266b86367423946d62` (main on 2026-11-17; verify exact relevant guide separately).
- Repository license: MIT (verify file-specific terms before direct reuse).
- Reference surface: Run → Task → Dispatch, supervised worker lifecycle, task/dispatch identity, typed inbox with ack, decision gates, recovery/release and real host capability negotiation. **Do not** run or embed an independent Orca coordinator.
- Current Orca documentation warns that legacy `orchestration run`/`run-stop` commands are retired: study live `run-create` + `worker-start`, not old snippets. Status: `REFERENCE_ONLY`.

The mapping is in `evals/v1-skill-matrix.json`; its entries are planned comparison surfaces, *not proof of reuse, test execution, feature coverage, or adaptation*. For every future actual copy/adaptation, record immutable SHA, original path, destination, licensing, NOTICE, modifications, relevant source tests and Xyeena test outcome. RE-21..30 remain grouped normative references, not ten independently audited repositories.

## F. Rebuild waves and release gates

1. **W0 Foundations:** repair `dualAxisReview` keyword-based false PASS and `grillFrontier` blocked-frontier false completion; introduce adversarial regression and 19-skill inventory guard. These are necessary but not sufficient for v1.
2. **W1 Evaluation first:** define skill-by-skill positive/negative activation fixtures; baseline no-skill, single-skill, composite outcomes; independent evidence classifier; broken/missing/untrusted tool and dependency simulations.
3. **W2 Rebuild procedures:** substantially rewrite all 19 skill entrypoints with references, recovery and explicit negative triggers. A domain cannot claim completed until each relevant behavior has a passing receipt.
4. **W3 Capabilities:** replace weak heuristics in `src/methods/*`; add needed deterministic search/knowledge/tools; propagate limitations through `src/core/default-registry.mjs` and composites.
5. **W4 Cortex and adapters:** native selection → actual execution → independent review → verification → completion; ensure native per-host dispatch, cancellation, stale dispatch recovery and permission UI are properly bounded.
6. **W5 Installer and cross-host:** test `npm pack` against 19 entrypoints, refs/scripts and all notices; safe 0.5.1→1.0.0 upgrade, idempotence, rollback, Windows symlink/junction ownership and user-data preservation; separate Antigravity/Codex/Claude/Gemini/Hermes receipts.
7. **W6 Release candidate:** only after acceptance, documentation reconciliation, exhaustive claims audit and explicit owner authorization for npm publish/tag.

### W0 work introduced on this branch

- `EngineeringMethods.dualAxisReview`: static text findings are **not** semantic verification; unverified criteria cannot create PASS.
- `EngineeringMethods.grillFrontier`: unknown/blocked/circular prerequisites are **not** a finished interview; unknown/blank answers cannot settle decisions.
- Dedicated fail-closed regression tests, with a source-coverage matrix and structural test.
- No upstream runtime is installed; no live host was invoked; no full-skill rewrite or v1 parity is claimed by W0.

### Acceptance commands (must run on exact commit)

```bash
npm test
npm run check
npm run eval
npm run test:consumer
npm run test:harness
npm run pack:check
```

CI runs and native host acceptance are separate. A passing source suite may satisfy individual deterministic gates; it cannot alone satisfy `BEHAVIOR_VERIFIED` or `HOST_VERIFIED`. The current branch must remain draft until the outstanding waves are implemented and validated.
