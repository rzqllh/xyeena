# Universal Architecture — v3

v3 separates **universal policy** from **project-specific execution**.

## Layers

```text
Xyeena Profile
      ↓
Universal Core
      ↓
Stack Adapter(s)
      ↓
Project Profile
      ↓
Task Trigger(s)
      ↓
Risk-based Verification
```

## Universal Core
Never assumes:
- Next.js
- Vercel
- React
- Node.js
- a single repository layout
- one package manager
- one deployment provider

Core owns:
- scope discipline
- evidence-before-claim
- risk classification
- repository hygiene
- remote-action safety
- secret/AI-artifact scanning
- generic contract checks
- continuation/state recovery
- definition of done

## Stack Adapters
Adapters contain stack/tool-specific behavior.

Examples:
- `node`
- `nextjs`
- `python`
- `static-web`
- `docs-only`
- `monorepo`
- `vercel`
- `github`

Multiple adapters may be active together.

## Project Profiles
A project profile stores only project-specific facts and invariants.

Examples:
- route/layout invariants
- forbidden public terminology
- critical directories
- deployment mode
- project-specific commands
- known shared components
- product invariants

Do not put generic engineering advice into project profiles.

## Precedence

1. Current explicit user instruction
2. Safety / irreversible-action constraints
3. Project profile
4. Active adapters
5. Xyeena profile
6. Universal core
7. Tool defaults

## Rule
If a rule only makes sense for one stack/project, it does **not** belong in universal core.
