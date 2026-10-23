import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectOptionalProviders,
  selectSubagentBackend,
  buildEnterprisePolicy,
  arbitrateWorkflow,
  nativeFallbackForSkill,
  NATIVE_EQUIVALENCE
} from '../src/enterprise-policy.mjs';

test('provider inventory only recognizes eligible candidates and does not claim activation', () => {
  const providers = inspectOptionalProviders([
    { name: 'superior-ux', availability: 'detected' },
    { name: 'superior-security', availability: 'requires-host-trust' },
    { name: 'subagent-driven-development', availability: 'detected' },
    { name: 'other', availability: 'detected' }
  ]);
  assert.deepEqual(providers.superior.skills, ['superior-ux']);
  assert.deepEqual(providers.superpowers.skills, ['subagent-driven-development']);
  assert.equal(providers.superpowers.status, 'candidate');
  assert.deepEqual(providers.superior.untrusted, ['superior-security']);
});

test('subagent policy never creates synthetic workers or assumes healthy backend', () => {
  const task = { requiresDelegation: true, independent: true, readOnly: true };
  assert.equal(selectSubagentBackend({ task }).backend, 'inline');
  const available = {
    simpul: { enabled: true, healthy: false, adapterAvailable: true },
    native: { enabled: true, healthy: true, adapterAvailable: true, supportsParallel: true }
  };
  assert.deepEqual(selectSubagentBackend({ task, backends: available }), {
    backend: 'native',
    parallelism: 2,
    reason: 'verified-backend-capability'
  });
  available.simpul.healthy = true;
  available.simpul.supportsParallel = true;
  assert.equal(selectSubagentBackend({ task, backends: available }).backend, 'simpul');
});

test('parallel writes require actual isolation and bounded budget', () => {
  const backends = { simpul: { enabled: true, healthy: true, adapterAvailable: true, supportsWrites: true, supportsParallel: true } };
  const task = { requiresDelegation: true, independent: true, readOnly: false };
  assert.equal(selectSubagentBackend({ task, backends, maxParallel: 5 }).parallelism, 1);
  assert.equal(selectSubagentBackend({ task: { ...task, isolatedWorktrees: true }, backends, maxParallel: 5 }).parallelism, 5);
  assert.throws(() => selectSubagentBackend({ maxParallel: 17 }), /budget/);
});

test('core harness policy is present even without optional providers', () => {
  const policy = buildEnterprisePolicy({ goal: 'Fix a regression and verify tests', state: 'DEBUG', selectedSkills: ['xyeena-rig'] });
  assert.equal(policy.nativeFallbackAvailable, true);
  assert.equal(policy.workflowOwner, 'xyeena-rig');
  assert.ok(policy.harness.corePolicy.includes('permission-boundary'));
  assert.ok(policy.harness.contextualRequested.includes('testing'));
  assert.equal(policy.delegation.backend, 'inline');
  assert.equal(policy.optionalProviders.superior.skills.length, 0);
  assert.equal(policy.arbitration.mode, 'native-standalone');
});

test('Case 1: Both Superpowers and Superior eligible -> integrated dual provider with single governor', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'writing-plans', availability: 'detected' },
    { name: 'superior-code-review', availability: 'detected' },
    { name: 'superior-testing', availability: 'detected' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Build feature with TDD and review code',
    state: 'EXECUTE',
    inventory,
    selectedSkills: ['writing-plans', 'superior-code-review', 'superior-testing']
  });
  assert.equal(arbitration.mode, 'integrated-dual-provider');
  assert.equal(arbitration.workflowOwner, 'xyeena-rig');
  assert.equal(arbitration.singleGovernorEnforced, true);
  assert.equal(arbitration.competingControllersBlocked, true);
  assert.equal(arbitration.superpowers.delegatedRole, 'workflow-methodology');
  assert.equal(arbitration.superior.delegatedRole, 'specialist-quality');
  assert.ok(arbitration.superpowers.activeSkills.includes('writing-plans'));
  assert.ok(arbitration.superior.activeSkills.includes('superior-code-review'));
});

test('Case 2: Only Superpowers available -> workflow methodology with native specialist fallback', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'test-driven-development', availability: 'detected' },
    { name: 'systematic-debugging', availability: 'detected' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Debug unexpected error and verify',
    state: 'DEBUG',
    inventory,
    selectedSkills: ['systematic-debugging']
  });
  assert.equal(arbitration.mode, 'superpowers-with-native-specialist');
  assert.equal(arbitration.superpowers.delegatedRole, 'workflow-methodology');
  assert.equal(arbitration.superior.delegatedRole, null);
  assert.equal(arbitration.workflowOwner, 'xyeena-rig');
});

test('Case 3: Only Superior available -> specialist quality with native workflow fallback', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'superior-ui', availability: 'detected' },
    { name: 'superior-api-security', availability: 'detected' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Audit API authentication and responsive UI',
    state: 'REVIEW',
    inventory,
    selectedSkills: ['superior-ui', 'superior-api-security']
  });
  assert.equal(arbitration.mode, 'superior-with-native-workflow');
  assert.equal(arbitration.superior.delegatedRole, 'specialist-quality');
  assert.equal(arbitration.superpowers.delegatedRole, null);
  assert.equal(arbitration.workflowOwner, 'xyeena-rig');
});

test('Case 4: Neither available -> complete native standalone execution', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'xyeena-core', availability: 'detected' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Implement new feature from locked specification',
    state: 'EXECUTE',
    inventory,
    selectedSkills: ['xyeena-execute']
  });
  assert.equal(arbitration.mode, 'native-standalone');
  assert.equal(arbitration.workflowOwner, 'xyeena-rig');
  assert.equal(arbitration.superpowers.delegatedRole, null);
  assert.equal(arbitration.superior.delegatedRole, null);
});

test('Case 5: Provider disabled or untrusted -> automatic native fallback without failing', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'writing-plans', availability: 'disabled' },
    { name: 'superior-api-security', availability: 'requires-host-trust' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Plan implementation and audit security',
    state: 'PLAN',
    inventory,
    selectedSkills: ['writing-plans', 'superior-api-security']
  });
  assert.equal(arbitration.mode, 'native-standalone');
  assert.equal(arbitration.superpowers.status, 'disabled');
  assert.equal(arbitration.superior.status, 'untrusted');
  assert.equal(arbitration.nativeFallback.active, true);
  assert.equal(arbitration.nativeFallback.mappings['writing-plans'], 'xyeena-plan');
  assert.equal(arbitration.nativeFallback.mappings['superior-api-security'], 'xyeena-security');
});

test('Case 6: Platform-incompatible provider -> triggers native fallback', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'superior-performance', availability: 'incompatible-platform' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Optimize database queries',
    state: 'RESEARCH',
    inventory,
    selectedSkills: ['superior-performance']
  });
  assert.equal(arbitration.superior.status, 'incompatible');
  assert.equal(arbitration.nativeFallback.active, true);
  assert.equal(arbitration.nativeFallback.mappings['superior-performance'], 'xyeena-architecture');
});

test('Case 7: Conflicting workflow instructions and overlapping reviews deduplicated', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'requesting-code-review', availability: 'detected' },
    { name: 'superior-code-review', availability: 'detected' },
    { name: 'test-driven-development', availability: 'detected' },
    { name: 'superior-testing', availability: 'detected' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Run TDD and full code review',
    state: 'REVIEW',
    inventory,
    selectedSkills: ['requesting-code-review', 'superior-code-review', 'test-driven-development', 'superior-testing']
  });
  assert.equal(arbitration.mode, 'integrated-dual-provider');
  assert.ok(arbitration.deduplications.length > 0);
  assert.ok(arbitration.deduplications[0].includes('unified'));
});

test('Case 8: nativeFallbackForSkill maps all third-party capabilities to verified native counterparts', () => {
  assert.equal(nativeFallbackForSkill('writing-plans'), 'xyeena-plan');
  assert.equal(nativeFallbackForSkill('executing-plans'), 'xyeena-execute');
  assert.equal(nativeFallbackForSkill('systematic-debugging'), 'xyeena-debug');
  assert.equal(nativeFallbackForSkill('test-driven-development'), 'xyeena-test');
  assert.equal(nativeFallbackForSkill('verification-before-completion'), 'xyeena-verify');
  assert.equal(nativeFallbackForSkill('superior-code-review'), 'xyeena-review');
  assert.equal(nativeFallbackForSkill('superior-api-security'), 'xyeena-security');
  assert.equal(nativeFallbackForSkill('superior-ui'), 'xyeena-interface');
  assert.equal(nativeFallbackForSkill('superior-docs'), 'xyeena-writing');
  assert.equal(nativeFallbackForSkill('superior-delivery'), 'xyeena-release');
  assert.equal(nativeFallbackForSkill('unknown-skill'), 'xyeena-core');
});

test('regression P02: arbitrateWorkflow computes arbitratedSkills with deduplicated and fallback skills', () => {
  const inventory = [
    { name: 'xyeena-rig', availability: 'detected' },
    { name: 'superior-code-review', availability: 'detected' },
    { name: 'requesting-code-review', availability: 'detected' },
    { name: 'blocked-external-skill', availability: 'disabled' }
  ];
  const arbitration = arbitrateWorkflow({
    goal: 'Review code with unified quality',
    state: 'REVIEW',
    inventory,
    selectedSkills: ['xyeena-rig', 'superior-code-review', 'requesting-code-review', 'blocked-external-skill']
  });

  // Superior is candidate, duplicate requesting-code-review is suppressed, blocked skill is replaced
  assert.ok(arbitration.arbitratedSkills.includes('xyeena-rig'));
  assert.ok(arbitration.arbitratedSkills.includes('superior-code-review'));
  assert.ok(!arbitration.arbitratedSkills.includes('requesting-code-review'));
  assert.ok(arbitration.arbitratedSkills.includes('xyeena-core')); // fallback for blocked-external-skill
});

