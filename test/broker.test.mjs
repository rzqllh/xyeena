import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentBroker } from '../src/broker.mjs';

test('only governor can change topology', async () => {
  const broker = new AgentBroker();
  await assert.rejects(
    () => broker.spawn({ actor: 'executor', role: 'researcher', taskId: 'T1' }),
    /only the Governor/,
  );
  const worker = await broker.spawn({ role: 'researcher', taskId: 'T1' });
  assert.equal(worker.role, 'researcher');
});

test('worker requests capability through governor instead of spawning peers', () => {
  const broker = new AgentBroker();
  const msg = broker.requestCapability({
    runId: 'R1', taskId: 'T1', from: 'executor', capability: 'xyeena-research', reason: 'API behavior unknown',
  });
  assert.equal(msg.type, 'CAPABILITY_REQUEST');
  assert.equal(msg.to, 'governor');
});
