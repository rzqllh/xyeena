# Agent Orchestration  -  v4 adaptive template

<!-- V4-TEMPLATE id=agent-orchestration; version=4.0.2 -->

## Real host inventory

**Questions/required fields:** Actual available agent tools and versions, permission scopes, link to evidence; unsupported ≠ supported.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Responsibilities and arbitration

**Questions/required fields:** Role-to-task mapping, file ownership, conflict rules, reviews, escalation and approval boundary.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Dispatch/handoff protocol

**Questions/required fields:** Task IDs, input paths, expected artifacts, test evidence, actual invocation IDs or explicit sequential fallback.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Quality gates

**Questions/required fields:** Spec compliance, independent review where real capability exists, traceable merge and honest report.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Real-capability routing table

| Host / tool | Observed available? | Actual role dispatch API/tool name | Permission scope | Evidence / inspected at | Fallback |
|---|---|---|---|---|---|
| `[[FILL: host]]` | `[[FILL: Yes/No/Unknown]]` | `[[FILL: actual observed name or N/A]]` | `[[FILL: rights]]` | `[[FILL: concrete proof]]` | Sequential single-agent role simulation **not** called delegation |

## Dispatch DAG and gate ownership

| Task | Role | Depends on | Files/scope | Acceptance | Delegation ID | Reviewer and proof |
|---|---|---|---|---|---|---|
| TASK-001 | `[[FILL: role]]` | `[[FILL: real deps]]` | `[[FILL: scope]]` | `[[FILL: AC]]` | `[[FILL: actual ID or NOT DELEGATED]]` | `[[FILL: actual review evidence]]` |

Subagents may be unavailable in a given IDE/account/version. Never claim ten agent processes or independent QA just because ten roles exist in this document.
