---
name: veyra-research
description: Use when a factual or technical decision needs current primary-source verification.
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
1. Native Host Integration: Retrieve and inspect the relevant source directly and distinguish quoted evidence from inference.
2. Engine entry: `import { validateSourceEvidence, extractCitations, calculateCredibilityTier } from './engine.mjs'`
3. Evidence boundary: Do not label a source verified based solely on a URL, citation placeholder, or generated summary.
