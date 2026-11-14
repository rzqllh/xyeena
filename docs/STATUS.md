# Support and Release Status

This page separates the published baseline, newer source features, and recorded host observations. Documentation cleanup does not establish new runtime acceptance.

---

## 1. Published Baseline vs Rebuild Source

| Item | Status |
| :--- | :--- |
| **GitHub release** | [v0.4.1](https://github.com/rzqllh/xyeena/releases/tag/v0.4.1) |
| **npm baseline recorded by the repository** | `xyeena-agent@0.4.1`; recheck the registry before publishing a new version |
| **Source version** | `0.4.1` in `package.json`, with additional unreleased changes |
| **Rebuild Foundation Status** | P00–P10.2 Rebuild completed with **605 / 605 tests PASS** across 47 suites; frozen on feature branch |
| **Planned 0.5.0** | Limited-public release preparation; no new publication is performed by this documentation change |
| **Final publication** | Requires final owner approval, exact candidate checks, and publishing configuration |

Run source-only examples with `node bin/xyeena.mjs` from the intended checkout. Do not assume commands added after the 0.4.1 release exist in its npm package. Node.js 22.14+ is required.

---

## 2. Rebuild Foundation Acceptance Status (P00–P10.2)

The local rebuild on `feat/rebuild-foundation-p00` establishes the following verified components:
- **Capability Coverage:** 64 native capability contracts bound to concrete executable handlers (`BEHAVIOR_VERIFIED`: 64/64, `CONTRACT_ONLY`: 0).
- **Golden Scenarios:** 7 comparative golden scenarios verified (Superpowers planning, Superior deep modules, Anti-Slop WCAG AA contrast, Ponytail lean diffs, Caveman citations, Cloudflare finding validators, Xyeena disk persistence).
- **Installer Safety:** Verified against defined adversarial scenarios (user modification diff lock, corrupted manifest fail-closed, safe uninstall preserving custom files, symlink boundary checks, atomic rollback).
- **Cortex Live Activation:** Configured in workspace host files; dynamic runtime binding is reported honestly as **`HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`**.

---

## 3. Recorded Host Support

These observations were recorded on Windows on 2026-10-26 and 2026-10-27. They describe those host versions and interactions, not every installation or later vendor version.

| Host | Recorded evidence | Remaining limitation |
| :--- | :--- | :--- |
| **Antigravity CLI 1.4.7** | Native `PreToolUse` `force_ask`, user cancellation, and a scoped automatic deny for a harmless read-only command | Arbitrary privileged operations, OS containment, and other host versions remain unverified |
| **Antigravity IDE 2.5.5** | A tool ran despite an expected hook denial | **LIVE BLOCKED** for native hook enforcement; installation is not enforcement |
| **Hermes** | Bounded one-shot execution reached post-run token accounting | **LIVE PARTIAL**; real cancellation and provider-side spend limits remain unverified |
| **Codex, Claude Code, Gemini CLI** | Source adapters and protocol fixtures | Native acceptance remained unverified in the recorded environment |

A writable diagnostic receipt is not independent proof that a host loaded a hook. `hostEnforcement: UNVERIFIED` remains appropriate until a real host observation supports a narrower statement. A fixture using fake provider responses is not an authenticated provider test.

---

## 4. Source Safety Boundaries

- Read-only discovery and preview commands do not start a model session.
- One-shot execution requires consent. Source cancellation requests termination; it does not prove descendant processes or remote billing have stopped.
- Token limits validate reported usage after provider execution. They are not hard provider spending caps. Do not automatically retry with a larger budget after a rejection.
- Workspace writes stay serialized. A timed-out write may retain its lock until the adapter settles; recovery may be required.
- Unknown or incomplete backend readiness cannot authorize execution. A caller-asserted isolated worktree is not proof of OS containment.
- Guided hooks depend on the host loading and enforcing them. Missing support must not silently become permission to execute.

Read [Security](../SECURITY.md), [Runtime Adapters](RUNTIME-ADAPTERS.md), and [Guided Hooks](ANTIGRAVITY-GUIDED.md) before enabling execution.

---

## 5. Outstanding Host Acceptance Gates

The native Rig release scope tracks these open requirements:
- [#34: Antigravity IDE hook enforcement](https://github.com/rzqllh/xyeena/issues/34). A CLI result cannot substitute for an IDE result.
- [#36: Codex, Claude Code, and Gemini CLI](https://github.com/rzqllh/xyeena/issues/36). Record native activation, authorization, completion, and failure behavior on the intended host.
- [#37: Hermes cancellation and budget behavior](https://github.com/rzqllh/xyeena/issues/37). Confirm actual process termination and distinguish result rejection from provider spending controls.

Simpul is a separate optional integration. Its [interface issue #35](https://github.com/rzqllh/xyeena/issues/35) does not define the core Rig host scope. Do not close live requirements using simulated results.

---

## 6. Preparing a Release

1. Choose and document the supported host scope. Keep unsupported enforcement paths unavailable.
2. Run source tests, validation, evals, vendored harness tests, and the packed-consumer smoke on the exact candidate (`npm test`, `npm run check`, `npm run pack:check`, `npm run test:consumer`, `npm run test:harness`).
3. Inspect `npm pack --dry-run`; exclude credentials, sessions, logs, and internal handoffs while retaining required licenses and product skills.
4. Verify package, plugin, and release versions together. Check that the candidate npm version has not already been published.
5. Verify the npm trusted publisher and required environment reviewers in the external services. Workflow YAML alone does not prove those settings exist.
6. Obtain final owner approval before a tag, GitHub Release, or npm publication. Verify the published artifact against the approved source.

The [operations runbook](xyeena-rig/RUNBOOK.md) covers migration, recovery, source preflight, and native acceptance. [Contributing](../CONTRIBUTING.md) describes development checks. Source CI and live host acceptance are separate evidence classes.
