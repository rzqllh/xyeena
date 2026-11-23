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
