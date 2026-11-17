import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadRegistry } from '../src/registry.mjs';
import { resolveCapabilities } from '../src/resolver.mjs';
import { CortexOrchestrator } from '../src/core/cortex.mjs';

describe('xyeena-core L0 kernel invariants & microtask protection', () => {
  const registry = loadRegistry();
  const cortex = new CortexOrchestrator();

  it('preserves xyeena-core as invariant kernel across both positive and negative prompts', () => {
    const micro1 = resolveCapabilities(registry, { prompt: 'A small factual question: what is a constant?', state: 'TRIAGE' });
    const micro2 = resolveCapabilities(registry, { prompt: 'What is 2 + 2?', state: 'TRIAGE' });
    const substantial = resolveCapabilities(registry, { prompt: 'Implement user authentication with database migration', state: 'PLAN' });

    assert.equal(micro1.kernel, 'xyeena-core');
    assert.equal(micro2.kernel, 'xyeena-core');
    assert.equal(substantial.kernel, 'xyeena-core');
  });

  it('never leaks xyeena-core into domain candidate, primary, or supporting lists', () => {
    const prompts = [
      'What is 2 + 2?',
      'A small factual question: what is a constant?',
      'Review evidence and verify completion claims',
      'Implement this plan'
    ];

    for (const prompt of prompts) {
      const res = resolveCapabilities(registry, { prompt, state: 'TRIAGE' });
      assert.notEqual(res.primary?.name, 'xyeena-core');
      assert.ok(!res.supporting.some(x => x.name === 'xyeena-core'));
      assert.ok(!res.candidates.some(x => x.name === 'xyeena-core'));
    }
  });

  it('resolves micro tasks to TIER_0_MICRO with direct resolution, zero DAG, and zero subagents', () => {
    const microPrompts = [
      'What is 2 + 2?',
      'A small factual question: what is a constant?',
      'Define a variable in one sentence'
    ];

    for (const prompt of microPrompts) {
      const plan = cortex.resolve(prompt);
      assert.equal(plan.tier, 'TIER_0_MICRO', `Prompt "${prompt}" should resolve to TIER_0_MICRO`);
      assert.equal(plan.workflow.tier, 'TIER_0_MICRO');
      assert.equal(plan.workflow.requiresSubagent, false);
      assert.equal(plan.workflow.delegationStrategy, 'none');
      assert.equal(plan.workflow.requiresRiskGate, false);
      assert.equal(plan.workflow.steps.length, 1);
      assert.equal(plan.workflow.steps[0].name, 'Direct Resolution');
      assert.ok(plan.budget.l0TokenShare <= 1500, `L0 token share (${plan.budget.l0TokenShare}) must not exceed 1500 tokens`);
    }
  });

  it('allocates proper higher tier and domain capabilities for substantial implementation tasks', () => {
    const plan = cortex.resolve('implement this plan and fix the bug in src/resolver.mjs');
    assert.notEqual(plan.tier, 'TIER_0_MICRO');
    assert.ok(plan.activeCapabilities.some(c => c.layer === 'L0'), 'Must retain L0 kernel invariants');
  });
});
