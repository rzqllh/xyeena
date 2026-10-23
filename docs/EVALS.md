# Evaluation and validation

Xyeena Rig uses layered validation rather than a single aggregate test count.

| Layer | Purpose | Evidence |
| --- | --- | --- |
| Unit and contract tests | Verify deterministic skill, consent, budget and checkpoint behavior | `npm test` |
| Scenario evaluations | Exercise resolver, governor and consent cases | `npm run eval` |
| Harness regression | Validate bundled Harness behavior | `npm run test:harness` |
| Consumer smoke | Verify the packed package can be installed and invoked | `npm run test:consumer` |
| CI matrix | Catch platform regressions across Windows, macOS and Linux | GitHub Actions on exact commit |
| Live host acceptance | Test real installation, activation, user permission UI, tool interception and worker lifecycle | Separate operator-run evidence |

Representative test cases include: relevant and irrelevant skill triggers, dependency collision, untrusted provider exclusion, worker cancellation and concurrency, denied privileges, evidence provenance, migration rollback, checkpoint crash recovery, and side-effect-safe retries.

The source test suite and deterministic evaluator do not establish end-to-end behavioral improvements in real models. Host-native conformance must be assessed separately for Antigravity, Codex, Claude Code, Gemini CLI and Hermes.

See [Validation record](xyeena-rig/EVIDENCE.md), [Acceptance matrix](xyeena-rig/ACCEPTANCE_MATRIX.md) and [Security](../SECURITY.md).
