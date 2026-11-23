# Cli Contract  -  v4 adaptive template

<!-- V4-TEMPLATE id=cli-contract; version=4.0.2 -->

## Command taxonomy

**Questions/required fields:** Subcommands, syntax, argument precedence, help examples and required/optional flags.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Input/output contract

**Questions/required fields:** stdin/stdout/stderr, structured output schemas, encoding, terminal widths and colors/TTY behavior.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Error and exit codes

**Questions/required fields:** Stable nonzero exit codes, diagnostics without leaking secrets, quiet/verbose modes.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Compatibility and tests

**Questions/required fields:** Versioning, shell quoting, platform differences, idempotency and golden output fixtures.

- `[[FILL: project-specific decision, rationale and direct reference]]`

## Public CLI compatibility matrix

| Command | Inputs/flags | stdout contract | stderr / exit code | Idempotency / side effects | Shell/OS tests |
|---|---|---|---|---|---|
| `[[FILL: subcommand]]` | `[[FILL: arguments]]` | `[[FILL: stable output]]` | `[[FILL: explicit failure]]` | `[[FILL: risks]]` | `[[FILL: actual runs]]` |
