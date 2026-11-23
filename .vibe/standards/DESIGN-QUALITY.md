# Design quality  -  project-specific, inspectable

Distilled (not copied) from AntiSlop, Hallmark, Impeccable, UI/UX Pro Max, Design Taste, Anthropic Frontend Design, Vercel Web Interface Guidelines, plus W3C WCAG 2.2 when relevant.

## Design-intent contract

Before choosing aesthetics record product category, audience, primary job, tone in concrete adjectives, desired reference qualities (not unlawful replication), brand assets, prohibitions, target platforms, content/assets actually available. Avoid “clean modern” as a complete art direction. A utilitarian dashboard needs different visual ambition than a marketing campaign, game UI or medical interface.

## Visual AntiSlop and intent (UI work only)

- Reject interchangeable generated layouts, decoration without purpose, placeholder marketing claims, generic hero patterns, purposeless gradients and repeated glass/card treatments.
- Apply Hallmark-inspired fidelity to real identity and tokens; Impeccable-inspired completeness across interactive states; Design Taste and UI/UX Pro Max-inspired hierarchy and composition. These are design cues, not substitute evidence.
- Prefer concrete, audience-specific content and accessible interactions over novelty. Verify real rendering, not imagined pixels.

## System, not collage

- Define named color, typography, spacing, radius, iconography, elevation, motion and density tokens. Reuse in implementation; check actual generated CSS/SwiftUI/Compose etc., not only Markdown.
- Establish one coherent hierarchy: content priority, reading order, primary action, meaningful whitespace, responsive grids and content density.
- Use real approved assets or conspicuously labeled placeholders. No fabricated customer metrics, company logos, quotes, UI screenshots, testimonials, or third-party visual rights.
- Consider one distinctive compositional gesture aligned with product identity, instead of unrelated decorative flourishes. Distinctiveness must not reduce clarity or performance.
- Do not ban gradients, cards, serif type or dark UI categorically. Reject unsupported repetition, not a stylistic category chosen for good reason.

## Interaction fidelity

Specify routes/surfaces, role restrictions, data source, keyboard flow, touch targets, validation, unsaved changes, loading, empty, success, error, unauthorized, offline/timeout and destructive confirmation where relevant. Provide recovery actions. Auth is enforced server/data-side, never by hidden UI.

## Accessible & responsive by design

For web, default target WCAG 2.2 AA as a **project proposal**, not a compliance claim; verify success criteria with tools and manual testing. For native apps, reference current official platform guidance and test assistive technology on target devices. Check labels, semantic order, focus, contrast, text resize, high zoom, input modality, reduced-motion, content reflow and language formatting.

## Visual verification loop (when tools permit)

1. Compare rendered result to approved direction across **project-chosen** breakpoints and state variants; do not invent screenshots.
2. Check overflow/long translations/errors/data extremes, layout consistency, focus/keyboard, motion and performance.
3. Conduct independent critique if real reviewer capability exists. Provide ranked defects with repro and screenshots only when actually captured.
4. Record tool limitations and untested surfaces; do not substitute written confidence for visual checks.

## Quality scoring rubric (human judgment; not automated proof)

Rate each 0–3 with evidence: purpose fit, hierarchy, system coherence, interaction feedback, accessibility, responsive integrity, content authenticity, technical performance. `0=missing/broken`, `1=major gaps`, `2=acceptable with issues`, `3=well executed with evidence`. Any critical security/accessibility block cannot be averaged away by aesthetics.

## Domain-routing examples

- Marketing/portfolio: stronger editorial composition and real imagery; conversion intent and content provenance.
- Operations dashboard: legibility, error prevention, dense information, auditability; motion restrained.
- Mobile: native navigation/gesture conventions and smaller-width state checks.
- Games: HUD comprehension, input device, readability during motion, latency and accessibility options.
- CLI: hierarchy via terse syntax/help, error specificity, terminal width and output stability; visual design tokens usually N/A.

Upstream provenance is maintained in the generator source. External skills may be used when useful; this document is usable without them.
