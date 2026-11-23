# Architecture  -  v4 adaptive template

<!-- V4-TEMPLATE id=architecture; version=4.0.2 -->

## System context and quality goals

**Questions/required fields:** Stakeholders, system responsibilities, external trust boundaries, top measurable nonfunctional drivers (arc42/C4 context).

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Constraints and decision drivers

**Questions/required fields:** Platforms, operating costs, deadlines, proprietary integration, privacy, performance and why alternatives were excluded.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Building blocks and ownership

**Questions/required fields:** Component table: role, interface, input/output, owner, lifecycle, failure modes; optional C4 container diagram, not an invented diagram.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Runtime scenarios

**Questions/required fields:** Primary journeys and sequence of calls/jobs/events, retries/idempotency, concurrency and partial failure behavior.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Data and contract topology

**Questions/required fields:** Persisted models, caches, consistency, migrations, retention, external APIs and typed contracts, linked to executable files.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Deployment and operations

**Questions/required fields:** Environment boundaries, secrets, CI/CD, logs, monitoring, alerts, backup, recovery and rollback/forward-fix.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Risk, alternatives, ADR

**Questions/required fields:** Known debt, trade-offs and evidence, requirements-to-architecture mapping, undecided questions.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## System and trust boundary diagram

Use C4 context/container **only at the depth justified by the project**. Draw real entities with verified integration and data movement; don't invent services or tool names. Keep diagram sources editable in a fenced `mermaid` block or an actual repo diagram file. A blank diagram is less harmful than a plausible fake system.

| Component | Responsibility | Interface/contract | Data/trust class | Failure mode | Observability | Deployment owner |
|---|---|---|---|---|---|---|
| `[[FILL: observed/proposed component]]` | `[[FILL: role]]` | `[[FILL: path]]` | `[[FILL: boundary]]` | `[[FILL: mode]]` | `[[FILL: signal]]` | `[[FILL: owner]]` |

## Decision record interface

| ADR | Alternatives | Evidence | Risk/reversibility | Approval | Impacted contracts |
|---|---|---|---|---|---|
| `[[FILL: ADR ID]]` | `[[FILL: alternatives]]` | `[[FILL: source]]` | `[[FILL: risk]]` | `[[FILL: status]]` | `[[FILL: paths]]` |

Explicitly distinguish **intended** architecture from **observed** deployment state, especially in inherited repositories.
