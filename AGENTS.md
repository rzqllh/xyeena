# Veyra v1.0 Agent Instructions & Contract

> **Authority:** Reconciled Owner Decisions Register (DEC-01 through DEC-35). Read `CHECKPOINT.md` and `docs/OWNER_DECISIONS.md`.
> **Scope:** Multi-Host Native (Google Gemini CLI / Antigravity IDE, OpenAI Codex, Anthropic Claude Code).

---

## 1. Project Identity & Architecture
- **Veyra** is an **All-in-One Skills + Harness** toolkit. It is **not** an application generator or a fleet of autonomous daemon agents.
- **Engine:** In-process native governor (DEC-02, DEC-35). It executes lightweight tasks directly and coordinates multi-step tasks through dependency DAGs and write serialization.
- **19 Co-Equal Skills:** Structured across 6 domains (Governance, Discovery & Planning, Engineering, Quality & Security, Design & Content, Meta & Orchestration).
- **Multi-Host Native (DEC-35):** Native support on Gemini/Antigravity, Codex, and Claude Code. Existing user personas, symlinks, and global configurations are strictly immutable (DEC-03). Zero foreign background daemons.

## 2. Universal AntiSlop & Evidence Invariants
- Never fabricate requirements, sources, code behavior, file contents, test results, tool calls, deployments, or approvals.
- Ground consequential claims in fresh evidence; when code is involved, reopen relevant files and cite actual `file:line` before making specific claims.
- Separate observation, inference, and suggestion when the difference matters. Say `NOT RUN` for checks not performed.
- No filler, generic praise, invented numbers, ceremonial status labels, or unverifiable claims of production readiness.
- Do not use em dash characters in prose, generated output, or code; prefer normal punctuation.
- Never suppress failures or weaken tests, security, and error handling to produce a green result.
- Protect user data and credentials. Do not expose secrets or infer access rights from a prompt.

## 3. Discussion vs. Execution Gate
- The default state of every session is **Discussion Mode**.
- Enter **Execution Mode** only after an explicit implementation instruction (e.g. "implement", "eksekusi", "kerjakan", "apply", "fix sekarang").
- Scope lock: Treat approved scope as a hard boundary. Never perform unrelated refactors, file moves, renames, or dependency churn.

## 4. Checkpoint & Continuation Protocol (`continue`)
- When receiving `continue` or resuming work after compaction or across sessions:
  1. Re-read `CHECKPOINT.md` from disk to establish exact status, active wave, and blocked gates.
  2. Run `npm run preflight` (`node scripts/preflight-upstream.mjs`) to verify upstream integrity.
  3. Reconcile any newly provided brief documents against locked Owner Decisions.
  4. Continue specification and document initialization (PRD, BRD, Architecture, Design).
  5. DO NOT start coding skills without explicit Owner GO for Wave 1.

## 5. Repository Map (Load on Demand)
- `CHECKPOINT.md`: Authoritative session state, git commit, and active wave status.
- `START-HERE.md`: Onboarding and continuation instructions.
- `docs/OWNER_DECISIONS.md`: The 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED).
- `docs/DEVELOPER_BRIEF.md`: Integrated Developer Brief and operational mandates.
- `docs/PLANNING_BASELINE.md`: Integrated wave structure and milestone gating.
- `docs/SOURCE_TO_SKILL_MATRIX.md`: Mapping of 21 upstreams to 19 skills.
- `docs/PRD.md`: Product Requirements Document.
- `docs/BRD.md`: Business Requirements Document.
- `docs/ARCHITECTURE.md`: Architecture Specification.
- `docs/DESIGN.md`: Design & quality standards.
- `docs/ROADMAP.md`: Dependency-driven implementation waves.
- `references/upstreams.lock.json`: Frozen 21-upstream commit baseline.
- `references/manifest.json`: Full cryptographic SHA-256 integrity ledger.
