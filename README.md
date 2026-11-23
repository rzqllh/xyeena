# Vibe Coding Template v4.0.2: lean, adaptive source library

This is a **generator source library**, not an instruction to copy every file into a project. The 59 optional templates live under `templates/`; Studio exports only selected documents and a small agent contract.

## Quick start

- In a coding agent, start with `AGENTS.md`. Use `START-HERE.md` only when onboarding an idea.
- Tell the agent the goal. It should discuss the proposed scope until you say GO, then complete that scope without needless approvals.
- UI domain standards, including Hallmark, Impeccable, Design Taste and visual AntiSlop, live in `.vibe/standards/DESIGN-QUALITY.md` and scoped host rules.
- Skills and provider plugins may be used when relevant but are not required.

## Authoring and testing the template library

```bash
python scripts/v4.py list
python scripts/v4.py suggest --types web,api
python scripts/v4.py init --name "Example" --types web
python scripts/v4.py activate prd --dry-run
python scripts/v4.py check --template
python scripts/v4.py check --project
python -m unittest discover -s tests -v
```

`init` creates a minimal PROJECT-BRIEF.md if absent; no phase ledger is generated. `activate` copies one selected document, never overwriting existing files. Template metadata and upstream inventory remain source assets, not mandatory context for exported projects.

Real implementation behavior is determined by code and executed tests. No script can prove visual quality, compatibility with an untested host or a production deploy.
