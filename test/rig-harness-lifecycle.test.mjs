import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectRigHarness, enforceRigPreflight } from '../src/rig-harness-lifecycle.mjs';
import { applyCompactSetup } from '../src/compact-setup.mjs';
import { previewOrchestration } from '../src/orchestrator.mjs';
import { setupHealthCheck } from '../src/setup-health.mjs';

function temp(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-gate-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return dir;
}
test('core Harness is available for every Rig preview without project opt-in',t=>{
  const cwd=temp(t);
  const inspection=inspectRigHarness({cwd,contextualRequested:['testing','security']});
  assert.equal(inspection.core.status,'rig-read-only-boundary');
  assert.ok(inspection.core.rules.includes('permission-boundary'));
  assert.deepEqual(inspection.contextual.requested,['50-quality','60-security']);
  assert.deepEqual(inspection.contextual.installed,[]);
  assert.equal(fs.readdirSync(cwd).length,0);
});
test('contextual Harness detects only physically installed project guides',t=>{
  const cwd=temp(t);
  const dir=path.join(cwd,'.xyeena','harness','guides','50-quality');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'README.md'),'# testing');
  const result=inspectRigHarness({cwd,contextualRequested:['testing','security']});
  assert.deepEqual(result.contextual.installed,['50-quality']);
  assert.deepEqual(result.contextual.missing,['60-security']);
});
test('read-only execution gate requires actual selected governor and explicit consent',t=>{
  const cwd=temp(t);
  applyCompactSetup({cwd,runtime:'codex',preset:'essential',yes:true});
  const plan=previewOrchestration({cwd,runtime:'codex',goal:'Review tests',includeGlobal:false});
  assert.equal(plan.harness.core.status,'rig-read-only-boundary');
  assert.equal(setupHealthCheck({cwd,runtime:'codex',includeGlobal:false}).filesystem.orchestratorName,'xyeena-rig');
  assert.throws(()=>enforceRigPreflight(plan),/consent/);
  const gate=enforceRigPreflight(plan,{consent:true});
  assert.equal(gate.status,'PASS');
  assert.equal(gate.externalActionsAuthorized,false);
  assert.throws(()=>enforceRigPreflight({...plan,entrypoint:'/missing'},{consent:true}),/governor/);
});
