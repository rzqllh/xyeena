# Security  -  v4 adaptive template

<!-- V4-TEMPLATE id=security; version=4.0.2 -->

## Risk inventory and data classes

**Questions/required fields:** Assets, trust boundaries, actors, threat likelihood, impact and assumptions; cite applicable standards only when relevant.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Authentication and authorization

**Questions/required fields:** Identity sources, recovery, token/session lifecycle, least privilege, server/data enforcement, row/tenant isolation.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Application and platform controls

**Questions/required fields:** Input validation, SSRF/injection, dependency hygiene, file handling, rate limits, secrets, encryption, logging.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Privacy and external AI

**Questions/required fields:** Collection purpose, consent, retention, deletion/export, processor transfers, AI data policies and test redaction.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Threat-to-test map

**Questions/required fields:** THREAT-###, mitigation, owner, expected evidence, residual risk and review date.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Incident and release approvals

**Questions/required fields:** Escalation, rollback/key rotation, production change gates, who accepts risk.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Threat-to-control proof

| THREAT | Asset / attacker capability | Entry / trust boundary | Prevention | Detection / recovery | Negative test | Residual risk owner |
|---|---|---|---|---|---|---|
| THREAT-001 | `[[FILL: actual asset/attacker]]` | `[[FILL: boundary]]` | `[[FILL: control/code]]` | `[[FILL: log/runbook]]` | `[[FILL: TEST ID]]` | `[[FILL: owner]]` |

## Permission matrix

| Actor | Resource | Read | Create | Update | Delete | Enforcement path | Verification |
|---|---|---|---|---|---|---|---|
| `[[FILL: role]]` | `[[FILL: resource]]` | `[[FILL: rule]]` | `[[FILL: rule]]` | `[[FILL: rule]]` | `[[FILL: rule]]` | `[[FILL: actual backend/DB path]]` | `[[FILL: TEST ID]]` |

Reference OWASP ASVS and NIST SSDF only for applicable controls; a checklist does **not** establish legal or security compliance. No actual secrets should be pasted into this file.
