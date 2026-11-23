# Generative UI specification

<!-- V4-TEMPLATE id=generative-ui; version=4.0.2 -->

Use only when the project actually needs agent-generated interfaces.

## User experience and surfaces

- Who needs generated UI and for which task: `[[FILL: users and goal]]`
- Allowed UI components and states: `[[FILL: permitted catalog and error/empty/loading states]]`
- Native host capability checks and text fallback: `[[FILL: host behavior and recovery]]`
- Keyboard, touch, accessibility and responsive states: `[[FILL: expected interactions]]`

## Declarative contract

- Versioned JSON Schema for surfaces and events: `[[FILL: schema path and versions]]`
- Source provenance and unknown-data display: `[[FILL: evidence policy]]`
- Schema rejection, resource limits, and safe fallback: `[[FILL: failure handling]]`

## Actions and authorization

- Allowlisted typed actions and idempotency: `[[FILL: action names and argument contracts]]`
- Scopes permitted for automatic execution: `[[FILL: authenticated policy, not model-generated claims]]`
- Approval required for external, destructive, credential, permission and production actions: `[[FILL: explicit trust boundary]]`
- Never eval arbitrary model-produced HTML, JS or raw tool names.

## Acceptance examples

- Schema rejects unsupported components, malicious actions and invalid payloads.
- Offline or no-AI modes still permit ordinary project editing.
- Human verification covers focus, recovery, motion preferences and data correctness.
- Tests and provider support remain `NOT RUN` until observed.
