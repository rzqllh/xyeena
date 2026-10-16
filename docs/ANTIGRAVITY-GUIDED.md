# Antigravity Guided hooks

Workspace-level installation is optional and requires a separate confirmation.
Guided installs SessionStart, PreInvocation, PostToolUse and Stop hooks.
Rig does not create a daemon, contact an AI model or bypass Antigravity permissions.

## Commands

    xyeena guided preview
    xyeena guided install --yes
    xyeena guided status
    xyeena guided list
    xyeena guided resume --id RUN_ID
    xyeena guided bind --id RUN_ID --conversation UUID --yes
    xyeena guided uninstall --yes

Preview shows the managed hook group, file paths and preserved group names.
It does not print the contents of third-party hooks or change files.
Install saves an existing hooks.json to .xyeena/backups/antigravity,
then adds only the xyeena-rig-guided entry to .agents/hooks.json.
A dependency-free runner is copied into .xyeena/hooks, so hooks do not
call npx or download code for each event. Reinstall if the Node path changes.

Uninstall removes only the owned hook group and unmodified copied runner.
Conflicting groups, malformed JSON, modified owned entries or symlink
destinations cause an error rather than an overwrite.

## Smart Resume Suggestion

SessionStart reads bounded local Xyeena run snapshots. If exactly one
unfinished run matches the current workspace, it suggests asking the user
whether to resume. It does not load the task into a new conversation, execute
tools, or access transcript files. The resume command prints a small capsule
for manual review. Other workspaces and ambiguous matches are ignored.

Binding requires explicit approval and an actual Antigravity conversation UUID. PreInvocation sends a bounded task capsule once to that conversation. PostToolUse keeps keyed hashes of consecutive failures rather than full command inputs or errors, and offers one diagnosis nudge after repeated identical failures.

Stop writes an INCOMPLETE checkpoint with the Git revision and a digest of current worktree status for bound tasks. It neither restores files nor declares completion. Stop always allows Antigravity to stop; Rig does not auto-approve tools.

## Acceptance and current limits

Run project tests and inspect Antigravity > Customizations > Hooks.
Native IDE activation and portability must be verified manually. Tests of
these functions alone do not prove that Antigravity invokes them.
Automatic task selection, strict tool enforcement, timer-based checkpoint scheduling and behavioral efficiency claims remain out of scope. Verify the native hook invocation from Antigravity IDE; fixture tests alone are insufficient.

Upstream contracts: https://www.antigravity.google/docs/hooks
Rules: https://www.antigravity.google/docs/rules-workflows?tab=ide
