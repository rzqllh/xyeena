# Third-party Source Provenance Template — Xyeena

**Status:** TEMPLATE, not an assertion any source is currently copied.
**Parent:** [Future upstream integration roadmap](XYEENA_UPSTREAM_INTEGRATION_2026-11-14.md)

This ledger must be populated **before** copying/adapting and publishing third-party material. Use one record per distinct source component or license boundary. Never rely on this file as a legal permission grant by itself.

## Per-component record

| Field | Required evidence |
| --- | --- |
| RE ID / component ID | Source inventory reference and proposed Xyeena capability |
| Upstream author and GitHub URL | Actual authoritative repository |
| Full pinned commit SHA + release | Both resolved; distinguish tag and HEAD |
| Original file path(s) | Exact paths at pinned commit, including referenced templates/assets |
| SHA-256/source content fingerprint | Recorded where practical |
| License at copied commit and file | License filename, SPDX identifier, exceptions |
| Copyright and notice ownership | Original copyright, patent/trademark notices if applicable |
| LICENSE/NOTICE placement | Exact Xyeena repository and npm-package locations |
| Reuse method | REFERENCE_ONLY / DIRECT_REUSE / MODIFIED_DERIVATIVE / COMPOSED / REIMPLEMENTED |
| Modified file notice | Description of material changes and where prominently marked |
| Destination file(s) | Xyeena repo path and package inclusion status |
| Runtime dependencies/hooks | Transitive licensing, safety and activation consent |
| Original upstream tests | Which were executed or NOT_RUN |
| Xyeena regression and comparative tests | Input fixtures, score rubric, results, host/evidence |
| Security/compatibility review | Trust boundary, script/MCP/plugin risks, platform limitations |
| Owner decision | APPROVED / REJECTED / DEFERRED, date, scope |
| Publication status | PRIVATE_WORK / PUBLIC_SOURCE_READY / NPM_READY / BLOCKED |

## License handling checklist

- [ ] File and tagged-version license independently checked.
- [ ] License permits intended reproduction/modification/redistribution.
- [ ] All required original copyright and license texts retained.
- [ ] Applicable Apache-2.0 NOTICE and prominent changes marked.
- [ ] Independent licensing checked for code, docs, skill prompts, presets, fonts and artwork.
- [ ] Upstream and downstream changes documented without misleading ownership claims.
- [ ] Package contents checked after npm pack; no accidental private materials.
- [ ] Any copyleft, source-available, mixed-license or unclear component escalated before copying.
- [ ] Owner consent for new execution/dependency/host permissions recorded.
- [ ] Public acknowledgement plan separated from mandatory legal compliance.

## Example record (illustrative only; no copying authorized)

**ID:** RE-31 / konoha-retrieval-candidate
**Source:** https://github.com/andycungkrinx91/konoha
**Reference commit observed:** 9789bdd1d57d5f7a39a58406105e36127ffdb35b
**License observed:** Apache-2.0 at LICENSE, copyright 2026 Andy Setiyawan
**Proposed purpose:** study bounded retrieval and SQLite FTS5 integration for optional Xyeena capability
**Reuse method:** REFERENCE_ONLY until an exact file and owner decision exist
**Destination:** not chosen
**Tests:** NOT_RUN by this planning task
**Owner status:** DEFERRED until alignment and audit grilling

## NOTICE.md policy

Current public NOTICE.md describes the **existing Rig implementation**; do not rewrite it now to imply 31 upstream projects have already been included. Later add exact reused-source acknowledgements and legal files per component, leaving "research influence" separate from "third-party code incorporated." A launch gratitude post is optional and not a substitute for licensing requirements.
