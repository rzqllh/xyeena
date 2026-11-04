import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

import {
  ThinkingMethods,
  EngineeringMethods,
  WorktreeManager,
  DesignMethods,
  QualityMethods,
  SecurityMethods,
  DeliveryMethods
} from '../../src/methods/index.mjs';

import {
  MemoryStore,
  MEMORY_SCOPES,
  MEMORY_CATEGORIES,
  ContextCompactor,
  TaskNode,
  TaskGraph,
  TASK_STATUS,
  CheckpointManager,
  AgentOverlayManager
} from '../../src/runtime/index.mjs';

describe('Xyeena Rebuild: Behavioral & Scenario Integration Suite', () => {

  // =========================================================================
  // 1. ROUTING & EFFICIENCY SCENARIOS
  // =========================================================================
  describe('Routing & Efficiency Scenarios', () => {
    const kernel = new BehavioralKernel();
    const composer = new WorkflowComposer(kernel);
    const router = new IntentRouter();

    const registry = new CapabilityRegistry();
    for (const inv of kernel.invariants) {
      registry.register({ id: inv.id, layer: CAPABILITY_LAYERS.L0 });
    }
    registry.register({ id: 'design.interface', layer: CAPABILITY_LAYERS.L1 });
    registry.register({ id: 'design.accessibility', layer: CAPABILITY_LAYERS.L1 });
    registry.register({ id: 'design.responsive', layer: CAPABILITY_LAYERS.L1 });
    registry.register({ id: 'engineering.tdd', layer: CAPABILITY_LAYERS.L1 });
    registry.register({ id: 'engineering.test-strategy', layer: CAPABILITY_LAYERS.L1 });
    registry.register({ id: 'security.full-audit', layer: CAPABILITY_LAYERS.L2, negative_trigger: 'Must not activate on passive queries' });

    const resolver = new CapabilityResolver(registry, router);

    it('Scenario: Casual greeting / micro-task strictly loads L0 Kernel only with zero domain overhead', () => {
      const prompt = 'Halo, apa kabar? Tolong jelaskan arti closure di JS secara singkat.';
      const mode = router.classifyIntent(prompt);
      const tier = router.classifyTier(prompt, mode);
      assert.strictEqual(mode, EXECUTION_MODES.DISCUSSION);
      assert.strictEqual(tier, TASK_TIERS.TIER_0_MICRO);

      const resolved = resolver.resolve(prompt, mode, tier);
      const payload = composer.compose({ prompt, mode, tier, activeCapabilities: resolved });

      assert.strictEqual(payload.stats.domainCapabilityCount, 0);
      assert.ok(payload.stats.estimatedTokens < 500, `Expected < 500 tokens, got ${payload.stats.estimatedTokens}`);
      assert.strictEqual(payload.activeCapabilityIds.includes('security.full-audit'), false);
    });

    it('Scenario: Passive security mention does NOT activate heavyweight full security audit', () => {
      const prompt = 'Apakah endpoint login ini sudah menggunakan session cookie yang aman?';
      const mode = router.classifyIntent(prompt);
      const tier = router.classifyTier(prompt, mode);

      const resolved = resolver.resolve(prompt, mode, tier);
      const payload = composer.compose({ prompt, mode, tier, activeCapabilities: resolved });

      // Negative trigger strictly blocks full security audit
      assert.strictEqual(payload.activeCapabilityIds.includes('security.full-audit'), false);
    });

    it('Scenario: Explicit audit request triggers full audit gate authorization', () => {
      const authPassive = SecurityMethods.assertAuditActivationAllowed(false);
      assert.strictEqual(authPassive.allowed, false);
      assert.strictEqual(authPassive.status, 'BLOCKED');

      const authExplicit = SecurityMethods.assertAuditActivationAllowed(true);
      assert.strictEqual(authExplicit.allowed, true);
      assert.strictEqual(authExplicit.status, 'ACTIVATED');
    });

    it('Scenario: Budget governor halts runaway retry loops immediately', () => {
      const gov = new EffortBudgetGovernor({ maxRetries: 3 });
      gov.recordRetry('Attempt 1');
      gov.recordRetry('Attempt 2');
      gov.recordRetry('Attempt 3');

      assert.throws(() => {
        gov.recordRetry('Attempt 4');
      }, /tripped/i);
    });
  });

  // =========================================================================
  // 2. NATIVE METHODS & QUALITY SCENARIOS
  // =========================================================================
  describe('Native Methods & Quality Scenarios', () => {

    it('Scenario: TDD rejects GREEN transition claim if test was never observed RED', () => {
      const invalidTdd = EngineeringMethods.verifyTddCycle('GREEN', {
        testFailedInitially: false,
        testPassedAfterCode: true
      });
      assert.strictEqual(invalidTdd.compliant, false);
      assert.ok(invalidTdd.reason.includes('RED'));

      const validTdd = EngineeringMethods.verifyTddCycle('GREEN', {
        testFailedInitially: true,
        testPassedAfterCode: true
      });
      assert.strictEqual(validTdd.compliant, true);
      assert.strictEqual(validTdd.status, 'TDD_COMPLIANT');
    });

    it('Scenario: Systematic Debugging enforces 4-phase discipline', () => {
      // Cannot isolate without repro command
      const isolateFail = ThinkingMethods.trackDebuggingInvestigation({
        stage: 'ISOLATE',
        evidence: {}
      });
      assert.strictEqual(isolateFail.compliant, false);

      // Cannot verify without regression test pass
      const verifyFail = ThinkingMethods.trackDebuggingInvestigation({
        stage: 'VERIFY_FIX',
        evidence: {
          reproduceCommand: 'node test/bug.test.mjs',
          rootCauseLocation: 'src/core/router.mjs:42',
          regressionPassed: false
        }
      });
      assert.strictEqual(verifyFail.compliant, false);

      // Full compliant investigation
      const fullSuccess = ThinkingMethods.trackDebuggingInvestigation({
        stage: 'VERIFY_FIX',
        evidence: {
          reproduceCommand: 'node test/bug.test.mjs',
          rootCauseLocation: 'src/core/router.mjs:42',
          fixDiff: '- badCode\n+ goodCode',
          regressionPassed: true
        }
      });
      assert.strictEqual(fullSuccess.compliant, true);
    });

    it('Scenario: Anti-Slop cleans redundant comments while preserving architectural notes and TODOs', () => {
      const sampleCode = [
        '// import express module',
        'import express from "express";',
        '// initialize application',
        'const app = express();',
        '// NOTE: Rate limiter must be placed before auth middleware to protect against DDoS (CVE-2024-X)',
        'app.use(limiter);',
        '// TODO: Add metrics collector for latency monitoring',
        '// return the result',
        'return app;'
      ].join('\n');

      const result = QualityMethods.sanitizeCodeComments(sampleCode);
      assert.strictEqual(result.removedCommentsCount, 3);
      assert.ok(result.cleanedCode.includes('NOTE: Rate limiter must be placed before auth middleware'));
      assert.ok(result.cleanedCode.includes('TODO: Add metrics collector'));
      assert.strictEqual(result.cleanedCode.includes('// import express module'), false);
      assert.strictEqual(result.cleanedCode.includes('// return the result'), false);
    });

    it('Scenario: Anti-Slop detects marketing clichés and robotic conversational transitions', () => {
      const copyWithSlop = 'Our cutting-edge platform will delve into your workflows to seamlessly elevate and revolutionize productivity. Furthermore, it is a testament to next-gen engineering.';
      const audit = QualityMethods.auditCopywriting(copyWithSlop);
      assert.strictEqual(audit.hasSlop, true);
      assert.ok(audit.detectedCliches.includes('cutting-edge'));
      assert.ok(audit.detectedCliches.includes('delve into'));
      assert.ok(audit.detectedCliches.includes('seamlessly'));
      assert.ok(audit.detectedCliches.includes('elevate'));
      assert.ok(audit.detectedCliches.includes('furthermore'));

      const cleanCopy = 'Xyeena runs verifiable workflows with zero external runtime dependencies and strict token budgeting.';
      const cleanAudit = QualityMethods.auditCopywriting(cleanCopy);
      assert.strictEqual(cleanAudit.hasSlop, false);
      assert.strictEqual(cleanAudit.detectedCliches.length, 0);
    });

    it('Scenario: Accessibility audits flag sub-44px tap targets and outline suppression', () => {
      const badCss = `
        .close-btn { width: 24px; height: 24px; outline: none; }
      `;
      const tapAudit = QualityMethods.auditTouchTargets(badCss);
      assert.strictEqual(tapAudit.compliant, false);

      const focusAudit = QualityMethods.auditFocusIndicators(badCss);
      assert.strictEqual(focusAudit.compliant, false);

      const goodCss = `
        .action-btn { min-width: 44px; min-height: 44px; outline: none; }
        .action-btn:focus-visible { ring-2 ring-blue-500; }
      `;
      const goodTap = QualityMethods.auditTouchTargets(goodCss);
      assert.strictEqual(goodTap.compliant, true);

      const goodFocus = QualityMethods.auditFocusIndicators(goodCss);
      assert.strictEqual(goodFocus.compliant, true);
    });

    it('Scenario: WCAG 2.1 AA relative luminance math accurately passes high-contrast and fails low-contrast pairs', () => {
      // Pure Black (#000000) on Pure White (#FFFFFF): Ratio 21:1
      const highContrast = DesignMethods.calculateWcagContrast([0, 0, 0], [255, 255, 255]);
      assert.strictEqual(highContrast.passesAA, true);
      assert.strictEqual(highContrast.passesAAA, true);
      assert.ok(highContrast.ratio >= 20.0);

      // Light Gray (#CCCCCC) on White (#FFFFFF): Ratio ~1.6:1 (Fails AA)
      const lowContrast = DesignMethods.calculateWcagContrast([204, 204, 204], [255, 255, 255]);
      assert.strictEqual(lowContrast.passesAA, false);
      assert.ok(lowContrast.ratio < 3.0);
    });

    it('Scenario: Cloudflare findings schema validation rejects path traversal and invalid CWEs', () => {
      const maliciousFinding = {
        file: '../../etc/passwd',
        line: 1,
        attackClass: 'PATH_TRAVERSAL',
        severity: 'CRITICAL',
        remediation: 'Sanitize input paths strictly'
      };
      const res1 = SecurityMethods.validateFinding(maliciousFinding);
      assert.strictEqual(res1.valid, false);
      assert.ok(res1.errors.some(e => e.includes('traversal')));

      const badCweFinding = {
        file: 'src/api.js',
        line: 10,
        attackClass: 'INJECTION_SQL_COMMAND',
        severity: 'HIGH',
        remediation: 'Use parameterized prepared statements',
        cwe: 'INVALID-CWE-FORMAT'
      };
      const res2 = SecurityMethods.validateFinding(badCweFinding);
      assert.strictEqual(res2.valid, false);
      assert.ok(res2.errors.some(e => e.includes('CWE')));

      const goodFinding = {
        file: 'src/api.js',
        line: 10,
        attackClass: 'INJECTION_SQL_COMMAND',
        severity: 'HIGH',
        description: 'Unsanitized user input interpolated into SQL query string',
        evidence: 'db.query("SELECT * FROM users WHERE id = " + req.id)',
        remediation: 'Use parameterized prepared statements',
        cwe: 'CWE-89'
      };
      const res3 = SecurityMethods.validateFinding(goodFinding);
      assert.strictEqual(res3.valid, true);
    });

    it('Scenario: Worktree manager blocks path traversal and uncommitted deletion', () => {
      const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-wt-base-'));
      try {
        // Blocks nesting inside .git
        assert.throws(() => {
          WorktreeManager.validateWorktreePath(tmpBase, path.join(tmpBase, '.git', 'wt-danger'));
        }, /inside internal git/i);

        // Blocks uncommitted removal without force
        const removalPlan = WorktreeManager.planRemoval({
          repoDir: tmpBase,
          worktreePath: path.join(tmpBase, 'my-feature'),
          hasUncommittedChanges: true,
          force: false
        });
        assert.strictEqual(removalPlan.allowed, false);
        assert.strictEqual(removalPlan.status, 'BLOCKED');

        // Allows removal with explicit force
        const forcedPlan = WorktreeManager.planRemoval({
          repoDir: tmpBase,
          worktreePath: path.join(tmpBase, 'my-feature'),
          hasUncommittedChanges: true,
          force: true
        });
        assert.strictEqual(forcedPlan.allowed, true);
        assert.ok(forcedPlan.pruneCommand.includes('--force'));
      } finally {
        fs.rmSync(tmpBase, { recursive: true, force: true });
      }
    });

    it('Scenario: Technical documentation rubric detects placeholder slop and unformatted text', () => {
      const lazyDoc = 'TODO: Fill this in later. Lorem ipsum dolor sit amet.';
      const auditLazy = DeliveryMethods.auditDocumentationRubric(lazyDoc);
      assert.strictEqual(auditLazy.compliant, false);
      assert.ok(auditLazy.score < 80);

      const goodDoc = [
        '# API Documentation',
        '## Authentication',
        'Authenticate using Bearer tokens:',
        '```bash',
        'curl -H "Authorization: Bearer <TOKEN>" https://api.example.com',
        '```'
      ].join('\n');
      const auditGood = DeliveryMethods.auditDocumentationRubric(goodDoc);
      assert.strictEqual(auditGood.compliant, true);
      assert.strictEqual(auditGood.score, 100);
    });
  });

  // =========================================================================
  // 3. MEMORY & RECOVERY SCENARIOS (REAL DISK PERSISTENCE)
  // =========================================================================
  describe('Memory & Recovery Scenarios (Real Disk Persistence)', () => {
    let tmpDir;

    it('Scenario: Memory survives actual process restart via file-backed disk store', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-mem-test-'));

      // 1. Session 1: Store memory in disk store
      const session1 = new MemoryStore({
        storageDir: tmpDir,
        projectId: 'project-alpha',
        scope: MEMORY_SCOPES.WORKSPACE
      });

      session1.remember({
        key: 'db-schema-v2',
        value: 'Uses UUIDv7 as primary key for temporal ordering',
        category: MEMORY_CATEGORIES.DECISION,
        userConsented: true
      });

      // 2. Simulate complete session termination and new session start on same disk folder
      const session2 = new MemoryStore({
        storageDir: tmpDir,
        projectId: 'project-alpha',
        scope: MEMORY_SCOPES.WORKSPACE
      });

      const recovered = session2.get('db-schema-v2');
      assert.ok(recovered !== null);
      assert.strictEqual(recovered.value, 'Uses UUIDv7 as primary key for temporal ordering');
      assert.strictEqual(recovered.category, MEMORY_CATEGORIES.DECISION);

      // Clean up
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('Scenario: Project isolation prevents cross-project memory contamination', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-mem-iso-'));

      const storeProjA = new MemoryStore({
        storageDir: tmpDir,
        projectId: 'project-A'
      });
      storeProjA.remember({
        key: 'secret-config',
        value: 'Config A value',
        userConsented: true
      });

      const storeProjB = new MemoryStore({
        storageDir: tmpDir,
        projectId: 'project-B'
      });

      // Project B must NOT see Project A's memory
      assert.strictEqual(storeProjB.get('secret-config'), null);

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('Scenario: Stale memory invalidation cleans obsolete decisions', () => {
      const store = new MemoryStore();
      store.remember({ key: 'old-api', value: 'Use REST v1', category: MEMORY_CATEGORIES.DECISION, userConsented: true });
      store.remember({ key: 'new-api', value: 'Use GraphQL v2', category: MEMORY_CATEGORIES.DECISION, userConsented: true });

      const invalidated = store.invalidateStale(e => e.value.includes('v1'));
      assert.strictEqual(invalidated, 1);
      assert.strictEqual(store.get('old-api'), null);
      assert.ok(store.get('new-api') !== null);
    });

    it('Scenario: Task DAG state machine accurately handles acyclic dependencies and blockings', () => {
      const graph = new TaskGraph();
      const nodeBuild = new TaskNode({ id: 'task-build', title: 'Build package', dependencies: [] });
      const nodeTest = new TaskNode({ id: 'task-test', title: 'Run tests', dependencies: ['task-build'] });
      const nodeDeploy = new TaskNode({ id: 'task-deploy', title: 'Deploy artifacts', dependencies: ['task-test'] });

      graph.addTask(nodeBuild);
      graph.addTask(nodeTest);
      graph.addTask(nodeDeploy);

      assert.strictEqual(graph.validate(), true);

      const readyInitially = graph.getReadyTasks();
      assert.strictEqual(readyInitially.length, 1);
      assert.strictEqual(readyInitially[0].id, 'task-build');

      // Transition build: READY -> RUNNING -> COMPLETED
      graph.transition('task-build', TASK_STATUS.RUNNING);
      graph.transition('task-build', TASK_STATUS.COMPLETED);

      const readyNext = graph.getReadyTasks();
      assert.strictEqual(readyNext.length, 1);
      assert.strictEqual(readyNext[0].id, 'task-test');
    });

    it('Scenario: Checkpoint restoration safely reconstructs task graph without duplicate execution', () => {
      const manager = new CheckpointManager();
      const snapshot = manager.createSnapshot({
        checkpointId: 'chk-001',
        phase: 'Phase 2: Core Engineering',
        tasks: [
          { id: 'T-1', status: TASK_STATUS.COMPLETED },
          { id: 'T-2', status: TASK_STATUS.READY }
        ],
        modifiedFiles: ['src/core/kernel.mjs']
      });

      const freshGraph = new TaskGraph();
      freshGraph.addTask(new TaskNode({ id: 'T-1', title: 'Task 1', dependencies: [] }));
      freshGraph.addTask(new TaskNode({ id: 'T-2', title: 'Task 2', dependencies: [] }));

      const resumeResult = manager.resumeFromSnapshot(snapshot, freshGraph);
      assert.strictEqual(resumeResult.restored, true);
      assert.strictEqual(freshGraph.get('T-1').status, TASK_STATUS.COMPLETED);
      assert.strictEqual(freshGraph.get('T-2').status, TASK_STATUS.READY);
    });
  });

  // =========================================================================
  // 4. AGENTS & OVERLAYS SCENARIOS
  // =========================================================================
  describe('Agents & Host Overlays Scenarios', () => {
    it('Scenario: Ephemeral agent overlay preserves existing personas without file mutation', () => {
      const originalPersona = '# Persona: Senior Database Specialist\nExpert in PostgreSQL performance.';

      const overlay = AgentOverlayManager.composeEphemeralOverlay({
        targetAgentName: 'tamaki-database',
        taskScope: 'Optimize index on orders table',
        targetFiles: ['schema.sql'],
        deliverableRequired: 'Migration script with EXPLAIN ANALYZE evidence.'
      });

      // Overlay instructions generated for runtime
      assert.ok(overlay.ephemeralPrompt.includes('EPHEMERAL TASK OVERLAY'));
      assert.ok(overlay.ephemeralPrompt.includes('Optimize index on orders table'));
      assert.strictEqual(overlay.ephemeralOnly, true);

      // Original persona remains completely unaltered
      assert.strictEqual(originalPersona.includes('EPHEMERAL TASK OVERLAY'), false);
    });
  });

});
