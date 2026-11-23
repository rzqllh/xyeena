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

## Operational Instructions
1. Discovery & Activation: Activated during requirement gathering, architecture brainstorming, or when user asks for deep design stress-testing.
2. Engine Invocation:
   - Programmatic: `import { generateQuestionFrontier, detectAmbiguities, detectContradictions } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-grill/engine.mjs').then(m => console.log(m.generateQuestionFrontier([])))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Prompt user with focused, non-trivial multiple choice questions or sharp architectural tradeoff inquiries.
   - Claude Code / Codex: Challenge implicit assumptions and probe edge-case failure modes before freezing specifications.
4. Output & Verification: Resolve open ambiguities and document locked decisions in project register.
