# Antigravity Intelligent Guided

This integration enhances Antigravity's native agent lifecycle. It does not run another model, replace the editor, or grant blanket tool permission. The portable Rig skills and Harness remain independently installable.

## First-run setup

From an Antigravity project, after selecting Rig's skills or Harness:

```sh
xyeena antigravity hooks preview
xyeena antigravity hooks install --yes --approve-hooks
xyeena antigravity hooks status
```

The first command is read-only. Installation updates only the `.agents/hooks.json` group named `xyeena-rig-guided`, makes a timestamped backup if the file already exists, and installs a self-contained Node hook launcher at `.xyeena/rig/antigravity-hook.mjs`. Other hook groups are retained.

For **explicit global** installation, pass `--scope global` to each command. This writes `~/.gemini/config/hooks.json` and a user-local launcher. Neither the package installer nor ordinary Rig initialization enables global hooks.

Open Antigravity IDE's Customizations → Hooks to confirm the handler is loaded and enabled. A valid configuration file is not proof that a particular IDE build invoked it.

To disconnect:

```sh
xyeena antigravity hooks remove --yes --approve-hooks
```

Uninstall removes only an unmodified Rig-owned group. It does not restore the whole backup over a potentially newer configuration. If the installed group was edited independently, removal refuses to overwrite it.

## Resume

At `SessionStart`, the launcher examines a bounded number of local `.xyeena/runs/*/snapshot.json` records. If it finds incomplete tasks associated with the active workspace, it provides a **suggestion**, not a resume command or authorization to continue.

When the user explicitly chooses a task, bind its existing run to the current Antigravity conversation:

```sh
xyeena antigravity resume --run run-... --conversation CONVERSATION_ID
```

The next `PreInvocation` reads the run's current snapshot and injects one bounded context capsule. A task is not selected merely because the IDE opened the same folder.

At `Stop`, a bound task receives a checkpoint with the Git HEAD and a best-effort worktree fingerprint. Untracked file **contents** are not fingerprinted, and this checkpoint is not a substitute for fresh test evidence.

## Loop guidance

The launcher stores only hashes of tool inputs and a count of consecutive failures. Repeated failures of the same tool invocation trigger one short `PreInvocation` reminder. There is no automatic retry, `auto_approve`, `force_continue`, or forced task resumption.

Hook failure is non-blocking. PreToolUse returns `allow`, which delegates to the IDE's existing permission policy; it is not `auto_approve`.

## Limits and validation

This PR implements a first native lifecycle integration, not an enforced filesystem sandbox. Other tools or processes can still write outside declared scopes. The hook launcher does not read transcripts or retain command contents.

The source and fixture tests cover preview, consent, ownership, idempotence, explicit resume, fallback decisions, and bounded anti-loop guidance. **Manual Antigravity IDE verification and comparative behavioral evaluations remain required** before claiming release-quality native integration.

Source contracts:
- [Antigravity hooks](https://antigravity.google/docs/hooks)
- [Antigravity rules](https://antigravity.google/docs/rules)
