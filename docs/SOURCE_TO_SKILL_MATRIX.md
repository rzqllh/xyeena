# Veyra v1.0 — Source-to-Skill Mapping Matrix

> **Scope:** Mapping of 21 canonical upstream repositories to the 19 co-equal Veyra skills across 6 functional domains.
> **Status:** `REFERENCE_ONLY` Upstreams & `PLANNED` Skills
> **Authority:** 35 Canonical Owner Decisions (DEC-01 through DEC-35, 100% LOCKED) — See `docs/OWNER_DECISIONS.md`

---

## 1. Domain & Skill Architecture Summary

The 19 planned Veyra skills are structured across 6 domains. Upstream repositories serve strictly as methodological references (`REFERENCE_ONLY`) for clean-room implementation (DEC-27):

| Domain | Skill Entrypoint | Description | Primary Upstream Reference | Secondary Upstream Reference | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Governance** | `veyra-core` | Core pragmatic judgment, scope locking, AntiSlop invariants | `obra/superpowers` (RE-01) | `DietrichGebert/ponytail` (RE-05) | `PLANNED` |
| **Governance** | `veyra-context` | Context economy, compact token payloads, memory boundaries | `JuliusBrussee/caveman` (RE-06) | `makecindy/cindy` (RE-33) | `PLANNED` |
| **Governance** | `veyra-handoff` | Session continuation, cross-compaction state recovery | `makecindy/cindy` (RE-33) | `Aniekanetim/orca-agent` (RE-34) | `PLANNED` |
| **Discovery & Planning** | `veyra-research` | High-trust primary-source evidence, bounded retrieval | `andycungkrinx91/konoha` (RE-18) | `anthropics/skills` (RE-13) | `PLANNED` |
| **Discovery & Planning** | `veyra-grill` | Question-frontier interview, architectural stress-testing | `mattpocock/skills` (RE-09) | `obra/superpowers` (RE-01) | `PLANNED` |
| **Discovery & Planning** | `veyra-plan` | Reviewable, dependency-ordered phased execution plans | `obra/superpowers` (RE-01) | `mattpocock/skills` (RE-09) | `PLANNED` |
| **Discovery & Planning** | `veyra-architecture` | Deep module boundaries, Clean Architecture seams | `KodekaTeam/superior-skills` (RE-03) | `obra/superpowers` (RE-01) | `PLANNED` |
| **Engineering** | `veyra-execute` | Scoped implementation with TDD and acceptance proof | `obra/superpowers` (RE-01) | `KodekaTeam/superior-skills` (RE-03) | `PLANNED` |
| **Engineering** | `veyra-debug` | Root-cause isolation, failure reproduction, no shotgun fixes | `obra/superpowers` (RE-01) | `DietrichGebert/ponytail` (RE-05) | `PLANNED` |
| **Engineering** | `veyra-prototype` | Disposable experiments to validate uncertain behavior | `alchaincyf/huashu-design` (RE-19) | `pbakaus/impeccable` (RE-08) | `PLANNED` |
| **Quality & Security** | `veyra-test` | Automated behavior verification, regression tests | `obra/superpowers` (RE-01) | `KodekaTeam/superior-skills` (RE-03) | `PLANNED` |
| **Quality & Security** | `veyra-review` | Dual-axis architectural depth and surgical safety review | `KodekaTeam/superior-skills` (RE-03) | `DietrichGebert/ponytail` (RE-05) | `PLANNED` |
| **Quality & Security** | `veyra-verify` | Mandatory execution evidence before completion claims | `obra/superpowers` (RE-01) | `cloudflare/security-audit-skill` (RE-07) | `PLANNED` |
| **Quality & Security** | `veyra-security` | Threat modeling, RLS audit, secret leak detection | `cloudflare/security-audit-skill` (RE-07) | `trailofbits/skills` (RE-16) / `supabase` (RE-17) | `PLANNED` |
| **Quality & Security** | `veyra-release` | Safe transitions, rollback validation, SemVer (DEC-33) | `DietrichGebert/ponytail` (RE-05) | `JuliusBrussee/caveman` (RE-06) | `PLANNED` |
| **Design & Content** | `veyra-interface` | Editorial layout, craft critique, accessibility & tokens | `pbakaus/impeccable` (RE-08) | `Nutlope/hallmark` / `taste` / `ui-ux-pro-max` | `PLANNED` |
| **Design & Content** | `veyra-writing` | Human, concise technical copy; buzzword elimination | `miqdadbadjuber/anti-slop` (RE-04) | `JuliusBrussee/caveman` (RE-06) | `PLANNED` |
| **Meta & Orchestration** | `veyra-skillcraft` | Skill authoring, testing, and lifecycle management | `anthropics/skills` (RE-13) | `obra/superpowers` (RE-01) | `PLANNED` |
| **Meta & Orchestration** | `veyra-orchestrate` | Native collaboration, optional governor, receipts | `Aniekanetim/orca-agent` (RE-34) | `makecindy/cindy` (RE-33) | `PLANNED` |

---

## 2. Upstream Coverage Verification (21/21)

Every one of the 21 upstream repositories is mapped and utilized strictly as a methodological reference (DEC-27):

1. `obra/superpowers` (RE-01) -> `veyra-core`, `veyra-plan`, `veyra-execute`, `veyra-debug`, `veyra-test`, `veyra-verify`
2. `obra/superpowers-skills` (RE-02) -> `veyra-test`, `veyra-execute`, `veyra-verify`
3. `KodekaTeam/superior-skills` (RE-03) -> `veyra-architecture`, `veyra-review`, `veyra-execute`
4. `miqdadbadjuber/anti-slop` (RE-04) -> `veyra-core`, `veyra-writing`, `veyra-interface`
5. `DietrichGebert/ponytail` (RE-05) -> `veyra-core`, `veyra-debug`, `veyra-review`, `veyra-release`
6. `JuliusBrussee/caveman` (RE-06) -> `veyra-context`, `veyra-writing`, `veyra-release`
7. `cloudflare/security-audit-skill` (RE-07) -> `veyra-security`, `veyra-verify`
8. `pbakaus/impeccable` (RE-08) -> `veyra-interface`, `veyra-prototype`
9. `mattpocock/skills` (RE-09) -> `veyra-grill`, `veyra-plan`
10. `Nutlope/hallmark` (RE-10) -> `veyra-interface` (The Floor standards)
11. `Leonxlnx/taste-skill` (RE-11) -> `veyra-interface` (App Screen vs. Page craft)
12. `nextlevelbuilder/ui-ux-pro-max-skill` (RE-12) -> `veyra-interface` (3-tier design tokens)
13. `anthropics/skills` (RE-13) -> `veyra-skillcraft`, `veyra-research`
14. `vercel-labs/agent-skills` (RE-14) -> `veyra-architecture` (Frontend & routing conventions)
15. `greensock/gsap-skills` (RE-15) -> `veyra-interface` (Motion performance & cleanup)
16. `trailofbits/skills` (RE-16) -> `veyra-security` (Security invariants & workflow security)
17. `supabase/agent-skills` (RE-17) -> `veyra-security` (RLS policies & transactional migration)
18. `andycungkrinx91/konoha` (RE-18) -> `veyra-research` (Bounded retrieval & memory isolation)
19. `alchaincyf/huashu-design` (RE-19) -> `veyra-prototype`, `veyra-interface` (3 visual directions)
20. `makecindy/cindy` (RE-33) -> `veyra-context`, `veyra-handoff`, `veyra-orchestrate`
21. `Aniekanetim/orca-agent` (RE-34) -> `veyra-handoff`, `veyra-orchestrate`
