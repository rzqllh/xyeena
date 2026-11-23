# Veyra v1.0 — Real Native Host Qualification Runbook

Status: NOT_RUN until an actual host session and independently checkable tool events exist. Version detection and direct Node imports are not native E2E tests.

## Safety and prerequisites
- Use a temporary copy or detached worktree of the exact veyra-review commit. Never run on Xyeena main or a live user project.
- Use the host's existing authenticated installation only. Do not install a CLI, enable API billing, or grant new credentials without owner approval.
- Use read-only/plan mode for initial discovery. Do not use YOLO, bypass-permissions, force-push, or unrestricted file tools.
- Review cost limits and provider usage before a new model call. A host that is not available is NOT_RUN, not PASS.
- Keep raw event streams local. Redact tokens, local usernames/absolute paths, user content, and session identifiers before uploading receipts.

## Real sessions (invoke only with owner-approved credits and installed host)
From the isolated checkout root, adapt each command to the local host version:

Gemini CLI:
  gemini -p "Read skills/veyra-plan/SKILL.md and skills/veyra-security/SKILL.md with your file tools. Report their actual operational instructions and show which tool calls were used. Do not modify files." --approval-mode plan --output-format stream-json

Codex CLI:
  codex exec --ephemeral --sandbox read-only --json "Read skills/veyra-plan/SKILL.md and skills/veyra-security/SKILL.md through tools. Report the actual instructions and tool actions. Do not modify files."

Claude Code:
  claude -p "Read skills/veyra-plan/SKILL.md and skills/veyra-security/SKILL.md using read-only tools and report tool evidence. Do not modify files." --permission-mode plan --output-format stream-json

Use the host's current official CLI help if a flag differs from its installed version. Do not infer success from a textual claim that a file was read.

## Evidence acceptance
1. Capture executable path, CLI version, chosen model, command and arguments (without secrets), working directory identity (redacted), exact Veyra commit and UTC timestamp.
2. Parse the event stream: demand actual tool invocation and tool result for file inspection; demand evidence of selected skill file content and an explicit skill/intent routing trace. Gemini stream-json uses tool_use/tool_result events; Codex --json reports item.* events. Claude event formats vary by CLI version.
3. Check the response against actual source lines, not just statements such as "19 skills discovered."
4. For write/rollback tests use an isolated scratch project with fixture hashes, compare before/after, and record the tool-executed commands and exit codes. Do not expand permissions automatically.
5. Run at least 5 pre-registered tasks at equivalent host/model/tool/budget settings for A/B/C: no Veyra, actual pinned reference workflow, and Veyra. Keep failures, tool usage, costs and all three outputs. No made-up baseline.
6. Any absent event stream, mismatched SHA, unauthorized write, unsupported host, unapproved expense, or incomplete run is FAILED, NOT_RUN or BLOCKED, never LIVE_HOST_PASS.

Official CLI references:
- Gemini: https://geminicli.com/docs/cli/headless/
- Codex: https://learn.chatgpt.com/docs/non-interactive-mode
- Claude: https://code.claude.com/docs/en/cli-reference

## Current result
- Gemini CLI: Executable `gemini.cmd` (v0.2.2) present. Headless execution tested with existing OAuth credentials (`google_accounts.json` / `oauth_creds.json`); failed with `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals. To continue using Gemini, please migrate to the Antigravity suite of products: https://antigravity.google (reasonCode: 'UNSUPPORTED_CLIENT')`. Standalone individual OAuth headless execution is deprecated by Google upstream. Status: BLOCKED_UPSTREAM_CLIENT_DEPRECATED (requires Vertex AI or paid Gemini API key for headless agent runs).
- Codex CLI: Checked via `where.exe codex`: Not found in PATH. Status: NOT_RUN_HOST_UNAVAILABLE.
- Claude Code: Checked via `where.exe claude`: Not found in PATH. Status: NOT_RUN_HOST_UNAVAILABLE.
