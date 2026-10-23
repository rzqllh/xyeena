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
- **PostToolUse:** tracks keyed failure fingerprints to suggest diagnosis without retaining raw command arguments.
- **Stop:** records an INCOMPLETE checkpoint. Stopping is never blocked and completion is not inferred.

Binding and unbinding are explicit: `guided bind --id RUN_ID --conversation UUID --yes` and `guided unbind --conversation UUID --yes`. The host must provide the actual conversation identifier.

## Limits and verification

Guided hooks do not automatically approve tools, install an AI provider, or guarantee interception of every command. Verify native registration in Antigravity IDE's hook settings and perform a live invocation before declaring the integration active. Hook setup and unit tests are not substitutes for host activation evidence.

See [Runtime adapters](RUNTIME-ADAPTERS.md) and [Security](../SECURITY.md).
