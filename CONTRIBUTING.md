# Contributing

Contributions should preserve compatibility, project data, and host permission boundaries.

## Before opening a pull request

1. Document affected behavior, runtimes and compatibility.
2. Add targeted regression tests for behavior changes.
3. Run the checks below and report their actual results.
4. Distinguish fixtures and contract tests from live host execution.
5. Keep authorization, workspace scope and evidence verification fail-closed.
6. Provide migration/rollback guidance when touching installer behavior.

```sh
npm ci
npm test
npm run check
npm run eval
npm run test:harness
npm run test:consumer
npm pack --dry-run
```

Source layout: `skills/` contains distributable skills; `src/` runtime code; `harness/` project safeguards; `test/` automated checks; `docs/` maintained documentation. Release-readiness tracking is in `docs/xyeena-rig/`.

Do not commit local sessions, tokens, credentials, checkpoints, backups, scratch files, or generated logs. Preserve licenses and [NOTICE.md](NOTICE.md). Follow [SECURITY.md](SECURITY.md) for confidential vulnerability reporting.

Merger and release authorization are separate from passing CI.
