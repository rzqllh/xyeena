# CLI reference

See [current source/host status](STATUS.md) (2026-10-26). CLI 1.4.7 `force_ask`/user-cancel and a narrowly scoped auto-`deny` passed native Windows acceptance; IDE 2.5.5 interception remains blocked. Commands implemented after npm 0.4.1 are source-only.


Commands can be invoked with `npx --yes xyeena-agent@0.4.1` for the published package or `node bin/xyeena.mjs` from a source checkout. Some documented source commands postdate the published package; they are marked **source**.

## Read-only operational prerequisites (source only)

```sh
node bin/xyeena.mjs ops preflight --dir .
```

This performs local executable/PATH and `.agents/hooks.json` metadata inspection only, without invoking any host command, starting a model, printing command lines, changing files or contacting Simpul. It intentionally reports `hostEnforcement: "UNVERIFIED"` and native host acceptance as `NOT_TESTED_BY_PREFLIGHT` even when `agy` is detected and `PreToolUse` is registered. Linked or oversized hook manifests are not read. A human must separately verify native deny and consent; see [status](STATUS.md). This command is not part of published npm 0.4.1.

## Setup and inspection

`setup check --runtime antigravity` now reports `hostDetection.detectedCommands` (including `agy` if discovered), `detectedSurface`, and `confirmedRunning:false`. Command presence never certifies CLI session interception or IDE activation; it is a read-only PATH/skill inventory hint.

| Command | Effect |
| --- | --- |
| `setup` | Interactive installation wizard |
| `setup --scope SCOPE --runtime HOST --preset PRESET --dry-run` | Read-only installation preview |
| `setup ... --yes` | Confirm the proposed installation |
| `setup check --runtime HOST` | Inspect installed host-visible skills; not proof of live activation |
| `setup diff --runtime HOST --preset PRESET --file PATH` | Preview a bounded managed-file conflict |
| `setup backups` | List recorded backup journals |
| `setup rollback --id ID --dry-run` | Inspect a supported restore operation |
| `setup rollback --id ID --yes` | Apply an ownership-checked restore |
| `setup compact --runtime HOST --preset PRESET --dry-run` | **Source:** preview one host-visible Xyeena skill entry |
| `setup compact --runtime HOST --preset PRESET --yes` | **Source:** install that compact entry |

The `--runtime` value accepts supported host names (comma-separated where permitted). The setup preset is `essential`, `balanced`, or `complete`. Global installation writes into user-owned host skill directories. Project Harness remains a separate opt-in.

Legacy selective installation remains supported:

```sh
node bin/xyeena.mjs init --components skills --runtime codex --skills xyeena-interface --yes
node bin/xyeena.mjs init --components harness --guards 00-core,60-security --yes
```

Never assume a `--dry-run` result granted permission for a later write.

## Inventory and routing

| Command | Effect |
| --- | --- |
| `skills matrix` | Per-host filesystem inventory |
| `skills discover --runtime HOST` | Read-only skill discovery |
| `route --runtime HOST --prompt TEXT` | Select eligible skill candidates without a model call |
| `orchestrate preview --runtime HOST --goal TEXT` | **Source:** inspect workflow plan and constraints |
| `orchestrate run --runtime HOST --goal TEXT --yes` | **Source:** new, restricted read-only one-shot agent session |
| `host preview / host run` | Host-specific one-shot preview or consent-gated invocation |
| `sdk preview / sdk run` | Optional Antigravity SDK bridge, separate Python environment required |

Orchestration and host adapters do not inject into a running IDE conversation. Detected skill files do not prove host activation. Execution may incur provider usage.

## Harness and diagnostics

| Command | Effect |
| --- | --- |
| `list` | List packaged capabilities |
| `doctor` | Inspect installation details |
| `harness doctor` | Inspect Harness configuration |
| `audit` | Read-only repository assessment |
| `scan` | Check project invariants, nonzero exit on blockers |
| `risk` / `changed` | Assess Git change scope |
| `adapters` | Inspect project adapter selection |
| `verify` | **Executes** native project checks; may create artifacts |
| `check --source .` | Validate packaged skill/contracts |
| `eval` | Run deterministic evaluator fixtures |
| `guided preview/install/status/uninstall` | Manage optional Antigravity Guided hooks |

`verify` reports INCOMPLETE if no meaningful native check ran; it does not manufacture PASS. Guided hooks are separate from skill and Harness installation.

## Operational safety

- Destructive, external, and privileged actions require authority from the actual host.
- Caller-supplied approval metadata is not valid human consent.
- Runtime tool interception is only effective when a supported host integration is installed and verified.
- Third-party skill/plugin eligibility depends on host trust and runtime state.
- Token, cost, and worker limits are constraints on a usable adapter, not a guarantee that any host supports delegation.

See [Getting started](GETTING-STARTED.md), [Runtime adapters](RUNTIME-ADAPTERS.md), [Operator runbook](xyeena-rig/RUNBOOK.md), and [Security](../SECURITY.md).

## Resource limits and native host hooks (current source)

`host run --runtime hermes --max-turns N --token-limit N --yes` sets Hermes one-shot maximum agent iterations and a settlement-only reported usage ceiling. Defaults are 2 turns and 50,000 reported tokens; overruns and missing usage fail the response, **not** the provider bill. Numeric limits are validated before process launch.

`guided preview` / `guided install --yes` now include a native Antigravity `PreToolUse` hook in the managed hook group. Real host activation must be verified independently. The host decides approval; Xyeena never auto-approves or silently overrides permissions.

## Native source CLI cancellation

For source-only `host run`, `sdk run`, and `orchestrate run` (including `--record`), pressing Ctrl+C sends a cancellation request through a scoped `AbortSignal` to the adapter. SIGTERM is handled the same way. Run-specific listeners are removed afterward; no implicit global background watcher is created. The adapters attempt to stop only their directly spawned child and reject canceled work without reporting completion. This behavior is covered by programmatic tests; native terminal signal delivery and all-descendant cleanup have **not** been accepted on Windows. Review [OPS-06 issue #37](https://github.com/rzqllh/xyeena/issues/37).

## Guided native-hook diagnostics

**Native acceptance update (2026-10-26):** `agy 1.4.7` honored a Xyeena approval prompt/cancellation and independently blocked an exact, read-only command via Xyeena `deny`. The probe's local `hostEnforcement: UNVERIFIED` is intentional; see the [witnessed evidence](STATUS.md) and [scope limits](STATUS.md). Use `guided runner-preview`, `guided runner-upgrade --yes`, and `guided probe deny-start --yes` only from a source checkout; the published 0.4.1 package predates them.


`xyeena guided status --dir .` reports filesystem installation and enablement independently of `hostActivation` and `hostEnforcement`. Both status fields remain unverified without external native proof; even a locally observed callback is not an authenticated IDE host decision.

```sh
xyeena guided probe start --dir . --yes
# Ask a NEW native IDE agent session to run a harmless read-only command.
xyeena guided probe status --dir .
xyeena guided probe clear --dir . --yes
```

`start` writes one local diagnostic state file with a five-minute expiry; the hook runner only records an invocation timestamp, tool name and its own decision. It does not log tool arguments or grant permission. `CALLBACK_OBSERVED_UNATTESTED` cannot establish that Antigravity actually enforced a decision; direct local invocation can create the same record. Verify a real native denial separately. On the tested Windows IDE 2.5.5 session, expected `deny` was not enforced. See [Guided hooks](ANTIGRAVITY-GUIDED.md).

`guided status` also reports `managedIntegrity`, `runnerIntegrity`, `preToolUseExact`, `preToolUseEnabled`, `probeEligible`, and a redacted list of `changedManagedFields` to safely diagnose host modifications. A diagnostic probe can run with unrelated managed event drift **only** when the exact owned `PreToolUse` event is enabled and the runner hash matches. Install/uninstall still refuse modified managed groups. A callback receipt never certifies native host enforcement.

### Safe runner-only update

`xyeena guided runner-preview --dir .` is a read-only preview. `xyeena guided runner-upgrade --dir . --yes` changes only the owned local runner and its manifest script hash, after verifying that the old runner has not been tampered with and the entire enabled PreToolUse event is unchanged. Existing host-modified SessionStart/PostInvocation metadata is preserved in place. The old script is backed up in the existing ignored Antigravity backup directory. Full `guided install` still refuses altered managed group config. A successful update does not prove that a native host enforces hook decisions. See [Guided hooks](ANTIGRAVITY-GUIDED.md).
