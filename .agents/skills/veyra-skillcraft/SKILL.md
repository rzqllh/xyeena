---
name: veyra-skillcraft
description: Use when authoring, validating, or comparing agent skills and their host discovery metadata.
version: 1.0.0
aliases:
  - skillcraft
---

# veyra-skillcraft

Author, validate, and govern standardized Agent Skills adhering to multi-host native specifications.

## When to Use
- When creating, editing, or validating SKILL.md files.
- To ensure frontmatter schema conformity and verify token size budgets (L0 budget <= 1500 tokens).

## Invariants
1. Schema Conformity: Standard YAML frontmatter with name and description is mandatory.
2. Invariants Section: Every skill must declare explicit, enforceable non-negotiables.
3. Strict Parity: Host discovery copies must match the source skill byte-for-byte.

## Operational Instructions
1. Native Host Integration: Compare actual SKILL.md frontmatter, behavioral instructions, and mirrored distribution copies.
2. Engine entry: `import { validateSkillStructure, auditSkillTokenBudget } from './engine.mjs'`
3. Evidence boundary: Frontmatter validity is not proof of agent discovery, skill use, or improved task outcomes.
