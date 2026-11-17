import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCortex } from '../src/core/index.mjs';

describe('v1 Cortex native-execution honesty', () => {
  it('recognizes all rewritten skill explicit entrypoints', () => {
    const cortex = createDefaultCortex();
    for (const id of ['xyeena-context', 'xyeena-handoff', 'xyeena-grill', 'xyeena-prototype', 'xyeena-skillcraft']) {
      const detected = cortex.detectExplicitSkills('Use /' + id + ' for this task');
      assert.ok(detected.includes(id), 'Missing ' + id);
    }
  });

  it('separates registry ONLINE from live host readiness', () => {
    const state = createDefaultCortex().getStatus();
    assert.equal(state.status, 'ONLINE');
    assert.equal(state.statusScope, 'IN_PROCESS_REGISTRY_ONLY');
    assert.equal(state.nativeHostExecution, 'NOT_PROBED');
    assert.equal(state.liveOrchestrationVerified, false);
  });

  it('propagates native BLOCKED without executing dependents', async () => {
    const cortex = createDefaultCortex();
    let invoked = 0;
    const outcome = await cortex.execute('implement this caching task', {
      executor: async () => {
        invoked += 1;
        return { status: 'BLOCKED', reason: 'No native worker dispatch available' };
      }
    });
    assert.equal(outcome.status, 'BLOCKED');
    assert.equal(outcome.verificationStatus, 'NOT_VERIFIED');
    assert.equal(outcome.executedSteps.length, 0);
    assert.equal(invoked, 1);
    assert.ok(cortex.evidenceLedger.records.every(record => record.status !== 'VERIFIED'));
  });

  it('does not treat REVIEW_REQUIRED or UNKNOWN as successful execution', async () => {
    for (const returnedStatus of ['REVIEW_REQUIRED', 'UNKNOWN', 'NOT_RUN', 'METHOD_EVALUATED']) {
      const cortex = createDefaultCortex();
      const outcome = await cortex.execute('implement this caching task', {
        executor: async () => ({ status: returnedStatus })
      });
      assert.equal(outcome.status, 'BLOCKED', returnedStatus);
      assert.equal(outcome.executedSteps.length, 0);
    }
  });

  it('a resolved callback is not independent proof of host parity or side effects', async () => {
    const cortex = createDefaultCortex();
    const outcome = await cortex.execute('implement this caching task', {
      executor: async () => ({ status: 'SUCCESS', message: 'acknowledged' })
    });
    assert.equal(outcome.status, 'COMPLETED');
    assert.equal(outcome.verificationStatus, 'REVIEW_REQUIRED');
    assert.equal(outcome.hostAcceptance, 'NOT_VERIFIED');
    assert.ok(cortex.evidenceLedger.records.every(record => record.status !== 'VERIFIED'));
  });
});
