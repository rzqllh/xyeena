---
name: veyra-interface
description: Editorial interface craft, WCAG 2.2 accessibility contrast checker, Hallmark Floor standards, 3-tier design tokens.
version: 1.0.0
aliases:
  - veyra-ui
  - interface
  - ui
---

# veyra-interface

Craft editorial, responsive user interfaces compliant with WCAG 2.2 accessibility and anti-slop visual standards. Also known as `veyra-ui`.

## When to Use
- When designing or auditing frontend UI, typography, colors, and responsive layouts.
- To compute exact WCAG 2.2 contrast ratios (AA 4.5:1, AAA 7.0:1) and verify touch target sizes.
- To enforce 3-tier design token architecture (primitive -> semantic -> component).

## Invariants
1. Minimum Contrast Gate: Body text must meet WCAG 2.2 AA (4.5:1) minimum contrast ratio.
2. Anti-AI Slop Aesthetic: Ban generic AI purple gradient cards and unstyled dashboard tropes (Hallmark Floor).
3. Mobile Touch Targets: Interactive touch targets must meet minimum 44x44px bounds.

## Operational Instructions
1. Discovery & Activation: Activated when designing or reviewing UI components, styles, color palettes, typography, or accessibility. Canonical alias: veyra-ui.
2. Engine Invocation:
   - Programmatic: `import { calculateContrastRatio, auditHallmarkFloor, auditDesignTokens, auditTouchTargetSize } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-interface/engine.mjs').then(m => console.log(m.calculateContrastRatio('#0F172A', '#F8FAFC')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Inspect CSS and component styles with `read_file`, verify WCAG 2.2 AA (4.5:1) text contrast, and check 44x44px touch targets.
   - Claude Code / Codex: Enforce 3-tier token architecture and eliminate generic AI purple gradients and card tropes.
4. Output & Verification: Produce accessible, responsive UI code compliant with WCAG 2.2 AA and anti-slop visual standards.
