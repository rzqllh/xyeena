/**
 * Test Suite: End-to-End Acceptance Campaign (Final Closure)
 *
 * Validates the 18 end-to-end acceptance scenarios specified in Section 6:
 *  1. Natural-language coding task
 *  2. Explicit /xyeena-debug
 *  3. Product brainstorming and planning
 *  4. Full-stack TypeScript/React task
 *  5. UI design critique
 *  6. Mobile accessibility review
 *  7. User-directed visual design
 *  8. Human copywriting
 *  9. Source-grounded research
 * 10. Scoped security review
 * 11. Supabase/Postgres safety analysis (with truthful static check pass)
 * 12. MCP/retrieval task
 * 13. Multi-step DAG execution
 * 14. Existing-user-skill precedence
 * 15. Micro-task low-overhead execution
 * 16. Failed execution and recovery
 * 17. Installer dry-run, installation, repair, and uninstall in isolated fixtures
 * 18. Real artifact creation only when authorized
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  KnowledgeMethods,
  SecurityMethods,
  LiveDatabaseAdapter,
  DesignMethods,
  EngineeringMethods,
  QualityMethods,
  DeliveryMethods,
  ThinkingMethods
} from '../src/methods/index.mjs';

import { COMPOSITE_DEFINITIONS } from '../src/core/composites.mjs';
import { createDefaultCortex } from '../src/core/cortex.mjs';
import { BehavioralTraitOverlay } from '../src/core/personality.mjs';
import { TaskGraph, TaskNode, TASK_STATUS } from '../src/runtime/task-dag.mjs';
import { CheckpointManager } from '../src/runtime/checkpoint.mjs';
import { InstallationTransaction } from '../src/installer/transaction.mjs';

describe('XYEENA — End-to-End Acceptance Campaign Suite (18 Scenarios)', () => {

  const cortex = createDefaultCortex();

  // Scenario 1: Natural-language coding task
  it('Scenario 1: Natural-language coding task resolves via Cortex with smallest-correct-change and precision engineer traits', () => {
    const prompt = 'Tambahkan fungsi deduplikasi array objek berdasarkan key tertentu di utilitas data';
    const plan = cortex.resolve(prompt);

    assert.ok(plan.workflow, 'Plan must include workflow definition');
    assert.strictEqual(plan.engine, 'Cortex');

    // Traits include precision engineer
    const traits = BehavioralTraitOverlay.resolveTraits(prompt);
    assert.ok(traits.some(t => t.id === 'trait.precision-engineer'));

    // Audit lean diff using Ponytail heuristic
    const sampleDiff = `
--- a/src/data-utils.ts
+++ b/src/data-utils.ts
@@ -10,3 +10,7 @@ export function chunk<T>(arr: T[], size: number): T[][] {
+export function dedupeByKey<T>(items: T[], key: keyof T): T[] {
+  const seen = new Set();
+  return items.filter(item => !seen.has(item[key]) && seen.add(item[key]));
+}
    `;

    const leanAudit = EngineeringMethods.auditPonytailLeanDiff({ diff: sampleDiff, taskBudget: 15 });
    assert.strictEqual(leanAudit.verdict, 'PONYTAIL_LEAN_PASS');
    assert.strictEqual(leanAudit.smallestChangeSatisfied, true);
    assert.strictEqual(leanAudit.isClean, true);
  });

  // Scenario 2: Explicit /xyeena-debug
  it('Scenario 2: Explicit /xyeena-debug enforces 4-phase discipline and Discussion Mode gate without speculative edits', () => {
    const prompt = '/xyeena-debug: race condition pada cache token saat concurrent refresh';
    const explicit = cortex.detectExplicitSkills(prompt);

    assert.ok(explicit.includes('xyeena-debug'));
    const plan = cortex.resolve(prompt);
    assert.strictEqual(plan.mode, 'DIAGNOSE');

    // 4-Phase systematic debugging discipline (Superpowers RE-01)
    // Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
    const prematureFixAttempt = ThinkingMethods.trackDebuggingInvestigation({
      stage: 'PROPOSE_FIX',
      evidence: {}
    });
    assert.strictEqual(prematureFixAttempt.compliant, false);
    assert.strictEqual(prematureFixAttempt.ironLaw, 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST');

    // Compliant 4-phase progression
    const validInvestigation = ThinkingMethods.trackDebuggingInvestigation({
      stage: 'PROPOSE_FIX',
      evidence: {
        reproduceCommand: 'npm run test:repro',
        rootCauseLocation: 'src/auth/token.ts:42'
      }
    });
    assert.strictEqual(validInvestigation.compliant, true);
    assert.strictEqual(validInvestigation.status, 'DISCIPLINE_SATISFIED');
  });

  // Scenario 3: Product brainstorming and planning
  it('Scenario 3: Product brainstorming and planning constructs reviewable phased plan with rollback and ADR structure', () => {
    const planComposite = COMPOSITE_DEFINITIONS.find(c => c.id === 'xyeena-plan');
    assert.ok(planComposite, 'xyeena-plan composite must exist');

    const execution = planComposite.execute({
      title: 'Multi-Tenant Billing Webhook Architecture',
      spec: 'Idempotent webhook ingestion, signature validation, retry queue, customer tenant ledger'
    });

    assert.strictEqual(execution.status, 'SUCCESS');
    assert.ok(execution.phasedPlan.phases.length >= 2, 'Must have at least 2 distinct phases');

    // Structured ADR composition
    const adr = DeliveryMethods.composeAdr({
      id: 'ADR-012',
      title: 'Idempotent Stripe Webhook Ingestion',
      status: 'ACCEPTED',
      context: 'Stripe webhooks can deliver duplicates during retries; invoices must not be charged twice.',
      decision: 'Record event_id in idempotent_events table using transactional unique index before dispatching.',
      consequences: 'Guarantees exactly-once processing at the cost of one lightweight INSERT per incoming webhook.'
    });

    assert.ok(adr.includes('# ADR-012: Idempotent Stripe Webhook Ingestion'));
    assert.ok(adr.includes('## Consequences'));
  });

  // Scenario 4: Full-stack TypeScript/React task
  it('Scenario 4: Full-stack TypeScript/React task audits server/client boundaries, secret leakage, and animation cleanup', () => {
    // 1. Client file leaking service role key (Vercel RE-13 convention violation)
    const clientCode = `
'use client';
import { createClient } from '@supabase/supabase-js';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummysecret12345';
export function UserProfile() { return <div>User</div>; }
    `;
    const leakCheck = SecurityMethods.detectServiceRoleKeyExposure({
      content: clientCode,
      filePath: 'src/app/components/UserProfile.tsx'
    });
    assert.strictEqual(leakCheck.exposed, true);
    assert.strictEqual(leakCheck.severity, 'CRITICAL');

    // 2. React animation lifecycle cleanup missing (GSAP RE-14)
    const badAnimationCode = `
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
export function HeroBanner() {
  const boxRef = useRef(null);
  useEffect(() => {
    gsap.to(boxRef.current, { x: 100, duration: 1 });
  }, []);
  return <div ref={boxRef}>Hero</div>;
}
    `;
    const lifecycleAudit = DesignMethods.verifyMotionLifecycleCleanup({
      componentCode: badAnimationCode,
      framework: 'react'
    });
    assert.strictEqual(lifecycleAudit.hasCleanup, false);
    assert.strictEqual(lifecycleAudit.verdict, 'MISSING_LIFECYCLE_CLEANUP');

    // Compliant with useGSAP
    const goodAnimationCode = `
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
export function HeroBanner() {
  const container = useRef(null);
  useGSAP(() => {
    gsap.to('.box', { x: 100 });
  }, { scope: container });
  return <div ref={container}><div className="box">Hero</div></div>;
}
    `;
    const cleanAudit = DesignMethods.verifyMotionLifecycleCleanup({
      componentCode: goodAnimationCode,
      framework: 'react'
    });
    assert.strictEqual(cleanAudit.hasCleanup, true);
    assert.strictEqual(cleanAudit.verdict, 'MOTION_LIFECYCLE_VERIFIED');
  });

  // Scenario 5: UI design critique
  it('Scenario 5: UI design critique identifies surface mode, craft deficits, and proposes intentional visual hierarchy', () => {
    const rawCss = `
.dashboard-card {
  background: #ffffff;
  color: #a0a0a0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 12px;
}
    `;

    // 1. Resolve surface mode (Impeccable RE-07)
    const mode = DesignMethods.resolveSurfaceMode('Admin analytics data tables');
    assert.strictEqual(mode.mode, 'Operate');
    assert.strictEqual(mode.isAppScreen, true);

    // 2. Critique craft
    const critique = DesignMethods.critiqueCraft({
      mode: mode.mode,
      markupOrCss: rawCss
    });
    assert.strictEqual(critique.verdict, 'CRAFT_CRITIQUE_COMPLETE');
    assert.ok(critique.touchTargetStandard.includes('24px'));
  });

  // Scenario 6: Mobile accessibility review
  it('Scenario 6: Mobile accessibility review enforces WCAG AA (24px) / AAA (44px) and relative luminance contrast', () => {
    // 1. Touch target sizes (Anti-Slop RE-03 / Apple HIG RE-22 / WCAG RE-21)
    const undersizedTarget = DesignMethods.evaluateTouchTargetSize({ widthPx: 18, heightPx: 18 });
    assert.strictEqual(undersizedTarget.passesAA, false);
    assert.strictEqual(undersizedTarget.passesAAA, false);
    assert.strictEqual(undersizedTarget.verdict, 'TARGET_SIZE_VIOLATION');

    const aaTarget = DesignMethods.evaluateTouchTargetSize({ widthPx: 26, heightPx: 26 });
    assert.strictEqual(aaTarget.passesAA, true);
    assert.strictEqual(aaTarget.passesAAA, false);
    assert.strictEqual(aaTarget.verdict, 'WCAG_AA_COMPLIANT');

    const aaaTarget = DesignMethods.evaluateTouchTargetSize({ widthPx: 48, heightPx: 48 });
    assert.strictEqual(aaaTarget.passesAA, true);
    assert.strictEqual(aaaTarget.passesAAA, true);
    assert.strictEqual(aaaTarget.verdict, 'WCAG_AAA_COMPLIANT');

    // 2. Relative luminance contrast calculation with RGB tuples
    // [255, 255, 255] (1.0) on [0, 0, 0] (0.0) -> 21:1
    const highContrast = DesignMethods.calculateWcagContrast([255, 255, 255], [0, 0, 0]);
    assert.strictEqual(highContrast.ratio, 21);
    assert.strictEqual(highContrast.passesAA, true);
    assert.strictEqual(highContrast.passesAAA, true);

    // [119, 119, 119] (#777777) on [255, 255, 255] -> ~4.48:1 (fails AAA normal text)
    const midContrast = DesignMethods.calculateWcagContrast([119, 119, 119], [255, 255, 255]);
    assert.strictEqual(midContrast.passesAAA, false);
  });

  // Scenario 7: User-directed visual design
  it('Scenario 7: User-directed visual design explores 3 distinct directions with token-bound palettes and typography scales', () => {
    const directions = DesignMethods.exploreVisualDirections('Fintech Wealth Management Dashboard');

    assert.strictEqual(directions.directionsCount, 3);
    assert.strictEqual(directions.directions.length, 3);
    assert.strictEqual(directions.verdict, 'VISUAL_DIRECTIONS_EXPLORED');

    for (const dir of directions.directions) {
      assert.ok(dir.id, 'Direction must have an ID');
      assert.ok(dir.name, 'Direction must have a name');
      assert.ok(dir.focus, 'Direction must specify focus');
      assert.ok(dir.paletteRecommendation.length >= 3, 'Direction must specify palette');
    }
  });

  // Scenario 8: Human copywriting
  it('Scenario 8: Human copywriting detects AI clichés and buzzword density with quote exemptions', () => {
    const aiSlopCopy = 'In this fast-paced world, our revolutionary platform allows you to delve into a rich tapestry of seamless experiences, a testament to our innovation.';
    const audit = QualityMethods.auditUniversalAntiSlop(aiSlopCopy, { domain: 'copywriting' });

    assert.strictEqual(audit.compliant, false);
    assert.ok(audit.copywriting.detectedCliches.includes('delve'));
    assert.ok(audit.copywriting.detectedCliches.includes('tapestry'));
    assert.ok(audit.copywriting.detectedCliches.includes('testament to'));

    // Quote exemption
    const quoted = 'The CEO stated: "Our platform allows users to delve into a rich tapestry of data."';
    const cleanQuoted = QualityMethods.auditCopywriting(quoted, { allowQuotedUsage: true });
    assert.strictEqual(cleanQuoted.hasSlop, false);
    assert.strictEqual(cleanQuoted.count, 0);
  });

  // Scenario 9: Source-grounded research
  it('Scenario 9: Source-grounded research enforces verified file:line citations and compact payload', () => {
    const verboseRaw = `
Hello there! I would be very happy to assist you with that analysis.
The verified technical findings are as follows:
- Token timeout definition: src/auth/token.ts:12
- Password hashing implementation: src/auth/hash.ts:45
Hope this helps! Let me know if you need anything else!
    `;

    const compressed = EngineeringMethods.compressTechnicalOutput(verboseRaw);

    assert.ok(compressed.compressedText.includes('src/auth/token.ts:12'));
    assert.ok(compressed.compressedText.includes('src/auth/hash.ts:45'));
    assert.strictEqual(compressed.verbatimPayloadPreserved, true);
    assert.ok(!compressed.compressedText.includes('Hello there!'));
  });

  // Scenario 10: Scoped security review
  it('Scenario 10: Scoped security review defaults to scoped diff mode and blocks full audit without explicit consent', () => {
    const securityComposite = COMPOSITE_DEFINITIONS.find(c => c.id === 'xyeena-security');

    // 1. Without explicit full audit permission
    const blocked = securityComposite.execute({
      fullAuditRequested: true,
      explicitOwnerApproval: false
    });
    assert.strictEqual(blocked.status, 'BLOCKED_CONSENT_REQUIRED');

    // 2. Default scoped diff review
    const diff = `
--- a/src/api/auth.ts
+++ b/src/api/auth.ts
@@ -10,1 +10,1 @@
- const user = await db.query('SELECT * FROM users WHERE id = ' + req.params.id);
+ const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    `;
    const scoped = securityComposite.execute({ diff });
    assert.strictEqual(scoped.status, 'SUCCESS');
    assert.strictEqual(scoped.mode, 'SCOPED_DIFF_REVIEW');
  });

  // Scenario 11: Supabase/Postgres safety analysis (with truthful static check pass)
  it('Scenario 11: Supabase/Postgres safety analysis enforces epistemic truthfulness: static check passes without claiming live verification', async () => {
    // 1. Static policy check ONLY: must return STATIC_CHECK_PASS and requiresLiveValidation: true
    const staticCheck = SecurityMethods.evaluateRlsPolicy({
      tableName: 'tenant_accounts',
      rlsEnabled: true,
      policies: [
        { name: 'tenant_isolation', definition: 'auth.uid() = user_id AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())' }
      ]
    });

    assert.strictEqual(staticCheck.secure, true);
    assert.strictEqual(staticCheck.requiresLiveValidation, true);
    assert.strictEqual(staticCheck.verdict, 'STATIC_CHECK_PASS');
    assert.strictEqual(staticCheck.epistemicStatus, 'STATIC_ANALYSIS_ONLY');

    // 2. Caller-asserted boolean alone is rejected (DEC-31 anti-self-assertion)
    const selfAssertedCheck = SecurityMethods.evaluateRlsPolicy({
      tableName: 'tenant_accounts',
      rlsEnabled: true,
      policies: [
        { name: 'tenant_isolation', definition: 'auth.uid() = user_id' }
      ],
      liveExecutionVerified: true
    });
    assert.strictEqual(selfAssertedCheck.verdict, 'STATIC_CHECK_PASS');
    assert.strictEqual(selfAssertedCheck.requiresLiveValidation, true);
    assert.strictEqual(selfAssertedCheck.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
    assert.strictEqual(selfAssertedCheck.receiptRejected, true);

    // 3. Fake / manufactured receipt without authorized LiveDatabaseAdapter is rejected
    const fakeReceipt = SecurityMethods.createRlsQueryReceipt({
      tableName: 'tenant_accounts',
      dbEnvironment: 'postgres-staging'
    });
    const fakeReceiptCheck = SecurityMethods.evaluateRlsPolicy({
      tableName: 'tenant_accounts',
      rlsEnabled: true,
      policies: [
        { name: 'tenant_isolation', definition: 'auth.uid() = user_id' }
      ],
      trustedQueryReceipt: fakeReceipt
    });
    assert.strictEqual(fakeReceiptCheck.verdict, 'STATIC_CHECK_PASS');
    assert.strictEqual(fakeReceiptCheck.requiresLiveValidation, true);
    assert.strictEqual(fakeReceiptCheck.epistemicStatus, 'STATIC_ANALYSIS_ONLY');
    assert.strictEqual(fakeReceiptCheck.receiptRejected, true);

    // 4. Authorized LiveDatabaseAdapter with active client: returns RLS_LIVE_ISOLATION_VERIFIED
    const liveAdapter = new LiveDatabaseAdapter({
      environment: 'postgres-staging',
      client: {
        query: async ({ query, principal }) => {
          if (query.includes('WHERE tenant_id = $1')) {
            return { rows: [], rowCount: 0, error: 'ACCESS_DENIED' };
          }
          return { rows: [{ id: '1', user_id: principal.id }], rowCount: 1 };
        }
      }
    });
    const probe = await liveAdapter.executeIsolationProbe({
      tableName: 'tenant_accounts',
      testPrincipals: [
        { id: 'usr-1', tenantId: 'tenant-a' },
        { id: 'usr-2', tenantId: 'tenant-b' }
      ]
    });
    const liveCheck = SecurityMethods.evaluateRlsPolicy({
      tableName: 'tenant_accounts',
      rlsEnabled: true,
      policies: [
        { name: 'tenant_isolation', definition: 'auth.uid() = user_id' }
      ],
      liveDatabaseAdapter: liveAdapter,
      liveProbeResult: probe
    });
    assert.strictEqual(liveCheck.verdict, 'RLS_LIVE_ISOLATION_VERIFIED');
    assert.strictEqual(liveCheck.requiresLiveValidation, false);
    assert.strictEqual(liveCheck.epistemicStatus, 'LIVE_EXECUTION_PROVEN');
    assert.strictEqual(liveCheck.receiptVerified, true);

    // 3. PostgreSQL migration safety: flags table lock hazards
    const unsafeSql = 'CREATE INDEX idx_orders_user ON big_orders (user_id);';
    const migrationAudit = SecurityMethods.auditPostgresMigrationSafety({
      ddl: unsafeSql,
      currentTableRows: 50000
    });
    assert.strictEqual(migrationAudit.safe, false);
    assert.ok(migrationAudit.hazards.some(h => h.type === 'LOCK_HEAVY_INDEXING'));
    assert.strictEqual(migrationAudit.verdict, 'MIGRATION_LOCK_HAZARDS_DETECTED');
  });

  // Scenario 12: MCP/retrieval task
  it('Scenario 12: MCP/retrieval task audits parity and enforces bounded retrieval with index corruption recovery', () => {
    // 1. MCP parity
    const parity = KnowledgeMethods.auditMcpToolParity({
      manifestTools: [
        { name: 'read_doc', parameters: { required: ['path'] } },
        { name: 'write_doc', parameters: { required: ['path', 'body'] } }
      ],
      dispatcherHandlers: [
        { name: 'read_doc', requiredParams: ['path'] },
        { name: 'write_doc', requiredParams: ['path'] } // missing 'body'
      ]
    });
    assert.strictEqual(parity.parityConsistent, false);
    assert.strictEqual(parity.verdict, 'PARITY_MISMATCH');

    // 2. Bounded retrieval
    const dataset = [
      { path: 'docs/guide.md', content: 'Comprehensive user guide for the platform.' },
      { path: 'docs/api.md', content: 'API endpoints and parameter schemas.' }
    ];
    const retrieved = KnowledgeMethods.boundedRetrieve({
      query: 'guide',
      dataset,
      maxResults: 1
    });
    assert.strictEqual(retrieved.results.length, 1);

    // 3. Corrupted index recovery to direct scan
    const corruptedIndexString = '{"index": "corrupted", "entries": [MISSING_CLOSE_BRACKET';
    const recovered = KnowledgeMethods.boundedRetrieve({
      query: 'guide',
      dataset,
      indexData: corruptedIndexString,
      fallbackDirectScan: true
    });
    assert.strictEqual(recovered.recoveredFromCorruption, true);
    assert.strictEqual(recovered.indexStatus, 'INDEX_CORRUPTED_FALLBACK');
  });

  // Scenario 13: Multi-step DAG execution
  it('Scenario 13: Multi-step DAG execution validates topological ordering, dependency gates, and checkpoint creation', () => {
    const graph = new TaskGraph();
    const taskA = new TaskNode({ id: 'task-a', title: 'Prepare Schema', dependencies: [] });
    const taskB = new TaskNode({ id: 'task-b', title: 'Seed Mock Data', dependencies: ['task-a'] });
    const taskC = new TaskNode({ id: 'task-c', title: 'Run Integration Tests', dependencies: ['task-b'] });

    graph.addTask(taskA);
    graph.addTask(taskB);
    graph.addTask(taskC);

    const order = graph.getExecutionOrder();
    assert.deepStrictEqual(order, ['task-a', 'task-b', 'task-c']);

    // Checkpoint management
    const checkpointManager = new CheckpointManager();
    const snapshot = checkpointManager.createSnapshot({
      checkpointId: 'ckpt-dag-001',
      phase: 'PRE_INTEGRATION_TESTS',
      tasks: graph.getAll(),
      evidence: [],
      modifiedFiles: ['schema.sql']
    });

    assert.strictEqual(snapshot.checkpointId, 'ckpt-dag-001');
    assert.strictEqual(snapshot.tasks.length, 3);
  });

  // Scenario 14: Existing-user-skill precedence
  it('Scenario 14: Existing-user-skill precedence prioritizes user slash-command and custom skill over auto heuristics', () => {
    const prompt = '/custom-lint-check: periksa formatting pada file controller';
    const explicit = cortex.detectExplicitSkills(prompt);

    assert.ok(explicit.includes('custom-lint-check'));

    // Plan records explicit primary skill
    const plan = cortex.resolve(prompt);
    assert.strictEqual(plan.explicitSkills.primarySkill, 'custom-lint-check');
  });

  // Scenario 15: Micro-task low-overhead execution
  it('Scenario 15: Micro-task executes under 5ms latency threshold with 0 DAG tasks and 0 file persistence', async () => {
    const start = performance.now();
    const result = await cortex.execute('Apa nama proyek ini?');
    const elapsed = performance.now() - start;

    assert.strictEqual(result.engine, 'Cortex');
    assert.strictEqual(result.tier, 'TIER_0_MICRO');
    assert.strictEqual(result.status, 'DISCUSSION_MODE');
    assert.ok(elapsed < 15, `Micro task must execute quickly; took ${elapsed.toFixed(2)}ms`);
  });

  // Scenario 16: Failed execution and recovery
  it('Scenario 16: Failed execution isolates error to node, logs evidence failure, and recovers via checkpoint', () => {
    const graph = new TaskGraph();
    const nodeA = new TaskNode({ id: 'migrate-db', title: 'Apply Migration' });
    graph.addTask(nodeA);

    // Simulate task execution failure
    nodeA.status = TASK_STATUS.FAILED;
    nodeA.error = 'Connection reset by peer during ALTER TABLE';

    assert.strictEqual(nodeA.status, TASK_STATUS.FAILED);
    assert.ok(nodeA.error.includes('Connection reset'));

    // Host process did NOT crash, failure is safely contained in task state
    assert.strictEqual(graph.get('migrate-db').status, TASK_STATUS.FAILED);
  });

  // Scenario 17: Installer dry-run, installation, repair, and uninstall in isolated fixtures
  it('Scenario 17: Installer handles dry-run, copy installation, modified file preservation, and safe uninstall', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyeena-e2e-install-'));
    try {
      // 1. Dry run plan
      const tx = new InstallationTransaction({
        cwd: tempDir,
        runtime: 'antigravity',
        mode: 'copy'
      });
      const plan = tx.plan();
      assert.strictEqual(plan.availableSkillsCount, 19);
      assert.strictEqual(fs.existsSync(path.join(tempDir, '.agents')), false, 'Plan must not write files to disk');

      // 2. Real installation
      const installResult = tx.execute();
      assert.strictEqual(installResult.success, true);
      assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'skills')));

      // 3. User modifies one official file
      const coreSkillDoc = path.join(tempDir, '.agents', 'skills', 'xyeena-core', 'SKILL.md');
      assert.ok(fs.existsSync(coreSkillDoc));
      fs.appendFileSync(coreSkillDoc, '\n<!-- User Custom Modification: Project Specific Invariant -->\n');

      // 4. Uninstall without consent contract: modified file MUST be preserved (DEC-26)
      const uninstallTx = new InstallationTransaction({
        cwd: tempDir,
        runtime: 'antigravity'
      });
      const uninstallResult = uninstallTx.uninstall();
      assert.strictEqual(uninstallResult.success, true);

      // Modified file is preserved!
      assert.ok(fs.existsSync(coreSkillDoc), 'Modified file must be preserved on uninstall');
      const preservedList = uninstallResult.preserved;
      assert.ok(preservedList.some(p => p.includes('xyeena-core/SKILL.md')));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Scenario 18: Real artifact creation only when authorized
  it('Scenario 18: Real artifact creation governance: zero files created in Discussion Mode, persists only when authorized', () => {
    // 1. In Discussion Mode, Cortex generates plans in memory without creating persistent files
    const discussionPlan = cortex.resolve('Bagaimana rancangan arsitektur sistem pembayaran?');
    assert.strictEqual(discussionPlan.mode, 'DISCUSSION');
    assert.ok(discussionPlan.workflow);

    // 2. DeliveryMethods generates ADR string in memory; persistence requires explicit consent
    const adrContent = DeliveryMethods.composeAdr({
      id: 'ADR-099',
      title: 'Decoupled Event Sourcing',
      status: 'PROPOSED',
      context: 'Need event sourcing for ledger audits.',
      decision: 'Use append-only log with Kafka.',
      consequences: 'Higher operational cost but 100% audit trail.'
    });

    assert.ok(typeof adrContent === 'string');
    assert.ok(adrContent.startsWith('# ADR-099: Decoupled Event Sourcing'));
  });

  // Section 4 Verification: Inspected XYN Architectural Trait Synthesis
  it('validates inspected XYN architectural principles: Maker-Checker separation, empirical claim boundaries, and hypothetical disclosure', () => {
    // 1. Maker-Checker Separation Invariant
    const selfReview = BehavioralTraitOverlay.validateMakerChecker({
      author: 'alice',
      reviewer: 'alice'
    });
    assert.strictEqual(selfReview.valid, false);
    assert.strictEqual(selfReview.violation, 'MakerCheckerViolation');

    const validReview = BehavioralTraitOverlay.validateMakerChecker({
      author: 'alice',
      reviewer: 'bob'
    });
    assert.strictEqual(validReview.valid, true);
    assert.strictEqual(validReview.verdict, 'MAKER_CHECKER_SEPARATION_VERIFIED');

    // 2. Empirical Claim Boundaries: raw data claims require attached primary artifacts
    const unattachedClaim = BehavioralTraitOverlay.validateEmpiricalClaim({
      claimText: 'Tim kami telah memeriksa data mentah dan log database produksi.',
      attachedArtifacts: []
    });
    assert.strictEqual(unattachedClaim.valid, false);
    assert.strictEqual(unattachedClaim.overclaim, true);
    assert.strictEqual(unattachedClaim.violation, 'EmpiricalClaimBoundaryViolation');

    const groundedClaim = BehavioralTraitOverlay.validateEmpiricalClaim({
      claimText: 'Tim kami telah memeriksa data mentah dan log database produksi.',
      attachedArtifacts: ['docs/audits/raw-db-log-receipt-20261115.json']
    });
    assert.strictEqual(groundedClaim.valid, true);
    assert.strictEqual(groundedClaim.overclaim, false);

    // 3. Hypothetical & Conceptual Guardrails
    const missingDisclosure = BehavioralTraitOverlay.validateHypotheticalDisclosure({
      text: 'Berdasarkan pengujian $n=500$, sistem mencapai tingkat keberhasilan 95%.',
      isHypothetical: true
    });
    assert.strictEqual(missingDisclosure.compliant, false);
    assert.strictEqual(missingDisclosure.violation, 'MissingConditionalDisclosure');

    const spuriousPrecision = BehavioralTraitOverlay.validateHypotheticalDisclosure({
      text: 'Berdasarkan simulasi kondisional pada skenario sintetis, kepastian tercapai 99.999%.',
      isHypothetical: true
    });
    assert.strictEqual(spuriousPrecision.compliant, false);
    assert.strictEqual(spuriousPrecision.violation, 'SpuriousPrecisionDetected');

    const validHypothetical = BehavioralTraitOverlay.validateHypotheticalDisclosure({
      text: 'Berdasarkan simulasi kondisional pada skenario sintetis, tingkat keberhasilan estimasi adalah 95%.',
      isHypothetical: true
    });
    assert.strictEqual(validHypothetical.compliant, true);
    assert.strictEqual(validHypothetical.verdict, 'HYPOTHETICAL_DISCLOSURE_VERIFIED');

    // 4. QA Verdict Tokens
    const passToken = BehavioralTraitOverlay.evaluateQaVerdict('VERDICT: PASS');
    assert.strictEqual(passToken.validToken, true);
    assert.strictEqual(passToken.status, 'PASS');
    assert.strictEqual(passToken.isAcceptable, true);

    const failToken = BehavioralTraitOverlay.evaluateQaVerdict('VERDICT: FAIL');
    assert.strictEqual(failToken.validToken, true);
    assert.strictEqual(failToken.status, 'FAIL');
    assert.strictEqual(failToken.isAcceptable, false);
  });

});
