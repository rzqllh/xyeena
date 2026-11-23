# Evidence & anti-hallucination protocol

Evidence is inspectable, not an adjective.

## Record types

- `Confirmed`: explicit human decision or direct, reproducible observation. Store who/what, path/URL, date and scope.
- `Inferred`: derived claim with rationale and explicit supporting Evidence IDs.
- `Proposed`: recommendation awaiting decision; record alternatives, reversibility, risks, and user-facing consequences.
- `Unknown`: no sufficient evidence; record verification question and owner.
- `Contradicted`: two observations disagree; do not smooth away conflict.

## Admissible sources, in order

1. Specific user-approved requirements and inspected repository evidence.
2. Executable source of actual current behavior: code, SQL migrations, IDL/OpenAPI, tests, infra config, real logs.
3. Upstream official documentation, published specifications, vendor docs, issue/commit history when version-sensitive.
4. Community reports labeled anecdotal; never the sole proof of hard security or compatibility claims.

## Evidence ledger

Use `.vibe/evidence.json` for structured references and `docs/EVIDENCE.md` when narrative is necessary. For each: `id`, `claim`, `status`, `source_type`, `source`, `verified_at`, `scope`, `limitations`. If a claimed source cannot be accessed, leave Unknown. Never paste credentials or confidential records into public artifacts.

## Contradiction handling

When sources diverge: log facts side-by-side, identify which version/environment each describes, reproduce if possible, request decision if behavior changes. Freeze affected implementation until critical contradiction is resolved.

## Traceability

Link `REQ-###` → acceptance criteria (`AC-###`) → relevant design/data/API sections → implementation → test (`TEST-###`) → actual verification artifact. Treat incomplete links as gaps, not retroactive successes.
