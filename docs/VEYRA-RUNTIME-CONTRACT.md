# Veyra runtime integration contract

## What actually executes

- Node engines are local functions, not autonomous agents.
- The project-local veyra-verify CLI runs real commands and records hashes, exit codes, and timestamps in .veyra/receipts.jsonl.
- The completion gate reads the same journal from a new process. It checks the HMAC with a per-workspace key stored under the local user home directory and rejects receipts older than 300 seconds.
- Receipt provenance is LOCAL_PROCESS_VERIFIED, not native agent E2E. Malicious same-user processes can read the key and forge records. This is diagnostic integrity, not an OS security sandbox.

## Using verified command execution

Run:

    node .agents/skills/veyra-verify/engine.mjs run --task tests -- npm test

Check from another terminal:

    node .agents/skills/veyra-verify/engine.mjs gate --task tests

The gate exits nonzero for missing, failed, forged, stale or corrupted receipts. It proves the recorded command succeeded, not an unrelated claim or host skill usage.

## Owner-opt-in tool hooks

Templates are under examples/hooks and are NOT enabled automatically. Confirm hook names and settings on the installed host version. Commands assume the project root as current directory.

Policy: .veyra/scope.json. Start from examples/veyra-scope.example.json.

By default file writes and shell tools are blocked. For an approved code task, the owner may set readOnly to false and allowedPatterns to ["src/**"]. Shell tools remain blocked unless allowShell is set to true explicitly. Enabling allowShell bypasses path-level inspection for arbitrary shell commands and requires separate sandboxing.

Only matched native tools are intercepted. Other tools, external processes, plugins, and host behavior outside the selected matchers are not guaranteed. Argument validation is not filesystem isolation. A process running as the same OS user can edit this policy.

Owner must manually merge an example into the appropriate Gemini, Claude, or Codex settings, review matchers, and activate/trust hooks. Do not overwrite existing host configuration.

Official references:
- https://geminicli.com/docs/hooks/reference/
- https://code.claude.com/docs/en/hooks
- https://learn.chatgpt.com/docs/hooks

## Evidence boundary

A native agent E2E PASS requires an actual host prompt with observed native tool-use and tool-result events, meaningful skill content consumption, and independently checked task results. Reading SKILL.md or running Node unit tests does not qualify.

## Existing project-local installations

The installer refuses to overwrite an existing manifest. Existing Yoru skills are not automatically updated. Use a fresh isolated worktree for the new version; any migration of existing files requires explicit inspection and safe preservation.
