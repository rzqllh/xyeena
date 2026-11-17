---
name: xyeena-interface
description: Use when designing, building, redesigning, auditing, or polishing a frontend, UI, UX flow, landing page, dashboard, component library, or responsive interface.
---

# Interface — v1 Procedure Entry

**Activate when:** A real web/mobile interface, interaction flow, design system, accessibility or responsive audit is requested.

**Do not activate for:** Pure backend work, content-only changes with no interaction, or aesthetic redesign that violates a locked product brief.

## Execution route

1. Inspect product job, existing stack, design tokens, actual copy/data, target devices and accessibility constraints; classify Persuade/Operate/Read/Experience.
2. Use UI UX Pro Max's searchable design-knowledge approach for layout/type/color/interaction references; select evidence specific to stack and surface rather than loading all guides.
3. Explore distinct directions where the brief warrants; pick one through hierarchy, information density, interaction mechanics and design-system fit before implementation.
4. Apply Hallmark quality floor (keyboard focus, reduced motion, no layout-thrashing motion, overflow and hit targets) plus Impeccable critique/polish; honor intentional brand exceptions with evidence.
5. Verify rendered screenshots across relevant widths, keyboard and screen-reader semantics, empty/loading/error, responsive content, interaction and console/network; static CSS scanning cannot certify visual quality.

**Output contract:** Surface brief and references, selected direction, token/state map, rendered QA evidence, issue-by-issue fixes and residual gaps.

**Failure boundary:** A generated visual specification, static lint or screenshot of one state is not proof that mobile interactions or accessibility work.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.

## Selective design knowledge lookup

Use the bundled `scripts/search-design-knowledge.mjs` against `knowledge/design-index.json` for targeted guidance, e.g. `node skills/xyeena-interface/scripts/search-design-knowledge.mjs "dashboard filter" nextjs operate`. This returns **reference-only guidance**, not live UI acceptance. Verify real rendering, interaction and accessibility before claiming quality.
