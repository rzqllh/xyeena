# Prd  -  v4 adaptive template

<!-- V4-TEMPLATE id=prd; version=4.0.2 -->

## One-paragraph product thesis

**Questions/required fields:** For [actors], address [problem] so that [outcome]; show observable evidence and strongest assumptions.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Users and jobs

**Questions/required fields:** Primary and secondary roles, accessibility context, jobs-to-be-done, boundaries, non-user actors.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Scope and explicit exclusions

**Questions/required fields:** MVP capabilities numbered REQ-001..., priority and dependencies, non-goals and future candidates; distinguish user request from proposal.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Functional behaviors

**Questions/required fields:** For each capability: entry, actor, happy path, errors, permissions, data changes, notifications and recovery.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Non-functional constraints

**Questions/required fields:** Availability, latency, privacy, accessibility, localization, cost, operational and platform compatibility targets if relevant.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Acceptance criteria and success

**Questions/required fields:** AC-### Given/When/Then or measurable observable checks; instrumentation and test reference.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Unknowns and trade-offs

**Questions/required fields:** Blocking product decisions, defaults proposed only when reversible, explicit approval record.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Requirement-to-outcome matrix

| ID | Actor / real need | Observable behavior | Value or metric | Non-goal / limit | Owner | Evidence |
|---|---|---|---|---|---|---|
| REQ-001 | `[[FILL: role/need]]` | `[[FILL: action/result]]` | `[[FILL: measure]]` | `[[FILL: excluded behavior]]` | `[[FILL: owner]]` | `[[FILL: EV or user decision]]` |

## Acceptance examples (illustrative syntax only)

```gherkin
Feature: [[FILL: actual capability]]
  Scenario: [[FILL: success case]]
    Given [[FILL: verified precondition and actor]]
    When [[FILL: action]]
    Then [[FILL: observable outcome]]
  Scenario: [[FILL: forbidden/invalid case]]
    Given [[FILL: role or invalid state]]
    When [[FILL: action]]
    Then [[FILL: safe rejection and no forbidden data change]]
```

Separate **Proposed** defaults from user **Confirmed** choices. The bracketed examples are NOT specifications. For each REQ produce an AC and explicit negative test before baseline approval.
