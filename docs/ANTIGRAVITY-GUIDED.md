# Antigravity Guided hooks

Guided hooks are an optional workspace integration for task context and permission checks. They depend on Antigravity actually loading and enforcing the hook. [Support status](STATUS.md) records CLI 1.4.7 observations and the IDE 2.5.5 enforcement limitation.

The commands below use newer source functionality. Run them from the intended source checkout; do not assume the published 0.4.1 package contains them.

## Preview, install, and remove

```sh
node bin/xyeena.mjs guided preview --dir .
node bin/xyeena.mjs guided install --dir . --yes
node bin/xyeena.mjs guided status --dir .
```

Review the preview before confirming. The installer modifies only its owned group in `.agents/hooks.json`, stores the local runner under `.xyeena/hooks/`, and backs up existing owned configuration. Do not commit local bindings, backups, or probe state.

To remove Xyeena-owned entries:

```sh
node bin/xyeena.mjs guided uninstall --dir . --yes
```

The installer refuses modified or unowned data rather than adopting it silently. Preserve unrelated hook groups and global host settings.

## Interpret status

| Field | Meaning |
| --- | --- |
| `installed`, `enabled` | Manifest state; not proof the host loaded it |
| `preToolUseRegistered`, `preToolUseEnabled` | Expected hook registration and enabled state |
| `runnerIntegrity` | Local managed-runner hash comparison |
| `probeEligible` | Eligibility for the bounded diagnostic |
| `hostEnforcement: UNVERIFIED` | Local configuration cannot independently authenticate host enforcement |

A callback receipt can be produced by directly invoking the local runner. Observe the actual native tool rejection or approval interaction before recording host acceptance.

## Inspect a callback

```sh
node bin/xyeena.mjs guided probe start --dir . --yes
node bin/xyeena.mjs guided probe status --dir .
node bin/xyeena.mjs guided probe clear --dir . --yes
```

Between starting and inspecting the five-minute probe, use a fresh native host conversation to request a harmless read-only command such as `git status --short`. Do not invoke the runner directly and call that a native test.

`AWAITING_CALLBACK` means no callback was recorded. `CALLBACK_OBSERVED_UNATTESTED` means the local runner was invoked, not that the host honored its decision. Probe data is private, local, and ignored by Git; it must not contain raw prompts, transcripts, paths, commands, or credentials.

## Safe native denial test

After reviewing the managed installation, explicitly arm the single-use diagnostic:

```sh
node bin/xyeena.mjs guided probe deny-start --dir . --yes
```

In a fresh native CLI conversation, request only `run_command` with the exact `CommandLine` value `git status --short`. The diagnostic applies to that harmless command, in the trusted workspace, for five minutes or until consumed. Other commands retain the ordinary policy.

Count the test as passed only when the native host rejects the tool with `Xyeena: native deny diagnostic blocked read-only git status` and no successful command output. A local receipt alone is insufficient. Inspect probe status and clear the probe afterward:

```sh
node bin/xyeena.mjs guided probe status --dir .
node bin/xyeena.mjs guided probe clear --dir . --yes
```

Do not test containment with destructive writes. A denial of this one command does not prove arbitrary shell confinement, IDE hook support, or OS sandboxing.

## Host drift and runner upgrades

A host can modify unrelated lifecycle events. Review `managedIntegrity`, `changedManagedFields`, the exact enabled `PreToolUse` registration, and runner integrity before taking action. Do not delete the manifest or force an install to clear a warning.

```sh
node bin/xyeena.mjs guided runner-preview --dir .
node bin/xyeena.mjs guided runner-upgrade --dir . --yes
node bin/xyeena.mjs guided status --dir .
```

The guarded upgrade requires demonstrably owned state and an ignored backup destination. It changes only the owned runner and its matching metadata; it does not rewrite `.agents/hooks.json`, other groups, global settings, or the root `.gitignore`. Modified unknown runner data must remain a conflict.

On the recorded Windows CLI, hook commands resolve relative to `.agents/`; the managed launcher accounts for this. Do not infer the IDE uses the same launch context. An argument-schema error is also not a hook denial.

## Permission and lifecycle boundaries

`PreToolUse` uses `allow`, `force_ask`, or `deny` under the host's permission system. Out-of-workspace and symlinked writes are denied; commands and ambiguous tools require user consent. Read paths must satisfy the workspace boundary. Shell-internal side effects cannot be sandboxed by this hook.

Other lifecycle events can suggest a resume, provide bounded context to an explicitly bound conversation, track failure fingerprints, and record an incomplete checkpoint. Stopping must remain possible. Use real host conversation identifiers for explicit binding; do not invent them.

Read [runtime adapters](RUNTIME-ADAPTERS.md), [Security](../SECURITY.md), and the [official hook contract](https://www.antigravity.google/docs/hooks) when adapting an integration. Documentation and source fixtures do not establish native enforcement on a new host version.
