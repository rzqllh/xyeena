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

## Operational Instructions
1. Discovery & Activation: Activated when creating, authoring, auditing, or packaging new Agent Skills or SKILL.md files.
2. Engine Invocation:
   - Programmatic: `import { validateSkillStructure, auditSkillTokenBudget } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-skillcraft/engine.mjs').then(m => console.log(m.validateSkillStructure('sample')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Validate YAML frontmatter, ensure Invariants block exists, and check L0 token budget <= 1,500 tokens.
   - Claude Code / Codex: Ensure parity between `skills/` and `.agents/skills/` distribution directories.
4. Output & Verification: Verify valid skill structure and token-budget compliance.
