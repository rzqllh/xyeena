# Design  -  v4 adaptive template

<!-- V4-TEMPLATE id=design; version=4.0.2 -->

## Design brief and intent

**Questions/required fields:** Audience and task; design personality described concretely; reference strengths/constraints; what must NOT be copied. Approved brand materials only.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Interaction architecture

**Questions/required fields:** Surface/site map, navigation model, primary and alternate journeys, action permissions, deep links and escape routes.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Design-system vocabulary

**Questions/required fields:** Real design tokens (palette, typography roles, spacing, elevation, radii, icons, grid, density, motion); implementation source path and version.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Unique composition and content

**Questions/required fields:** One meaningful design differentiator tied to audience; verified content/assets, no invented screenshots, metrics, endorsements or brands.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## State matrix

**Questions/required fields:** For each component: idle, hover/focus, loading, empty, invalid, error, success, disabled, offline, unauthorized, destructive, long content where applicable.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Responsive and native adaptation

**Questions/required fields:** Supported widths/devices, safe area, keyboard/touch, zoom/reflow, RTL/locale, table overflow, reduced-motion, constraints for density.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Accessibility criteria

**Questions/required fields:** Proposed target: WCAG 2.2 AA for web where applicable; exact criteria, keyboard/focus, contrast, labels, AT/manual tests and defect ownership.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Visual verification plan

**Questions/required fields:** Actual screenshot capture/inspection methods, target screen sizes, content extremes, comparison to approved tokens, human critique rubric, unresolved defects.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Design decisions and approvals

**Questions/required fields:** Trace visual decisions to PRD evidence, document explicit user waivers with risk and reviewer.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Upstream-inspired design gate matrix (mandatory for visual projects)

| Principle | Source influence | Required observation | Proof / fail condition |
|---|---|---|---|
| Design direction fits a real user and task | Design Taste, Anthropic Frontend Design | Audience, tone, page type, context and approved references identified | Design choices cannot be explained by the brief = FAIL |
| Identity and brand truth | Hallmark | Actual logo/type/color/assets and usage rights confirmed | Fabricated brand logos, metrics, testimonials = FAIL |
| Coherent semantic tokens | Hallmark, UI/UX Pro Max | Components reuse defined typography/color/spacing/motion tokens | Inconsistent ad-hoc visual rules = needs remediation |
| Purpose before decoration | AntiSlop, Superior | Each repeated decorative/motion pattern has a usability rationale | Generic gradients/glass/cards by default = reconsider |
| Fidelity across states | Impeccable | Inspect loading/empty/error/success/disabled/unauthorized/long text as applicable | Broken state or missing recovery = FAIL |
| Accessibility | WCAG 2.2 / platform guidance | Keyboard, focus, semantic structure, contrast, zoom/text size, motion preference | Critical barrier without approved mitigation = FAIL |
| Device-specific robustness | UI/UX Pro Max, Impeccable | Actual relevant viewport/device inspection | Overflow, invisible actions or clipped critical content = FAIL |
| Honest visual QA | Impeccable, AntiSlop | Screenshots/review outputs with file paths or explicit NOT RUN | Self-awarded pixel-perfect/production-ready = FAIL |

## Component/state verification matrix

| Surface or component | Actor/permission | Normal | Loading / empty | Error / recovery | Destructive/disabled | Mobile / keyboard / AT proof |
|---|---|---|---|---|---|---|
| `[[FILL: concrete component]]` | `[[FILL: owner]]` | `[[FILL: behavior]]` | `[[FILL: states or N/A]]` | `[[FILL: recovery]]` | `[[FILL: guard]]` | `[[FILL: actual proof / NOT RUN]]` |

## Token-to-implementation parity

| Token group | Approved semantic meaning | Executable source | Visual test reference | Owner |
|---|---|---|---|---|
| Color / type / spacing / motion | `[[FILL: meaning]]` | `[[FILL: code path]]` | `[[FILL: screenshot/check or NOT RUN]]` | `[[FILL: owner]]` |

## Specific AntiSlop design critique

- Does the page have a **defensible composition** for this product, rather than rearranged generic SaaS cards?
- Are images/content real and permitted, or prominently labeled placeholders?
- Do all main actions work, with honest feedback on failures and loading?
- Does the design remain legible at real target devices, accessible input, long content and slow responses?
- Record **critical**, **major**, **minor** findings with severity, reproduction, owner and screenshots when available; missing screenshots must be `NOT RUN`, not fabricated.
