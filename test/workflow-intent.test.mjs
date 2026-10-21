import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inferWorkflowState } from '../src/workflow-intent.mjs';
import { previewOrchestration } from '../src/orchestrator.mjs';

const cases = [
  ['Please debug this regression', 'DEBUG'],
  ['Perbaiki bug crash ketika startup', 'DEBUG'],
  ['Audit implementation for security issues', 'REVIEW'],
  ['Tinjau dan evaluasi perubahan source', 'REVIEW'],
  ['Riset dokumentasi API terbaru', 'RESEARCH'],
  ['Bandingkan opsi database', 'RESEARCH'],
  ['Create implementation roadmap', 'PLAN'],
  ['Rancang arsitektur modular', 'PLAN'],
  ['Implement the existing plan', 'PLAN'], // conservative: planning mention triggers review of plan
  ['Kerjakan modul baru', 'EXECUTE'],
  ['Please help with this question', 'TRIAGE']
];
for (const [goal, state] of cases) test('infer workflow '+state+': '+goal, () => {
  const result = inferWorkflowState(goal);
  assert.equal(result.state, state);
  assert.equal(result.automatic, true);
});
test('AUTO routing remains informational and explicit state can override', t => {
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-intent-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  for (const skill of ['xyeena-debug','xyeena-orchestrate']) {
    const dir=path.join(cwd,'.agents','skills',skill);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'SKILL.md'),
      '---\nname: '+skill+'\ndescription: Work on debugging\n---\n');
  }
  const auto=previewOrchestration({cwd,runtime:'codex',goal:'perbaiki crash',includeGlobal:false});
  assert.equal(auto.state,'DEBUG');
  assert.equal(auto.stateSource,'heuristic');
  assert.ok(auto.selectedSkills.includes('xyeena-debug'));
  assert.equal(auto.executed,false);
  const explicit=previewOrchestration({cwd,runtime:'codex',goal:'perbaiki crash',state:'REVIEW',includeGlobal:false});
  assert.equal(explicit.state,'REVIEW');
  assert.equal(explicit.stateSource,'explicit');
  assert.ok(!explicit.selectedSkills.includes('xyeena-debug'));
});
