# Veyra v1.0 — Start Here

Welcome to the Veyra v1.0 developer workspace.

---

## What to do if you are continuing work (`continue`)

If you are an AI assistant opening this workspace or receiving the prompt `continue`:

1. Read [`CHECKPOINT.md`](CHECKPOINT.md) first to get the authoritative current state.
2. Run upstream preflight:
   ```bash
   node scripts/preflight-upstream.mjs
   ```
3. Verify that `docs/DEVELOPER_BRIEF.md` and `docs/PLANNING_BASELINE.md` are integrated and synchronized with DEC-01..35.
4. Advance specification and document refinement (PRD, BRD, Architecture, Design, Test Criteria).
5. Do not start coding skills without explicit Owner approval for Wave 1.

---

## Starting New Discussion / Review

If you are discussing plans or exploring requirements:
- Read [`docs/OWNER_DECISIONS.md`](docs/OWNER_DECISIONS.md) to understand the 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED).
- Read [`docs/ROADMAP.md`](docs/ROADMAP.md) for the 7 dependency-driven waves.
- Ask high-value questions that resolve remaining ambiguities without reopening settled decisions.
