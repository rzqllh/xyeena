---
name: veyra-skillcraft
description: Skill authoring, validation, and lifecycle governance.
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
