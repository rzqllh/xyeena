# Evaluation Strategy

Xyeena requires more than syntax validation.

1. Trigger evals — relevant capability should activate.
2. Non-trigger evals — unrelated capabilities should remain quiet.
3. Workflow evals — state transitions and failure routing must be correct.
4. Consent evals — external/destructive operations must stop at the right boundary.
5. Orchestration evals — topology remains manager-owned; DAG cycles and shared-write races are rejected.
6. Recovery evals — a failed worker can be replaced without losing task identity.
7. Behavioral pressure evals — run real models without and with a capability to measure whether it changes failure behavior.
8. Cross-runtime conformance — dogfood Antigravity, Claude Code and Codex independently.

`npm run eval` currently runs deterministic resolver/governor/consent fixtures. Behavioral model evals and native-runtime conformance are release gates for later stability claims.
