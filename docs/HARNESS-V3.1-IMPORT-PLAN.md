# Harness v3.1 source adoption

Status: **source package prepared and tested locally, not yet committed to this GitHub branch**.

## Pinned upstream and provenance

- Existing Xyeena Agentic baseline: `8ba54598f4da89662474625732095aab847d5d9d`.
- Reviewed v3.1 ZIP SHA-256: `b65f826cabd69d6357fcf84c4fa1d874aeb4f383a7a35db9b5eee573f30fe888`.
- Source: user-supplied `xyeena-harness-v3.1-repo-ready(1).zip`.
- Hardening-candidate runtime safety tests: **15/15 passed** in the isolated source tree.

## Target architecture

- Keep `xyeena-agent` as the **single published npm package** and both public binaries.
- Interactive `xyeena init`: no preselection; choose Skills, Harness, or explicit All; then runtimes, individual skills and Harness guardrail groups.
- Leave the original `xyeena doctor` unchanged; route `xyeena harness doctor|audit|scan|verify` and standalone `xyeena audit|scan|verify` through the reviewed v3.1 runtime.
- Keep `src/harness.mjs` as a small wrapper invoking the pinned vendored runtime. No second public CLI, no second npm install.
- Imported sources belong under `harness/upstream-v3.1/` with per-category original Markdown documents under `harness/guides/`. The packed consumer and manual users can review each file.
- The original 41 guardrail Markdown documents, runtime modules, adapters, integration examples and license placeholder must be preserved where relevant, rather than replaced by abbreviated placeholders.

## Local staging validation

The source overlay was constructed from the original uploaded archive and the previously tested hardening candidate. A simulated feature-branch repository successfully completed:
- Preview: no file writes, 41 guardrail Markdown files included.
- Explicit apply: file manifest checksum verification, branch/remote/clean-worktree checks; no automatic Git commit or push.
- Harness `doctor` invoked through the wrapper and reported the Git branch and risk.
- Original 15 Harness unit tests passed.
- `npm pack --dry-run` included the vendored source in a fake consumer package.
- A project with no project-native scripts returned verification status `INCOMPLETE` (exit code 3), and `verify` did not create evidence without `--evidence`.
- Invalid explicit `--base` failed with exit code 2.

These are **isolated fixture results, not final acceptance of the integrated GitHub tree**.

## Integration work still required

1. Apply the reviewed overlay on the actual PR #2 feature branch, inspect the full diff and update the package changelog.
2. Run all original Xyeena Agentic tests, original 15 Harness tests, evaluation checks, packed npm consumer tests and the Windows/Linux/macOS CI matrix against that exact head.
3. Verify installer selections on Windows PowerShell: Skills-only, Harness-only, selected guards, explicit All, Cancel, dry-run, rerun and overwrite refusal.
4. Resolve the original Harness archive's `LICENSE-NOT-SET.md` publication-rights question and review third-party attribution.
5. Review npm package allowlist, release notes, semver, and evidence/privacy cleanup.
6. Keep PR #2 **draft** and `main` unchanged until all checks, including manual gates, pass.

## Distribution

The full-source overlay is supplied as a downloadable conversation artifact, not committed to this branch. A developer can extract it outside the repository, inspect it, preview its installer, then apply it only after checking out `feat/selective-skills-harness-installer` in a clean local clone. The importer never pushes automatically.
