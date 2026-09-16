# Security policy

## Reporting

Open a private security advisory in the GitHub repository after you publish it. Do not post
secrets, exploit payloads against real systems, credentials, or private user data in public issues.

## Design boundaries

Xyeena treats read-only/local reversible operations differently from external or destructive
operations. Its consent engine is advisory infrastructure for agent runtimes; it does not replace
runtime sandboxing, OS permissions, provider authorization, or human review.

Third-party skills and scripts are executable instructions. Review them before installation.
Xyeena does not download skills at runtime.
