import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const ROOT = resolve(process.cwd());
function renderQualificationDocs(h,b,u){
  const m=(a)=>a.join('\n')+'\n';
  const integration=Number(h.testsPassed||0),total=Number(h.testsTotal||0);
  const sha=u.archive?.sha256||'NOT_REPORTED';
  const base='a8c038a9bd965029f21547715e7079d2596213f9';
  const gate=[
    '# Veyra v1.0 — Release Gate Decision (Independent Evidence Correction)',
    '', '**Verdict: RELEASE_BLOCKED / REVIEW_READY.** Qualification records are frozen against commit '+base+'.',
    '',
    '| Gate | Evidence | Verdict |',
    '| --- | --- | --- |',
    '| Local Node integration | '+integration+'/'+total+' direct engine checks reported | PASS_AS_INTEGRATION_ONLY |',
    '| Native Gemini/Codex/Claude E2E | No verifiable native agent tool traces in evidence | NOT_RUN |',
    '| Capability-matched A/B/C | Original baseline scores hardcoded, no actual agent comparator runs | RETRACTED |',
    '| Archive integrity | Local SHA-256 match reported, pinned source commit identity not checked | PARTIAL |',
    '| CI regression | GitHub Actions run 45143793670 succeeded on source commit | PASS_FOR_THAT_COMMIT |',
    '| Distribution license | NOTICE.md says unassigned, package.json says MIT | OWNER_DECISION_REQUIRED |',
    '| Stable public release | Native E2E, fair benchmark and legal gates unresolved | BLOCKED |',
    '',
    'The prior label CONDITIONAL_CANDIDATE remains a historical project report, not approval to publish.',
    'No merge, tag, npm publish or repository migration is authorized by this document.'
  ];
  const hostDoc=[
    '# Veyra v1.0 — Host Qualification Matrix (Corrected)',
    '', '## What was actually run',
    'The qualification/host_e2e_runner.mjs executes direct Node.js engine integrations in an isolated project. It does not invoke a Gemini, Codex or Claude prompt.',
    '',
    '| Test layer | Result | Evidence boundary |',
    '| --- | --- | --- |',
    '| Node.js engine integration | '+integration+'/'+total+' reported PASS | Tool/function-level, not native agent |',
    '| Gemini CLI native agent | NOT_RUN | Version detection is not a native E2E session |',
    '| Codex CLI native agent | NOT_RUN | No recorded native invocation |',
    '| Claude Code native agent | NOT_RUN | No recorded native invocation |',
    '',
    'Proof required for a future PASS: CLI command and version, isolated repository SHA, streaming tool-use and tool-result events, actual skill-read evidence, filesystem diff, execution exit status, cost/usage and an independently checkable assertion.',
    'Raw host_e2e_receipt.json is reclassified as NODE_INTEGRATION_ONLY. It must not be presented as LIVE_HOST_VERIFIED.'
  ];
  const benchmark=[
    '# Veyra v1.0 — Benchmark Evidence Correction',
    '', '**Historical A/B/C percentages are RETRACTED as release evidence.**',
    'The previous comparator A/B values were fixed illustrative assumptions, not measured same-host agents or actual upstream implementations. Comparator C included unconditional full scores and an incorrect WCAG pass comparison of an object against a number.',
    '',
    'The new benchmark_abc_runner.mjs performs local function checks and computes observed pass rates from outputs. It explicitly records:',
    '',
    '| Comparator | Current qualification |',
    '| --- | --- |',
    '| A: same-host agent without Veyra | NOT_RUN |',
    '| B: actual pinned upstream agent | NOT_RUN |',
    '| C: Veyra functions | LOCAL_FUNCTION_PROXY_ONLY |',
    '',
    'No A/B/C superiority percentage is released. The historical receipt remains marked RETRACTED for audit traceability. Future comparative evaluation must actually execute all three agent configurations with equal task set, model, context, tool access and budget.',
    '',
    'To create a new local-function-only receipt: node qualification/benchmark_abc_runner.mjs.'
  ];
  const origin=[
    '# Veyra v1.0 — Upstream Provenance (Corrected)',
    '',
    '| Layer | Evidence | Status |',
    '| --- | --- | --- |',
    '| Lockfile metadata | 21 pinned repositories declared | LOCKFILE_VALID reported |',
    '| Local ZIP | SHA-256 '+sha+' reported by Windows runner | LOCAL_ARCHIVE_HASH_REPORTED |',
    '| ZIP central directory | 45,640 entries reported | ARCHIVE_ENTRY_PRESENCE_REPORTED |',
    '| Actual archive contents in this audit | Archive binary not committed or independently rehashed | NOT_INDEPENDENTLY_VERIFIED |',
    '| Pinned Git commit contents | No 21 git HEAD / tree object proofs | SOURCE_SHA_NOT_VERIFIED |',
    '| references/manifest.json | File presence and size only | LEDGER_CONTENTS_NOT_VERIFIED |',
    '',
    'A ZIP checksum proves identity of a particular byte sequence if reproduced against the genuine archive; it does not prove each folder was generated from the claimed Git commit. Full source verification requires pinned Git object checks or equivalent independent content hash reconciliation.',
    'Do not present 21/21 SOURCE_SHA_VERIFIED without those receipts.'
  ];
  const q=[
    '# Veyra v1.0 — Independent Release Qualification Correction',
    '',
    '**Frozen evidence commit:** '+base,
    '**Decision:** REVIEW_READY / STABLE_RELEASE_BLOCKED',
    '',
    'The source branch and GitHub Actions regression matrix were verified. The previous release qualification evidence overstated native host execution, comparative benchmarks and upstream provenance.',
    '',
    'Node.js integration: '+integration+'/'+total+' recorded PASS. Native agent E2E: NOT_RUN for Gemini, Codex and Claude in the available evidence.',
    'A/B/C superiority percentages: RETRACTED. New runner measures Veyra functions only and does not simulate an upstream agent win rate.',
    'Local upstream archive SHA report: '+sha+'. Pinned source SHA identities and file ledger contents: NOT_VERIFIED.',
    'Legal gate: BLOCKED pending rights assessment and owner decision on NOTICE.md versus package.json licensing.',
    '',
    'Prior GitHub CI evidence: https://github.com/rzqllh/xyeena/actions/runs/45143793670',
    '',
    'Next executable step: run native host sessions with read-only permissions and retain sanitized tool events (see LIVE-HOST-RUNBOOK.md). After evidence reconciliation and license signoff, re-evaluate release gates.'
  ];
  const legal=[
    '# Veyra v1.0 — Distribution Rights and Attribution Gate',
    '',
    '**Legal release gate: BLOCKED / OWNER_DECISION_REQUIRED.**',
    '',
    'NOTICE.md states the assembled package has no owner-assigned distribution license and requires separate verification of original template rights.',
    'package.json currently declares MIT. Those statements conflict. This review does not assign or revoke the owner’s licensing rights.',
    'The 21 upstream license entries returned by bin/veyra.mjs are declarations, not independently verified file-content checks; auditedCount is now zero until provenance is inspected.',
    '',
    'Required before publishing: confirm ownership of original template, map exact bundled third-party content and LICENSE/NOTICE obligations, check asset and brand rights, obtain owner authorization for a package license, then align package.json, NOTICE.md and release notes.',
    'No existing upstream MIT/Apache notation should be treated as permission to redistribute arbitrary assets or the assembled product.'
  ];
  return {
    'RELEASE-GATE-DECISION.md':m(gate),
    'HOST-E2E-MATRIX.md':m(hostDoc),
    'BENCHMARK-RESULTS.md':m(benchmark),
    'UPSTREAM-INTEGRITY.md':m(origin),
    'RELEASE-QUALIFICATION.md':m(q),
    'LICENSE-PROVENANCE.md':m(legal)
  };
}
export function generateQualificationDocs() {
  const read = name => JSON.parse(readFileSync(join(ROOT,'qualification','receipts',name),'utf8'));
  const data = renderQualificationDocs(read('host_e2e_receipt.json'),read('benchmark_abc_receipt.json'),read('upstream_integrity_receipt.json'));
  for (const [name,body] of Object.entries(data)) writeFileSync(join(ROOT,'qualification',name),body,'utf8');
  return Object.keys(data);
}
if (process.argv[1] && process.argv[1].endsWith('generate_qualification_docs.mjs')) {
  try { console.log('Generated corrected reports: '+generateQualificationDocs().join(', ')); }
  catch(e) { console.error(e); process.exitCode=1; }
}
