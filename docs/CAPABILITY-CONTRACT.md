# Capability Contract Specification

[Current source and host acceptance (2026-10-26)](STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

Xyeena Rig distinguishes between **19 packaged Agent Skills** (on-disk folders under `skills/`) and **64 native capability contracts** registered in the Cortex engine (`src/core/default-registry.mjs`).

---

## 1. Packaged Skills vs Native Capability Contracts

| Category | Count | Location | Format | Purpose |
| :--- | :---: | :--- | :--- | :--- |
| **Packaged Skills** | 19 | `skills/xyeena-*/` | `SKILL.md` + `capability.json` | Model-facing guidelines adhering to the Agent Skills standard, discovered by host agent runtimes |
| **Native Capability Contracts** | 64 | `src/core/default-registry.mjs` | JavaScript Contract Objects + Concrete Handlers | Machine-level executable capabilities powering the Cortex orchestration engine across 9 domains |

---

## 2. The 9 Functional Domains (64 Capabilities)

All 64 native capability contracts are bound to concrete executable handlers in `src/core/default-registry.mjs` and verified in `test/p10-1-cortex-64-bindings.test.mjs`:

### 1. Thinking (`thinking.*` — 7 capabilities)
- `thinking.brainstorming`: Creative ideation and assumption exploration.
- `thinking.deep-module-design`: Deep module seam analysis and abstraction boundaries.
- `thinking.systematic-debugging`: Root-cause hypothesis generation and defect isolation.
- `thinking.frontier-grilling`: Critical stress-testing of assumptions and plans.
- `thinking.epistemic-classification`: Categorizing assertions into evidence tiers.
- `thinking.tradeoff-analysis`: Pragmatic evaluation of architectural alternatives.
- `thinking.domain-modeling`: Conceptual domain entity definition and glossary formation.

### 2. Design (`design.*` — 7 capabilities)
- `design.design-system`: Three-layer design token generation and scales.
- `design.ux-craftsmanship`: Anti-generic interface heuristics and visual hierarchy.
- `design.contrast-calculation`: Pure JavaScript mathematical WCAG 2.1 AA luminance checking.
- `design.slide-generation`: Strategic deck architecture and visual presentations.
- `design.layout-composition`: Fluid responsive grid and tap-target compliance.
- `design.interaction-states`: Comprehensive focus, hover, disabled, and error state matrices.
- `design.component-specification`: Deep specifications for reusable UI primitives.

### 3. Engineering (`engineering.*` — 8 capabilities)
- `engineering.tdd`: Test-driven red-green-refactor workflow enforcement.
- `engineering.clean-implementation`: Bounded scoped feature execution.
- `engineering.safe-refactoring`: Behavior-preserving structural code modification.
- `engineering.surgical-patching`: Narrow root-cause bug repair.
- `engineering.dependency-resolution`: Dependency audit and conservative upgrade analysis.
- `engineering.api-runtime-hardening`: Contract validation and boundary parsing.
- `engineering.state-persistence`: Local atomic file persistence and transaction safety.
- `engineering.worktree-isolation`: Multi-branch workspace isolation and collision safety.

### 4. Quality (`quality.*` — 7 capabilities)
- `quality.comment-hygiene`: Filtering obvious and repetitive AI-generated comments.
- `quality.copywriting-anti-slop`: Detection and elimination of generic AI marketing prose.
- `quality.dual-axis-review`: Multi-perspective structural and risk code auditing.
- `quality.regression-prevention`: Targeted regression test generation and verification.
- `quality.acceptance-validation`: Independent outcome evidence evaluation.
- `quality.dead-code-detection`: Identification and safe removal of unreachable code.
- `quality.performance-budgeting`: Overhead profiling and token budget tracking.

### 5. Security (`security.*` — 8 capabilities)
- `security.scoped-review`: Passive baseline security analysis (default mode).
- `security.full-audit`: Comprehensive security pipeline (strictly opt-in via user consent).
- `security.trust-boundary-validation`: Untrusted input sanitization and parameter guards.
- `security.secret-scanning`: Pattern and entropy inspection for credentials.
- `security.authz-verification`: Permissions, role, and boundary policy checks.
- `security.supply-chain-audit`: Dependency vulnerability and lockfile verification.
- `security.path-traversal-guard`: Boundary validation for path-bearing tool arguments.
- `security.injection-defense`: Defense against prompt injection and payload escapes.

### 6. Coordination (`coordination.*` — 7 capabilities)
- `coordination.task-dag-orchestration`: Multi-step dependency execution planning.
- `coordination.single-governor-arbitration`: Exclusive authority enforcement for Cortex.
- `coordination.host-native-delegation`: Controlled dispatch to host subagents.
- `coordination.worker-lease-fencing`: Monotonic token fencing for concurrent runners.
- `coordination.anti-loop-termination`: Oscillating review and failure cycle termination.
- `coordination.context-compaction`: Token-efficient context summarization and handoff.
- `coordination.checkpoint-recovery`: Crash resumption from verified task checkpoints.

### 7. Delivery (`delivery.*` — 7 capabilities)
- `delivery.git-workflow`: Bounded branch, commit, and development freeze operations.
- `delivery.release-verification`: Preflight checklist and packaging integrity validation.
- `delivery.license-provenance`: Verification of third-party attribution and licenses.
- `delivery.artifact-governance`: Adaptive persistence and collision-safe file writes.
- `delivery.pr-preparation`: Scoped evidence-grounded pull request description authoring.
- `delivery.changelog-maintenance`: Conventional changelog recording.
- `delivery.semantic-versioning`: SemVer evaluation based on API surface diffs.

### 8. Knowledge (`knowledge.*` — 7 capabilities)
- `knowledge.primary-source-research`: Grounded investigation of authoritative documentation.
- `knowledge.codebase-navigation`: Efficient semantic symbols and reference localization.
- `knowledge.memory-retrieval`: Retrieval of persistent workspace notes and memory.
- `knowledge.glossary-curation`: Project-wide terminology and acronym stabilization.
- `knowledge.adr-generation`: Structured Architectural Decision Record documentation.
- `knowledge.evidence-ledger`: Tracking verification receipts and test hashes.
- `knowledge.context-indexing`: Lightweight keyword and symbol indexing.

### 9. Extensibility (`extensibility.*` — 6 capabilities)
- `extensibility.skill-crafting`: Authoring and linting of standard Agent Skills (`SKILL.md`).
- `extensibility.host-adapter-binding`: Mapping portable contracts to host-specific tools.
- `extensibility.plugin-manifest-validation`: Schema verification for host plugin manifests.
- `extensibility.fastmcp-bridge`: Bounded FastMCP transport for read-only workers.
- `extensibility.hook-lifecycle-management`: Managing Antigravity Guided lifecycle hooks.
- `extensibility.custom-evaluator`: Constructing deterministic evaluation fixtures.

---

## 3. Machine Contract Schema (`capability.json`)

Each capability defines:
- `metadata`: `id`, `name`, `version`, `category`, `description`.
- `type`: `KNOWLEDGE`, `PROCESS`, `TOOL`, `AGENT`, `GOVERNOR`, `GATE`.
- `activation`: Trigger intents, prompt signals, file paths, and eligible states.
- `workflow`: Entry state, observable completion criteria, transitions.
- `dependencies`: Array of required capability IDs.
- `chain`: Allowed dynamic follow-on capabilities.
- `requirements`: Required host tools or runtime prerequisites.
- `parallelism`: `SAFE` or `SERIAL_ONLY`.
- `consent`: Minimum permission boundary (`READ_ONLY`, `WORKSPACE_WRITE`, `EXTERNAL_DESTRUCTIVE`).
- `evidence`: Required proof type before completion.
- `budget`: `defaultTokens` and `maxSupporting` (bounded $\le 5$).
- `handler`: Executable JavaScript function in `src/core/default-registry.mjs`.

---

## 4. Epistemic Evidence Tiers (DEC-31)

To prevent overclaiming, Xyeena Rig enforces four strict evidence tiers:

1. **`CONTRACT_ONLY` (0 in Rebuild):** The capability contract exists in schema, but has no functional handler.
2. **`BEHAVIOR_VERIFIED` (64 / 64 in Rebuild):** The capability handler is bound, executable, and verified by automated unit and integration tests.
3. **`COMPARATIVE_VERIFIED` (7 Golden Scenarios):** Behavior verified to match or exceed golden reference implementations from upstream ecosystems (Superpowers, Superior, Anti-Slop, Ponytail, Caveman, Cloudflare, Xyeena Baseline).
4. **`LIVE_HOST_VERIFIED` (Host-dependent):** Verified in an actual live host session with empirical observation of host permission prompts, tool interception, or execution traces.
