---
name: veyra-release
description: Semantic versioning calculation, reversible migration verification, and release checklists.
version: 1.0.0
aliases:
  - release
---

# veyra-release

Manage safe software transitions, calculate SemVer increments, and verify reversible migration procedures.

## When to Use
- When planning a version increment or updating CHANGELOG.md.
- To audit database schema migrations for paired rollback procedures.
- When validating all pre-release gates before tagging or publication.

## Invariants
1. SemVer Compliance: Breaking changes mandate a MAJOR bump; new features require MINOR (DEC-33).
2. Reversible Migrations: Every forward schema migration must have an executable rollback script.
3. Stable-Only Release: Zero unverified features or open security findings permitted in stable releases (DEC-32).

## Operational Instructions
1. Discovery & Activation: Activated when preparing releases, tagging versions, computing SemVer increments, or validating database migrations.
2. Engine Invocation:
   - Programmatic: `import { calculateSemVer, validateMigrationRollback, auditReleaseGateCriteria } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-release/engine.mjs').then(m => console.log(m.calculateSemVer('1.0.0', 'minor')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Compute strict SemVer bumps based on commit history, verify migration reversible rollbacks, and check release gates.
   - Claude Code / Codex: Block unauthorized tags, npm publishes, or production deployments without explicit Owner approval.
4. Output & Verification: Generate release readiness checklist with verified rollback script and version metadata.
