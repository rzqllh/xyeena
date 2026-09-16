import { message } from './protocol.mjs';

// The broker deliberately owns topology. Workers may request capability help, but
// only the Governor actor may spawn/cancel workers. This prevents recursive agent meshes.
export class AgentBroker {
  constructor({ ledger = null, adapter = null, governorId = 'governor' } = {}) {
    this.ledger = ledger;
    this.adapter = adapter;
    this.governorId = governorId;
    this.workers = new Map();
  }

  async spawn({ actor = this.governorId, role, taskId, contextPack = null, model = null } = {}) {
    this.#assertGovernor(actor);
    if (!role || !taskId) throw new Error('spawn requires role and taskId');
    const worker = this.adapter?.spawn
      ? await this.adapter.spawn({ role, taskId, contextPack, model })
      : { id: `local:${role}:${taskId}`, role, taskId, state: 'READY', model };
    this.workers.set(worker.id, worker);
    this.#record({ type: 'agent.spawned', agent: worker, task_id: taskId });
    return worker;
  }

  async cancel(workerId, { actor = this.governorId, reason = 'canceled' } = {}) {
    this.#assertGovernor(actor);
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`unknown worker ${workerId}`);
    if (this.adapter?.cancel) await this.adapter.cancel(worker, { reason });
    const updated = { ...worker, state: 'CANCELED', reason };
    this.workers.set(workerId, updated);
    this.#record({ type: 'agent.canceled', agent_id: workerId, reason });
    return updated;
  }

  send(input) {
    const msg = message(input);
    this.#record({ type: 'message.recorded', message: msg });
    return msg;
  }

  requestCapability({ runId, taskId, from, capability, reason, evidenceRefs = [] }) {
    return this.send({
      runId,
      taskId,
      from,
      to: this.governorId,
      type: 'CAPABILITY_REQUEST',
      payload: { capability, reason },
      evidenceRefs,
    });
  }

  #assertGovernor(actor) {
    if (actor !== this.governorId) throw new Error('only the Governor may change agent topology');
  }

  #record(event) {
    if (this.ledger) this.ledger.append(event);
  }
}
