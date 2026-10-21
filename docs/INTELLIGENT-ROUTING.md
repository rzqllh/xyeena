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

## Experimental one-shot Antigravity SDK execution

The bridge is **optional**. It uses the official Python Antigravity SDK and is distinct from the existing Antigravity IDE conversation. It will call the configured Gemini provider only when the user explicitly runs `sdk run --yes`. No Python dependency is installed by the normal Xyeena package.

```powershell
# Install SDK separately in a Python environment (optional).
python -m pip install google-antigravity
# Set GEMINI_API_KEY in your own environment before the run.
node bin/xyeena.mjs sdk preview --goal "Inspect regressions in tests"
node bin/xyeena.mjs sdk run --goal "Inspect regressions in tests" --yes
```

For complex read-only work, optionally append `--delegate` to `sdk run --yes` to enable native SDK self-cloning subagents. This adds `START_SUBAGENT` to the otherwise read-only built-in tool selection and can increase provider token usage. It is never enabled by default.

When installed as an npm package use `npx xyeena-agent sdk ...`. Use `--dir PATH`, `--local-only`, `--python PATH`, or `--timeout-ms N` as appropriate.

- The worker uses `LocalAgentConfig(skills_paths=[...])` with restricted read-only tools. It never enables write or shell tools. Subagents are disabled by default and enabled only via explicit `--delegate`.
- It discovers installed and selected skill directories on the host, allowing native SDK skill loading. It does not copy SKILL.md into a prompt.
- The worker requires a valid Gemini API/Vertex environment. Provider usage may incur token charges; it is not a free/local mode.
- Calls are one-shot and return the text report plus optional token usage. Outputs are always `REVIEW_REQUIRED` (not `VERIFIED`); model-generated text is **not independent evidence**.
- SDK availability and model authentication cannot be verified by repository CI; acceptance requires a manual smoke test on a configured host.
- This does **not** control an already-running Antigravity IDE session, and it cannot replace native IDE-level permissions. Separate native IDE tool-dispatch support remains pending.

Security boundaries: no `--force` installer, no implicit SDK invocation, no automatic permissions, no external/destructive tasks, no background daemon, bounded input/output/timeout, no command-shell execution, and no user secrets in the JSON invocation.

## Portable host adapters (Gemini CLI, Hermes, Codex, Antigravity, Claude)

Skill discovery is host-specific. The core never assumes a skill installed in one environment exists in another. The `skill-hosts.mjs` registry declares paths, precedence and bounded scanning rules; `workspace-skills.mjs` discovers actual files and routes only eligible candidates. No scan reads `scripts/` or executes skill instructions.

```sh
node bin/xyeena.mjs skills matrix --local-only
node bin/xyeena.mjs skills discover --runtime hermes
node bin/xyeena.mjs route --runtime gemini --prompt "investigate regression" --state DEBUG
# Optional manual install in checkout; existing Harness is untouched.
node bin/xyeena.mjs init --components skills --runtime gemini,hermes --skills xyeena-orchestrate --yes
```

Supported scopes and precedence:
- Antigravity IDE: project `.agents/skills`, legacy `.agent/skills`; user `~/.gemini/config/skills`, legacy `~/.gemini/antigravity/skills`.
- Codex: project `.agents/skills`; user `~/.agents/skills`.
- Gemini CLI: project `.agents/skills`, `.gemini/skills`; user `~/.agents/skills`, `~/.gemini/skills`. Shared alias wins at each level.
- Claude Code: project `.claude/skills`; user `~/.claude/skills`.
- Hermes: project `.hermes/skills` and `.agents/skills` in Git repository; user `~/.hermes/skills`; optionally `skills.external_dirs` from Hermes config. Category-nested skills are supported. Project trust is mandatory and not granted by discovery.

For Hermes, Xyeena reads a conservative subset of the local `skills:` settings from `~/.hermes/config.yaml` (external_dirs, trusted_project_dirs, project_discovery). A detected untrusted skill returns `availability: requires-host-trust` and is excluded from automatic routing. For stronger guarantees, verify Hermes' effective skills with `hermes skills list`. Config macros or unsupported YAML styles are never interpreted as executable commands. Native runtime disablement, permissions and skill quality/security scanners must still be checked by the host: `detected` means a valid local file exists, not that execution or activation succeeded.

Use `xyeena skills matrix` for per-host inventory; `--runtime all` on discovery is a deduplicated, cross-host view, **not** a claim that every runtime can load the result. For routing, select exactly one host. No automatic installation, global skill mutation, shell invocation, permission bypass or publishing occurs.

## Gemini CLI and Hermes native one-shot execution (experimental)

The portable `host` CLI is a separate opt-in path for real headless agent execution, not a replacement for a live IDE/chat session:

```sh
node bin/xyeena.mjs host preview --runtime hermes --goal "Audit tests" --local-only
node bin/xyeena.mjs host run --runtime hermes --goal "Audit tests" --yes
node bin/xyeena.mjs host run --runtime gemini --goal "Review architecture" --yes
```

`host preview` never makes model calls. `host run --yes` is a **real provider-backed AI call** which may consume paid tokens. It is refused unless `xyeena-orchestrate` has been found in the active runtime (for Hermes project skills, trust is required). It uses the discovered eligible skills as *suggestions*, not proof of host-native activation. Native settings, disabled skills and Hermes security quarantine may narrow actual availability further.

**Hermes:** launches `hermes chat --query-file - --oneshot -Q --format stream-json --toolsets safe --skills <detected names>`. The task arrives on stdin (not command arguments); `safe` excludes shell and file-edit toolsets and permits research/media tools only. It intentionally does not grant file/terminal writes or the complete `skills` toolset (which includes `skill_manage`). Thus this mode cannot perform normal code-editing work and may have limited local codebase access. It does not use `--yolo` or silently trust a repository.

**Gemini CLI:** launches headless JSON with `--approval-mode plan --extensions none`, passing the task on stdin. Plan Mode provides native read-only constraints according to Gemini's documentation. Enforcement is delegated to the installed Gemini CLI; do not interpret a model response or our mock tests as proof of sandboxing. Folder trust must already be satisfied; `--skip-trust` is deliberately not used.

Both adapters use argv arrays with no shell and bounded output/timeouts. Neither asserts independently verified completion; even a successful host execution returns `REVIEW_REQUIRED`. For higher-assurance read-only execution, verify the host policy and filesystem side effects in a disposable workspace. CLI wrappers on Windows (such as `.cmd`) require platform-specific live acceptance before declaring support. Source tests mock the native process; they do not authenticate models.
