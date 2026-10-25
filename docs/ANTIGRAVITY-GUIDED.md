# Antigravity Guided hooks

Guided hooks are an optional, workspace-scoped integration. They help carry bounded task context across supported session lifecycle events without taking over the host's approval system.

## Inspect and install

From a source checkout or a package version that includes the Guided commands:

```sh
xyeena guided preview --dir .
xyeena guided install --dir . --yes
xyeena guided status --dir .
```

Review `.agents/hooks.json` before installation. An existing configuration is backed up under `.xyeena/backups/antigravity/`; only the Xyeena-owned group is modified. The local hook runner lives in `.xyeena/hooks/`, with no per-event npm download. Do not commit backup data or binding state.

Uninstall only Xyeena-owned entries:

```sh
xyeena guided uninstall --dir . --yes
```

## Session behavior

- **SessionStart:** offers a resume suggestion when a single unfinished run matches the workspace.
- **PreInvocation:** may supply a bounded task capsule to an explicitly bound conversation.
- **PreToolUse (opt-in):** intercepts host tool proposals through Antigravity's native hook schema. Known reads keep the host's normal permission policy; workspace file writes, shell commands and unknown/external tools require `force_ask` for fresh approval. Writes outside the workspace or through symlink paths are denied. The hook never uses `auto_approve` or `permissionOverrides`.
- **PostToolUse:** tracks keyed failure fingerprints to suggest diagnosis without retaining raw command arguments.
- **Stop:** records an INCOMPLETE checkpoint. Stopping is never blocked and completion is not inferred.

Binding and unbinding are explicit: `guided bind --id RUN_ID --conversation UUID --yes` and `guided unbind --conversation UUID --yes`. The host must provide the actual conversation identifier.

## Limits and verification

This policy is **not** an operating-system sandbox and does not parse shell commands to prevent shell-internal path escapes. Approval remains a decision of the user and the host; `force_ask` requests a fresh dialog rather than granting permission. A successful installation or unit test does **not** prove native interception has been activated. Verify the hook in Antigravity IDE > Customizations > Hooks and observe a real read, denied write and freshly prompted shell command before marking OPS-07 LIVE_ACCEPTED. The native hook contract is documented at [Antigravity Hooks](https://www.antigravity.google/docs/hooks). Hook setup and unit tests are not substitutes for host activation evidence.

See [Runtime adapters](RUNTIME-ADAPTERS.md) and [Security](../SECURITY.md).
