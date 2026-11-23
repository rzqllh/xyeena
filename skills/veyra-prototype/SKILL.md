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
