# Veyra v1.0 — Host Qualification Matrix (Corrected)

## What was actually run
The qualification/host_e2e_runner.mjs executes direct Node.js engine integrations in an isolated project. It does not invoke a Gemini, Codex or Claude prompt.

| Test layer | Result | Evidence boundary |
| --- | --- | --- |
| Node.js engine integration | 8/8 reported PASS | Tool/function-level, not native agent |
| Gemini CLI native agent | NOT_RUN | Version detection is not a native E2E session |
| Codex CLI native agent | NOT_RUN | No recorded native invocation |
| Claude Code native agent | NOT_RUN | No recorded native invocation |

Proof required for a future PASS: CLI command and version, isolated repository SHA, streaming tool-use and tool-result events, actual skill-read evidence, filesystem diff, execution exit status, cost/usage and an independently checkable assertion.
Raw host_e2e_receipt.json is reclassified as NODE_INTEGRATION_ONLY. It must not be presented as LIVE_HOST_VERIFIED.
