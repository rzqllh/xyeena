import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MEMORY_SCOPES,
  MEMORY_CATEGORIES,
  MemoryStore,
  ContextCompactor,
  TASK_STATUS,
  TaskNode,
  TaskGraph,
  CheckpointManager,
  AgentOverlayManager
} from '../../src/runtime/index.mjs';
import { ERROR_CODES, XyeenaError } from '../../src/core/errors.mjs';

describe('M3 Advanced Runtime: Unit Verification Suite', () => {

  describe('Scoped Persistent Memory', () => {
    it('persists scoped memories with operator consent', () => {
      const store = new MemoryStore({ scope: MEMORY_SCOPES.WORKSPACE });
      const entry = store.remember({
        key: 'db_migration_convention',
        value: 'Always use two-phase expand/contract',
        category: MEMORY_CATEGORIES.CONVENTION,
        userConsented: true
      });
      assert.strictEqual(entry.key, 'db_migration_convention');
      assert.strictEqual(store.get('db_migration_convention').value, 'Always use two-phase expand/contract');
    });

    it('rejects memory write without operator consent', () => {
      const store = new MemoryStore();
      assert.throws(() => {
        store.remember({
          key: 'test_key',
          value: 'test value',
          userConsented: false
        });
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.PERMISSION_DENIED;
      });
    });

    it('rejects persistence of values containing suspected credentials/secrets', () => {
      const store = new MemoryStore();
      assert.throws(() => {
        store.remember({
          key: 'api_token',
          value: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
          userConsented: true
        });
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.SCOPE_VIOLATION;
      });
    });

    it('performs keyword-based contextual search across memories', () => {
      const store = new MemoryStore();
      store.remember({ key: 'auth_jwt', value: 'Use RS256 with 15m expiration', userConsented: true });
      store.remember({ key: 'css_tokens', value: 'Use OKLCH semantic tokens', userConsented: true });

      const results = store.search('jwt');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].key, 'auth_jwt');
    });
  });

  describe('Context Compaction', () => {
    it('compacts state into a high-density summary preserving locked decisions', () => {
      const summary = ContextCompactor.compactState({
        activeProject: 'Xyeena Rebuild',
        activeBranch: 'feat/rebuild-foundation-p00',
        gitHead: '45b430b2',
        lockedDecisions: [
          { id: 'ARCH-DEC-01', title: 'L0 Budget <= 1500 tokens', status: 'FROZEN' }
        ],
        modifiedFiles: ['src/core/kernel.mjs'],
        pendingTasks: [
          { id: 'M3-001', title: 'Runtime Integration', status: 'IN_PROGRESS' }
        ]
      });

      assert.ok(summary.includes('ARCH-DEC-01'));
      assert.ok(summary.includes('src/core/kernel.mjs'));
      assert.ok(summary.includes('feat/rebuild-foundation-p00'));
    });
  });

  describe('Task DAG & State Machine', () => {
    it('determines ready tasks strictly when dependencies are completed', () => {
      const graph = new TaskGraph();
      const taskA = new TaskNode({ id: 'taskA', title: 'Setup database' });
      const taskB = new TaskNode({ id: 'taskB', title: 'Seed data', dependencies: ['taskA'] });

      graph.addTask(taskA);
      graph.addTask(taskB);

      // Initially only taskA is ready
      let ready = graph.getReadyTasks();
      assert.strictEqual(ready.length, 1);
      assert.strictEqual(ready[0].id, 'taskA');

      // Complete taskA -> taskB becomes ready
      graph.transition('taskA', TASK_STATUS.RUNNING);
      graph.transition('taskA', TASK_STATUS.COMPLETED, { tableCount: 5 });

      ready = graph.getReadyTasks();
      assert.strictEqual(ready.length, 1);
      assert.strictEqual(ready[0].id, 'taskB');
    });

    it('detects and rejects task dependency cycles', () => {
      const graph = new TaskGraph();
      graph.addTask(new TaskNode({ id: '1', title: 'Step 1', dependencies: ['2'] }));
      graph.addTask(new TaskNode({ id: '2', title: 'Step 2', dependencies: ['1'] }));

      assert.throws(() => {
        graph.validate();
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.CIRCULAR_DEPENDENCY;
      });
    });

    it('enforces valid task status transitions', () => {
      const graph = new TaskGraph();
      const task = graph.addTask(new TaskNode({ id: 't1', title: 'Task 1' }));

      // Invalid transition: READY directly to COMPLETED without RUNNING
      assert.throws(() => {
        graph.transition('t1', TASK_STATUS.COMPLETED);
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.INVALID_CONTRACT;
      });
    });
  });

  describe('Checkpoint & Recovery', () => {
    it('creates snapshots and resumes task graph state idempotently', () => {
      const manager = new CheckpointManager();
      const graph = new TaskGraph();
      const t1 = graph.addTask(new TaskNode({ id: 'step1', title: 'First step' }));
      const t2 = graph.addTask(new TaskNode({ id: 'step2', title: 'Second step' }));

      // Simulate step1 completion
      graph.transition('step1', TASK_STATUS.RUNNING);
      graph.transition('step1', TASK_STATUS.COMPLETED);

      const snapshot = manager.createSnapshot({
        checkpointId: 'CHK-001',
        phase: 'M3',
        tasks: graph.getAll(),
        modifiedFiles: ['src/runtime/memory.mjs']
      });

      assert.strictEqual(snapshot.tasks[0].status, TASK_STATUS.COMPLETED);

      // Create new clean graph and resume state from snapshot
      const newGraph = new TaskGraph();
      newGraph.addTask(new TaskNode({ id: 'step1', title: 'First step' }));
      newGraph.addTask(new TaskNode({ id: 'step2', title: 'Second step' }));

      const resumeResult = manager.resumeFromSnapshot(snapshot, newGraph);
      assert.strictEqual(resumeResult.restored, true);
      assert.strictEqual(newGraph.get('step1').status, TASK_STATUS.COMPLETED);
      assert.strictEqual(newGraph.get('step2').status, TASK_STATUS.READY);
    });
  });

  describe('Existing-Agent Ephemeral Overlay (ARCH-DEC-03)', () => {
    it('composes bounded ephemeral overlay without mutating base persona', () => {
      const payload = AgentOverlayManager.composeEphemeralOverlay({
        targetAgentName: 'Rinne (Tester)',
        taskScope: 'Verify IndexedDB storage failure recovery',
        targetFiles: ['test/storage.test.mjs'],
        deliverableRequired: 'Test execution log and pass verdict'
      });

      assert.strictEqual(payload.targetAgentName, 'Rinne (Tester)');
      assert.strictEqual(payload.ephemeralOnly, true);
      assert.ok(payload.ephemeralPrompt.includes('EPHEMERAL TASK OVERLAY'));
      assert.ok(payload.ephemeralPrompt.includes('test/storage.test.mjs'));
    });

    it('rejects subagent deliverable if unauthorized files were modified (scope leak)', () => {
      const payload = AgentOverlayManager.composeEphemeralOverlay({
        targetAgentName: 'Hibiki (Frontend)',
        taskScope: 'Style button',
        targetFiles: ['src/button.css']
      });

      // Subagent modified unauthorized file src/auth.js!
      const validation = AgentOverlayManager.validateAgentDeliverable(payload, {
        modifiedFiles: ['src/button.css', 'src/auth.js'],
        deliverableContent: 'Styled button'
      });

      assert.strictEqual(validation.accepted, false);
      assert.ok(validation.reason.includes('Subagent scope leak'));
    });
  });

});
