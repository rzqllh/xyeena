---
paths:
  - "**/*.{sql,prisma,dbml}"
  - "**/migrations/**/*"
---
Validate schema behavior, ownership, migrations and rollback using the actual database tooling; do not infer production state from docs.
