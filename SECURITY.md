# Security policy

[Latest tested host boundaries and release status](docs/STATUS.md) (reviewed 2026-10-26). A native Antigravity CLI 1.4.7 scoped `force_ask`/user-cancel and read-only `deny` have been demonstrated; Antigravity IDE 2.5.5 interception remains blocked. Neither result establishes general-purpose sandboxing.


A source-level `AbortSignal` requests termination of one-shot host child processes, but no guarantee is made that all descendants are terminated or that upstream provider billing stops immediately. Source output quotas and sanitized SDK errors are independent safeguards, not proof of native sandbox containment. See [OPS-06 live acceptance](https://github.com/rzqllh/xyeena/issues/37).

## Vulnerability reporting

Please use [GitHub's private vulnerability reporting](https://github.com/rzqllh/xyeena/security/advisories/new) if available for this repository. If private reporting is not enabled, contact a maintainer through a confidential channel before disclosing exploit details. Do not include credentials, sensitive logs or private workspace contents in a public issue.

Provide affected version or commit, environment, reproducible steps, observed impact and a minimal sanitized test case. Security reports are assessed according to exploitability and actual trust boundaries rather than test-count totals.

## Supported scope

The published npm package and the current `main` source may have different capabilities. Report the exact package version and host runtime involved. No security-fix timeline or production-service SLA is implied by this open-source repository.

## Trust model

- **Host authority:** the agent host owns authentication, user authorization, sandboxing and real tool interception. A caller-supplied approval object or model message is not a substitute for human consent.
- **Skills and plugins:** installed files are not automatically active, trusted or safe. Discovery must not execute third-party content. Review untrusted skills before enabling them.
- **Execution:** read-only local previews are distinct from agent/model calls and write-capable work. Privileged operations must be authorized by the host and fail closed where enforcement is unavailable.
- **Evidence:** a model's `PASS` or `VERIFIED` assertion is not sufficient for task verification; an independent check tied to the task is required.
- **Delegation:** worker actions must not exceed the authority or workspace scope granted to the parent; do not assume external MCP transport health proves worker readiness.
- **Local data:** backup journals, checkpoints and audit files may contain workspace metadata. Keep them outside version control and avoid including raw secrets in reports.

## Release assurance

Automated CI, contract tests, package smoke tests and static checks provide useful evidence but do not establish live host integration, penetration-test certification, or a security warranty. Outstanding operational acceptance is recorded in [the acceptance matrix](docs/xyeena-rig/ACCEPTANCE_MATRIX.md).

Source is provided under the [MIT License](LICENSE), without warranty.
