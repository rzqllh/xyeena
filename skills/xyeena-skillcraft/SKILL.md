---
name: xyeena-skillcraft
description: Use when creating, editing, packaging, testing, or reviewing Agent Skills, SKILL.md files, agent instructions, or Xyeena capabilities.
---

# Skillcraft — v1 Procedure Entry

**Activate when:** An Agent Skill, trigger description, reference, script, routing contract, skill package or evaluation needs creation or revision.

**Do not activate for:** Ordinary product task, renaming a description without behavior change, or claiming skill quality from number of lines.

## Execution route

1. Write activation and negative activation fixtures before editing the entrypoint. Define target behavior, unacceptable rationalizations, and observable result.
2. Establish baseline without skill under matched input; record failure and scoring rubric, not a fabricated comparative win.
3. Implement minimal SKILL.md pointer and branch-specific reference/tool layers; verify relative paths, package ownership, script dependencies and license provenance.
4. Run positive/negative trigger tests, with-skill behavioral scenarios and combination scenarios using real host/tool receipts where available.
5. Red-team bypass patterns: fabricated worker calls, unauthorized writes, stale green tests, success with missing evidence, prompt injection; reject or revise weak skills.

**Output contract:** Skill contract, baseline vs candidate trace, trigger confusion matrix, behavioral adversarial verdict, package acceptance.

**Failure boundary:** A parser test of SKILL.md frontmatter only supports STRUCTURE_VALID, never BEHAVIOR_VERIFIED or HOST_VERIFIED.

Use [references/procedure.md](references/procedure.md) for decision, recovery, and adversarial cases. Use host-native execution and independent evidence, not an invented worker, host, verifier, or upstream runtime. This entrypoint alone is not evidence of behavior/host parity.
