# Categorized Harness Catalog

The files in v1 cover the high-value baseline. The following modules are intentionally grouped so they can be added only when a project needs them.

## 00 Core / Agent Discipline
Implemented:
Anti-Slop, Scope Control, Evidence Before Claim, Continuation, Permission Boundary, Risk, Definition of Done.

Optional:
- Intent Preservation
- Failure Diagnosis
- Assumption Ledger
- Decision Record
- Context Budget
- Simplicity
- Maintainability

## 10 Personal / Project Profiles
Implemented:
Xyeena Profile.

Recommended profiles:
- Yomirra
- Portfolio
- Work/Corporate Reporting
- Experimental/Prototype

Profiles should contain durable preferences and domain invariants, not generic coding advice.

## 20 Product
Implemented:
Product Contract, Domain Invariants, Hierarchy.

Optional:
- Information Architecture
- Navigation Contract
- Feature Flag Lifecycle
- Admin UX Hierarchy
- Destructive Action
- Forms
- Empty/Loading/Error/Offline State
- Search/Filter Semantics
- Entitlement/Pricing
- Onboarding

## 30 Design & Experience
Implemented:
Design System, Layout, UI, UX, Mobile, Responsive, Motion, Accessibility, Copy.

Optional:
- Interaction
- Design Drift
- Visual Density
- Content Design
- Anti-AI Copy (can be extracted from Copy)
- Iconography
- Typography
- Color Semantics
- Touch/Gesture
- Desktop
- Tablet
- Browser Compatibility
- Internationalization
- SEO/Metadata
- Visual Regression

## 40 Engineering
Implemented:
Architecture, State & Data Flow, API & Runtime Boundary, Dependency Discipline.

Optional:
- Cache
- Concurrency/Race
- Persistence
- Migration
- Configuration
- Feature Flags
- PWA/Offline
- Background Jobs
- File/Upload
- Media/Image/Reader Pipeline
- Database
- Search/Indexing
- Third-Party Integration
- Error Boundary
- Resilience/Fallback
- External Service Failure
- Type Safety

## 50 Quality
Implemented:
Testing, Audit, Impact & Regression.

Optional:
- Test Quality
- E2E
- Contract Testing
- Cross-Surface Audit
- Consistency Audit
- Dead Code/Entropy
- Review
- Bug Reproduction
- Visual QA
- Browser QA

## 60 Security & Trust
Implemented:
Security, Threat Modeling, Authorization, Secrets & Privacy, Supply Chain.

Optional:
- Authentication
- Session
- Input/Output Encoding
- CSP / Browser Security
- SSRF
- CSRF
- XSS
- Abuse Resistance
- Rate Limiting
- Secure Admin
- Security Headers
- Data Classification
- Audit Logging
- Vulnerability Response

## 70 Performance & Cost
Implemented:
Performance, Perceived Performance, Resource Budget.

Optional:
- Bundle Budget
- Network Efficiency
- Media/Image Loading
- Rendering Budget
- Core Web Vitals
- Database Query Budget
- Serverless Invocation Budget
- Cache Efficiency

## 80 Operations
Implemented:
Git Lifecycle, Deployment Budget, Release & Rollback.

Optional:
- CI
- Environment Parity
- Observability
- Logging
- Incident/Hotfix
- Backup/Restore
- Branch Cleanup
- Versioning/Changelog
- Infrastructure Changes

## 90 Hygiene / Governance
Implemented:
Repository + AI Artifact + Documentation Hygiene.

Optional:
- Public Documentation Safety
- Naming
- License/Asset Provenance
- Generated Code
- TODO/Debt Register
- Repository Structure
- Stale Configuration

## 95 Agent / Tool Safety
Implemented:
External Content Trust, Tool & Action Safety.

Optional:
- Prompt Injection Defense
- Connector/Data Exfiltration Boundary
- Browser Automation Safety
- Command Execution Safety
- Filesystem Boundary
- Credential Use
- Human-in-the-Loop Gate
- Side-Effect Budget
- Agent-generated Code Security
- Untrusted Patch Review

## Important distinction
Do not merge these concepts:
- Design != UI != UX != Layout != Hierarchy.
- Mobile != Responsive.
- Security != Privacy != Authorization != Supply Chain.
- Audit is a method, not a quality criterion.
- Deployment Budget != Release Safety.
- Project Profile != generic engineering rules.
