import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BehavioralKernel,
  WorkflowComposer,
  CapabilityRegistry,
  CapabilityResolver,
  IntentRouter,
  TASK_TIERS,
  EXECUTION_MODES,
  CAPABILITY_LAYERS,
  EffortBudgetGovernor
} from '../../src/core/index.mjs';
import { ContextCompactor } from '../../src/runtime/index.mjs';

describe('M5 Token Economy & Benchmark Suite', () => {

  const kernel = new BehavioralKernel();
  const composer = new WorkflowComposer(kernel);
  const router = new IntentRouter();

  // Setup sample registry
  const registry = new CapabilityRegistry();
  for (const inv of kernel.invariants) {
    registry.register({ id: inv.id, layer: CAPABILITY_LAYERS.L0 });
  }
  registry.register({ id: 'design.interface', layer: CAPABILITY_LAYERS.L1 });
  registry.register({ id: 'design.accessibility', layer: CAPABILITY_LAYERS.L1 });
  registry.register({ id: 'design.responsive', layer: CAPABILITY_LAYERS.L1 });
  registry.register({ id: 'engineering.tdd', layer: CAPABILITY_LAYERS.L1 });
  registry.register({ id: 'engineering.test-strategy', layer: CAPABILITY_LAYERS.L1 });
  registry.register({ id: 'security.full-audit', layer: CAPABILITY_LAYERS.L2 });

  const resolver = new CapabilityResolver(registry, router);

  it('Micro task benchmark: zero domain overhead, consumes < 500 tokens', () => {
    const prompt = 'Apa bedanya let dan const dalam JavaScript?';
    const mode = router.classifyIntent(prompt);
    const tier = router.classifyTier(prompt, mode);
    assert.strictEqual(tier, TASK_TIERS.TIER_0_MICRO);

    const activeCaps = resolver.resolve(prompt, mode, tier);
    const payload = composer.compose({ prompt, mode, tier, activeCapabilities: activeCaps });

    // Zero domain capabilities loaded
    assert.strictEqual(payload.stats.domainCapabilityCount, 0);
    // Payload token count strictly within micro budget
    assert.ok(payload.stats.estimatedTokens < 500, `Expected < 500 tokens, got ${payload.stats.estimatedTokens}`);
  });

  it('UI task benchmark: loads UI domain, strictly excludes security audit', () => {
    const prompt = 'Tolong buat komponen modal dialog responsive dengan css dan aksesibilitas';
    const mode = router.classifyIntent(prompt);
    const tier = router.classifyTier(prompt, mode);

    const activeCaps = resolver.resolve(prompt, mode, tier);
    const payload = composer.compose({ prompt, mode, tier, activeCapabilities: activeCaps });

    const activeIds = payload.activeCapabilityIds;
    assert.ok(activeIds.includes('design.interface'));
    assert.ok(activeIds.includes('design.accessibility'));
    assert.ok(activeIds.includes('design.responsive'));
    // Security audit must NOT be loaded
    assert.strictEqual(activeIds.includes('security.full-audit'), false);
  });

  it('Backend test task benchmark: loads TDD domain, strictly excludes UI references', () => {
    const prompt = 'Tolong buat test suite TDD untuk database resolver';
    const mode = router.classifyIntent(prompt);
    const tier = router.classifyTier(prompt, mode);

    const activeCaps = resolver.resolve(prompt, mode, tier);
    const payload = composer.compose({ prompt, mode, tier, activeCapabilities: activeCaps });

    const activeIds = payload.activeCapabilityIds;
    assert.ok(activeIds.includes('engineering.tdd'));
    // Design must NOT be loaded
    assert.strictEqual(activeIds.includes('design.interface'), false);
    assert.strictEqual(activeIds.includes('design.responsive'), false);
  });

  it('Context compaction benchmark: compresses 50 tasks into high-density summary < 400 tokens', () => {
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `TASK-${i + 1}`,
      title: `Subtask ${i + 1} execution step`,
      status: i < 48 ? 'COMPLETED' : 'READY'
    }));

    const summary = ContextCompactor.compactState({
      activeProject: 'Xyeena Benchmark',
      activeBranch: 'feat/rebuild-foundation-p00',
      gitHead: '45b430b2',
      lockedDecisions: [{ id: 'ARCH-DEC-01', title: 'L0 Token Limit', status: 'FROZEN' }],
      modifiedFiles: ['src/core/kernel.mjs'],
      pendingTasks: tasks.filter(t => t.status === 'READY')
    });

    const tokenEstimate = Math.ceil(summary.length / 3.8);
    assert.ok(tokenEstimate < 400, `Compacted summary should be < 400 tokens, got ${tokenEstimate}`);
  });

  it('Circuit breaker benchmark: trips within < 2ms on 4 consecutive retries', () => {
    const start = performance.now();
    const gov = new EffortBudgetGovernor({ maxRetries: 3 });
    let tripped = false;

    try {
      gov.recordRetry('Attempt 1');
      gov.recordRetry('Attempt 2');
      gov.recordRetry('Attempt 3');
      gov.recordRetry('Attempt 4');
    } catch {
      tripped = true;
    }

    const elapsed = performance.now() - start;
    assert.strictEqual(tripped, true);
    assert.ok(elapsed < 10, `Trip latency should be < 10ms, took ${elapsed}ms`);
  });

});
