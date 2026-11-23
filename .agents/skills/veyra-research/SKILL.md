---
name: veyra-research
description: Primary-source evidence bounding, citation extraction, provenance verification, and fact grounding.
version: 1.0.0
aliases:
  - research
---

# veyra-research

Investigate technical questions against verified primary sources, enforce strict citation provenance, and reject ungrounded assertions.

## When to Use
- When gathering external API specifications, documentation facts, or architectural references.
- To verify claims against local repository files before stating findings as facts.

## Invariants
1. Direct Citation Provenance: Separate verbatim quotes from agent inferences.
2. Primary Source Hierarchy: Prefer local code and official documentation over tertiary commentary.
3. No Hallucinated URLs: All cited links and file paths must exist and match regex standards.

## Operational Instructions
1. Discovery & Activation: Activated when gathering external technical documentation, verifying library APIs, or checking source specifications.
2. Engine Invocation:
   - Programmatic: `import { validateSourceEvidence, extractCitations, calculateCredibilityTier } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-research/engine.mjs').then(m => console.log(m.calculateCredibilityTier('https://github.com')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Inspect primary documentation files or pinned upstream references; extract exact line numbers and citations.
   - Claude Code / Codex: Prioritize official documentation and high-trust repos; reject hallucinated APIs and unverified blog posts.
4. Output & Verification: Provide primary-source citations with concrete file paths, URLs, and credibility ratings.
