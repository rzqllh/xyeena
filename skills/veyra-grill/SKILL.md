---
name: veyra-grill
description: Question-frontier interview, architectural stress-testing, and contradiction discovery.
version: 1.0.0
aliases:
  - grill
---

# veyra-grill

Relentlessly test plans, requirements, and assumptions before implementation to eliminate ambiguities.

## When to Use
- When reviewing a new feature proposal or architectural change.
- When an assumption lacks proof or a risk lacks a deterministic rollback plan.

## Invariants
1. Critical Ambiguity Gate: Implementation is BLOCKED while critical ambiguities remain.
2. Contradiction Detection: Reconciles conflicting statements between goals and constraints.
3. Falsifiable Frontier: Questions are targeted and testable, not polite open-ended chats.
