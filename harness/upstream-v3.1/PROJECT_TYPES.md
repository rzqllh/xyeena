# Supported Project Types

v3 is intentionally multi-project.

Out of the box it can reason about:

## Web / JavaScript
- Next.js
- generic Node.js
- static HTML/CSS/JS
- monorepos

## Python
- pyproject/requirements/Pipenv/Poetry/uv-style projects

## Documentation repositories
Docs-only changes automatically lower the default risk level unless a project profile says otherwise.

## Provider adapters
- GitHub
- Vercel

## Unknown stacks
Unknown stacks still receive universal:
- repo state inspection
- secret/artifact scanning
- scope/risk handling
- contract checking
- evidence generation
- Git safety

Project-specific verification can be configured explicitly without modifying the universal core.

## Extending

Add a new adapter instead of editing core when adding:
- another framework
- another language
- another CI system
- another deployment provider
- another repository topology

This keeps the system usable across many unrelated projects.
