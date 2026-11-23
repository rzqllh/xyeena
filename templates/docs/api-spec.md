# Api Spec  -  v4 adaptive template

<!-- V4-TEMPLATE id=api-spec; version=4.0.2 -->

## Contract authority

**Questions/required fields:** Executable OpenAPI/GraphQL/Proto/event schema path and supported parser version; do not invent endpoints.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Operations and permissions

**Questions/required fields:** Method/path/event, actor, auth, ownership, rate/size limits, idempotency, versioning and trace IDs.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Request/response/error

**Questions/required fields:** Validated schemas, examples marked illustrative, privacy redaction, pagination, conflict and transient failure.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## External integrations

**Questions/required fields:** Provider, API versions, authentication, timeouts, retries, callbacks, sandbox and contractual dependencies.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Compatibility and tests

**Questions/required fields:** Contract diff policy, consumer-driven tests, negative paths, mock accuracy, recorded test outputs.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Operation inventory

| Operation ID | Method/path or event | Auth/owner | Request schema | Success response | Error/retry/idempotency | Contract test |
|---|---|---|---|---|---|---|
| `[[FILL: actual operation]]` | `[[FILL: contract ref]]` | `[[FILL: policy]]` | `[[FILL: IDL path]]` | `[[FILL: response]]` | `[[FILL: behavior]]` | `[[FILL: TEST ID]]` |

Use OpenAPI when HTTP and supported by your tooling. As of the cited research snapshot, OAS 3.2.1 is published; **verify what your chosen validator and generator support** before selecting that version. The contract is the `.yaml/.json/.proto/.graphql` artifact, not an invented endpoint table.
