# Xyeena Rig v0.3.0 — Release checklist

**Release candidate:** `xyeena-agent@0.3.0` from Draft PR #12, not an npm registry release until the `v0.3.0` GitHub Release workflow completes and the registry is checked.

## Verified automated gates

- `package.json`, `package-lock.json`, `src/paths.mjs`, `plugin.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` all report `0.3.0`.
- All original 19 skills and 41 Harness guardrail documents remain in the package. No runtime npm dependencies added.
- Cross-platform GitHub Actions must pass: Node 22.14 and 24, Ubuntu/macOS/Windows, Agent Skills reference, SDK worker contract, GitHub npx smoke.
- `npm test` covers setup wizard cancellation, safe previews, selected runtimes, Essential/Balanced/Complete presets, Harness opt-in, prevention of modified file overwrites and CLI gating.
- `npm run test:consumer` installs the actual `npm pack` tarball offline and verifies beginner `setup` to Hermes and Gemini in disposable projects.
- Documentation: [Windows beginner guide](INSTALL-WINDOWS-PEMULA.md) plus README, getting started, CLI reference, and native host limits.

## Live acceptance gate — target computer (not satisfied by GitHub CI)

1. Run `node --version` (must be >=22.14) and `npm --version` on a Windows desktop.
2. Open a **disposable Git repository** dedicated to acceptance. Keep installed Hermes/Gemini credentials separate; do not upload secrets.
3. From the validated branch commit, test GitHub tarball `npx --yes --package https://codeload.github.com/rzqllh/xyeena/tar.gz/<COMMIT_SHA> xyeena setup`. Select only the actual host(s). Confirm you can cancel without files and install after review.
4. Run `xyeena skills matrix --local-only` using the **same package version**; validate missing skills are not invented and Hermes trust checks block untrusted project skills.
5. Reopen Hermes/Gemini/Codex/Claude/Antigravity and check they detect the selected skills. Try a bounded, non-sensitive *read-only* goal in a disposable project; record the host version, invoked skill(s), tokens and actual result. Native one-shot execution is not proof of in-session dispatch.
6. Confirm any existing custom SKILL.md remains unmodified and any third-party installations are untouched.
7. Note any real host discrepancies in PR #12. Do not enable autonomous writes or publish while unresolved blockers remain.

## Publish sequence (maintainer action)

1. Make sure the exact PR HEAD is green on all 9 CI jobs and live acceptance is documented.
2. Review PR #12 diff, mark Ready for Review, approve and merge to `main`. Do not merge if the status is stale or conflicting.
3. In GitHub, create **a Release with tag `v0.3.0` pointing to the merged `main` commit** (not a working branch or older tag).
4. The existing `.github/workflows/publish.yml` runs on `release.published`. It checks `v0.3.0` against `package.json`, runs all tests, and publishes through the repository's configured npm authentication.
5. Confirm the workflow is green. On the maintainer terminal, independently check:
   ```powershell
   npm view xyeena-agent version
   npx --yes xyeena-agent@0.3.0 version
   ```
6. Smoke-test `npx --yes xyeena-agent@0.3.0 setup` in a disposable folder; cancel first, then install Essential after reviewing files.
7. Only **after** successful registry checks update quickstart links to `@latest` and mark the release published in user-facing announcements.

**If the version is missing from npm, do not represent it as installable with `@0.3.0`; continue using the approved GitHub tarball test route.**
