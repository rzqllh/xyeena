# Risk register

| Risk | Severity | Mitigation | Status |
| --- | --- | --- | --- |
| Nested skills ignored by native hosts | High | One root SKILL.md and nested references, not nested native discovery | LIVE unverified |
| User/third-party files overwritten | Critical | Owned marker, hash verification, reject unowned/modified, explicit update+backup | CODED |
| Compact install breaks legacy slash names | High | Keep legacy layout; no silent migration | OPEN |
| Skill folder presence mistaken for activation | High | Candidate-only reporting; add native inventory adapter | PARTIAL |
| Same-name skill spoofed as Superior or Superpowers | High | Candidate-only until provenance validated | OPEN |
| Malicious SKILL.md content gains permissions | Critical | Read metadata only at discovery, enforce host trust and operation policy | PARTIAL |
| Superpowers independently starts uncontrolled workers | Critical | Single workflow owner; runtime bootstrap arbitration needed | OPEN |
| Simpul missing but fake agent reported as active | Critical | Require healthy actionable adapter before choice | POLICY only |
| Parallel shared writes corrupt workspace | Critical | Serialize unless isolated worktree proven | POLICY only |
| Harness policy declared but not enforced | Critical | Separate executable gates with failure-injection smoke | OPEN |
| Cloud token cost explosion | Medium | Bounded selection, inline default, explicit provider consent | PARTIAL |
| Interrupted upgrade corrupts host entry | High | Stage then rename, backup restore; failure injection pending | PARTIAL |
| Host configuration modified implicitly | High | No auth, trust, hooks or unrelated skill edits | CODED |
