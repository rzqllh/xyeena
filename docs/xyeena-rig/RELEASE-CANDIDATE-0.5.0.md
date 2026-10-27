# Xyeena Rig v0.5.0 — release-candidate gate

[Current source and host status](../STATUS.md) · [Native operator acceptance](NATIVE_ACCEPTANCE_HANDOFF.md) · [Security risks](RISK_REGISTER.md)

**State: SOURCE_RC_CI_PASS / SCOPED_PUBLIC_RELEASE_APPROVED / FINAL_PUBLICATION_NOT_AUTHORIZED.**

**Source CI checkpoint:** Candidate #68 based on main `bd99d7b5d862d6db61959347a7a751ba5ae118ef` passed **9/9** source CI jobs at head `e825c6c9ded90009cf91a75f07652f985483c8a9` ([run 40454069557](https://github.com/rzqllh/xyeena/actions/runs/40454069557)). Any later candidate edit needs a fresh successful CI on its **exact HEAD**. CI cannot establish native host behavior.

This is an **unpublished, isolated metadata candidate** prepared on 27 October 2026 from the merged Xyeena Rig source through PR #67. Simpul is a separate optional workspace and does not block RIG-native release qualification.

## Release artifact and consistency checks

- Candidate npm package name: `xyeena-agent`; requested package version: `0.5.0`. This version is **not** an assertion about npm registry state.
- Version equality must hold among `package.json`, `package-lock.json` root/package versions, `src/paths.mjs`, `plugin.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`.
- Source validation: Node 22.14 and 24 on Windows/macOS/Ubuntu, skills reference, Python SDK worker contract, harness tests, security/regression suite, `npm run check`, `npm run eval`, `npm pack --dry-run`, packed consumer installation and GitHub-source `npx` smoke. Require the **final candidate head's** complete CI pass; no earlier run is inherited.
- Public docs must keep the published `@0.4.1` installation instructions and identify `@0.5.0` as **not yet available on npm**.
- Publish workflow in `main` does not trigger on push/commit-message. A future tag and explicitly published stable GitHub Release must reference the identical, versioned **current `main` HEAD**, and `npm-publish` reviewers and Trusted Publisher OIDC must be configured externally.

## Approved scoped public release — 2026-10-27 (scope approval, not publish authorization)
 
- **Native test observed:** Antigravity CLI `agy 1.4.7` on Windows, narrow hook `force_ask` with user cancellation and `deny` for a harmless exact-match command. This is not general shell isolation.
- **Explicit security limitation:** Antigravity IDE 2.5.5 has no observable Hooks UI in the user's installation and failed a prior IDE-originated deny test. Never market IDE-native hook enforcement as supported.
- **Experimental/unverified:** Codex, Claude Code, Gemini CLI adapters have source/regression tests only; native binaries were unavailable at the operator's preflight. Hermes detected 47 skills and completed a provider-backed result but the native one-shot was rejected for post-run >5000 token accounting; no cancellation/tree teardown PASS.
- **No universal 'five-host native security' promise:** installation paths, skill discovery and read-only adapters have different evidence levels from host enforcement.

**Operator scope decision recorded:** public `0.5.0` may ship with the above limitations prominently disclosed; native tests remain open and unverified features must not be advertised as protected. **This approves the product's support scope only.** It explicitly does **not** authorize merging candidate code to main, creating `v0.5.0`, publishing a GitHub Release, or executing npm publication. Those require a separate final GO after release controls are confirmed.

## Native/runtime acceptance still missing

| Issue | Recorded evidence | Why still open |
| --- | --- | --- |
| [#34 Antigravity IDE](https://github.com/rzqllh/xyeena/issues/34) | Windows `agy` CLI accepted narrow consent and native deny; IDE 2.5.5 previously bypassed expected hook | Require separately observed real IDE native deny; CI and managed hook hash are not substitutes |
| [#36 Codex / Claude / Gemini](https://github.com/rzqllh/xyeena/issues/36) | Source adapters have negative protocol tests, but recorded Windows binaries were unavailable | Real authenticated, permission-constrained and safely canceled read-only one-shot per host |
| [#37 Hermes](https://github.com/rzqllh/xyeena/issues/37) | Bounded one-shot and CI dummy Windows tree-cancel tests | Real host Ctrl+C/cancellation and authorization, independent process observation |

**Source CI acceptance and end-to-end native security acceptance are separate dimensions.** A release may deliberately scope unsupported host enforcement, but only after that limitation is reflected in public marketing and a human authorizes the exact release.

## Enterprise administrative controls — require human verification

- GitHub branch/tag protection and ownership/approval rules checked by repo administrator.
- GitHub `npm-publish` environment exists **with human approval protection/required reviewers configured, if available for this repository's plan**, not just declared in YAML.
- npm Trusted Publisher ties `rzqllh/xyeena`, `publish.yml`, and environment `npm-publish` exactly, **and permits direct `npm publish`** (new trusted publisher entries can default to stage-only); no long-lived token fallback.
- Exact npm registry `0.5.0` availability checked immediately before publication. The exact version must be unused.
- Generated npm tarball contents, license, notices and dependency inventory reviewed; OIDC provenance and fresh registry consumer install verified **after** a human-approved release.

No access to the operator's Windows IDE, private GitHub repository settings or npm account configuration was established by a green CI matrix.

## Promotion and rollback boundary

1. Only after completed candidate CI and manual native/support-scope review, maintainer explicitly approves `0.5.0` metadata promotion to main.
2. A separate explicit instruction must authorize tagging `v0.5.0` and publishing a GitHub Release; neither happens as part of candidate construction.
3. Protected publication workflow runs tests and npm OIDC publish. On npm publish failure, do not reuse an existing version or fabricate a provenance receipt.
4. On application regressions, revert the source and issue a new patch version; npm versions are immutable. Never rewrite/delete audit receipts to imply success.

**Current gate:** scope A is approved. **Publication remains NO-GO** until exact-head CI, GitHub/n​pm environment and trusted publisher setup, and a separate final human release authorization are verified. The remaining native issue tickets stay open by design.
