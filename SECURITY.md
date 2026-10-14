# Security policy

## Reporting

Use the [GitHub repository Security tab](https://github.com/rzqllh/xyeena/security) for private vulnerability reporting if enabled. If unavailable, use a confidential maintainer contact channel rather than publicly disclosing sensitive details. Do not post secrets, exploit payloads against real systems, credentials, or private user data in public issues.

## Design boundaries

Xyeena Rig treats read-only/local reversible operations differently from external or destructive
operations. Its consent engine is advisory infrastructure for agent runtimes; it does not replace
runtime sandboxing, OS permissions, provider authorization, or human review.

Third-party skills and scripts are executable instructions. Review them before installation.
Xyeena does not download skills at runtime.
