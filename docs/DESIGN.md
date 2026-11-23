# Veyra v1.0 — Design & Quality Standards

> **Status:** APPROVED BASELINE
> **Authority:** AntiSlop, Hallmark Floor, Impeccable Craft, Taste Skill, UI UX Pro Max

---

## 1. Visual & Interaction AntiSlop Invariants

Veyra enforces strict visual craft standards to prevent generic AI interface output:
- **No Floating Cards & Generic Shadows:** Avoid low-contrast unbordered cards floating on generic gray backgrounds.
- **The Floor Standards (Nutlope/hallmark):**
  - Smooth compositor-only CSS transitions (`transform`, `opacity`), avoiding layout thrashing.
  - Mandatory focus rings (`:focus-visible`) for keyboard navigation.
  - Native `prefers-reduced-motion` media query compliance.
  - Horizontal viewport overflow prevention (`overflow-x: clip` on root layout containers).
- **Craft Primacy (pbakaus/impeccable):** Respect user intent and brief constraints over template defaults ("The brief wins").
- **App Screen vs. Page Craft (Leonxlnx/taste-skill):** Operational workspaces prioritize information density, quiet functional borders, and keyboard accessibility over oversized hero banners.

## 2. Token Architecture (3-Tier Hierarchy)

All styling in Veyra follows the UI UX Pro Max 3-tier token hierarchy:
1. **Primitive Tokens:** Raw values (e.g. `--color-blue-500: #3b82f6;`, `--space-4: 16px;`).
2. **Semantic Tokens:** Purpose-bound variables (e.g. `--color-surface-primary`, `--color-text-danger`).
3. **Component Tokens:** Element-scoped bindings (e.g. `--button-primary-bg`, `--input-border-focus`).

## 3. Accessibility Standards (WCAG 2.2)

- **Contrast Ratios:**
  - Standard text: $\ge 4.5:1$ (WCAG AA).
  - High-visibility and critical status: $\ge 7.0:1$ (WCAG AAA).
- **Touch Target Sizes:**
  - Standard interactive targets: Minimum $24\times 24$ px (WCAG AA).
  - Primary touch actions: Minimum $44\times 44$ px (WCAG AAA / Apple HIG).
