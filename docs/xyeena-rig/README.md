# Engineering assurance

This directory contains the design contracts, acceptance criteria and operational release gates for Xyeena Rig. It is maintained alongside source code and CI. A passing test suite is not a claim of live readiness in every supported host.

| Document | Purpose |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Components and trust boundaries |
| [Requirements](REQUIREMENTS_TRACEABILITY.md) | Functional requirement coverage R01–R15 |
| [Roadmap](ROADMAP.md) | Implemented phases and outstanding operational acceptance |
| [Acceptance matrix](ACCEPTANCE_MATRIX.md) | Acceptance conditions A01–A33, plus A14a |
| [Task tracker](TASK_TRACKER.md) | Remaining tasks and release dependencies |
| [Risk register](RISK_REGISTER.md) | Residual risks and mitigations |
| [Validation](EVIDENCE.md) | Evidence sources and qualification of claims |
| [Operator runbook](RUNBOOK.md) | Installation, testing, rollback and release readiness |

## Assurance levels

- **Implemented:** source functionality exists.
- **CI validated:** automated checks and fixtures pass at a recorded commit.
- **Integration validated:** supported interfaces pass contract tests; this does not prove availability in a production host.
- **Live accepted:** a configured host has been exercised end-to-end with recorded evidence.
- **Blocked:** a required external capability or operational check remains unavailable.

Public npm `0.4.1` is the currently published baseline. Later changes on `main` have not been published as npm `0.5.0`. Separate approval and outstanding live-acceptance work are required for a public release.

The project's security model is documented in [SECURITY.md](../../SECURITY.md).
