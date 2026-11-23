@AGENTS.md
@CHECKPOINT.md

# Claude Code Host Entry — Veyra v1.0

- **Multi-Host Native:** Native support for Claude Code.
- **Continuation:** On session start or after chat compaction, re-read `CHECKPOINT.md` from disk.
- **Preflight:** Run `node scripts/preflight-upstream.mjs` before touching code.
- **Scope Discipline:** Discussion Mode is default. Enter Execution Mode only after explicit implementation instruction.
- **Zero Fiction:** Never invent missing files or simulate test results.
