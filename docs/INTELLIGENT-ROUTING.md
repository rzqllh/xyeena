# Skill discovery and orchestration

[Current source and host acceptance (2026-10-26)](STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

Xyeena Rig can inspect supported host skill directories, rank eligible capabilities, and produce a deterministic execution plan. Inventory inspection never installs third-party content or invokes a model.

## Discover and route

```sh
node bin/xyeena.mjs skills discover --runtime codex
node bin/xyeena.mjs route --runtime codex --prompt "Investigate a regression" --state DEBUG
node bin/xyeena.mjs orchestrate preview --runtime codex --goal "Review the failing tests"
```

Host-specific roots, workspace/global precedence, plugin provenance and optional dependencies are handled by `src/workspace-skills.mjs` and `src/skill-hosts.mjs`. Required dependencies must be eligible before a capability is selected. Shadowed/colliding records are retained for auditing.

## Provider policy

- Xyeena Rig is the one workflow governor.
- Superpowers may supply coding methodology; Superior Skills may supply specialist review or quality guidance.
- Neither provider is required. Eligible native Xyeena modules serve as a fallback.
- Mere filesystem presence does not establish plugin activation, trust or an executable worker.
- Skills are loaded selectively to limit context overhead.

## Execution and verification

```sh
node bin/xyeena.mjs orchestrate run --runtime codex --goal "Review failing tests" --yes
```

This command creates a **new read-only one-shot session** after explicit consent. It is not an active IDE chat. Programmatic task adapters may dispatch independent read-only tasks, but write-capable operations require actual host authority and isolation. Worker IDs and terminal statuses must come from a real execution adapter.

Simpul is an optional FastMCP integration whose contract can be validated independently of its upstream worker supervisor. A transport probe is insufficient to select it for live execution; native/inline fallback remains available. Output becomes VERIFIED only after an independent checker evaluates evidence against the task contract.

See [Architecture](ARCHITECTURE.md), [Runtime adapters](RUNTIME-ADAPTERS.md), [Security](../SECURITY.md) and [Acceptance](xyeena-rig/ACCEPTANCE_MATRIX.md).
