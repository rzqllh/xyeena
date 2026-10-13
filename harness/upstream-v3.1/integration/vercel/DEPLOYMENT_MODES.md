# Vercel Deployment Modes

The harness separates development verification from Vercel deployment.

## Mode A — STANDARD

Use the normal Vercel Git integration.

Use when:
- preview deployments are useful
- deployment quota is not currently constrained

Harness behavior:
- local verification still runs before push
- pushes may create Vercel previews

## Mode B — BUDGET

Keep Git integration enabled, but configure an Ignored Build Step for changes that do not affect the app.

Use when:
- docs/non-runtime changes are common
- build minutes are the main pressure

Important:
Ignored Build Step can save build work/build minutes, but a skipped/cancelled deployment may still appear as a deployment event depending on the platform/account behavior. Do not treat this mode as a guaranteed way to avoid every deployment-count limit.

See `ignore-build-step.sh`.

## Mode C — STRICT

Disable automatic Git deployments and explicitly deploy only a verified commit/SHA.

Use when:
- Hobby deployment limits are the real bottleneck
- local/CI verification is strong
- preview-per-push is not worth the quota cost

Typical flow:

local implementation
-> local verification
-> commits
-> push branch
-> GitHub CI
-> PR review
-> merge
-> explicit production deployment of verified SHA

This is the strongest deployment-budget mode.

### Vercel setting

A repository can use a `vercel.json` configuration such as:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

Do not switch an existing project to STRICT automatically. It changes deployment behavior and should be an explicit project decision.

## Recommended Xyeena default

For constrained Hobby projects:

- everyday work: STRICT when reliable CI/manual release is configured
- otherwise: BUDGET
- production release: exactly one validated deployment whenever practical

Never rotate accounts/projects to evade provider quotas.
