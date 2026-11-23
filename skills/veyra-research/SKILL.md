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
