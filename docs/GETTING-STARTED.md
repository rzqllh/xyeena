# Getting started

The [dated source and host acceptance status](STATUS.md) distinguishes published npm 0.4.1 from newer source-only features and separates native Antigravity CLI hook evidence from unverified IDE integration.


Xyeena Rig packages Agent Skills and optional project Harness tools for five supported agent hosts. You need Node.js **22.14 or newer** and an installed agent host. No Git clone is required to use the published npm package.

Run `node bin/xyeena.mjs setup check --runtime antigravity` from updated source to inspect the `agy` CLI command candidate and configured skills. The check does **not** launch the agent or test host permissions. For live evidence, use the [separately recorded acceptance](STATUS.md).

## Install with the wizard

```sh
npx --yes xyeena-agent@0.4.1 setup
```

Choose a **global** installation (user-owned directories used across projects) or **workspace** installation, then select the actual host(s) and a skill preset. Review destinations and confirm the write. Setup does not log into any AI account, bypass host trust, start a model session or make Harness global.

After installation, restart or reload the agent host and inspect its native skill list. A successful file installation does not guarantee an active skill.

## Non-interactive setup

```sh
# Inspect changes before writing.
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime "codex,antigravity" --preset balanced --dry-run

# Confirm explicitly.
npx --yes xyeena-agent@0.4.1 setup --scope workspace --runtime "codex,antigravity" --preset balanced --yes

# Global user-owned copy installation.
npx --yes xyeena-agent@0.4.1 setup --scope global --runtime codex --preset essential --yes
```

Use `--mode symlink` only after reviewing persistent skill-store and platform behavior. Global installation does not install project Harness guides. See [Global installation](GLOBAL-INSTALL.md).

## Compact mode (source checkout)

The source tree provides an opt-in compact layout that exposes only `xyeena-rig/SKILL.md` to the host and stores selected modules as references:

```sh
node bin/xyeena.mjs setup compact --runtime codex --preset complete --dry-run
node bin/xyeena.mjs setup compact --runtime codex --preset complete --yes
```

This is **unreleased source functionality** relative to npm `0.4.1`. It preserves other installed skills and does not silently migrate a legacy flat layout. Follow the [operator runbook](xyeena-rig/RUNBOOK.md) for ownership-aware migration, backups and rollback.

## Inspect a setup

```sh
npx --yes xyeena-agent@0.4.1 skills matrix
npx --yes xyeena-agent@0.4.1 setup check --runtime codex
```

Checks report detected files and eligibility clues; inspect the native host UI for real activation. If an existing file differs, preview the conflict before using `--update`. Never delete a whole skill root: it may contain third-party data.

## Use the toolkit

```sh
npx --yes xyeena-agent@0.4.1 list
npx --yes xyeena-agent@0.4.1 audit
npx --yes xyeena-agent@0.4.1 risk
npx --yes xyeena-agent@0.4.1 verify
```

`verify` executes project-defined commands. To inspect routing without a model call from a source checkout:

```sh
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Review a failing test"
```

One-shot agent execution is separately consent-gated and read-only. It does not take over the current IDE conversation. See [CLI reference](CLI-REFERENCE.md), [Orchestration](ORCHESTRATION.md), and [Runtime adapters](RUNTIME-ADAPTERS.md).

## Uninstall and troubleshooting

Run the managed rollback or uninstall workflow appropriate to the installation method; do not remove manually modified or third-party skills. For unsupported live host hooks, advanced features remain unavailable rather than silently receiving elevated permissions. The [security policy](../SECURITY.md) describes the trust boundary.

Windows users can follow [Panduan instalasi Windows](INSTALL-WINDOWS-PEMULA.md).
