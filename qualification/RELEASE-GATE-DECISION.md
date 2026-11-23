# Veyra v1.0 — Release Gate Decision (Independent Evidence Correction)

**Verdict: RELEASE_BLOCKED / REVIEW_READY.** Qualification records updated on veyra-review.

| Gate | Evidence | Verdict |
| --- | --- | --- |
| Local Node integration | 8/8 direct engine checks reported | PASS_AS_INTEGRATION_ONLY |
| Native Gemini/Codex/Claude E2E | Gemini OAuth deprecated upstream (`UNSUPPORTED_CLIENT`); Codex/Claude unavailable | BLOCKED_HOST_UNAVAILABLE |
| Capability-matched A/B/C | Original baseline scores hardcoded, no actual agent comparator runs | RETRACTED |
| Archive & Upstream integrity | 21/21 pinned Git commit objects verified in Git database (`git cat-file -t commit`) | PASS_OBJECT_PROVENANCE_VERIFIED (21/21) |
| CI regression | GitHub Actions matrix passes across Node 20/22/24 on Ubuntu/macOS/Windows | PASS |
| Distribution license | Resolved under Owner Locked Decisions (Proprietary free-to-use, SEE LICENSE IN LICENSE) | RESOLVED_BY_OWNER_LOCKED_DECISIONS |
| Stable public release | Native agent E2E and comparative LLM benchmarks require host/auth availability | BLOCKED |

The prior label CONDITIONAL_CANDIDATE remains a historical project report, not approval to publish.
No merge, tag, npm publish or repository migration is authorized by this document.
