# Harness v3.1 adoption and acceptance record

## Integration status

- **Source integrated into `main`:** original Harness v3.1 imported via feature-branch commit `441dcf4616e751fe4a13e069c7978f3f30c4906e` and squash-merged in [PR #2](https://github.com/rzqllh/xyeena/pull/2) at `9fa245fe67f2bb70255568cd5431783f`.
- **Base:** Xyeena Agentic remains the single distributable npm package `xyeena-agent` with executable aliases `xyeena` and `xyeena-agent`.
- **Licensing:** original Xyeena author authorized MIT for Agentic, Skills and Harness; `harness/upstream-v3.1/LICENSE` is included in the npm package, and `LICENSE-NOT-SET.md` has been removed.
- **Release:** source in `main` is version `0.2.0`. Publication to npm is **not yet confirmed** and must be approved separately via [issue #3](https://github.com/rzqllh/xyeena/issues/3); do not assume the public `npx` command resolves the new version until verified.

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

## Post-merge status and outstanding npm release

1. The source integration is complete; the merged PR #2 feature-branch CI passed all 7 jobs on Windows, macOS, Linux, and the Agent Skills validator.
2. Windows PowerShell manual installer acceptance was reported satisfactory by the project owner. The full final 8/8 script output was not included, so this is **owner-reported evidence**, not a separately archived terminal log.
3. The public source package versions (`package.json`, `package-lock.json`, `src/paths.mjs`) were synchronized to `0.2.0`. The Harness snapshot stays private, under MIT.
4. Pending: validate main-branch post-merge CI independently, confirm npm registry version, inspect the final tarball and obtain explicit publish approval; tracked at [release issue #3](https://github.com/rzqllh/xyeena/issues/3).
5. The separate Xyeena Island/Desktop implementation must not be mixed into this package's publishing workflow.

## References

- [Merged PR #2](https://github.com/rzqllh/xyeena/pull/2)
- [Release issue #3](https://github.com/rzqllh/xyeena/issues/3)
- [README](../README.md)
- [CHANGELOG](../CHANGELOG.md)
