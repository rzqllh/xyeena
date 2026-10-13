# Xyeena Harness v3.1

Universal, modular operating system + executable guardrails for coding/design agents.

**Core principle:** maximum discipline, minimum ceremony.

## Important v3.1 fix

A missing project config is no longer a blocker.

This works immediately inside any Git repository:

```bash
xyeena doctor
xyeena audit
xyeena scan
xyeena verify
```

If `.xyeena/config.json` does not exist, Harness enters **BOOTSTRAP mode**:
- embedded universal defaults are used;
- stack/provider adapters are auto-detected;
- project-specific invariants are not invented;
- read-only audit continues normally.

Persistent project config is optional until you run:

```bash
xyeena init
```

## This ZIP is repository-ready

After extracting:

```bash
cd xyeena-harness-3.1
git init
npm test
npm run smoke
git add .
git commit -m "chore: bootstrap Xyeena Harness v3.1"
```

There are no runtime npm dependencies.

## Package/CLI

This original v3.1 source is vendored internally in `xyeena-agent` and licensed MIT. Its nested `package.json` is marked `private: true` to prevent accidental standalone publishing. Use the unified public `npx xyeena-agent init` installer to select Skills, Harness, or All explicitly. Its legacy CLI metadata remains only for source-reference compatibility.

## Intended first-use flow in another project

```bash
npx xyeena-agent init
npx xyeena-agent harness doctor
npx xyeena-agent audit
npx xyeena-agent scan
npx xyeena-agent verify
```

The installer never selects all components implicitly. The bundled upstream `init` and `install-hook` commands are not exposed through the unified CLI.

`init` is deliberately optional for audit.

See:
- `HARNESS.md`
- `UNIVERSAL_ARCHITECTURE.md`
- `ACTIVATION_MATRIX.md`
- `EXECUTABLE_ENFORCEMENT.md`
- `adapters/README.md`
