# Veyra v1.0 — Release Gate Decision

**Verdict: REVIEW_READY / STABLE_RELEASE_BLOCKED**

| Gate | Evidence | Status |
| --- | --- | --- |
| Node regression | 84/84 PASS, CI run 45299915880 | VERIFIED |
| OS/Node matrix | Ubuntu/macOS/Windows × Node 20/22/24 (9/9) | VERIFIED |
| Persistent command receipts | Cross-process HMAC journal, five-minute freshness, tamper rejection | LOCAL_PROCESS_VERIFIED |
| Optional pre-tool hooks | Write/shell policy, path traversal and symlink tests | CODE_TESTED_NOT_HOST_ACTIVATED |
| Native Gemini/Codex/Claude E2E | No accepted agent prompt plus tool-use/tool-result traces | NOT_RUN |
| Fair A/B/C agent benchmark | Previous synthetic scores retracted | NOT_RUN |
| Pinned upstream sources | 21/21 Git object presence reported by local Antigravity, content mapping not reproduced here | PARTIAL |
| Distribution policy | Proprietary/free-to-use public npm selected; exact third-party obligations pending | OWNER_DECIDED_IP_REVIEW_OPEN |
| Stable public release | Requires above unverified host and IP gates | BLOCKED |

Runtime threat model and opt-in hook templates: [docs/VEYRA-RUNTIME-CONTRACT.md](../docs/VEYRA-RUNTIME-CONTRACT.md). Existing Yoru installation is not silently updated.
No merge, tag, npm publish or main-branch changes are authorized by this register.
