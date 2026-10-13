# Xyeena 0.2.0 — installer acceptance and release record

**Repository status (13 October 2026):** [PR #2](https://github.com/rzqllh/xyeena/pull/2) was squash-merged into `main` at `9fa245fe67f2bb70255568cd5431783f`. The final feature-branch CI matrix passed 7/7 jobs. The owner reported that Windows manual acceptance was satisfactory; the complete 8/8 terminal summary was not attached. **npm publication remains pending separate approval**; see [issue #3](https://github.com/rzqllh/xyeena/issues/3).

## Verified automated gates

- `npm ci`, `npm test`, `npm run test:harness`, `npm run test:consumer`, `npm run check`, `npm run eval`, and `npm pack --dry-run` must pass on the candidate commit.
- CI matrix: Windows, macOS and Linux on Node.js 22.14 and 24, plus Agent Skills reference validation.
- The CLI banner, package.json, and package-lock.json must all report `0.2.0`; vendored `@xyeena/harness` is private and remains on v3.1.
- The package must include `harness/upstream-v3.1/LICENSE` and exclude `LICENSE-NOT-SET.md`.

## Manual Windows PowerShell acceptance (required)

For a repeat acceptance run, use a clean checkout of `main`:

```powershell
git pull --ff-only origin main
node .\scripts\manual-acceptance.mjs
```

This script creates disposable fixtures in the Windows temp directory, walks through the actual terminal wizard (you choose the listed answers), checks selected file outputs, validates cancellation/repeat/overwrite guards, and prints a PASS/FAIL summary. **It cannot certify human acceptance until someone runs it in a real Windows PowerShell terminal.** No Git commit, push, project reset, npm publication or automatic cleanup occurs.


Run these commands in a **real interactive PowerShell terminal**, from a clean checkout of `main`. Do not run against a production project. Use temporary folders as illustrated:

```powershell
git switch main
git pull --ff-only origin main
node .\bin\xyeena.mjs version
$TestRoot = Join-Path $env:TEMP ('xyeena-accept-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $TestRoot | Out-Null
Write-Host "Acceptance data: $TestRoot"
```

Record actual outcomes; do not count an automated pseudo-terminal test as the manual gate.

1. **Cancel:** run `node .\bin\xyeena.mjs init --dir "$TestRoot\cancel"`; select `0` or press Enter. Expect exit without `.agents/`, `.claude/` or `.xyeena/` creation.
2. **Skills only:** run `node .\bin\xyeena.mjs init --dir "$TestRoot\skills"`; select `1`, runtime `codex`, skill `xyeena-interface`, confirm `y`. Verify it previews `xyeena-core` as a required dependency, creates only `.agents/skills/xyeena-interface` and `.agents/skills/xyeena-core` plus inventory; no Harness guides or Claude skills.
3. **Harness only:** run `node .\bin\xyeena.mjs init --dir "$TestRoot\harness"`; select `2`, guardrail `00-core`, confirm `y`. Expect `.xyeena/config.json`, `.xyeena/profile.md`, `.xyeena/harness/guides/00-core`, and no `.agents/skills`. It must not generate root `AGENTS.md` or alter Git hooks.
4. **Explicit All:** run `node .\bin\xyeena.mjs init --dir "$TestRoot\all"`; select `3`, then runtime `all`, skill `all`, guardrails `all`, confirm `yes`. All components should be installed only after that confirmation.
5. **Cancel at confirmation:** run the Harness-only scenario against a fresh `cancel-late` folder but answer `n` at `Proceed?`. No project files should be written.
6. **Repeat and conflict:** repeat Skills-only on `$TestRoot\skills` and expect no conflict. Modify the installed `xyeena-interface/SKILL.md` by appending a unique local marker; repeat without `--force` and expect a refusal before any overwrite. Confirm the marker is preserved. Restore the original file in the disposable fixture before re-testing.
7. **Non-TTY contract:** `node .\bin\xyeena.mjs init --components harness --guards 00-core --dir "$TestRoot\explicit" --yes` should install only the selected group. `--dry-run` in a fresh folder must not write files.

Optional inspection:

```powershell
Get-ChildItem -Force "$TestRoot\skills"
Get-ChildItem -Force "$TestRoot\harness\.xyeena\harness\guides"
Test-Path "$TestRoot\harness\AGENTS.md"
```

Do not clean up acceptance evidence before recording results. When done, you may remove the temporary fixture manually after confirming the path.

## Final decision gates

- All GitHub Actions jobs green for the final release-candidate commit.
- All seven manual scenarios above recorded PASS; no unexplained installer writes or overwrites.
- npm package archive audited for secret files, unexpected artifacts, source notices and LICENSE.
- The integration merge is complete. npm publication remains a separate step requiring explicit maintainer approval and registry verification; see issue #3.
