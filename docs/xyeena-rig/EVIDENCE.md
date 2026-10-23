# Validation and evidence

## Recorded repository baseline

- **Repository:** [rzqllh/xyeena](https://github.com/rzqllh/xyeena)
- **Integrated source baseline:** `main` at [`aade0a69242bea989101588953be781110372530`](https://github.com/rzqllh/xyeena/commit/aade0a69242bea989101588953be781110372530)
- **Automated CI:** [GitHub Actions run 39925231442](https://github.com/rzqllh/xyeena/actions/runs/39925231442) — successful Windows, macOS and Ubuntu checks on Node.js 22.14 and 24, plus package/SDK contract jobs.
- **Recorded post-merge local validation:** 317 tests passed; `npm ci`, `npm run check`, `npm run eval`, `npm run test:harness`, `npm run test:consumer` and `npm pack --dry-run` passed at the integrated baseline.
- **Published package:** `xyeena-agent@0.4.1`. Additional source features are unreleased.

These references document a historical passing commit; they do not assert that later changes have been independently validated. Consult CI on the current commit before approval.

## Verification classes

| Class | Recorded evidence | Limitation |
| --- | --- | --- |
| Code and contracts | Repository tests, skills manifests, Harness and adapter tests | Tests may use fixtures |
| Packaging | Tarball/consumer smoke | Not a new published npm version |
| Cross-platform | GitHub Actions jobs | Not a live IDE acceptance session |
| Simpul | MCP API contract tests | No accepted end-to-end supervisor execution |
| Host approvals and hooks | Boundary tests, fail-closed behavior | Live host interception and user-approval provenance still pending |

No new `0.5.0` tag or npm publication has been authorized. Never treat a model status message or file-size check as independent proof of acceptance.

## Additional live evidence

Each completed operational gate should record its environment, exact commit, host/tool version, test procedure, outcome, security limitations and sanitized evidence reference. See [Task tracker](TASK_TRACKER.md) and [Acceptance](ACCEPTANCE_MATRIX.md).
