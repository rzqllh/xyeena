# Executable Enforcement — v3.1

## Bootstrap mode

Project configuration is optional.

When `.xyeena/config.json` is absent, the CLI uses `runtime/default-config.json`.
This is sufficient for:
- doctor
- adapter detection
- read-only audit
- repository/secret/AI-artifact scan
- generic risk classification
- generic verification

No project-specific invariant is assumed in bootstrap mode.

An existing but invalid config is a blocker because ignoring explicit policy would be unsafe.

## Commands

```bash
xyeena init
xyeena doctor
xyeena adapters
xyeena audit
xyeena risk --base origin/main
xyeena scan
xyeena verify --base origin/main
xyeena prepush --base origin/main
xyeena install-hook
```

## `init`

`xyeena init` is non-destructive:
- creates `.xyeena/config.json` only if absent;
- creates `.xyeena/profile.md` only if absent;
- creates `AGENTS.md` only if absent;
- adds `.harness/evidence/` to `.gitignore` without replacing existing content;
- detects adapters and target branch;
- works before `git init`, although Git-specific checks become available after Git exists.

## `audit`

`audit` is read-only and completes the report even if findings contain blockers.

`scan`, `verify`, and `prepush` remain enforcement commands and may return non-zero.

## Evidence

Successful verification writes `.harness/evidence/latest.json`.
Local evidence should be gitignored.
