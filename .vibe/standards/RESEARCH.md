# Research protocol: investigate before claiming

Scope research to real project decisions; avoid research theater.

1. Frame a **decision question** and falsifiable alternatives. Define time/version/environment where claim matters.
2. Check user-provided docs/repository before external sources. Query official owners/specification maintainers for current behavior. Prefer release docs and changelogs to generic tutorials.
3. Record `access date`, `source URL/path`, `release/ref`, and `confidence`. **Branch `main` is mutable**; if adopting exact code, pin SHA and audit license/dependencies.
4. Compare at least one credible competing approach for material architectural/platform choices; document costs, complexity, free-tier limits, maintenance, security and accessibility.
5. Separate normative standard (“MUST”), vendor feature, recommendation, benchmark and anecdote. Applicability is not automatic.
6. For external upstream skills, read source and LICENSE, inspect installer scripts and tool requests, identify unique useful rules, map to local standards, de-duplicate conflicts. Do **not** run the skill as part of onboarding.
7. Stop when the evidence supports a bounded decision. If no current access exists, mark Unknown and provide a verification procedure rather than simulating research.
8. Deliver compact comparison table with `Source`, `Claim`, `Applicability`, `Evidence`, `Uncertainty`, `Recommended decision`.

See `.vibe/upstream/sources.json` for reviewed upstreams; `license` and `ref` claims have their own confidence. The skill names are not quality endorsements.
