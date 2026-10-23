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
    'docs/GETTING-STARTED.md','docs/ARCHITECTURE.md','docs/CLI-REFERENCE.md',
    'docs/xyeena-rig/ROADMAP.md','docs/xyeena-rig/ACCEPTANCE_MATRIX.md',
    'docs/xyeena-rig/EVIDENCE.md']){
    assert.ok(fs.statSync(path.join(PACKAGE_ROOT,file)).isFile(),file);
  }
});
test('relative links in maintained Markdown resolve to files or directories',()=>{
  const docs=['README.md','CONTRIBUTING.md','SECURITY.md',
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
