# Antigravity Guided hooks

Workspace-level installation is optional and requires a separate confirmation.
Only the documented SessionStart and Stop events are installed in this first slice.
Rig does not create a daemon, contact an AI model or bypass Antigravity permissions.

## Commands

    xyeena guided preview
    xyeena guided install --yes
    xyeena guided status
    xyeena guided list
    xyeena guided resume --id RUN_ID
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

Stop returns a non-continuation decision. No auto-continue or auto-approval.

## Acceptance and current limits

Run project tests and inspect Antigravity > Customizations > Hooks.
Native IDE activation and portability must be verified manually. Tests of
these functions alone do not prove that Antigravity invokes them.
Context re-injection, scope enforcement, automatic checkpoint scheduling,
and behavioral efficiency claims are not implemented in this slice.

Upstream contracts: https://www.antigravity.google/docs/hooks
Rules: https://www.antigravity.google/docs/rules-workflows?tab=ide
