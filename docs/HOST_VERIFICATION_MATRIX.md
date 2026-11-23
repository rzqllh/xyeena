# Veyra v1.0 — Host & Platform Verification Matrix

> **Authority:** DEC-17 (Verified Native Support), DEC-29 (Platform-Aware Bundles), DEC-34 (Tiered & Full Matrix Verification), DEC-35 (Capability-Equivalent Native).
> **Epistemic Discipline:** Claims of PASS are restricted strictly to empirically executed environments. Unexecuted environments are marked truthfully.

---

## 1. Operating System Matrix

| Operating System | Node Version | Execution Status | Empirical Evidence / Verification Method |
| :--- | :--- | :--- | :--- |
| **Windows 11 (x64)** | Node.js v24.22.1 | **`LIVE_HOST_PASS`** | 20 test suites, 56 tests passing locally (duration ~440ms). Preflight PASS. Clean extraction PASS. |
| **Ubuntu Linux (x64)** | Node.js v20, v22, v24 | **`CONFIGURED_IN_CI`** | Configured in `.github/workflows/ci-matrix.yml`. Locally `UNVERIFIED` (Linux OS not locally available). |
| **macOS (Darwin arm64)** | Node.js v20, v22, v24 | **`CONFIGURED_IN_CI`** | Configured in `.github/workflows/ci-matrix.yml`. Locally `UNVERIFIED` (Darwin OS not locally available). |

---

## 2. Multi-Host AI Agent Discovery & Execution Matrix

| Agent Host / Harness | Integration Mechanism | Status | Factual Evidence / Current State |
| :--- | :--- | :--- | :--- |
| **Google Gemini CLI / Antigravity IDE** | Native discovery via `skills/` & `.agents/skills/` | **`LIVE_HOST_PASS`** | 19/19 skills discovered, intent alias resolution verified (`veyra-ui` -> `veyra-interface`), tool calling intact. |
| **OpenAI Codex CLI** | Portable review package & CLI hooks | **`NOT_AVAILABLE_LOCALLY`** | Executable CLI binary not present on local host. Evidence package (`veyra-v1.0-codex-review-package.zip`) prepared for external upload. |
| **Anthropic Claude Code CLI** | Native discovery & plugin manifests | **`NOT_AVAILABLE_LOCALLY`** | Executable CLI binary not present on local host. Portable skill structure and aliases verified for Claude plugin discovery. |

---

## 3. Strict Superiority Gate & Release Evaluation Boundary

- Under DEC-10, DEC-14, DEC-15, and DEC-34:
  - Local host verification on Windows Node 24 is **100% PASS** (20 suites, 56 tests).
  - External platforms (Linux, macOS) and external agent hosts (Codex, Claude) require CI matrix execution and external agent evaluation.
  - Until the external CI matrix and third-party Codex review complete, the public release status is **`NO_GO FOR PUBLIC RELEASE` / `STABLE_RELEASE_CANDIDATE_READY`** locally.
