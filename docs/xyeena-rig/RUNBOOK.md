# Enterprise Operator Runbook

**Environment:** Node.js >=22.14.0  
**Scope:** Xyeena Rig enterprise operations, deployment, migration, rollback, and verification.

---

## 1. Automated Verification Suite

Run full suite from repository root:

```bash
# 1. Clean installation of dependencies
npm ci

# 2. Comprehensive test suite (277 unit/integration tests)
npm test

# 3. Capability inventory and runtime manifests check
npm run check

# 4. Scenario intent evaluations (18 scenarios)
npm run eval

# 5. Core Harness contract tests (15 tests)
npm run test:harness

# 6. Packed consumer artifact smoke test
npm run test:consumer

# 7. Package build dry-run inspection
npm pack --dry-run
```

All 7 checks must exit with code 0 before any deployment or merge.

---

## 2. Compact Workspace Installation

Exposes a single host-visible `xyeena-rig/SKILL.md` entry:

```bash
# Dry-run inspection (read-only, no disk changes)
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --dry-run

# Apply compact setup
node bin/xyeena.mjs setup compact --runtime "codex,antigravity" --preset complete --yes
```

---

## 3. Legacy 19-Skill Migration & Compatibility

Migrates existing loose standalone skills to the compact layout while preserving user modifications:

```bash
# Preview legacy migration
node -e "import('./src/compact-setup.mjs').then(m => console.log(m.previewLegacyMigration({ runtime: 'all' })))"

# Apply migration (backs up owned skills to .xyeena/backups/legacy-migration/<id>/)
node -e "import('./src/compact-setup.mjs').then(m => console.log(m.applyLegacyMigration({ runtime: 'all', yes: true })))"
```

### Rollback Legacy Migration
Restores original standalone skills from the timestamped migration journal:

```bash
node -e "import('./src/compact-setup.mjs').then(m => console.log(m.rollbackLegacyMigration({ migrationId: '<migration-id>', yes: true })))"
```

---

## 4. Safe Compact Uninstallation

Safely removes `xyeena-rig` after verifying package ownership, saving a safety backup:

```bash
node -e "import('./src/compact-setup.mjs').then(m => console.log(m.uninstallCompactSetup({ runtime: 'all', yes: true })))"
```

---

## 5. DAG Crash Recovery & Smart Resume

If an orchestration process is interrupted mid-run:

```bash
# Inspect checkpoint and get smart resume suggestion
node -e "import('./src/task-runner.mjs').then(m => {
  const store = new m.DurableCheckpointStore({ runId: '<runId>' });
  const cp = store.loadCheckpoint();
  console.log(m.formatResumeSuggestion(cp));
})"
```

Resume execution by re-running with the saved `runId`. Completed `VERIFIED` tasks will not be re-executed, and completed worker evidence on disk will be reclaimed without re-dispatching.

---

## 6. Enterprise Release & Publication Procedure

1. Verify all 8 stacked PRs (PR #18 through PR #25) are reviewed.
2. Merge PRs sequentially into `main` starting from PR #18.
3. Validate `main` baseline passes all 7 validation scripts.
4. Obtain explicit operator authorization for publication.
5. Create release tag:
   ```bash
   git tag -a v0.5.0 -m "Release v0.5.0: Enterprise Xyeena Rig"
   git push origin v0.5.0
   ```
6. Publish to npm:
   ```bash
   npm publish
   ```
