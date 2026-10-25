# CLI reference

Commands can be invoked with `npx --yes xyeena-agent@0.4.1` for the published package or `node bin/xyeena.mjs` from a source checkout. Some documented source commands postdate the published package; they are marked **source**.

## Setup and inspection

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
