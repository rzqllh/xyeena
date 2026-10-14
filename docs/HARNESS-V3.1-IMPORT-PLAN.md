# Harness v3.1 adoption and acceptance record

## Integration status

- **Source integrated into `main`:** original Harness v3.1 imported via feature-branch commit `441dcf4616e751fe4a13e069c7978f3f30c4906e` and squash-merged in [PR #2](https://github.com/rzqllh/xyeena/pull/2) at `9fa245fe67f2bb70255568cd5431783f`.
- **Base:** Xyeena Rig (formerly Xyeena Agentic) remains the single distributable npm package `xyeena-agent` with executable aliases `xyeena` and `xyeena-agent`.
- **Licensing:** original Xyeena author authorized MIT for Agentic, Skills and Harness; `harness/upstream-v3.1/LICENSE` is included in the npm package, and `LICENSE-NOT-SET.md` has been removed.
- **Release:** `xyeena-agent@0.2.0` was [published on npm](https://www.npmjs.com/package/xyeena-agent/v/0.2.0) on 14 October 2026, alongside the [GitHub release](https://github.com/rzqllh/xyeena/releases/tag/v0.2.0), with a [successful publish run](https://github.com/rzqllh/xyeena/actions/runs/38536465520). [Issue #3](https://github.com/rzqllh/xyeena/issues/3) was closed. The later Rig branding is source-only relative to this immutable release.

## Source provenance

- Reviewed owner-supplied archive: `xyeena-harness-v3.1-repo-ready(1).zip`.
- Source archive SHA-256: `b65f826cabd69d6357fcf84c4fa1d874aeb4f383a7a35db9b5eee573f30fe888`.
- Original 41 Markdown guardrails are represented in `harness/guides/` and grouped by category. Vendored source including adapters, runtime and integration examples is in `harness/upstream-v3.1/`.
- No separate Harness npm install is intended; the original nested package is marked private.

## Compatibility and safety

- `xyeena init` presents selectable Skills, Harness or All with granular runtime/skills/guardrail choices. No implicit install-all.
- Non-interactive setup requires explicit flags and confirmation; dry-run writes nothing.
- Mandatory skill dependencies are included; existing user-modified targets refuse overwrite unless `--force` is selected.
- Legacy Agentic `xyeena doctor` remains available, while the new `xyeena harness doctor` uses the vendored runtime.
- Vendored upstream `init` (would create `AGENTS.md`) and `install-hook` are blocked by the public Harness bridge; no hidden Git hook mutations.
- Missing verification scripts return INCOMPLETE rather than a false PASS; evidence is opt-in.

## Verified evidence

| Gate | Result / scope |
| --- | --- |
| Windows local Agentic tests | 45/45 passed |
| Windows local Harness tests | 15/15 passed |
| Packed npm consumer | Passed with Windows executable-path fix |
| Capability validation | 19 capabilities passed |
| Agentic evaluations | 16/16 passed |
| npm package license inventory | MIT LICENSE present; placeholder absent |
| `git diff --cached --check` | Clean before commit |
| PR integration commit CI | 7/7 jobs passed: Windows/macOS/Linux Node.js 22/24 + skills-ref |

## Post-merge and publication outcome (14 October 2026)

1. Harness v3.1 source was integrated via PR #2. The release candidate's cross-platform CI passed 7/7 jobs.
2. Windows manual acceptance was owner-reported satisfactory; the full final terminal transcript was not archived in this record.
3. The published 0.2.0 package and lockfile are synchronized. The vendored Harness source remains private and MIT licensed.
4. GitHub Release `v0.2.0`, registry publication, and successful Actions execution are now confirmed; see [closed issue #3](https://github.com/rzqllh/xyeena/issues/3).
5. [Rig branding PR #4](https://github.com/rzqllh/xyeena/pull/4) updated current source presentation after publication without rewriting 0.2.0.
6. Xyeena Notch/Island and Xyn assets remain separate from this npm package and its licensing scope.

## References

- [Merged PR #2](https://github.com/rzqllh/xyeena/pull/2)
- [Release issue #3](https://github.com/rzqllh/xyeena/issues/3)
- [README](../README.md)
- [CHANGELOG](../CHANGELOG.md)
