# Upstream-to-native knowledge map (v4.0)

This table records idea provenance, not upstream source-code reuse. Exact source URLs, license confidence, time and status: `sources.json`. External skills may be used when relevant but are not onboarding prerequisites.

| Source | Distilled principle | Native rule | Applies to | Excluded / reconciled |
|---|---|---|---|---|
| AntiSlop | Truthful copy/code/UI; purpose-gated decisions, delivery proof | `AGENTS.md` universal invariants; `DESIGN-QUALITY.md` only for visual work | shared truth rules; visual rules only for UI | Specific aesthetic bans not absolute |
| Hallmark | Token consistency, brand truth, user-specific composition | `DESIGN-QUALITY.md` | `DESIGN`, tokens, content, UI, marketing | No Together AI or external image library |
| Impeccable | Inspect actual UI and critique purpose, states, craft | `DESIGN-QUALITY.md` + delivery rubric | UI/mobile/accessibility/test | No CLI, binary, paid tool or browser requirement at onboarding |
| UI/UX Pro Max | Consider category-specific patterns/palettes/type, app interactions | `DESIGN-QUALITY.md` | DESIGN/styleguide/mobile | No one-size-fits-all style, no copying its CSV database |
| Design Taste / Taste Skill | Audience-first art direction, avoid repeated default recipes, screenshot review | `DESIGN-QUALITY.md` | DESIGN/landing/portfolio | Do not force single-screen sections, animations or shaders |
| Anthropic Frontend Design | Design before implementation, challenge model convergence | `DESIGN-QUALITY.md` | DESIGN/visual QA | No Anthropic skill text or assets shipped |
| Vercel Agent Skills | Focused web QA and performance priorities | `ENGINEERING.md` and design review | Frontend/React/Next where chosen | No React/Next dependency for universal projects |
| Superpowers | Intent → plan → tests → code → verification; systematic debugging | `ENGINEERING.md`, `ORCHESTRATION.md` | task/TDD/tests/QA/handoffs | No unverified automatic subagents |
| Superior Skills | Contextual routing, anti-filler and continuity of verified changes | `AGENTS.md`, `EVIDENCE.md` on demand | only when needed | Avoid duplicative logs for every trivial operation |
| Orca | Supervised agents, task DAG and messaging semantics | `ORCHESTRATION.md` | multi-host multi-agent planning | No Orca-specific commands assumed or invoked |
| Diátaxis | Separate beginner tutorial, how-to, reference and explanation | README, onboarding, templates | all docs | Not an instruction to generate empty documents |
| arc42 + C4 | Architecture context/constraints/building blocks/risks, appropriately scoped diagrams | ARCHITECTURE template | architecture, infra | No compulsory four-tier diagram gallery |
| OAS + JSON Schema | Executable contracts are authoritative | api-spec, data-contract, schema | API/data | Markdown is not a replacement for IDL/schema |
| OWASP ASVS + NIST SSDF | Risks mapped to verifiable controls | SECURITY.md, security/threat-model/test | security/ops | No unearned compliance claim |
| W3C WCAG 2.2 | Testable accessibility success criteria | DESIGN-QUALITY, accessibility | user interfaces | Native platforms need native guidance too |
| AGENTS/Gemini/Copilot docs | Portable canonical instructions with adapter caveats | AGENTS, CLAUDE, GEMINI, `.github/` | multi-host | Never equate pointers with guaranteed file injection |

## Rules for expanding upstream corpus

1. Supply canonical repository+path, license and direct source content, not an alias or screenshot.
2. Mark `candidate` until inspected; unverified Cindy/Konoha names intentionally supply **zero rules**.
3. Prefer unique measurable checks over overlapping hype or multiple copies of the same rule.
4. Add purpose, applicability, negative example, verification method, conflicts and target template ID.
5. No installer scripts, third-party binaries, copied skill bodies or runtime prerequisites in this distribution.
