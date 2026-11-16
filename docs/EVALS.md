# Evaluation and Validation

See the [current source/host acceptance status](STATUS.md). PR #30's final source commit passed 9/9 CI check jobs, and a user-observed native CLI `deny` test provided separate host evidence. Neither is an all-host security certification.

Xyeena Rig uses layered validation rather than a single aggregate test count.

| Layer | Purpose | Evidence |
| :--- | :--- | :--- |
| **Unit and contract tests** | Verify deterministic skill, consent, budget and checkpoint behavior | `npm test` (605 / 605 PASS) |
| **Scenario evaluations** | Exercise resolver, governor and consent cases | `npm run eval` |
| **Harness regression** | Validate bundled Harness behavior | `npm run test:harness` (15 / 15 PASS) |
| **Consumer smoke** | Verify the packed package can be installed and invoked | `npm run test:consumer` |
| **Contract integrity** | Validate 19 skills and 64 capability contracts | `npm run check` |
| **Package contents** | Verify zero internal dossier or secret leakage | `npm run pack:check` |
| **CI matrix** | Catch platform regressions across Windows, macOS and Linux | GitHub Actions on exact commit |
| **Live host acceptance** | Test real installation, activation, user permission UI, tool interception and worker lifecycle | Separate operator-run evidence |

Representative test cases include: relevant and irrelevant skill triggers, dependency collision, untrusted provider exclusion, worker cancellation and concurrency, denied privileges, evidence provenance, migration rollback, checkpoint crash recovery, and side-effect-safe retries.

The source test suite and deterministic evaluator do not establish end-to-end behavioral improvements in real models. Host-native conformance must be assessed separately for Antigravity, Codex, Claude Code, Gemini CLI and Hermes.

See [Support and release status](STATUS.md) and [Security](../SECURITY.md).
