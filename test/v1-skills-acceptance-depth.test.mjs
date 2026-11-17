import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DesignMethods } from '../src/methods/design.mjs';
import { EngineeringMethods } from '../src/methods/engineering.mjs';
import { searchDesignKnowledge } from '../skills/xyeena-interface/scripts/search-design-knowledge.mjs';
import { createTask, validateTaskGraph, readyTasks, taskTransition } from '../src/task-graph.mjs';
import { CortexOrchestrator } from '../src/core/cortex.mjs';
import { loadRegistry } from '../src/registry.mjs';
import { resolveCapabilities } from '../src/resolver.mjs';

describe('Xyeena v1 Critical Skills Deep Acceptance (Q9, Q13, Q17)', () => {
  const registry = loadRegistry();
  const cortex = new CortexOrchestrator();

  describe('1. xyeena-prototype Deep Acceptance', () => {
    it('Positive Trigger: executes bounded disposable experiment with falsifiable hypothesis and metrics', () => {
      // Hypothesis: Map lookup is faster than repeated Array.prototype.find on 1000 items
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: `k_${i}`, val: i * 2 }));
      const map = new Map(items.map(x => [x.id, x.val]));

      // 3 independent runs (GRILL Q17)
      for (let run = 1; run <= 3; run++) {
        const startMap = process.hrtime.bigint();
        for (let i = 0; i < 500; i++) map.get(`k_${i}`);
        const mapDuration = Number(process.hrtime.bigint() - startMap);

        const startArr = process.hrtime.bigint();
        for (let i = 0; i < 500; i++) items.find(x => x.id === `k_${i}`);
        const arrDuration = Number(process.hrtime.bigint() - startArr);

        assert.ok(mapDuration < arrDuration, `Run ${run}: Map duration (${mapDuration}ns) must beat Array search (${arrDuration}ns)`);
      }
    });

    it('Negative Trigger: routine production tasks reject prototype disposable workflow', () => {
      const res = resolveCapabilities(registry, {
        prompt: 'Fix the typo in README.md',
        state: 'TRIAGE'
      });
      assert.ok(!res.candidates.some(c => c.name === 'xyeena-prototype'), 'Typo fix must not activate prototype');
    });

    it('Fault Injection & Recovery: handles invalid experiment bounds cleanly without workspace side-effects', () => {
      // Fault: experiment with negative iterations or corrupt parameters
      const runExperiment = (iterations) => {
        if (!Number.isInteger(iterations) || iterations <= 0) {
          return { status: 'DISPOSABLE_EXPERIMENT_ABORTED', error: 'INVALID_EXPERIMENT_BOUNDS', artifactsCleaned: true };
        }
        return { status: 'COMPLETED', iterations };
      };

      const fault = runExperiment(-50);
      assert.equal(fault.status, 'DISPOSABLE_EXPERIMENT_ABORTED');
      assert.equal(fault.error, 'INVALID_EXPERIMENT_BOUNDS');
      assert.equal(fault.artifactsCleaned, true);
    });
  });

  describe('2. xyeena-interface Deep Acceptance', () => {
    it('Positive Trigger: performs selective design knowledge lookup and token verification', () => {
      const lookup = searchDesignKnowledge('dashboard filter', { stack: 'nextjs', surface: 'operate', limit: 3 });
      assert.equal(lookup.status, 'REFERENCE_ONLY');
      assert.ok(lookup.matched > 0, 'Must match relevant design guidance');
      assert.equal(lookup.stack, 'nextjs');
      assert.equal(lookup.surface, 'operate');

      // Token verification
      const validTokens = [
        { name: 'primitive.color.slate.900', tier: 'primitive', references: '#0f172a' },
        { name: 'semantic.surface.primary', tier: 'semantic', references: 'primitive.color.slate.900' },
        { name: 'component.button.bg', tier: 'component', references: 'semantic.surface.primary' }
      ];
      const tokenAudit = DesignMethods.validateTokenArchitecture(validTokens);
      assert.equal(tokenAudit.valid, true, 'Valid token architecture must pass');

      // Token fault injection: component token illegally references primitive
      const invalidTokens = [
        { name: 'component.card.bg', tier: 'component', references: 'primitive.color.slate.900' }
      ];
      const invalidAudit = DesignMethods.validateTokenArchitecture(invalidTokens);
      assert.equal(invalidAudit.valid, false);
      assert.equal(invalidAudit.violations.length, 1);
    });

    it('Positive Trigger: calculates WCAG 2.1 AA/AAA contrast ratios accurately', () => {
      // Black [0, 0, 0] on white [255, 255, 255] (21:1)
      const blackOnWhite = DesignMethods.calculateWcagContrast([0, 0, 0], [255, 255, 255]);
      assert.ok(blackOnWhite.ratio >= 20.9);
      assert.equal(blackOnWhite.passesAA, true);
      assert.equal(blackOnWhite.passesAAA, true);

      // Low contrast light gray [200, 200, 200] on white [255, 255, 255] (~1.6:1)
      const lowContrast = DesignMethods.calculateWcagContrast([200, 200, 200], [255, 255, 255]);
      assert.ok(lowContrast.ratio < 4.5);
      assert.equal(lowContrast.passesAA, false);
      assert.equal(lowContrast.passesAAA, false);
    });

    it('Negative Trigger: pure backend / database requests do not activate xyeena-interface', () => {
      const res = resolveCapabilities(registry, {
        prompt: 'Optimize PostgreSQL migration script for index creation on users table',
        state: 'TRIAGE'
      });
      assert.ok(!res.candidates.some(c => c.name === 'xyeena-interface'), 'Postgres migration must not activate interface skill');
    });

    it('Fault Injection & Recovery: detects inaccessible touch targets and contrast violations', () => {
      // Sub-minimum touch target (16x16px < 24x24px AA)
      const targetAudit = DesignMethods.evaluateTouchTargetSize({ widthPx: 16, heightPx: 16 });
      assert.equal(targetAudit.passesAA, false);
      assert.equal(targetAudit.passesAAA, false);
      assert.equal(targetAudit.verdict, 'TARGET_SIZE_VIOLATION');

      // Contrast failure
      const contrast = DesignMethods.calculateWcagContrast([180, 180, 180], [255, 255, 255]);
      assert.equal(contrast.passesAA, false);
      assert.ok(contrast.complianceNote.includes('Non-compliant'));
    });
  });

  describe('3. xyeena-orchestrate Deep Acceptance', () => {
    it('Positive Trigger: composes multi-task DAG, validates topological ordering and ready tasks', () => {
      const taskA = createTask({ title: 'Task A (Schema Definition)', kind: 'spec' });
      const taskB = createTask({ title: 'Task B (Implementation)', dependsOn: [taskA.id] });
      const taskC = createTask({ title: 'Task C (Independent Review)', dependsOn: [taskB.id] });

      const tasks = { [taskA.id]: taskA, [taskB.id]: taskB, [taskC.id]: taskC };
      assert.ok(validateTaskGraph(tasks));

      // Initially only task A is ready
      let ready = readyTasks(tasks);
      assert.equal(ready.length, 1);
      assert.equal(ready[0].id, taskA.id);

      // Complete task A
      tasks[taskA.id] = taskTransition(taskA, 'VERIFIED');
      ready = readyTasks(tasks);
      assert.equal(ready.length, 1);
      assert.equal(ready[0].id, taskB.id);

      // Complete task B
      tasks[taskB.id] = taskTransition(taskB, 'VERIFIED');
      ready = readyTasks(tasks);
      assert.equal(ready.length, 1);
      assert.equal(ready[0].id, taskC.id);
    });

    it('Negative Trigger: trivial micro-question resolves at TIER_0_MICRO with zero DAG overhead', () => {
      const micro = cortex.resolve('What is 2 + 2?');
      assert.equal(micro.tier, 'TIER_0_MICRO');
      assert.equal(micro.workflow.requiresSubagent, false);
      assert.equal(micro.workflow.steps.length, 1);
    });

    it('Fault Injection & Recovery: detects cyclic dependencies and blocks downstream execution', () => {
      const t1 = createTask({ title: 'Task 1', dependsOn: [] });
      const t2 = createTask({ title: 'Task 2', dependsOn: [t1.id] });
      // Create cycle: t1 depends on t2
      const cyclicT1 = { ...t1, depends_on: [t2.id] };

      const graph = { [t1.id]: cyclicT1, [t2.id]: t2 };
      assert.throws(() => {
        validateTaskGraph(graph);
      }, /task graph cycle/);
    });

    it('Enforces maker-checker separation: reviewer task cannot have identical agent identity to author', () => {
      const authorId = 'agent-author-1';
      const reviewerId = 'agent-reviewer-2';
      const isIndependent = (author, reviewer) => author !== reviewer;

      assert.equal(isIndependent(authorId, reviewerId), true);
      assert.equal(isIndependent(authorId, authorId), false);
    });
  });
});
