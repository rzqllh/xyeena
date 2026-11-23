# Verification report (v4.0.2)

The executable checks are in `scripts/v4.py` and `tests/test_v4.py`. They validate core contract length and imports, path references, the 59 source documents, safe activation, no legacy global boilerplate, and removal of empty lifecycle ledgers.

These tests do not establish functional compatibility with Codex, Claude Code, Gemini CLI, Antigravity IDE, Cursor or Copilot. Run each host separately and report TESTED or NOT RUN accurately.

`check --project` permits honest draft placeholders as warnings; `check --project --strict` rejects unresolved placeholders. Neither mode claims to validate the correctness of an application that has not been built.
