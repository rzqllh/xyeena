# Veyra v1.0 — Comprehensive Skill Contracts Register (All 19 Skills)

> **Authority:** Canonical Owner Decisions Register (DEC-01 through DEC-35, 100% LOCKED)
> **Status:** `LOCKED_CONTRACTS` (Waves 1 through 6)
> **Runtime Policy:** Pure native ES Modules, zero external dependencies, 100% Node.js standard library.

---

## 1. Domain & Skill Mapping Overview

| Domain | Skill Identifier | Aliases | Primary Capabilities | Upstream Lineage (Reference Only) |
| :--- | :--- | :--- | :--- | :--- |
| **Governance** | `veyra-core` | `core`, `governance-core` | Scope fencing, universal anti-slop, epistemic claims | `obra/superpowers` (RE-01), `DietrichGebert/ponytail` (RE-05) |
| **Governance** | `veyra-context` | `context`, `context-manager` | Token compression, fact preservation, memory boundary | `JuliusBrussee/caveman` (RE-06), `makecindy/cindy` (RE-33) |
| **Governance** | `veyra-handoff` | `handoff`, `checkpoint` | Checkpoint serialization, state recovery, continue driver | `makecindy/cindy` (RE-33), `Aniekanetim/orca-agent` (RE-34) |
| **Discovery & Plan** | `veyra-research` | `research` | Primary source evidence, citation extraction, provenance | `andycungkrinx91/konoha` (RE-18), `anthropics/skills` (RE-13) |
| **Discovery & Plan** | `veyra-grill` | `grill` | Question frontier, ambiguity detection, contradiction audit | `mattpocock/skills` (RE-09), `obra/superpowers` (RE-01) |
| **Discovery & Plan** | `veyra-plan` | `plan` | Execution DAG, cycle detection, blast radius estimation | `obra/superpowers` (RE-01), `mattpocock/skills` (RE-09) |
| **Discovery & Plan** | `veyra-architecture` | `architecture` | Boundary audit, Clean Architecture seams, coupling | `KodekaTeam/superior-skills` (RE-03), `obra/superpowers` (RE-01) |
| **Engineering** | `veyra-execute` | `execute` | Scoped execution, TDD cycle tracking, minimal diff | `obra/superpowers` (RE-01), `KodekaTeam/superior-skills` (RE-03) |
| **Engineering** | `veyra-debug` | `debug` | Log parsing, hypothesis ranking, anti-shotgun gate | `obra/superpowers` (RE-01), `DietrichGebert/ponytail` (RE-05) |
| **Engineering** | `veyra-prototype` | `prototype` | Disposable spike harness, sandbox isolation, cleanup | `alchaincyf/huashu-design` (RE-19), `pbakaus/impeccable` (RE-08) |
| **Quality & Security** | `veyra-test` | `test` | Automated suite classification, assertion density | `obra/superpowers` (RE-01), `KodekaTeam/superior-skills` (RE-03) |
| **Quality & Security** | `veyra-review` | `review` | Dual-axis review (architecture + safety), blocker gates | `KodekaTeam/superior-skills` (RE-03), `DietrichGebert/ponytail` (RE-05) |
| **Quality & Security** | `veyra-verify` | `verify` | Mandatory execution receipts, completion claim gate | `obra/superpowers` (RE-01), `cloudflare/security-audit` (RE-07) |
| **Quality & Security** | `veyra-security` | `security` | Secret leak detection, RLS audit, injection bounds | `cloudflare/security-audit` (RE-07), `trailofbits` (RE-16), `supabase` (RE-17) |
| **Quality & Security** | `veyra-release` | `release` | SemVer calculation, rollback verification, gate checks | `DietrichGebert/ponytail` (RE-05), `JuliusBrussee/caveman` (RE-06) |
| **Design & Content** | `veyra-interface` | `veyra-ui`, `ui`, `interface` | WCAG 2.2 contrast, Hallmark Floor craft, 3-tier tokens | `pbakaus/impeccable` (RE-08), `Nutlope/hallmark` (RE-10), `Leonxlnx/taste` (RE-11) |
| **Design & Content** | `veyra-writing` | `writing`, `copy` | Anti-marketing slop, character economy, Flesch score | `miqdadbadjuber/anti-slop` (RE-04), `JuliusBrussee/caveman` (RE-06) |
| **Meta-Orchestration** | `veyra-skillcraft` | `skillcraft` | Skill authoring, frontmatter audit, token budget | `anthropics/skills` (RE-13), `obra/superpowers` (RE-01) |
| **Meta-Orchestration** | `veyra-orchestrate` | `orchestrate` | Host detection, sequential fallback, receipt compilation | `Aniekanetim/orca-agent` (RE-34), `makecindy/cindy` (RE-33) |

---

## 2. Canonical Invariants
1. **Canonical Aliases:** `veyra-interface` is the canonical name for UI craft, with `veyra-ui` registered as a recognized alias.
2. **Zero External Dependencies:** Every skill runs purely on standard Node.js libraries (`node:fs`, `node:path`, `node:crypto`).
3. **Strict Parity:** All 19 skills in `skills/` have an identical counterpart in `.agents/skills/`.
