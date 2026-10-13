# GitHub Copilot Integration Notes

GitHub currently supports several useful layers:

- `.github/copilot-instructions.md` for repository-wide Copilot rules.
- `.github/instructions/**/*.instructions.md` for path-specific rules.
- `AGENTS.md` for standing agent instructions.
- Skills/prompts for task-specific workflows.

Recommended mapping for this harness system:

- `AGENTS.md`: thin entry point + core principles.
- `.github/copilot-instructions.md`: only compact repo-wide rules needed specifically by Copilot.
- `.github/instructions/`: path-specific contracts such as admin/security, UI, tests, docs.
- task skills/prompts: audits, migrations, releases, design review, security review.

Do not copy the complete harness corpus into every always-on instruction file. Keep always-on context small and reference/activate domain rules when needed.
