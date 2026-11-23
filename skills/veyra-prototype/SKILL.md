---
name: veyra-prototype
description: Disposable experiment spikes and throwaway prototype isolation.
version: 1.0.0
aliases:
  - prototype
---

# veyra-prototype

Validate uncertain design decisions through disposable, isolated spike implementations.

## When to Use
- To explore alternative state designs or UI mechanics before committing production architecture.
- When an experiment needs strict isolation from production code.

## Invariants
1. Absolute Isolation: Prototypes must never be committed to production package directories.
2. Throwaway By Default: Spikes produce design answers, not production code.
3. Mandatory Cleanup: Must maintain a removal manifest for all temporary scratch files.

## Operational Instructions
1. Discovery & Activation: Activated when exploring unverified technical hypotheses, library spikes, or disposable experiments.
2. Engine Invocation:
   - Programmatic: `import { createSpikeHarness, auditSpikeIsolation, generateCleanupManifest } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-prototype/engine.mjs').then(m => console.log(m.createSpikeHarness('spike-1', './scratch')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Create isolated test spikes in `scratch/`, run disposable experiments, and ensure production files are untouched.
   - Claude Code / Codex: Generate cleanup manifest to guarantee zero leftover experimental artifacts.
4. Output & Verification: Return conclusive experimental answer and clean up temporary test files.
