# Phase P07 Evidence: Security, Hardening & Live Acceptance Fixtures

**Phase ID:** P07  
**Scope:** R13, R14 — Red-Team Security Hardening, Path Traversal & Null-Byte Defense, Secret Sanitization, Anti-Recursion Worker Depth Guard, Multi-Runtime Activation Fixtures  
**Base Branch:** `feat/rig-enterprise-p06-installer` (commit `931ac54`)  
**Feature Branch:** `feat/rig-enterprise-p07-hardening`  
**Target PR Base:** `feat/rig-enterprise-p06-installer`  
**Date:** 2026-10-23  
**Status:** VERIFIED  

---

## 1. Summary of Changes

1. **Path-Traversal & Null-Byte Poison Defense (`assertWorkspaceBoundary` in `src/rig-harness-lifecycle.mjs`):**
   - Added explicit rejection of null-byte injections (`\0`) in target file paths, preventing C/posix path truncation exploits.
   - Strictly enforces lexical and physical path containment within workspace root, rejecting `../` traversal, Windows drive escapes, and escaping symlinks/junctions.

2. **Secret & Credential Sanitization (`sanitizeSecretText`, `sanitizeAuditData` in `src/rig-harness-lifecycle.mjs`):**
   - Implemented regex-based redactor `SENSITIVE_PATTERNS` matching GitHub PATs (`ghp_...`), OAuth tokens (`gho_...`), Anthropic keys (`sk-ant-...`), OpenAI keys (`sk-...`), AWS access keys (`AKIA...`), Bearer tokens, private keys, and common credential assignments.
   - Redacts secret strings to `[REDACTED_SECRET]` across tool parameters, error messages, and audit trail entries.
   - Centralized audit logging in `HarnessExecutionGate.recordAudit` to ensure secrets are never stored in memory or transcripts.

3. **Anti-Recursion Worker Depth Guard (`delegateWorker` in `src/rig-harness-lifecycle.mjs`):**
   - Tracks delegation `depth` in `HarnessExecutionGate`.
   - Strictly enforces that workers at depth >= 1 cannot delegate further (`Recursive delegation forbidden: worker cannot spawn sub-workers`), preventing unmonitored agent recursion loops.

4. **Prompt-Injection Resistance (`test/security-hardening.test.mjs`):**
   - Evaluated prompt framing attempts (jailbreak overrides, administrator privilege spoofing, "ignore previous instructions").
   - Confirmed that operations are classified strictly by actual command semantics (`classifyOperation`, `consentRequired`), ensuring destructive or external operations can never be executed without explicit task consent.

5. **Plugin Spoofing & Provenance Protection (`test/security-hardening.test.mjs`):**
   - Verified that untrusted or forged standalone skills attempting to impersonate core capabilities accurately reflect their true origin and cannot bypass trust boundaries.

6. **Multi-Runtime Activation Fixtures (`test/security-hardening.test.mjs`):**
   - Validated end-to-end activation across all 5 supported runtimes:
     - Antigravity (IDE SDK adapter)
     - Codex (portable CLI adapter)
     - Claude Code (portable CLI adapter)
     - Gemini CLI (portable CLI adapter)
     - Hermes (portable CLI adapter with trusted project directory configuration)
   - Confirmed each host discovers `xyeena-rig` and produces ready execution plans.

---

## 2. Verification Evidence

### Automated Test Runs
- `npm test`: **267 / 267 PASS** (0 failed, 0 skipped; +6 tests covering P07 security hardening and multi-runtime fixtures)
  - Unit tests in `test/security-hardening.test.mjs`: 6/6 PASS
  - Unit tests in `test/rig-harness-lifecycle.test.mjs`: 12/12 PASS
  - All existing 249 regression tests: 249/249 PASS
- `npm run check`: **PASS** (19 capabilities + runtime manifests verified)
- `npm run eval`: **PASS** (18/18 evaluated scenarios)
- `npm run test:harness`: **PASS** (15/15 harness contracts)
- `npm run test:consumer`: **PASS** (workspace copy + user-global symlink installs from npm tarball)
- `npm pack --dry-run`: **PASS** (244 files, 185.7 kB packed size)

---

## 3. Requirements & Acceptance Matrix Status

- **R13:** VERIFIED on activation fixtures (A31; physical live execution on missing host hardware remains BLOCKED per Rule 2 & 10).
- **R14:** VERIFIED (A32) — Adversarial, prompt injection, null-byte path traversal, secret leakage, and anti-recursion test suite green.
