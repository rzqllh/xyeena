import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectOptionalProviders, selectSubagentBackend, buildEnterprisePolicy } from '../src/enterprise-policy.mjs';

test('provider inventory only recognizes eligible candidates and does not claim activation',()=>{
  const providers=inspectOptionalProviders([
    {name:'superior-ux',availability:'detected'},
    {name:'superior-security',availability:'requires-host-trust'},
    {name:'subagent-driven-development',availability:'detected'},
    {name:'other',availability:'detected'}
  ]);
  assert.deepEqual(providers.superior.skills,['superior-ux']);
  assert.deepEqual(providers.superpowers.skills,['subagent-driven-development']);
  assert.equal(providers.superpowers.status,'candidate');
});
test('subagent policy never creates synthetic workers or assumes healthy backend',()=>{
  const task={requiresDelegation:true,independent:true,readOnly:true};
  assert.equal(selectSubagentBackend({task}).backend,'inline');
  const available={simpul:{enabled:true,healthy:false,adapterAvailable:true},native:{enabled:true,healthy:true,adapterAvailable:true,supportsParallel:true}};
  assert.deepEqual(selectSubagentBackend({task,backends:available}),{backend:'native',parallelism:2,reason:'verified-backend-capability'});
  available.simpul.healthy=true;
  available.simpul.supportsParallel=true;
  assert.equal(selectSubagentBackend({task,backends:available}).backend,'simpul');
});
test('parallel writes require actual isolation and bounded budget',()=>{
  const backends={simpul:{enabled:true,healthy:true,adapterAvailable:true,supportsWrites:true,supportsParallel:true}};
  const task={requiresDelegation:true,independent:true,readOnly:false};
  assert.equal(selectSubagentBackend({task,backends,maxParallel:5}).parallelism,1);
  assert.equal(selectSubagentBackend({task:{...task,isolatedWorktrees:true},backends,maxParallel:5}).parallelism,5);
  assert.throws(()=>selectSubagentBackend({maxParallel:17}),/budget/);
});
test('core harness policy is present even without optional providers',()=>{
  const policy=buildEnterprisePolicy({goal:'Fix a regression and verify tests',state:'DEBUG',selectedSkills:['xyeena-rig']});
  assert.equal(policy.nativeFallbackAvailable,true);
  assert.equal(policy.workflowOwner,'xyeena-rig');
  assert.ok(policy.harness.corePolicy.includes('permission-boundary'));
  assert.ok(policy.harness.contextualRequested.includes('testing'));
  assert.equal(policy.delegation.backend,'inline');
  assert.equal(policy.optionalProviders.superior.skills.length,0);
});
