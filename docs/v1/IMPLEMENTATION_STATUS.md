# Xyeena Rig v1 — Implementation and evidence ledger

Updated: 2026-11-17. Target `v1.0.0-rc.1` **not released**. Baseline `main@fadfe17914c1b1a7d416075b333085dfc6cfd99d`. Draft PR #75. Owner conditionally authorized automatic merge/release under Q15 **only when every acceptance gate passes**; no merge, tag, or publication has been executed.

## Scope accounting

| Wave | Implemented | Still required |
|---|---|---|
| W0 Correctness foundation | `dualAxisReview` no longer treats matching words as acceptance evidence; GRILL no longer completes blocked/cyclic graphs; adversarial tests | Broader audit of heuristic methods for semantic false positives |
| W1 Evaluator | 19-skill matrix, 19 positive/negative deterministic router cases, structure-only CLI, regression suite | Agent behavioral traces, matched no-skill/single/composite comparative runs, live model trigger selection |
| W2 19 skill procedures | 19/19 `SKILL.md` entrypoints rewritten; 19 `references/procedure.md` created | Independently scored procedure-following behavior with real tools and substantive upstream comparison |
| W3 Capability/data | UI design knowledge index with 19 searchable records, deterministic query tool and tests | Source-expanded and versioned upstream knowledge, semantic tool integrations, stronger evidence binding |
| W4 Cortex/native hosts | Explicit naming covers all 19 entrypoints; blocked/unknown callbacks do not complete tasks; `ONLINE` scoped to registry-only | Actual host-native dispatch receipts, task/dispatch identity, independent verifiers, cancellation and recovery E2E |
| W5 Safe packaging | Nested official skill folders can be uninstalled without leaving orphan owned paths, while retaining custom user content; transactional/consumer/pack tests in CI | End-to-end v0.5.1→v1 safe upgrade across real Antigravity/Codex environments and independent ownership audit |
| W6 Release | None; PR intentionally draft | 19 individually demonstrated behaviors, scoped parity tests, host acceptance, changelog, version and explicit release authorization |

## Proof ledger

- **Deterministic tests:** GitHub Actions `ci` run `43997415344` **success** on commit `d76d1bb0be1b6548291af71f61eda12fee774e0b`; all nine jobs succeeded, including Windows/macOS/Ubuntu, source tests, npx GitHub smoke, skills-ref, SDK worker contract. This is **source CI only**, not a native host acceptance receipt.
- **Current branch commit:** documentation updates after `d76d1bb` do not inherit its green CI. Check exact head SHA and current workflow status before any new PASS claim.
- **19 skill structure:** `npm run eval:v1:structure` validates local frontmatter, linked procedure assets and package contract presence; it intentionally outputs `TRIGGER_VERIFIED=NOT_RUN`, `BEHAVIOR_VERIFIED=NOT_RUN`, `HOST_VERIFIED=NOT_RUN`.
- **Router tests:** deterministic lexical selection fixtures (not proof a live model chose or executed a skill).
- **Design knowledge:** native static lookup only, not full UI UX Pro Max dataset or completed accessibility audit.
- **GitHub actions:** no evidence yet from local Antigravity/Codex native host invocation, video/rendered QA, or independent comparative model run. Such gates remain blocked, not inferred.
- **Upstreams:** historical RE-01..RE-32 retained; new RE-33 Cindy and RE-34 Orca pinned as `REFERENCE_ONLY`. No foreign coordinator bundled or copied.
- **Compatibility:** preserve exactly 19 skill entrypoint names and one Cortex governor; package version stays 0.5.1 until authorized release.

## Owner decisions and Gemini CLI continuity

- GRILL Q1–Q22 are locked and documented in [GEMINI-CONTINUITY.md](GEMINI-CONTINUITY.md). Four supported v1 hosts are **Antigravity, Codex, Claude Code and Gemini CLI**; each must be host verified.
- Full 19-skill live trigger/execution and fault/recovery coverage, independent final recheck, >=3 independent critical runs, and blind comparisons against v0.5.1/relevant upstream are not yet performed.
- Every eligible benchmark metric must improve at least 10%; an already-perfect score must remain perfect. An unqualified regression yields NO-GO.
- Automatic merge/release is only conditionally authorized **after all gates actually pass**. If post-release checks fail, use technically feasible rollback and safe npm mitigation; never claim npm publication is reversible.
- After Gemini CLI compaction, re-read its continuity instructions from disk. Do not invent acceptance results from old conversation summaries.

## Working acceptance commands

```sh
npm ci
npm test
npm run eval:v1:structure
npm run test:harness
npm run test:consumer
npm run check
npm run eval
npm pack --dry-run
```

These are repeatable commands, not a statement that every one has passed on the latest commit. CI must be judged at the exact head revision, and native host acceptance is a distinct gate.

## Release rule

No `1.0.0` release and no `FULL_PARITY` upstream claim on static documentation, deterministic lexer, unit tests, successful `npm pack`, or `Cortex.getStatus().status === 'ONLINE'`. Keep PR draft and do not publish until the owner-approved, measurable execution, benchmark and release gates have all actually passed; Q15 conditionally approves automation, not bypass of those gates.
