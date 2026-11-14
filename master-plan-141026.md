# XYEENA — Master Plan 14/10/2026: Remote Reconciliation Seed

> **Status: FUTURE / HOLD — NOT APPROVED FOR IMPLEMENTATION**
> Remote document created 2026-11-14. The originally named local master-plan-141026.md is NOT available in the current GitHub main tree or accessible project files. This is a **remote coordination seed, not a reconstructed or replacement copy** of that inaccessible local master plan. Once local and remote source align, merge both documents section by section, preserve local decisions, and resolve conflicts with the owner. Do not silently overwrite either version.

**Repository:** https://github.com/rzqllh/xyeena  
**Product:** Xyeena Rig (temporary; Skills + Harness, **not** a replacement subagent project).  
**Source-of-truth pointer:** [Detailed future integration plan](docs/future/XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md).  
**Provenance ledger template:** [Source-level licensing and credit](docs/future/UPSTREAM_PROVENANCE_TEMPLATE.md).

## 1. Why this plan exists

On 2026-11-14, GitHub main still represented legacy Xyeena Rig (package metadata 0.4.1, 19 skills). The owner and Antigravity CLI reported a newer **local** rebuild on feat/rebuild-foundation-p00, reportedly RC-3 at commit 743712c with 64 capability contracts, 553 tests, plus later P08 conditional installer work whose result has not yet been reviewed. Those are **historical AGY reports, not independent verification of the unpublished local checkout**.

Do not conflate:
- GitHub main or public npm release.
- Local desktop branch and unpushed commits.
- Native capabilities declared in a registry.
- Behavior/integration/parity actually verified.
- Future proposed upstream reuse.

This future plan must survive the desktop push and become visible to coding agents in an audit. **Do not implement it simply because it exists in the repository.**

## 2. Strategic decision: upstream-first with licenses and evidence

Previous clean-room/native-only redesign produced shallow or unverified functionality in some areas. The owner now prefers to **reuse, adapt, vendor, and compose high-quality original upstream skill/code when licensing permits**, with file-level provenance, retained licenses/notices, source tests, and real comparative QA.

This does NOT mean automatically copying every upstream repository, copying third-party secrets/assets, or installing large frameworks by default. Evaluate source files and licenses individually, record decisions, and preserve small always-on kernel + lazy capabilities.

**Core properties that must stay:**
1. Xyeena is Skills + Harness, not a fleet of XYN-character subagents.
2. One Xyeena workflow controller, existing host/user agent first, no duplicate governor.
3. Existing personas and host/system instructions always remain authoritative within their proper priority; never rewrite persona files.
4. Small always-on core; domain-specific skills loaded only when relevant; heavy ops not invoked on trivial requests.
5. Anti-Slop contextual quality during and after work, proportional to task.
6. Security full audit is explicit-only; ordinary security review remains scoped.
7. Claims must be evidence-backed; simulated/static tests are not live host acceptance.
8. Local-first state and safe recovery; privacy, approval and scoped filesystem rules.
9. New dependencies only if justified and authorized; optional features cannot make base install fragile.
10. Conditional installer safely replaces only verified Xyeena-owned legacy components, preserves user data, and rolls back on failure.

## 3. Expanded reference coverage

Carry forward research streams RE-01–RE-30 from existing blueprints and add **RE-31 Konoha**. Verify pinned full commit, exact file inventory, license and notices at the chosen commit before code reuse.

Primary sources:
- RE-01 obra/superpowers — TDD, planning, debugging, verification, execution.
- RE-02 KodekaTeam/superior-skills — engineering and domain quality.
- RE-03 miqdadbadjuber/anti-slop — writing/code/UI/mobile quality methods.
- RE-04 DietrichGebert/ponytail — minimal correct engineering and review.
- RE-05 JuliusBrussee/caveman — lean execution, context economy and surgical changes.
- RE-06 cloudflare/security-audit-skill — trustworthy audit workflow and validators.
- RE-20 rzqllh/xyeena — legacy source/host contracts and migration.
- RE-31 andycungkrinx91/konoha — retrieval, MCP orchestration, SQLite FTS5, QA, approvals, telemetry. License in its current main checkout: Apache-2.0; observed package version 2.2.21 at reference HEAD 9789bdd1d57d5f7a39a58406105e36127ffdb35b. Recheck SHA before implementing.

Additional sources RE-07–RE-19: Impeccable, Matt Pocock Skills, Hallmark, Taste Skill Family, UI UX Pro Max, Anthropic Skills, Vercel Agent Skills, GSAP Skills, Trail of Bits Skills, Supabase Agent Skills, Google DESIGN.md, Awesome DESIGN.md and Gemini Superpowers Antigravity. RE-21–RE-30 are knowledge/standards foundations. Exact repo identities, scope and license status must be reconciled with the local SOURCE_LOCKS.yaml, not guessed.

## 4. Composite skills — proposed, not implemented

A single Xyeena entrypoint can coordinate several **original upstream methods and local improvements** with selective loading and one acceptance rubric:

| Proposed command | Candidate source composition | Outcome |
| --- | --- | --- |
| /xyeena-design | Hallmark + Impeccable + Taste + UI UX Pro Max + Anti-Slop | Strong visual direction, craft, implementation and design QA |
| /xyeena-plan | Superpowers + Superior + Ponytail | Evidence-grounded, executable and lean plans |
| /xyeena-execute | Superpowers + Superior engineering + Caveman | Tested implementation without ceremony |
| /xyeena-debug | Superpowers debugging + source investigation + QA | Reproduced root-cause fixes |
| /xyeena-review | Superior review + relevant Anti-Slop + Impeccable | Independent scoped quality review |
| /xyeena-security | Cloudflare + Trail of Bits methodology | Scoped checks; explicit-only full audit |
| /xyeena-orchestrate | Xyeena DAG + selected Konoha patterns | Host-native, resource-aware delegation |
| /xyeena-research | Source-grounded research + retrieval + provenance | Trustworthy claims with cited evidence |

These names are **temporary**; command registration, spelling and aliases require owner decision. Composite does not mean concatenating every SKILL.md into the prompt. Give each composition stable inputs, execution stages, conflict resolver, budget, provenance and verified output contract.

## 5. Xyeena personality — traits, not new subagents

The separate XYN-character/subagent project may inform behavioral traits **only after actual source inspection and permission**. Extract patterns such as investigation, taste, skepticism, strategic planning, craftsmanship, security caution, humane writing, independent QA and efficient orchestration.

**Do not copy character names, lore, images, private persona files, roleplay behavior, or agent configuration.** No XYN agent becomes a runtime dependency. Personality is a lightweight per-domain overlay that cannot supersede user/host authority and should not make every host sound identical.

## 6. Host alignment and conditional installer

Hosts to evaluate from evidence: ChatGPT Desktop/Work where integration is actually available, Antigravity CLI/IDE, Gemini CLI, Hermes, Codex, Claude Code and additional compatible Agent Skills hosts. Do not claim an adapter can control ChatGPT's built-in subagents or system persona without a supported host mechanism.

The owner reports divergent behavior: ChatGPT Desktop continues using its existing subagents, and Hermes/Gemini appear unaligned. Treat these as **observations requiring live reproduction**, not established bugs in a particular vendor.

Conditional install must classify target as NOT_INSTALLED, LEGACY, OLD, SAME_VALID, SAME_CORRUPT, NEWER, FOREIGN, UNKNOWN or PARTIAL. Only replace Xyeena-owned files within selected host+scope; perform backup and rollback; preserve memory, personas, third-party skills, unrelated hooks and global configuration. No silent downgrade; dry-run first; verify fresh install/replace/repair/uninstall using disposable fixtures.

## 7. Hard synchronization gate (no implementation while mismatched)

The plan is dormant until **ALL**:
- The intended desktop branch and the remote branch/ref are identified, and source tree/commit lineage compared using git fetch, status, merge-base and relevant diffs. "Align" means reconciliation of intended changes, not merely same branch name.
- The old main source and local rebuild are reconciled intentionally, without force push, destructive resets, lost uncommitted changes or overwriting the original master-plan.
- The latest P08 execution results, tests, tarball and installer rollback evidence are examined instead of assumed.
- Working tree and local user modifications are protected, including any pre-existing .gitignore changes.
- The audit agent can point to exact versions, files, and open decisions, and can explain unsupported host claims.

**If not aligned: STOP at read-only state reconciliation.** Explain what differs and how to safely sync. Do not vendor upstream code or initiate a PR/merge/release as a consequence of reading this plan.

## 8. Conditional "grill owner" protocol

**Trigger:** An explicit owner request to audit/review/reconcile Xyeena rebuild, release readiness, source parity, or this future plan **AFTER alignment is verified**.

On that trigger:
1. Read this file, linked detailed plan, existing local accepted decisions, source locks and current code; check for drift.
2. Produce an evidence-backed gap table: existing behavior / desired upstream behavior / license / options / risk.
3. Ask a focused batch of **at most 5 consequential questions** (grill) with recommendation, alternatives, trade-offs and the default if owner does not decide.
4. Stop before any implementation or security/host changes requiring consent. No auto-assumed approval.
5. Record answers as ACCEPTED/REJECTED/DEFERRED with timestamp and source; then reconcile design and implementation plan.
6. After explicit implementation approval, proceed incrementally, with tests and file-level notices.

Grill topics must include: (A) which code to reuse/vendor vs compose, (B) initial composite command and quality rubric, (C) trait sourcing/voice boundaries, (D) host matrix and installer activation, (E) licensing, packaging and release strategy. Ask follow-up batches only for unresolved material decisions; do not repeat decided questions.

## 9. License and release obligations

Before committing adapted third-party files to a public branch or distributing a tarball, inspect license **per file/per pinned commit**, preserve copyright/license/NOTICE, identify modified files and record file-level origin. Copyright notices are required even if the public acknowledgement announcement is postponed until launch.

Apache-2.0 has NOTICE/change-marking obligations where applicable; MIT requires preservation of its notices. Anthropic skill licensing can differ per directory; Trail of Bits material is not automatically MIT/Apache. Do not label all research inspirations as copied software. Update root NOTICE.md only when actual reused components have been audited; preserve existing notices.

No npm publish, release tag, global host install, new dependency, remote deletion, PR merge or destructive cleanup without relevant owner approval.

## 10. Roadmap, sequencing and acceptance

- **F0 — Remote/desktop reconciliation:** inventory refs, source diff, P08 evidence, decision and original local master plan reconciliation.
- **F1 — Decision grill:** resolve above owner decision frontiers and freeze scoped legal and architectural decisions.
- **F2 — Source provenance:** inspect pinned files/tests/rights, produce component reuse matrix and license bundle.
- **F3 — Composite implementation:** begin with /xyeena-design when approved; source-preserving, measured and tested.
- **F4 — Skills/harness, persona traits and host alignment:** no replacement of user agents; verify in actual hosts.
- **F5 — Installer/migration and parity QA:** disposable install/update/uninstall, tests, benchmark, upstream comparison.
- **F6 — Documentation and release gate:** notices, changelog, public docs, owner decision on version/brand/PR/publish.

Done is **evidence**, not a count of handlers or claims of 100% parity. Separate STATIC, CONTRACT, BEHAVIOR, COMPARATIVE and LIVE HOST VERIFIED. Publish only when licenses, package contents, behavior and owner permissions are valid.

---

**Important for next auditing agent:** This file is intentionally on an older remote main before desktop alignment. If a local master-plan-141026.md exists, merge this remote-seed content with it, preserving the original. Never treat this newly created file as proof the entire original master plan was examined.
