# Blueprint: source library and generated project (v4.0.2)

## One source of truth, two surfaces

- **Generator source:** complete 59-document catalog, upstream mapping, templates, offline helper/validator and scoped standards. This large library stays outside the default project export.
- **Generated project:** lean `AGENTS.md`, ultra-thin `CLAUDE.md`/`GEMINI.md`, beginner entry point, optional Copilot/Cursor pointer, brief, and only user-selected documents and relevant domain standards/rules.

## Runtime flow

1. User describes an idea, or requests a small set of recommendations.
2. Interactive grilling asks only the next important question, in their language.
3. User can choose, customize, or write project documentation.
4. The generator previews available schema relationships from actual SQL; it does not invent a schema.
5. The user may connect a BYOK model. Lack of provider access does not prevent deterministic local editing and ZIP export.
6. The generator exports selected documents and a scoped host-adaptive instruction layer, without lifecycle ledgers or a copy of the template catalog.
7. Coding agents discuss unapproved changes until GO. Execution after GO is bounded by the authorized scope and risk.

## Quality boundaries

- Universal AntiSlop means honesty, anti-filler, source-backed claims, no em dash, real verification, security boundaries and appropriate scope. Its invariants are directly in `AGENTS.md`.
- Visual quality is domain specific. Hallmark, Impeccable, Design Taste, UI/UX Pro Max and visual AntiSlop principles are in `.vibe/standards/DESIGN-QUALITY.md` and selected native rules.
- Host-adapter syntax is checked structurally. Actual host instruction loading is not inferred from file presence.
- CLI checks validate structure and references, not rendered design, real LLM behavior, or external provider capability.

## Verification

`python scripts/v4.py check --template`, `python scripts/v4.py check --project`, `python -m unittest discover -s tests -v`, and Studio's `npm run check`/`npm run build` should provide actual exit codes before release claims.
