import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureDir, id, nowIso, writeJson } from './util.mjs';

export class RunLedger {
  constructor(runDir) {
    this.runDir = runDir;
    this.journal = path.join(runDir, 'journal.jsonl');
    this.snapshotFile = path.join(runDir, 'snapshot.json');
  }
  static create(root, { goal = '', cwd = process.cwd() } = {}) {
    const runId = id('run');
    const runDir = path.join(root, '.xyeena', 'runs', runId);
    ensureDir(runDir);
    const ledger = new RunLedger(runDir);
    ledger.append({ type: 'run.created', run_id: runId, goal, cwd, git_head: gitHead(cwd) });
    return ledger;
  }
  append(event) {
    const e = { event_id: id('evt'), at: nowIso(), ...event };
    fs.appendFileSync(this.journal, JSON.stringify(e) + '\n');
    const snapshot = this.rebuild();
    return { event: e, snapshot };
  }
  events() {
    if (!fs.existsSync(this.journal)) return [];
    return fs.readFileSync(this.journal, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
  }
  rebuild() {
    const snapshot = {
      run_id: null, goal: '', cwd: null, created_at: null, git_head: null,
      workflow_state: 'TRIAGE', claims: {}, decisions: {}, tasks: {}, artifacts: {}, message_count: 0, consent: {},
    };
    for (const e of this.events()) reduce(snapshot, e);
    writeJson(this.snapshotFile, snapshot);
    return snapshot;
  }
  snapshot() { return this.rebuild(); }
}

function reduce(s, e) {
  if (e.type === 'run.created') { s.run_id = e.run_id; s.goal = e.goal; s.cwd = e.cwd; s.created_at = e.at; s.git_head = e.git_head; }
  if (e.type === 'workflow.transitioned') s.workflow_state = e.to;
  if (e.type === 'claim.added') s.claims[e.claim.id] = e.claim;
  if (e.type === 'claim.invalidated' && s.claims[e.claim_id]) s.claims[e.claim_id].freshness = e.freshness || 'STALE';
  if (e.type === 'decision.recorded') s.decisions[e.decision.id] = e.decision;
  if (e.type === 'task.created') s.tasks[e.task.id] = e.task;
  if (e.type === 'task.transitioned' && s.tasks[e.task_id]) s.tasks[e.task_id].state = e.to;
  if (e.type === 'artifact.recorded') s.artifacts[e.artifact.id] = e.artifact;
  if (e.type === 'message.recorded') s.message_count++;
  if (e.type === 'consent.resolved') s.consent[e.operation] = e.status;
}

export function gitHead(cwd) {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
export function staleGitClaims(snapshot, cwd) {
  const head = gitHead(cwd);
  if (!head || !snapshot.git_head || head === snapshot.git_head) return [];
  return Object.values(snapshot.claims)
    .filter((c) => c.scope?.git_head === snapshot.git_head && c.freshness !== 'STALE')
    .map((c) => c.id);
}
