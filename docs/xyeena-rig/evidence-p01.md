# Phase P01 Evidence: Unified Skill Discovery

**Phase ID:** P01  
**Scope:** R01, R02 — Unified Agent Skills & Host-native Plugin Discovery, Precedence, Safe Symlinks, Dependency Closure  
**Base Branch:** `main` (commit `4f0fa5e`)  
**Feature Branch:** `feat/rig-enterprise-p01-discovery`  
**Target PR Base:** `main`  
**Date:** 2026-10-23  
**Status:** VERIFIED  

---

## 1. Summary of Changes

1. **Host-Native Plugin Discovery (`src/skill-hosts.mjs`):**
   - Added `PLUGIN_HOSTS` defining workspace and global plugin directories for Antigravity, Gemini, Codex, Claude, and Hermes.
   - Added `pluginLocations()` resolving registered plugin directories per runtime with Hermes trust boundaries.

2. **Enterprise Skill & Plugin Inventory (`src/workspace-skills.mjs`):**
   - Added `readPluginManifest()` supporting `plugin.json`, `gemini-extension.json`, `extension.json`, and `package.json`.
   - Discovers skills inside plugins (`skills/<name>/SKILL.md`) and direct single-skill plugins.
   - Complete state tracking: `installed`, `enabled`, `trusted`, `eligible`, `executable`, `availability` (`detected`, `disabled`, `requires-host-trust`, `incompatible-platform`, `blocked-symlink`, `collision-shadowed`, `missing-dependency`).
   - Rich provenance tracking: `root`, `relative`, `type` (`standalone` vs `plugin`), `pluginName`, `pluginVersion`, `scope`.
   - Precedence-ranked collision resolution:
     - Workspace Standalone > Workspace Plugin > Global Standalone > Global Plugin.
     - Preserves auditable `shadowed` list of superseded skills marked `availability: 'collision-shadowed'`.
     - Rule enforced: an untrusted or blocked project skill never shadows an eligible global skill.
   - Dependency Closure:
     - Parses `dependencies` and `requires` from frontmatter.
     - Verifies closure against detected skills; missing dependencies set `executable: false`, `availability: 'missing-dependency'`.
   - Safe Symlinks and Windows Junctions:
     - Verifies symlinks and junctions fail closed (`availability: 'blocked-symlink'`) unless they are valid Xyeena-managed links to `.xyeena/skill-store/`.

3. **Cache Invalidation (`src/skill-cache.mjs`):**
   - Extended `inventoryFingerprint()` to stamp plugin directories, manifest files, and nested skills, guaranteeing automatic invalidation when plugins are modified.

4. **Hermetic Test Isolation & Robust Windows Executable Resolution:**
   - Isolated `test/workspace-skills.test.mjs` using dedicated temporary home fixtures, eliminating test pollution from developer environment.
   - Made `test/portable-cli-adapter.test.mjs` robust to Windows executable path resolution.

---

## 2. Verification Evidence

### Automated Test Runs
- `npm test`: **232 / 232 PASS** (0 failed, 0 skipped)
  - Unit tests in `test/workspace-skills.test.mjs`: 12/12 PASS (including positive discovery, disabled plugins, precedence, shadowing, dependencies, cache invalidation).
  - Unit tests in `test/portable-cli-adapter.test.mjs`: 12/12 PASS.
  - Unit tests in `test/portable-skill-hosts.test.mjs` and `test/skill-cache.test.mjs`: 18/18 PASS.
- `npm run check`: **PASS** (19 capabilities + runtime manifests verified)
- `npm run eval`: **PASS** (18/18 evaluated scenarios)
- `npm run test:harness`: **PASS** (15/15 harness contracts)
- `npm run test:consumer`: **PASS** (workspace copy + user-global symlink installs from npm tarball)
- `npm pack --dry-run`: **PASS** (238 files, 167.4 kB packed size)

---

## 3. Requirements & Acceptance Matrix Status

- **R01:** VERIFIED (E02-03, E02-05; A11, A18, A21)
- **R02:** VERIFIED (E02-04, E02-06; A22)
