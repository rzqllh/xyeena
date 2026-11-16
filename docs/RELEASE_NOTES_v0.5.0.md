# Xyeena Rig v0.5.0

Xyeena Rig v0.5.0 introduces the Cortex native orchestration layer, 64 native capability contracts, 11 `/xyeena-*` composite workflows, cross-domain Superpowers and Anti-Slop methodology adaptations, and a transactional skill installer.

## Highlights

- **Agent Skills + Harness:** 19 packaged skills with optional, scoped project integration.
- **Cortex:** Intent routing, contextual capability selection, DAG planning and execution-state reporting. Native execution depends on the host adapter and permissions; host hook enforcement varies.
- **Workflows:** 11 composites for design, planning, execution discipline, debugging, review, testing, verification, security, research, writing, and orchestration.
- **Installer:** Scoped dry-run, file ownership and modification checks, approval fingerprints, selective removal, backups, and rollback.
- **Upstream methodology:** Source-backed adaptations of public skill patterns, not bundled upstream runtimes; see `NOTICE.md` and `docs/future/UPSTREAM_INVENTORY.md`.

## Compatibility and upgrading

- Node.js **22.14.0+**; Windows defaults to copy-based skill installation.
- Installation integrations for Antigravity, Gemini CLI, Codex, Claude Code, and Hermes. Installation/discovery does not prove host-native permission enforcement.
- Upgrade from 0.4.1: back up custom files, preview the exact destination with `--dry-run`, and review the change fingerprint before approving an overwrite. See `docs/CLI-REFERENCE.md` and `docs/GETTING-STARTED.md`.
- After **actual npm publication**, a workspace preview example is:
  `npx --yes xyeena-agent@0.5.0 setup --scope workspace --runtime codex --preset balanced --dry-run`.
  Do not assume that version exists in the npm registry before release confirmation.

## Verification and limitations

Automated CI covered Node.js 22.14 and 24 on Ubuntu, Windows, and macOS, including packaged consumer smoke tests. These checks are not a substitute for live host or database execution evidence.

- Antigravity IDE 2.5.5 hook enforcement remains **LIVE BLOCKED**; hook installation alone does not establish runtime interception.
- Other native host behaviors may require additional live acceptance.
- Post-run token ledger limits do **not** guarantee provider-side spending caps.
- RLS inspections are static unless an independently trusted database execution path establishes tenant identity and execution provenance.
- Upstream methodology adaptation is distinct from direct source reuse.

See `docs/STATUS.md`, `SECURITY.md`, and `NOTICE.md` for precise support and license boundaries.

## Release authorization

Publishing a stable GitHub Release triggers the npm Trusted Publishing workflow. Proceed only after all supported-scope review blockers are resolved, the merged `main` commit exactly matches tag `v0.5.0`, npm trusted publisher/environment configuration has been verified, and the owner explicitly authorizes publication.
