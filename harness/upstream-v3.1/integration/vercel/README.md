# Vercel Adapter

Use this adapter only for projects actually deployed on Vercel.

Files:
- `DEPLOYMENT_MODES.md` — STANDARD/BUDGET/STRICT decision.
- `ignore-build-step.sh` — BUDGET mode docs-only build skipper.
- `vercel.strict.example.json` — STRICT mode auto-deploy disable example.
- `../github-actions/vercel-production-manual.yml.example` — optional explicit production deployment workflow.

## Safety notes

- Do not commit `.vercel/` metadata or downloaded production `.env` files.
- Store Vercel credentials in the CI secret store.
- Prefer short-lived/minimum-scope credentials where the platform supports them.
- STRICT mode is opt-in because disabling automatic deployments changes the project's operational behavior.
