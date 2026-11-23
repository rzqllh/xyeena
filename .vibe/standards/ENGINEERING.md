# Engineering & correctness protocol

Inspired by Superpowers' deliberate planning, test-first discipline and systematic debugging; NIST SSDF; contract-first engineering.

- **Inspect → reproduce → scope → design → approve → implement → verify.** No solution before understanding the failure mode or requirement.
- Prefer smallest cohesive, reversible change. Avoid speculative frameworks, unnecessary layers and technology fashion. Follow real project conventions unless approved changes justify divergence.
- For defects, record reliable reproduction, expected/actual behavior, smallest failing test, root cause hypothesis, counterexamples and permanent regression check. Do not random-walk by editing until green.
- Use **RED → GREEN → REFACTOR** where practical. If implementation-first is necessary (exploratory spike/prototype), label it and later add contract/regression tests; never claim TDD when absent.
- Design boundaries explicitly: inputs, outputs, errors, auth, idempotency, retries, timeouts, observability, persistence, concurrency, migrations, backwards compatibility, resource limits.
- Keep structured contracts executable and validated: OpenAPI, JSON Schema, protobuf, SQL migrations, typed interfaces, infrastructure-as-code. Markdown remains a decision and explanation layer.
- Test negative paths, permission boundaries, malformed inputs, stale data, rollback/failure sequences and retries, not only happy paths.
- Use dependency and supply-chain review, pinned versions where reproducibility matters, secrets scanning, environment isolation and fail-closed behavior for authorization.
- For multi-agent contributions, enforce single ownership of overlapping edits, atomic tasks and rebase/review of actual diffs; do not equate handoff with validation.
- Each completion includes exact command, environment, exit code, actual result, artifact path and honest unknowns.
