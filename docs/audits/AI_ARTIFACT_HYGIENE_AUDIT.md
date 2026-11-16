# P11 — AI Artifact & Repository Hygiene Audit

**Date:** 2026-11-14
**Scope:** Complete inventory of tracked, untracked, and ignored files to eliminate temporary AI artifacts, session transcripts, debug traces, and transient build bloat across the repository.

---

## 1. Artifact Classification & Disposal Inventory

| Path | Category | Tracking Status | Sensitivity | Disposition | Action Taken & Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `xyeena-agent-0.4.1.tgz` | Local build artifact | Ignored (`*.tgz`) | None | `KEEP_LOCAL_IGNORED` | Preserved locally for acceptance test `p07-independent-acceptance.test.mjs`; safely excluded from Git via `*.tgz`. |
| `.agents/skills/xyeena-*` | Host runtime symlinks | Ignored (`.agents/skills/xyeena-*/`) | Low (User home path) | `UNTRACK_KEEP_LOCAL` | Ignored surgically in `.gitignore`. Local symlinks pointing to user home skill-store must never enter Git, while custom skills remain trackable. |
| `.agents/plugins/marketplace.json` | Host plugin manifest | Tracked | Public | `KEEP` | Preserved in Git. Legitimate product plugin manifest. |
| `.agents/rules/xyeena-core.md` | Host agent workspace rule | Untracked | Public | `KEEP_LOCAL` | Preserved on disk for local Antigravity agent execution. |
| `.agents/hooks.json` | Host hook manifest | Untracked | Public | `KEEP_LOCAL` | Preserved on disk for local Antigravity hook diagnostics. |
| `.agents/agents/*` (8 files) | Subagent definitions | Untracked | Public | `KEEP_LOCAL` | Preserved on disk for local workspace subagent execution. |
| `.subagentbridge/production_audit.db` | Local SQLite session DB | Ignored (`.subagentbridge/`) | Low (Internal IDs) | `UNTRACK_KEEP_LOCAL` | Kept ignored in `.gitignore`. Disposable session execution history. |
| `.tmp/` (worktrees & test files) | Disposable test directories | Ignored (`.tmp/`) | None | `UNTRACK_KEEP_LOCAL` | Kept ignored in `.gitignore`. Contains detached worktrees used during test suites. |
| `.xyeena/` (backups, locks, runs) | Runtime workspace state | Ignored (`.xyeena/`) | Low (Local metadata) | `UNTRACK_KEEP_LOCAL` | Kept ignored in `.gitignore`. Contains backup journals and runtime execution locks. |
| `docs/xyeena_rebuild_workspace_*.zip` | Historical blueprint archive | Ignored | None | `HISTORICAL_REFERENCE` | Kept ignored via `.gitignore` pattern. Preserved as local historical reference. |
| `docs/xyeena_rebuild_workspace_*/` | Unpacked historical blueprint | Ignored | None | `HISTORICAL_REFERENCE` | Kept ignored via `.gitignore` pattern. Preserved as local historical reference. |
| `src/core/cortex.mjs` | Core source engine | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild source. Essential product component (DEC-27). |
| `src/core/default-registry.mjs` | Core capability contracts | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild source. Contains all 64 capability handlers (DEC-31). |
| `src/installer/baseline-hashes.mjs` | Baseline package hashes | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild source. Required for tamper detection (DEC-26). |
| `src/runtime/artifact-governance.mjs` | Artifact governance module | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild source. Enforces atomic persistence (DEC-28, DEC-30). |
| `test/artifact-governance.test.mjs` | Unit test suite | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild test suite. |
| `test/cortex-orchestration.test.mjs` | Unit test suite | Untracked (P10) | Public | `KEEP` | Uncommitted P10 rebuild test suite. |
| `test/p10-1-*.test.mjs` (3 files) | Adversarial test suites | Untracked (P10.1) | Public | `KEEP` | Uncommitted P10.1 test suites verifying 64 bindings & installer safety. |

---

## 2. `.gitignore` Hardening: Before vs After

### Before (Pre-P10 / Uncommitted Additions)
```gitignore
# Runtime locks, caches, and backups
.xyeena/backups/
.xyeena/*.lock
.xyeena/rollback.json
.subagentbridge/
.agents
.xyeena
```
*Risk Identified:* The blanket `.agents` rule was overly broad. It completely prevented Git from tracking `.agents/plugins/marketplace.json` and any custom or version-controlled workspace host rules and hooks.

### After (Hardened Surgical Rules)
```gitignore
# Dependencies and build outputs
node_modules/
coverage/
.tmp/
*.tgz
package-*.tgz

# Xyeena local runtime state, locks, backups, and caches
.xyeena/runs/
.xyeena/backups/
.xyeena/skill-store/
.xyeena/guided/
.xyeena/hooks/
.xyeena/*.lock
.xyeena/rollback.json
.xyeena/antigravity-guided.json
.xyeena/install.json
.xyeena/profile.md
.xyeena/config.json
.xyeena/

# Agent host local installation state (preserves plugin manifests and user skills)
.agents/skills/xyeena-*/
.agents/backups/
.agents/*.lock
.agents/*.tmp

# Subagent bridge and local databases
.subagentbridge/

# AI session transcripts, tool traces, and local scratch
*.transcript.jsonl
*.trace.json
transcript*.jsonl
scratch/
artifacts/

# Local/internal development materials
.internal/
.dev/
notes/
research/
private-evals/

# Environment and secrets
.env
.env.*
!.env.example
*.pem
*.key

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# OS and editor files
.DS_Store
Thumbs.db
.vscode/
.idea/

# Harness verification local evidence
.harness/evidence/

# Deployment artifacts
site/.vercel/

# Historical blueprint archives and unpacked workspaces
docs/xyeena_rebuild_workspace_*.zip
docs/xyeena_rebuild_workspace_*/
xyeena_rebuild_workspace_*.zip
```

---

## 3. Package Distribution Hygiene (`npm pack`)

To prevent internal audit documentation and development assessments from leaking into the public distribution tarball, `package.json` and `.npmignore` have been hardened:
- In `package.json`: added explicit exclusion negation `"!docs/audits/**"` in the `files` array.
- In `.npmignore`: added `docs/audits/`.
- **Verification:** Verified via `npm pack --dry-run --json`. The distribution package contains exactly 280 files (279.7 kB compressed, 918.5 kB uncompressed), completely excluding `docs/audits/` and all temporary test artifacts.

---

## 4. Verification of Ignore Behavior

Representative paths verified with `git check-ignore -v`:
1. `.agents/plugins/marketplace.json` -> **NOT IGNORED** (Correctly preserved for version control).
2. `.agents/skills/xyeena-core` -> **IGNORED** (Local symlink protected from entering repository).
3. `.agents/skills/custom-skill` -> **NOT IGNORED** (Custom user workspace skill remains trackable).
4. `.xyeena/runs/run-1.json` -> **IGNORED** (Local runtime state protected).
5. `transcript.jsonl` -> **IGNORED** (AI session transcripts protected).
6. `scratch/test.mjs` -> **IGNORED** (Temporary scratch scripts protected).
7. `docs/xyeena_rebuild_workspace_2026-11-03.zip` -> **IGNORED** (Archive protected).
8. `xyeena-agent-0.4.1.tgz` -> **IGNORED** (Build tarball protected).
