# Antigravity Guided hooks

Workspace-level installation is optional and requires a separate confirmation.
Guided installs SessionStart, PreInvocation, PostToolUse and Stop hooks.
Rig does not create a daemon, contact an AI model or bypass Antigravity permissions.

## Test a draft PR from any project

The preview requires no local checkout of the Xyeena Rig repository.
Run these commands in a PowerShell terminal opened at the project to test.
Use the GitHub source tarball for the PR commit. This is **not** the
published npm release. Direct npm GitHub specs may fail on some npm versions
with `GitFetcher requires an Arborist constructor`; the HTTPS tarball path
was smoke-tested on Windows.

```powershell
$sha = "e77ad4ab73d7c6077438ce83b3dfe01039793296"
$rig = "https://codeload.github.com/rzqllh/xyeena/tar.gz/$sha"
npx --yes --package $rig xyeena guided preview --dir .
```

Inspect the proposed `.agents/hooks.json` change before proceeding.
Installation requires a second, explicit command:

```powershell
npx --yes --package $rig xyeena guided install --dir . --yes
npx --yes --package $rig xyeena guided status --dir .
```

After reopening the workspace in Antigravity IDE, check **Customizations >
Hooks** and verify the hook group is recognized. To undo the hook install:

```powershell
npx --yes --package $rig xyeena guided uninstall --dir . --yes
```

These commands install and remove **Guided hooks only**. They do not
replace previously installed Skills or Harness configurations. Skill
upgrades remain a separate selective `xyeena init` operation with
existing-file protection; do not use `--force` on a workspace without
reviewing its modified files.

The SHA above is a verified development snapshot. Review
`git status --short` before and after the test. For newer commits, update
the SHA only after the matching GitHub Actions smoke test passes.
Do not use this unmerged package as a production release.

## Commands

    xyeena guided preview
    xyeena guided install --yes
    xyeena guided status
    xyeena guided list
    xyeena guided resume --id RUN_ID
    xyeena guided bind --id RUN_ID --conversation UUID --yes
    xyeena guided unbind --conversation UUID --yes
    xyeena guided uninstall --yes

Preview shows the managed hook group, file paths and preserved group names.
It does not print the contents of third-party hooks or change files.
Install saves an existing hooks.json to .xyeena/backups/antigravity,
then adds only the xyeena-rig-guided entry to .agents/hooks.json.
The backup directory has a local .gitignore; backup copies may contain
third-party command arguments and must not be committed.
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

Binding requires explicit approval and an actual Antigravity conversation UUID.
Session bindings include a local fingerprint key. The binder creates a nested
.xyeena/guided/.gitignore to exclude the session state, without modifying the
project's root ignore rules. An incompatible existing nested ignore file blocks
binding rather than being overwritten. Unbind removes the mapping on request. PreInvocation sends a bounded task capsule once to that conversation. PostToolUse runs for selected command and file-edit tools and keeps keyed hashes of consecutive failures rather than full command inputs or errors, and offers one diagnosis nudge after repeated identical failures.

Stop writes an INCOMPLETE checkpoint with the Git revision and a digest of current worktree status for bound tasks. It neither restores files nor declares completion. Stop always allows Antigravity to stop; Rig does not auto-approve tools.

## Acceptance and current limits

Run project tests and inspect Antigravity > Customizations > Hooks.
Native IDE activation and portability must be verified manually. Tests of
these functions alone do not prove that Antigravity invokes them.
Automatic task selection, strict tool enforcement, timer-based checkpoint scheduling and behavioral efficiency claims remain out of scope. Verify the native hook invocation from Antigravity IDE; fixture tests alone are insufficient.

Upstream contracts: https://www.antigravity.google/docs/hooks
Rules: https://www.antigravity.google/docs/rules-workflows?tab=ide
