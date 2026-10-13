# Harness v3.1 adoption and acceptance record

## Integration status

- **Source imported:** complete local overlay integrated and pushed to Draft PR #2 on branch `feat/selective-skills-harness-installer` in commit `441dcf4616e751fe4a13e069c7978f3f30c4906e`.
- **Base:** Xyeena Agentic remains the single distributable npm package `xyeena-agent` with executable aliases `xyeena` and `xyeena-agent`.
- **Licensing:** original Xyeena author authorized MIT for Agentic, Skills and Harness; `harness/upstream-v3.1/LICENSE` is included in the npm package, and `LICENSE-NOT-SET.md` has been removed.
- **Release:** npm publish and merge to `main` have NOT occurred. Public npm `0.1.0` still uses the previous all-skills install behavior.

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

## Still required before publish/merge

1. Windows PowerShell **interactive** wizard acceptance, including Cancel, Skills-only, Harness-only, All, repeated installs, conflicts and `--force` protection. Automated non-TTY and packaged-consumer checks do not replace this gate.
2. Evaluate package contents and provenance once more after README and metadata changes; run the full CI suite for the final candidate commit.
3. Choose and synchronize the next npm version in `package.json` and `src/paths.mjs`, verify published artifact and changelog, then publish only with explicit owner approval.
4. Keep PR #2 draft and `main` unchanged until the gates above are complete.

## References

- [Draft PR #2](https://github.com/rzqllh/xyeena/pull/2)
- [Current README](../README.md)
- [Unreleased changes](../CHANGELOG.md)
