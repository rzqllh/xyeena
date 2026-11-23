# Schema  -  v4 adaptive template

<!-- V4-TEMPLATE id=schema; version=4.0.2 -->

## Domain entities and invariants

**Questions/required fields:** Entity IDs, source requirement, meaning, ownership and lifecycle; no field is added solely because it is common.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Schema source and migrations

**Questions/required fields:** Path to executable SQL/ORM/DBML and migration history; never create binary schema.db as the intended schema specification.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Constraints and relationships

**Questions/required fields:** Uniqueness, cardinality, FK behavior, non-null defaults, transaction rules, indexes and isolation levels.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Access and retention

**Questions/required fields:** Per-role read/write, tenant policies, encryption/data classification, deletion, backups, export and audit.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Migration/rollback

**Questions/required fields:** Expand-contract and dual-read windows, backfills, validation queries, rollback/forward-fix and production approval.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Verification

**Questions/required fields:** Actual introspection/migration test results and model-generated examples clearly labeled.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Entity contract

| Entity.field | Type/units | Required/default | Uniqueness/FK/check | Owner / tenant | PII class / retention | Migration source |
|---|---|---|---|---|---|---|
| `[[FILL: actual entity.field]]` | `[[FILL: exact type]]` | `[[FILL: constraint]]` | `[[FILL: database rule]]` | `[[FILL: actor]]` | `[[FILL: classification]]` | `[[FILL: SQL/ORM migration path]]` |

## Transition and permission table

| Actor | Record state | Operation | Guard condition | Result/side effect | Deny test |
|---|---|---|---|---|---|
| `[[FILL: role]]` | `[[FILL: state]]` | `[[FILL: read/write/delete]]` | `[[FILL: enforced condition]]` | `[[FILL: state]]` | `[[FILL: TEST ID]]` |

`schema.db` is a binary data artifact, **not** a substitute for a schema definition. Source truth belongs in migrations or text schema. If database is N/A, explain why, don't create empty tables.
