# Veyra v1.0 — Release Gate Decision (Independent Evidence Correction)

**Verdict: RELEASE_BLOCKED / REVIEW_READY.** Qualification records are frozen against commit a8c038a9bd965029f21547715e7079d2596213f9.

| Gate | Evidence | Verdict |
| --- | --- | --- |
| Local Node integration | 8/8 direct engine checks reported | PASS_AS_INTEGRATION_ONLY |
| Native Gemini/Codex/Claude E2E | No verifiable native agent tool traces in evidence | NOT_RUN |
| Capability-matched A/B/C | Original baseline scores hardcoded, no actual agent comparator runs | RETRACTED |
| Archive integrity | Local SHA-256 match reported, pinned source commit identity not checked | PARTIAL |
| CI regression | GitHub Actions run 45143793670 succeeded on source commit | PASS_FOR_THAT_COMMIT |
| Distribution license | NOTICE.md says unassigned, package.json says MIT | OWNER_DECISION_REQUIRED |
| Stable public release | Native E2E, fair benchmark and legal gates unresolved | BLOCKED |

The prior label CONDITIONAL_CANDIDATE remains a historical project report, not approval to publish.
No merge, tag, npm publish or repository migration is authorized by this document.
