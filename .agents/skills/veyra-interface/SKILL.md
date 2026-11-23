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
