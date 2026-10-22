# Evidence ledger

Date: 2026-10-23.
Repository main baseline: 91b2506a209bc645dc2b66603ab3b43dfb084e48.
Branch: feat/rig-enterprise-orchestration.

## Audited source baseline

- Package version `0.4.1`, 19 bundled native skills.
- Host-specific bounded filesystem discovery in `src/workspace-skills.mjs`, lexical routing, not an inventory of every native plugin.
- `orchestrate run` requires provider consent and creates a new read-only one-shot call, not active IDE dispatch.
- Project Harness and Guided Hooks are separate opt-in installations, not universal tool enforcement.
- `AgentBroker` has a no-adapter placeholder state that must not be treated as an executed worker.

## Changed source

- `src/compact-setup.mjs`: compact installation, ownership marker, safe managed update and backup.
- `src/enterprise-policy.mjs`: candidate providers, Harness policy description, verified-only backend selection.
- `src/cli.mjs` and `src/orchestrator.mjs`: compact setup, native fallback, and read-only Harness preflight.
- `src/live-backend.mjs`: actual-adapter-only conditional dispatcher (requires caller-supplied live Simpul/native adapters, not an installed connector).
- `test/compact-setup.test.mjs` and `test/enterprise-policy.test.mjs`.

## Validation record

Tests and CI results must be attached here after the PR is opened. No live plugin activation, IDE worker dispatch or Simpul integration has been verified as part of this code. Distinguish green unit tests from the remaining enterprise release gates.

## CI regression addressed

The first PR CI run had 213 passing unit tests and one macOS failure caused by the platform's canonical `/private/var` temporary path alias. The assertion was corrected to compare against `fs.realpathSync(home)`. A new commit also adds a Rig read-only Harness preflight and multi-target compact-install compensation. Subsequent CI results must be recorded separately; the original run was not fully green.

## Packed-install regression coverage

CI now includes a Windows npx GitHub tarball smoke for compact preview (no writes), confirmed compact installation, and compact governor detection by `setup check`. This is filesystem/CLI acceptance, not proof of live IDE skill activation.
