# Source and release status

**Evidence reviewed: 2026-10-26 (Asia/Jakarta).** This page describes the public Xyeena Rig repository and the recorded Windows acceptance session; it is not a promise that every host has been tested.

## Source versus published npm

| Surface | Verified source state | Release boundary |
| --- | --- | --- |
| GitHub `main` | Source baseline [`f3336547`](https://github.com/rzqllh/xyeena/commit/f3336547e57a65850e13ee8f225e250a5cf9f7b0) (merged PR [#29](https://github.com/rzqllh/xyeena/pull/29) and [#30](https://github.com/rzqllh/xyeena/pull/30)) | Code, docs and tests on `main`; not automatically npm-published |
| npm `xyeena-agent` | `0.4.1` is the last published baseline **recorded by this repository** | Registry cannot be authoritatively rechecked from this audit; verify the registry before a future release |
| Candidate `0.5.0` | Not published, tagged, or authorized by the user | A future publication requires explicit human approval |
| CI | PR #30's final source commit passed 9 of 9 GitHub required test/check jobs | CI is source/packaging assurance, not live host enforcement |

The package version remains `0.4.1` in `package.json`. Features implemented after that release—including compact skill setup, expanded adapters, native `PreToolUse` integration and new probe/runner commands—are **source-only until an authorized npm release**. Use `node bin/xyeena.mjs` from a source checkout, not `npx xyeena-agent@0.4.1`, when following source-only instructions. Node.js 22.14+ is required.

## Host acceptance as observed

| Host / boundary | Evidence | Status |
| --- | --- | --- |
| **Antigravity CLI `agy 1.4.7` (Windows)** | Native `PreToolUse` callback observed; `force_ask` displayed Xyeena-specific approval reason and user `No, cancel` blocked the tool; a separate one-shot `deny` returned `tool call denied by pre-tool hook: Xyeena: native deny diagnostic blocked read-only git status` without executing `git status --short`. Probe was cleared after test. | **LIVE PASS for those specific CLI consent/deny interactions** |
| **Antigravity IDE `2.5.5` (Windows)** | A native read-only tool was permitted despite an expected workspace-boundary hook denial; no native Xyeena approval dialog. | **LIVE BLOCKED** — installation does not enforce IDE security |
| **Hermes** | Previous one-shot Windows host run and budget post-run checks. Hard provider spend and native cancellation unproven. | **LIVE PARTIAL** |
| **Simpul supervisor** | Adapter/transport contracts only; no authenticated, complete live dispatch/cancel lifecycle. | **LIVE BLOCKED** |
| **Codex / Claude Code / Gemini CLI** | Source adapters and fixtures; corresponding standalone binaries unavailable in recorded Windows acceptance environment. | **LIVE BLOCKED / untested on that host** |

**Scope of PASS:** The CLI test used one exact, harmless read-only command and a user-canceled command. It is not proof of OS sandboxing, arbitrary privileged writes, multi-host enforcement, IDE hooks, or universally safe execution. `guided status` deliberately reports `hostEnforcement: UNVERIFIED` because a writable local diagnostic receipt does not independently authenticate a host. The separately witnessed native CLI tool rejection is the acceptance evidence.

The Antigravity CLI may modify `SessionStart` and `PostInvocation` in the managed group. Guided status reports this as `managedIntegrity: MODIFIED`; only the exact, enabled `PreToolUse` event and matching runner are probe-eligible. A guarded `runner-upgrade` updates the owned runner and manifest script hash with backup, preserving host-managed `.agents/hooks.json`, unrelated hooks, and the user's `.gitignore`. No global permissions are silently granted.

## Read-only host command discovery

The source `setup check --runtime antigravity` now checks `agy` as the native CLI executable in addition to any `antigravity` binary. This corrects a false negative seen on machines where only `agy` is on PATH. Results identify command candidates without launching a model and **do not change** the host acceptance matrix above: a discovered binary is not proof that either the CLI session is active or the IDE enforces hooks.

## Simpul submission-only contract

The source Simpul MCP adapter now adheres to the upstream `submit_goal` parameter schema and refuses write-capable or ambiguous delegation. Neither a user-provided permission flag nor a model-generated response can establish write containment. FastMCP SDK JSON result wrappers are decoded with size/type checks. **`executionReady` remains false** on a connectivity probe, and there is no automatic `execute_run` invocation. This is engineering contract correctness, not proof of a live Simpul supervisor or native delegation.

## What remains before a wider release

- Verify real native IDE interception or explicitly document IDE as unsupported for security enforcement; do not infer support from vendor docs or a successful install.
- Complete host-specific authorization, skill activation, worker lifecycle and negative tests for the other declared runtimes, where practical.
- Exercise an authenticated Simpul supervisor from submission through completion/cancellation before advertising live Simpul delegation; native or inline fallback remains available.
- Recheck npm registry, package inventory and provenance for the exact candidate; receive explicit approval before any tag, GitHub Release or npm publication.

For the audit trail see [OPS tracker](xyeena-rig/TASK_TRACKER.md), [acceptance matrix](xyeena-rig/ACCEPTANCE_MATRIX.md), [live evidence](xyeena-rig/EVIDENCE.md), [security policy](../SECURITY.md), and [guided hooks](ANTIGRAVITY-GUIDED.md).

**Change discipline:** this status is dated evidence. Update it only when independent CI or host observations change; historical figures and demonstrations stay in their dated evidence sections.
