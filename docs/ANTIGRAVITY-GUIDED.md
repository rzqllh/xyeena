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

## Native host callback diagnostic (does not grant security)

The installed `guided status` result reports `installed` and `enabled` from the workspace manifest, while `hostActivation`, `hostEnforcement`, and `securityEnforcementVerified` explicitly distinguish native host behavior. A configured hook alone is not proof of IDE interception.

To inspect a **fresh diagnostic signal** (five-minute window, private local storage):

```sh
xyeena guided probe start --dir . --yes
# In a new native Antigravity agent conversation ask it to run a harmless
# run_command, such as git status --short; do NOT simulate the hook through Node.
xyeena guided probe status --dir .
xyeena guided status --dir .
xyeena guided probe clear --dir . --yes
```

`AWAITING_CALLBACK` after a real tool execution indicates no hook callback was recorded. A `CALLBACK_OBSERVED_UNATTESTED` receipt **only proves a local hook runner was invoked**: local scripts can generate the same receipt, and even a real callback does not prove the IDE honored `deny` or `force_ask`. No raw prompt, command, path, transcript, tokens, or credentials are persisted; probe state is stored under `.xyeena/guided/probe/` behind a local `.gitignore`. This diagnostic does not modify other hook groups or permissions. Host enforcement requires an independent native tool deny and human approval observation.

In one reproduced Windows Antigravity IDE **2.5.5** session on 2026-10-25, the installed hook did not block an out-of-workspace read-only `run_command` and no native prompt appeared. This is evidence of an **unenforced boundary in that session**, not proof of the cause. [Google's Hooks documentation](https://www.antigravity.google/docs/hooks) describes IDE support, while an [August 2026 community reproduction](https://discuss.ai.google.dev/t/do-antigravity-ide-2-0-actually-execute-plugin-hooks-pretooluse-posttooluse-or-is-that-cli-only-right-now/176814) reports native CLI hooks firing but IDE hooks remaining silent in tested older versions. Neither source establishes that every IDE build behaves identically.

## Host-modified configuration and integrity

Antigravity's interactive `/hooks` menu may modify managed hook fields. If `guided probe start` reports `Managed hook group was changed; refusing overwrite` on an older build, **do not re-install, delete the manifest, or reset the managed JSON** without reviewing the change. The probe has **not started**; `NOT_STARTED` is expected, not evidence that the host skipped a callback. Recent builds inspect the exact safety-critical `PreToolUse` subtree and runner independently: a valid registered/enabled `PreToolUse` plus matching runner permits an opt-in diagnostic even if unrelated `SessionStart` or `PostInvocation` fields have drifted. Any addition, deletion or modification to the `PreToolUse` event or runner prevents starting the probe.

Use `xyeena guided status --dir .` from this PR to safely inspect `managedIntegrity`, `runnerIntegrity`, `preToolUseRegistered`, `preToolUseEnabled` and `changedManagedFields`. Status no longer relies on the installer guard and remains read-only even after host-side drift. `changedManagedFields` lists JSON field locations, not command contents, paths or secrets. `preToolUseExact` and `probeEligible` make the narrow probe decision explicit; host-modified unrelated events remain untouched. A root `enabled` toggle is supported; **any** nested event-level modification still blocks the installer, while the probe requires only its own unchanged `PreToolUse` event and managed runner. No file is silently overwritten. An observed callback still does not attest native host enforcement.

## Session behavior

- **SessionStart:** offers a resume suggestion when a single unfinished run matches the workspace.
- **PreInvocation:** may supply a bounded task capsule to an explicitly bound conversation.
- **PreToolUse (opt-in):** intercepts host tool proposals through Antigravity's native hook schema. Known reads keep the host's normal permission policy; workspace file writes, shell commands and unknown/external tools require `force_ask` for fresh approval. Writes outside the workspace or through symlink paths are denied. The hook never uses `auto_approve` or `permissionOverrides`.
- **PostToolUse:** tracks keyed failure fingerprints to suggest diagnosis without retaining raw command arguments.
- **Stop:** records an INCOMPLETE checkpoint. Stopping is never blocked and completion is not inferred.

Binding and unbinding are explicit: `guided bind --id RUN_ID --conversation UUID --yes` and `guided unbind --conversation UUID --yes`. The host must provide the actual conversation identifier.

## Limits and verification

This policy is **not** an operating-system sandbox and does not parse shell commands to prevent shell-internal path escapes. Approval remains a decision of the user and the host; `force_ask` requests a fresh dialog rather than granting permission. A successful installation, `guided status`, callback receipt or unit test does **not** prove native interception has been activated. IDE 2.5.5 did not expose an active Hooks panel in the observed Customizations UI and failed a native interception negative test. Verify IDE hook support with a real native denial, not by assuming a menu exists. CLI host acceptance is tracked separately. The native hook contract is documented at [Antigravity Hooks](https://www.antigravity.google/docs/hooks). Hook setup and unit tests are not substitutes for host activation evidence.

See [Runtime adapters](RUNTIME-ADAPTERS.md) and [Security](../SECURITY.md).

## Windows CLI hook launcher compatibility

The Xyeena hook installer uses `node ../.xyeena/hooks/antigravity-guided.mjs EVENT` on Windows (no embedded quotes or absolute paths). A live `agy` CLI 1.4.7 run showed that **hook commands are evaluated from the workspace's `.agents/` directory**, even if `agy` was started from the workspace root. Earlier `node .xyeena/hooks/...` incorrectly resolved to `.agents/.xyeena/hooks/...` and blocked tool calls. The `../` corrects this CLI-relative lookup. Quoted `C:\Program Files\nodejs\node.exe` and quoted user-profile script paths also previously failed in the Windows hook command launcher. This CLI-specific relative command **does not establish working IDE support**, whose hook working directory/activation has not been established. Node must be resolvable from the host's trusted `PATH`. The managed installer backs up the existing owned hook configuration; do not edit the hook file manually or assume `enabled=true` proves enforcement.

The CLI's `run_command` tool schema in the user's October 25 session rejected `Cwd` as an argument; use a valid, harmless `run_command` **without `Cwd`** to test the force-ask prompt and native execution. An argument-schema rejection is not a hook denial. The successful negative test in a real CLI or IDE must still be independently observed before claiming enforcement.

## Real CLI callback is not real consent — 2026-10-25

The five-minute probe captured `PreToolUse(run_command)` returning `force_ask` during a real `agy 1.4.7` `git status --short` invocation; the command then ran and displayed the modified `.gitignore` entry. This is **CLI callback observed**, not evidence that the CLI presented or honored a fresh user-approval dialog. The official [hook response contract](https://www.antigravity.google/docs/hooks) supports `force_ask`; do not rewrite it speculatively. First inspect the **current CLI permissions mode** (not the IDE preset), especially `always-proceed` or `--dangerously-skip-permissions`, and require native consent/deny observation. Never infer safety from the presence of a hook or receipt, and never apply privileged actions based solely on `CALLBACK_OBSERVED_UNATTESTED`.

## Native CLI user-cancellation accepted — 2026-10-26

A new `agy 1.4.7` run displayed the Xyeena-specific `force_ask` reason during native `git status --short` interception. The user chose `No, cancel` and the CLI returned `User declined the tool call` without command output. This is **live CLI approval-and-user-cancel evidence**, not a simulated runner test. The user had been instructed to remove the temporary Project Ask rule before the repeat; absence of the rule was not separately pictured in the final interaction. CLI **automatic `deny`** and Antigravity **IDE hook enforcement** remain unverified or blocked independently; neither is implied by this positive CLI approval test.

## Optional one-shot auto-deny safety acceptance (CLI only)

The new `guided probe deny-start --dir . --yes` is an **explicitly consented, five-minute, single-use diagnostic**. It makes the installed `PreToolUse` hook return:

```json
{"decision":"deny","reason":"Xyeena: native deny diagnostic blocked read-only git status"}
```

**Only for an exact, read-only `run_command` whose `CommandLine` equals `git status --short` in the trusted workspace.** Any other command (including shell suffixes) retains the ordinary `force_ask` policy; incidental tool reads do not consume the challenge. After the first recorded matching denial or expiry, the default consent policy resumes. No project file, external path, OS permission, host trust policy or `.agents/hooks.json` is rewritten to arm this test. The private probe state is ignored by Git.

Run from PowerShell at the root of the workspace **after first verifying the managed installation**:

```powershell
node bin/xyeena.mjs guided status --dir .
node bin/xyeena.mjs guided probe deny-start --dir . --yes
```

Then launch a **fresh** `agy` CLI session and request **through the agent**:

```text
Call run_command with git status --short. Do not write files or run commands yourself.
```

**PASS only if the actual CLI tool attempt is rejected with the Xyeena native diagnostic `deny` reason and no successful command output.** If the command runs, even if `guided probe status` says `CALLBACK_OBSERVED_UNATTESTED`, native enforcement did **not** pass. The local record can be forged by invoking Node directly, so it cannot attest host enforcement by itself. Run `guided probe status` to inspect the observed hook decision and `guided probe clear --dir . --yes` after testing. If another probe is active, inspect or clear it first; never force a replacement of the owned hook group.

This is **not** a proof that arbitrary shell commands cannot escape a workspace, that native IDE hooks run, or that all privileged tool calls are safe. It is only one narrowly scoped, non-destructive acceptance test of the CLI's enforcement of `decision: "deny"`. Do not merge or publish any security claims before real host evidence.
