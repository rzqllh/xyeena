# Activation Matrix

| Task signal | Required harnesses |
|---|---|
| Any implementation | core/*, tool-action-safety |
| Continue prior work | continuation, git when repo mutation |
| Shared UI/layout | design-system, layout, hierarchy, impact-regression, responsive, mobile |
| New interactive component | ui, ux, accessibility, motion if animated |
| Copy/content redesign | hierarchy, copy, product-contract |
| Shared state/data change | architecture, state-data, testing, impact-regression |
| API/server action | api-runtime, security, testing |
| Admin/auth/privileged action | security, threat-model as risk requires, authz, secrets-privacy |
| New dependency | dependency, supply-chain |
| Production performance work | performance, perceived-performance where UX-facing, resource-budget |
| Push/PR/deploy | git, deployment-budget, repo-ai-docs |
| Production release | release-rollback, evidence-before-claim |
| Audit request | audit + the domain being audited |
| External web/file/issue drives tool actions | external-content-trust |

## Escalation
LOW risk: focused local checks.
MEDIUM: affected consumers + broader regression.
HIGH: contract/security/runtime tests + rollback consideration.
CRITICAL: explicit approval and minimal, reversible execution path wherever possible.
