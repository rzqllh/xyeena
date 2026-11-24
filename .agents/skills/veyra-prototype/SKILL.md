---
name: veyra-prototype
description: Use when testing a reversible hypothesis in an isolated temporary workspace.
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
1. Native Host Integration: Create a disposable scratch environment and collect a reproducible command/output before interpreting the result.
2. Engine entry: `import { createSpikeHarness, auditSpikeIsolation, generateCleanupManifest } from './engine.mjs'`
3. Evidence boundary: Prototypes are not production validation; don't copy experimental code into production without approval.
