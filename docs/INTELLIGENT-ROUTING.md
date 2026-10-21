# Intelligent skill discovery and orchestration bridge (development)

This is an additive feature branch, not a new published npm release. Existing 19 Xyeena Skills, capability contracts, selective installer, Harness guardrails, Guided hooks, and existing CLI subcommands remain unchanged.

## Native automatic skill invocation

Antigravity IDE already supports automatic selection of relevant Agent Skills from its skill inventory, without typing individual slash commands. Xyeena's always-on core rule reinforces this behavior. A model must read only the necessary trusted SKILL.md files on demand, rather than blindly loading all installed skills.

The new CLI is a deterministic **read-only preview and diagnostic utility**. It does not inject native model context, spawn an IDE worker, approve tools, or guarantee that the IDE selects the same combination.

Run from a checkout of this branch, at the target project root:

\`\`\`sh
node bin/xyeena.mjs skills discover --runtime antigravity
node bin/xyeena.mjs route --runtime antigravity --prompt "systematic debugging for a regression" --state DEBUG
node bin/xyeena.mjs skills discover --runtime all --local-only
\`\`\`

Supported runtime names: \`antigravity\`, \`claude\`, \`codex\`, and \`all\`. Use \`--dir PATH\` for another workspace, \`--local-only\` to exclude global skill locations, and \`--max-supporting 0..8\` to adjust the candidate budget (default two). The old \`xyeena resolve\` behavior is unchanged.

Discovered skill roots:

| Host | Project roots | User roots |
| --- | --- | --- |
| Antigravity | \`.agents/skills\`, legacy \`.agent/skills\` | \`~/.gemini/config/skills\`, legacy \`~/.gemini/antigravity/skills\` |
| Claude Code | \`.claude/skills\` | \`~/.claude/skills\` |
| Codex | \`.agents/skills\` | \`~/.agents/skills\` |

Workspace skill names override same-name global skills. Discovery scans only immediate skill directories with readable, bounded \`SKILL.md\` YAML metadata. Files and directory symlinks are ignored. No third-party instructions or scripts are executed by discovery. Third-party routing uses lexical overlap and may miss semantic equivalents; native host routing remains the source of truth.

## Execution bridge

\`runTaskGraph({ tasks, adapter, maxParallel, approvedTaskIds, onTransition })\` is exported for host integrations. It requires a **real** \`adapter.executeTask(task)\` implementation. Without one it fails before dispatching any task; it cannot silently claim that an in-memory worker was executed.

The host adapter must perform the actual tool/worker call, enforce native permissions for every operation, and return \`{ verified: true, evidenceRefs: ['...'] }\` only after checking evidence. Without evidence, task state becomes \`REVIEW_REQUIRED\` and dependent tasks do not run. Exceptions result in \`FAILED\`. Independent tasks marked \`scope.readOnly === true\` may run concurrently; write tasks serialize. Tasks marked \`scope.operationClass: 'external' | 'destructive'\` additionally require their individual task ID in \`approvedTaskIds\`. That list is not permission to bypass host-level approval controls.

The branch deliberately does **not** claim to provide a verified native Antigravity spawn adapter, unattended IDE execution, automatic permission approval, automatic skill installation, or end-to-end autonomy. A separate native-host integration and live IDE acceptance test are required before those claims can be made.

## Regression and compatibility checklist

1. \`npm test\`, \`npm run check\`, \`npm run eval\`, \`npm run test:harness\`, and \`npm run test:consumer\` on the branch.
2. Existing \`xyeena resolve\`, \`init\`, and \`guided\` commands continue working without changed flags or semantics.
3. CLI discovery remains read-only, limits file sizes, avoids symbolic links, and never imports third-party scripts.
4. Native Antigravity activation must be tested in IDE with local and global skills (CLI unit tests cannot prove IDE execution).
5. Confirm external/destructive actions remain user-approved and task-scoped.

References: [Antigravity Agent Skills](https://www.antigravity.google/docs/skills?tab=ide), [Claude Code Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).
