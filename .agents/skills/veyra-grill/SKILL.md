---
name: veyra-grill
description: Use when a requirement, architecture choice, or safety assumption has unresolved consequential ambiguity.
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

## Operational Instructions
1. Native Host Integration: Ask only questions that change the decision; capture explicit owner approval before destructive or architectural actions.
2. Engine entry: `import { generateQuestionFrontier, detectAmbiguities, detectContradictions } from './engine.mjs'`
3. Evidence boundary: A generated question list is not evidence that the user approved the answers.

## Red flags
- Ambiguous requirement silently converted into a locked decision.
- A proposed plan is treated as user authorization.
- Repeated low-value questions block an otherwise safe task.

## Pressure tests
1. Owner says "what if": discuss options without initiating edits.
2. Destructive migration lacks rollback: ask for a decision before execution.
3. Answer already exists in context: do not ask it again.
