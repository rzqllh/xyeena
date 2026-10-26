import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from '../src/paths.mjs';

const read=relative=>fs.readFileSync(path.join(PACKAGE_ROOT,relative),'utf8');

test('public documentation distinguishes released package from source functionality',()=>{
  const readme=read('README.md'),website=read('site/index.html');
  assert.match(readme,/0\.4\.1/);
  assert.match(readme,/unreleased/i);
  assert.match(readme,/live.*(acceptance|validation)|acceptance.*live/i);
  assert.match(website,/0\.4\.1/);
  assert.doesNotMatch(website,/v0\.2\.0 live|v0\.2\.1 staging/i);
});
test('internal planning files are not part of maintained repository documentation',()=>{
  const retired=[
    'docs/audit','docs/HARNESS-V3.1-IMPORT-PLAN.md',
    'docs/RELEASE-ACCEPTANCE.md','docs/RELEASE-V0.3.0.md',
    'docs/V0.3.0-RELEASE-ACCEPTANCE.md','docs/xyeena-rig/PR_INDEX.md'
  ];
  for(const file of retired)assert.equal(fs.existsSync(path.join(PACKAGE_ROOT,file)),false,file);
  for(let i=1;i<=8;i++){
    assert.equal(fs.existsSync(path.join(PACKAGE_ROOT,`docs/xyeena-rig/evidence-p0${i}.md`)),false);
  }
});
test('required security notices and product reference files are present',()=>{
  for(const file of ['LICENSE','NOTICE.md','SECURITY.md','CONTRIBUTING.md',
    'docs/STATUS.md','docs/GETTING-STARTED.md','docs/ARCHITECTURE.md','docs/CLI-REFERENCE.md',
    'docs/xyeena-rig/ROADMAP.md','docs/xyeena-rig/ACCEPTANCE_MATRIX.md',
    'docs/xyeena-rig/EVIDENCE.md']){
    assert.ok(fs.statSync(path.join(PACKAGE_ROOT,file)).isFile(),file);
  }
});
test('relative links in maintained Markdown resolve to files or directories',()=>{
  const docs=['README.md','CONTRIBUTING.md','SECURITY.md','docs/STATUS.md',
    'docs/GETTING-STARTED.md','docs/ARCHITECTURE.md','docs/CLI-REFERENCE.md',
    'docs/INTELLIGENT-ROUTING.md','docs/RUNTIME-ADAPTERS.md',
    'docs/ANTIGRAVITY-GUIDED.md','docs/BRANDING.md',
    'docs/xyeena-rig/README.md','docs/xyeena-rig/ROADMAP.md',
    'docs/xyeena-rig/ARCHITECTURE.md','docs/xyeena-rig/RUNBOOK.md',
    'docs/xyeena-rig/TASK_TRACKER.md','docs/xyeena-rig/RISK_REGISTER.md',
    'docs/xyeena-rig/EVIDENCE.md','docs/xyeena-rig/REQUIREMENTS_TRACEABILITY.md',
    'docs/xyeena-rig/ACCEPTANCE_MATRIX.md'];
  for(const file of docs){
    const contents=read(file);
    for(const m of contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
      const target=m[1].split('#')[0];
      if(!target||/^(https?:|mailto:)/.test(target))continue;
      assert.ok(fs.existsSync(path.resolve(PACKAGE_ROOT,path.dirname(file),decodeURIComponent(target))),`${file}: ${target}`);
    }
  }
});

test('public status is dated and independently separates npm baseline, CLI host evidence and IDE blocker',()=>{
  const status=read('docs/STATUS.md');
  const readme=read('README.md'),site=read('site/index.html');
  const packageVersion=JSON.parse(read('package.json')).version;
  assert.match(status,/2026-10-26/);
  assert.match(status,/Antigravity CLI.*1\.4\.7/i);
  assert.match(status,/force_ask/);
  assert.match(status,/auto|automatic|deny/i);
  assert.match(status,/2\.5\.5/);
  assert.match(status,/LIVE BLOCKED/);
  assert.match(status,/UNVERIFIED/);
  assert.match(status,/Simpul.*BLOCKED/s);
  assert.match(status,/explicit human approval/i);
  assert.ok(readme.includes(`@${packageVersion}`));
  assert.ok(site.includes(`@${packageVersion}`));
  assert.ok(site.includes('id="source-status"'));
  assert.ok(site.includes('docs/STATUS.md'));
  assert.match(site,/IDE 2\.5\.5:[^<]*<\/strong> the expected native hook denial was not enforced/i);
});
test('all maintained product/engineering guides link to the single public source-status reference',()=>{
  const groups=['docs','docs/xyeena-rig'];
  for (const dir of groups) {
    for (const item of fs.readdirSync(path.join(PACKAGE_ROOT,dir),{withFileTypes:true})) {
      if (!item.isFile() || !item.name.endsWith('.md') || item.name==='STATUS.md') continue;
      const file=path.join(dir,item.name);
      assert.match(read(file),/\]\((?:\.\.\/)?STATUS\.md\)/,file);
    }
  }
  assert.match(read('SECURITY.md'),/\]\(docs\/STATUS\.md\)/);
  assert.match(read('CONTRIBUTING.md'),/\]\(docs\/STATUS\.md\)/);
});
test('live acceptance is distinct from historical test counts and missing host support',()=>{
  const tracker=read('docs/xyeena-rig/TASK_TRACKER.md');
  const acceptance=read('docs/xyeena-rig/ACCEPTANCE_MATRIX.md');
  const evidence=read('docs/xyeena-rig/EVIDENCE.md');
  const changelog=read('CHANGELOG.md');
  const ops07=tracker.split('\n').find(line=>line.startsWith('| OPS-07 |'));
  assert.ok(ops07);
  assert.match(ops07,/CLI 1\.4\.7/);
  assert.match(ops07,/AUTO-DENY LIVE PASS/);
  assert.match(ops07,/IDE 2\.5\.5 LIVE BLOCKED/);
  assert.doesNotMatch(tracker.split('\n').find(line=>line.startsWith('| OPS-08 |'))||'',/327\/327/);
  assert.match(acceptance,/SCOPED AUTO-DENY LIVE PASS/);
  assert.match(evidence,/historical snapshots/i);
  assert.match(changelog,/Unreleased.*2026-10-26/);
  assert.match(changelog,/No `0\.5\.0` release/i);
});

test('public acceptance backlog keeps named external host gates visible',()=>{
  const status=read('docs/STATUS.md');
  for(const num of [34,35,36,37])
    assert.ok(status.includes(`/issues/${num}`),`Missing external acceptance issue #${num}`);
  assert.match(status,/cannot close|only independent observations|not finished work/i);
  assert.match(status,/2a673c64/);
});

test('release status separates current source CI from unverified native host acceptance',()=>{
  const status=read('docs/STATUS.md');
  const runbook=read('docs/xyeena-rig/RUNBOOK.md');
  for(const pr of [39,40,41,42]) assert.ok(status.includes('/pull/'+pr));
  assert.match(status,/c84f7c45/);
  assert.match(status,/fake.*provider/i);
  assert.match(status,/No wider live-host/i);
  assert.match(runbook,/git worktree add --detach/);
  assert.match(runbook,/ops preflight --dir/);
  assert.match(status,/0\.4\.1/);
});
