# Migration v2 → v3

## What changed
- Core is now stack-agnostic.
- Stack/provider assumptions moved into `adapters/`.
- Auto-detection selects relevant adapters.
- Node and Python verification can coexist.
- Project profiles are explicit overlays.
- Vercel is only a provider adapter, never a universal assumption.

## Existing v2 projects
1. Keep your current project-specific contracts.
2. Copy v3 runtime/adapters.
3. Change config version to `3`.
4. Set `adapterMode` to `auto`.
5. Add explicit adapters only when auto-detection cannot infer them.
6. Move project-only paths/invariants into a project profile.

## Do not
- copy Yomirra invariants into unrelated projects
- make every project use Vercel rules
- make every repository run JS build commands
- force the same verification matrix across all stacks
