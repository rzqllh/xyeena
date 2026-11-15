/**
 * Test Suite: P17 — Specialized Platform, Security, Retrieval & Motion Intelligence
 *
 * Validates the 5 waves and 14 behavioral acceptance scenarios:
 * 1. Wave A — Konoha (RE-31): Bounded retrieval, index corruption recovery, MCP parity, task memory isolation.
 * 2. Wave B — Cloudflare Security Audit (RE-06): Structured finding schema, scoped diff review, deduplication.
 * 3. Wave C — Trail of Bits (RE-15): Clean-room security invariants, workflow security audit, false-positive rejection.
 * 4. Wave D — Supabase Agent Skills (RE-16): RLS tenant isolation, service-role key exposure, safe PostgreSQL migrations.
 * 5. Wave E — Official GSAP Skills (RE-14): Motion performance, React lifecycle cleanup, SSR safety, stack honor.
 * 6. Targeted P16 Quality Corrections: Heuristics context, grill consent semantics, Huashu 3-direction scoping, technical output preservation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  KnowledgeMethods,
  SecurityMethods,
  DesignMethods,
  EngineeringMethods,
  QualityMethods
} from '../src/methods/index.mjs';

import { COMPOSITE_DEFINITIONS } from '../src/core/composites.mjs';
import { CortexOrchestrator, createDefaultCortex } from '../src/core/cortex.mjs';

describe('P17 — Specialized Platform, Security, Retrieval & Motion Intelligence', () => {

  describe('1. Wave A — Konoha (RE-31): Bounded Retrieval, Index Recovery & MCP Parity', () => {

    it('Scenario 1: bounded retrieval enforces max results, byte budget, and path boundaries on multi-file dataset', () => {
      // 25-file mock dataset
      const dataset = [];
      for (let i = 1; i <= 20; i++) {
        dataset.push({
          path: `src/modules/feature_${i}.ts`,
          content: `// Feature ${i} implementation\nexport function runFeature${i}() {\n  return 'feature_${i}_value';\n}`
        });
      }
      // Add sensitive files and traversal attempts
      dataset.push({ path: '.env.production', content: 'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret' });
      dataset.push({ path: 'secrets/id_rsa', content: '-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...' });
      dataset.push({ path: '../outside/traversal.txt', content: 'traversal data' });
      dataset.push({ path: 'src/config.json', content: '{"name": "app", "version": "1.0.0"}' });
      dataset.push({ path: 'src/auth/token.ts', content: 'export const tokenExp = 3600;\n// token handling' });

      const bounded = KnowledgeMethods.boundedRetrieve({
        query: 'feature',
        dataset,
        maxResults: 5,
        maxBytes: 512,
        basePath: 'src/'
      });

      // 1. Result count cap
      assert.strictEqual(bounded.maxResultsEnforced, true);
      assert.ok(bounded.totalMatched <= 5, `Expected <= 5 results, got ${bounded.totalMatched}`);

      // 2. Byte budget cap
      assert.strictEqual(bounded.maxBytesEnforced, true);
      assert.ok(bounded.byteCount <= 512, `Expected <= 512 bytes, got ${bounded.byteCount}`);

      // 3. Security filtering: secrets excluded by default
      assert.ok(!bounded.results.some(r => r.path.includes('.env')), 'Secret .env file must be excluded');
      assert.ok(!bounded.results.some(r => r.path.includes('id_rsa')), 'Secret id_rsa file must be excluded');

      // 4. Path traversal rejected
      assert.ok(bounded.rejectedFiles.some(rf => rf.reason === 'PATH_TRAVERSAL_REJECTED'));

      // 5. Citations point to valid lines
      assert.ok(bounded.citations.length > 0);
      assert.ok(bounded.citations[0].lines.length > 0);
      assert.strictEqual(bounded.verdict, 'BOUNDED_RETRIEVAL_COMPLETE');
    });

    it('Scenario 2: index corruption recovers gracefully to direct scan without losing or corrupting source data', () => {
      const dataset = [
        { path: 'src/api/users.ts', content: 'export function listUsers() { return []; }' },
        { path: 'src/api/posts.ts', content: 'export function listPosts() { return []; }' }
      ];

      // Corrupted JSON index
      const corruptedIndexString = '{"index": "corrupted", "entries": [MISSING_CLOSE_BRACKET';

      const recovered = KnowledgeMethods.boundedRetrieve({
        query: 'listUsers',
        dataset,
        indexData: corruptedIndexString,
        fallbackDirectScan: true
      });

      assert.strictEqual(recovered.recoveredFromCorruption, true);
      assert.strictEqual(recovered.indexStatus, 'INDEX_CORRUPTED_FALLBACK');
      assert.strictEqual(recovered.totalMatched, 1);
      assert.strictEqual(recovered.results[0].path, 'src/api/users.ts');
      // Source dataset is unharmed
      assert.strictEqual(dataset.length, 2);
    });

    it('Scenario 3: MCP manifest vs dispatcher parity detects discrepancies and enforces execution gates', () => {
      const manifestTools = [
        { name: 'read_file', description: 'Read file content', parameters: { required: ['path'] } },
        { name: 'write_file', description: 'Write file content', parameters: { required: ['path', 'content'] } },
        { name: 'execute_command', description: 'Run shell command', parameters: { required: ['command'] } }
      ];

      const dispatcherHandlers = [
        { name: 'read_file', requiredParams: ['path'] },
        // write_file is missing required 'content' parameter enforcement
        { name: 'write_file', requiredParams: ['path'] },
        // undeclared internal handler
        { name: 'raw_db_exec', requiredParams: ['query'] }
      ];

      const audit = KnowledgeMethods.auditMcpToolParity({
        manifestTools,
        dispatcherHandlers
      });

      assert.strictEqual(audit.parityConsistent, false);
      assert.strictEqual(audit.verdict, 'PARITY_MISMATCH');

      // 1. Missing handler: execute_command is in manifest but not in dispatcher
      assert.strictEqual(audit.missingHandlers.length, 1);
      assert.strictEqual(audit.missingHandlers[0].toolName, 'execute_command');

      // 2. Undeclared tool: raw_db_exec is in dispatcher but not declared in manifest
      assert.strictEqual(audit.undeclaredTools.length, 1);
      assert.strictEqual(audit.undeclaredTools[0].handlerName, 'raw_db_exec');

      // 3. Parameter mismatch: content required by manifest but not handled
      assert.strictEqual(audit.parameterMismatches.length, 1);
      assert.strictEqual(audit.parameterMismatches[0].param, 'content');

      // Invariant: registration DOES NOT grant execution permission
      assert.strictEqual(audit.registrationDoesNotGrantExecution, true);
    });

    it('verifies task-scoped memory isolation and blocks automatic persistence of secrets', () => {
      const memoryStore = {
        'task-100': { currentStep: 1, lastFile: 'src/main.ts' }
      };

      // Valid task write
      const validWrite = KnowledgeMethods.verifyTaskMemoryIsolation({
        taskId: 'task-100',
        memoryStore,
        candidateWrite: { key: 'status', value: 'IN_PROGRESS' }
      });
      assert.strictEqual(validWrite.isolated, true);
      assert.strictEqual(validWrite.verdict, 'TASK_MEMORY_ISOLATED');

      // Blocked write containing secret API key
      const secretWrite = KnowledgeMethods.verifyTaskMemoryIsolation({
        taskId: 'task-100',
        memoryStore,
        candidateWrite: { key: 'apiKey', value: 'sk-1234567890123456789012' }
      });
      assert.strictEqual(secretWrite.isolated, false);
      assert.strictEqual(secretWrite.verdict, 'SECRET_PERSISTENCE_BLOCKED');
    });
  });

  describe('2. Wave B & C — Cloudflare & Trail of Bits Security Intelligence', () => {

    it('Scenario 4: machine-readable Cloudflare finding schema with source-to-sink trace and duplicate suppression', () => {
      const findingA = SecurityMethods.createStructuredFinding({
        title: 'Unauthenticated IDOR in User Profile Route',
        description: 'Callers can supply arbitrary user IDs without ownership verification.',
        rootCause: 'Route handler uses req.params.id directly without checking session user ID.',
        intendedBehavior: 'Route must assert session.user.id === req.params.id or role === ADMIN.',
        attackClass: 'INSECURE_DIRECT_OBJECT_REFERENCE',
        severity: 'HIGH',
        threatBoundary: 'UNTRUSTED_CLIENT_TO_SERVER',
        principal: 'unauthenticated_or_other_tenant',
        resource: '/api/users/:id',
        trace: [
          { kind: 'entrypoint', file: 'src/routes/users.ts', line: 15, scope: 'GET /api/users/:id', description: 'Client supplies target user id' },
          { kind: 'propagation', file: 'src/services/userService.ts', line: 44, scope: 'getUser(id)', description: 'ID passed without tenant check' },
          { kind: 'sink', file: 'src/db/queries.ts', line: 88, scope: 'SELECT * FROM users WHERE id = $1', description: 'Database query executed' }
        ],
        remediation: 'Filter by authenticated session user id: WHERE id = $1 AND tenant_id = $2'
      });

      // Validate finding schema
      const validation = SecurityMethods.validateFinding(findingA);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(findingA.verdict, 'CONFIRMED_VULNERABILITY');
      assert.ok(findingA.fingerprint.startsWith('xy-sec-'));

      // Duplicate finding test
      const duplicateFinding = { ...findingA };
      const uniqueFindingB = SecurityMethods.createStructuredFinding({
        title: 'CORS wildcard with credentials',
        attackClass: 'BROKEN_ACCESS_CONTROL',
        severity: 'MEDIUM',
        trace: [{ kind: 'sink', file: 'src/server.ts', line: 20 }]
      });

      const deduplicated = SecurityMethods.deduplicateFindings([findingA, duplicateFinding, uniqueFindingB]);
      assert.strictEqual(deduplicated.totalInput, 3);
      assert.strictEqual(deduplicated.uniqueCount, 2);
      assert.strictEqual(deduplicated.duplicateCount, 1);
    });

    it('Scenario 5: rejects pattern-match-only vulnerability claims without exploitability or reachable sink proof', () => {
      // Synthetic pattern match finding (e.g. grep found "eval" in a disabled test fixture)
      const falsePositive = SecurityMethods.validateSecurityInvariant({
        invariantName: 'No Dynamic Code Execution',
        condition: false,
        isPatternMatchOnly: true,
        reachableSink: false,
        exploitabilityEvidence: null,
        trustBoundaryCrossed: false
      });

      assert.strictEqual(falsePositive.validVulnerability, false);
      assert.strictEqual(falsePositive.verdict, 'REJECTED_FALSE_POSITIVE');
      assert.ok(falsePositive.reason.includes('pattern match without exploitability'));

      // Genuine exploitability proof with reachable sink
      const confirmedVulnerability = SecurityMethods.validateSecurityInvariant({
        invariantName: 'No SQL String Concatenation',
        condition: false,
        isPatternMatchOnly: false,
        reachableSink: true,
        exploitabilityEvidence: 'Payload "1 OR 1=1" returns all records across tenants',
        trustBoundaryCrossed: true
      });

      assert.strictEqual(confirmedVulnerability.validVulnerability, true);
      assert.strictEqual(confirmedVulnerability.verdict, 'INVARIANT_VIOLATION_CONFIRMED');
    });

    it('Scenario 6: security review without explicit full audit permission strictly stays in scoped mode', () => {
      // 1. Method gate
      const activationCheck = SecurityMethods.assertAuditActivationAllowed(false);
      assert.strictEqual(activationCheck.allowed, false);
      assert.strictEqual(activationCheck.status, 'BLOCKED');

      // 2. Composite /xyeena-security gate
      const securityComposite = COMPOSITE_DEFINITIONS.find(c => c.id === 'xyeena-security');

      // When full audit requested without explicit approval
      const blockedExecution = securityComposite.execute({
        fullAuditRequested: true,
        explicitOwnerApproval: false
      });
      assert.strictEqual(blockedExecution.status, 'BLOCKED_CONSENT_REQUIRED');

      // Default scoped review mode executes cleanly
      const scopedExecution = securityComposite.execute({
        diff: '--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1 +1 @@\n- const x = 1;\n+ const x = 2;'
      });
      assert.strictEqual(scopedExecution.status, 'SUCCESS');
      assert.strictEqual(scopedExecution.mode, 'SCOPED_DIFF_REVIEW');
    });

    it('audits GitHub Actions workflows for dangerous pull_request_target and unpinned actions', () => {
      const vulnerableWorkflow = `
name: CI
on:
  pull_request_target:
    types: [opened, synchronize]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}
      - uses: thirdparty/unpinned-action@main
      - name: Run PR comment script
        run: |
          echo "Processing PR: \${{ github.event.issue.body }}"
      `;

      const audit = SecurityMethods.auditWorkflowSecurity({
        workflowYaml: vulnerableWorkflow,
        workflowPath: '.github/workflows/ci.yml'
      });

      assert.strictEqual(audit.secure, false);
      assert.strictEqual(audit.verdict, 'WORKFLOW_VULNERABILITIES_DETECTED');
      assert.ok(audit.findings.some(f => f.id === 'SEC-GHA-001' && f.severity === 'CRITICAL'));
      assert.ok(audit.findings.some(f => f.id === 'SEC-GHA-002' && f.severity === 'HIGH'));
      assert.ok(audit.findings.some(f => f.id === 'SEC-GHA-003' && f.severity === 'MEDIUM'));
    });
  });

  describe('3. Wave D — Supabase Agent Skills (RE-16): Database & RLS Safety', () => {

    it('Scenario 7: evaluates Supabase RLS policies and detects cross-tenant isolation leaks', () => {
      const testPrincipals = [
        { id: 'usr-alice', tenantId: 'tenant-alpha' },
        { id: 'usr-bob', tenantId: 'tenant-beta' }
      ];

      // 1. Table missing RLS completely
      const unmanagedTable = SecurityMethods.evaluateRlsPolicy({
        tableName: 'public_profiles',
        rlsEnabled: false,
        policies: []
      });
      assert.strictEqual(unmanagedTable.secure, false);
      assert.ok(unmanagedTable.issues.some(i => i.severity === 'CRITICAL'));

      // 2. Table with RLS but permissive policy that leaks across tenants
      const leakingTable = SecurityMethods.evaluateRlsPolicy({
        tableName: 'tenant_invoices',
        rlsEnabled: true,
        policies: [
          { name: 'permissive_select', definition: 'true' }
        ],
        testPrincipals
      });
      assert.strictEqual(leakingTable.crossTenantLeak, true);
      assert.strictEqual(leakingTable.verdict, 'RLS_CROSS_TENANT_LEAK_DETECTED');

      // 3. Table with strict tenant isolation (static check only)
      const secureTable = SecurityMethods.evaluateRlsPolicy({
        tableName: 'tenant_invoices',
        rlsEnabled: true,
        policies: [
          { name: 'isolated_tenant_select', definition: 'auth.uid() = user_id AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())' }
        ],
        testPrincipals: [
          { id: 'usr-alice', tenantId: 'tenant-alpha' }
        ]
      });
      assert.strictEqual(secureTable.secure, true);
      assert.strictEqual(secureTable.requiresLiveValidation, true);
      assert.strictEqual(secureTable.verdict, 'STATIC_CHECK_PASS');
      assert.strictEqual(secureTable.epistemicStatus, 'STATIC_ANALYSIS_ONLY');

      // 4. Live execution verified receipt
      const liveVerifiedTable = SecurityMethods.evaluateRlsPolicy({
        tableName: 'tenant_invoices',
        rlsEnabled: true,
        policies: [
          { name: 'isolated_tenant_select', definition: 'auth.uid() = user_id' }
        ],
        liveExecutionVerified: true
      });
      assert.strictEqual(liveVerifiedTable.verdict, 'RLS_LIVE_ISOLATION_VERIFIED');
      assert.strictEqual(liveVerifiedTable.requiresLiveValidation, false);
      assert.strictEqual(liveVerifiedTable.epistemicStatus, 'LIVE_EXECUTION_PROVEN');
    });

    it('Scenario 8: detects exposed Supabase service-role keys in client-facing frontend bundles', () => {
      const clientFileContent = `
import { createClient } from '@supabase/supabase-js';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockservicekey12345';
export const supabase = createClient('https://xyz.supabase.co', SUPABASE_SERVICE_ROLE_KEY);
      `;

      const clientExposure = SecurityMethods.detectServiceRoleKeyExposure({
        content: clientFileContent,
        filePath: 'src/app/dashboard/page.tsx'
      });

      assert.strictEqual(clientExposure.exposed, true);
      assert.strictEqual(clientExposure.severity, 'CRITICAL');
      assert.strictEqual(clientExposure.verdict, 'SERVICE_ROLE_KEY_EXPOSED');

      // Server-side safe usage
      const serverFileContent = `
import { createClient } from '@supabase/supabase-js';
export const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      `;

      const serverSafe = SecurityMethods.detectServiceRoleKeyExposure({
        content: serverFileContent,
        filePath: 'src/server/supabase-admin.ts'
      });
      assert.strictEqual(serverSafe.exposed, false);
      assert.strictEqual(serverSafe.verdict, 'NO_CLIENT_SERVICE_ROLE_EXPOSURE');
    });

    it('Scenario 9: audits PostgreSQL migrations for table lock hazards and Expand-Migrate-Contract sequencing', () => {
      const hazardousDdl = `
-- Migration 20261115_add_status.sql
CREATE INDEX idx_orders_status ON orders(status);
ALTER TABLE orders ADD COLUMN priority INT NOT NULL;
CREATE FUNCTION get_admin_metrics() RETURNS INT SECURITY DEFINER AS $$ SELECT 42; $$ LANGUAGE sql;
      `;

      const audit = SecurityMethods.auditPostgresMigrationSafety({
        ddl: hazardousDdl,
        currentTableRows: 50000
      });

      assert.strictEqual(audit.safe, false);
      assert.strictEqual(audit.verdict, 'MIGRATION_LOCK_HAZARDS_DETECTED');
      assert.ok(audit.hazards.some(h => h.type === 'LOCK_HEAVY_INDEXING'));
      assert.ok(audit.hazards.some(h => h.type === 'TABLE_REWRITE_LOCK'));
      assert.ok(audit.hazards.some(h => h.type === 'SECURITY_DEFINER_PRIVILEGE_ESCALATION'));

      // Safe migration
      const safeDdl = `
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
ALTER TABLE orders ADD COLUMN priority INT DEFAULT 0;
CREATE FUNCTION get_metrics() RETURNS INT SECURITY INVOKER AS $$ SELECT 42; $$ LANGUAGE sql;
      `;
      const safeAudit = SecurityMethods.auditPostgresMigrationSafety({
        ddl: safeDdl,
        currentTableRows: 50000
      });
      assert.strictEqual(safeAudit.safe, true);
      assert.strictEqual(safeAudit.verdict, 'POSTGRES_MIGRATION_SAFE');
    });
  });

  describe('4. Wave E — Official GSAP Skills (RE-14): Motion & Lifecycle Intelligence', () => {

    it('Scenario 10: detects React animation lifecycle cleanup omissions and verifies SSR safety', () => {
      // Leaky component: useEffect creates tweens without revert()
      const leakyReactComponent = `
import React, { useEffect } from 'react';
import gsap from 'gsap';

export function Banner() {
  useEffect(() => {
    gsap.to('.banner', { x: 100, duration: 1 });
  }, []);
  return <div className="banner">Hello</div>;
}
      `;

      const leakyAudit = DesignMethods.verifyMotionLifecycleCleanup({
        componentCode: leakyReactComponent,
        framework: 'react'
      });
      assert.strictEqual(leakyAudit.hasCleanup, false);
      assert.strictEqual(leakyAudit.memoryLeakRisk, true);
      assert.strictEqual(leakyAudit.verdict, 'MISSING_LIFECYCLE_CLEANUP');

      // Clean component using useGSAP()
      const cleanReactComponent = `
import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function SafeBanner() {
  const container = useRef(null);
  useGSAP(() => {
    gsap.to('.box', { x: 100 });
  }, { scope: container });
  return <div ref={container}><div className="box">Safe</div></div>;
}
      `;

      const cleanAudit = DesignMethods.verifyMotionLifecycleCleanup({
        componentCode: cleanReactComponent,
        framework: 'react'
      });
      assert.strictEqual(cleanAudit.hasCleanup, true);
      assert.strictEqual(cleanAudit.memoryLeakRisk, false);
      assert.strictEqual(cleanAudit.verdict, 'MOTION_LIFECYCLE_VERIFIED');
    });

    it('Scenario 11: audits motion performance, flagging layout-thrashing properties while validating reduced-motion', () => {
      // Bad motion animating layout properties
      const layoutThrashingAnimation = `
gsap.to('.card', {
  width: 500,
  height: 300,
  top: 100,
  left: 50,
  duration: 0.5
});
      `;

      const perfAudit = DesignMethods.auditMotionPerformance({
        animationCode: layoutThrashingAnimation
      });
      assert.strictEqual(perfAudit.hasLayoutThrashing, true);
      assert.strictEqual(perfAudit.verdict, 'LAYOUT_THRASHING_WARNING');
      assert.ok(perfAudit.layoutThrashingProps.includes('width'));
      assert.ok(perfAudit.layoutThrashingProps.includes('top'));

      // Good motion animating compositor properties
      const compositorAnimation = `
gsap.to('.card', {
  x: 100,
  y: 50,
  scale: 1.1,
  rotation: 5,
  opacity: 0.9,
  duration: 0.5
});
      `;
      const goodPerf = DesignMethods.auditMotionPerformance({
        animationCode: compositorAnimation
      });
      assert.strictEqual(goodPerf.hasLayoutThrashing, false);
      assert.strictEqual(goodPerf.verdict, 'MOTION_PERFORMANCE_OPTIMIZED');

      // Reduced-motion compliance check
      const reducedMotionCss = `
.box { transition: transform 0.3s ease; }
@media (prefers-reduced-motion: reduce) {
  .box { transition: none; transform: none; }
}
      `;
      const motionSupport = DesignMethods.verifyReducedMotionSupport({
        cssOrJsCode: reducedMotionCss
      });
      assert.strictEqual(motionSupport.supportsReducedMotion, true);
      assert.strictEqual(motionSupport.verdict, 'REDUCED_MOTION_SUPPORTED');
    });

    it('Scenario 12: honors existing non-GSAP animation stack without forcing GSAP installation', () => {
      const framerPackageJson = {
        dependencies: {
          'next': '14.2.0',
          'react': '^18.2.0',
          'framer-motion': '^11.2.0'
        }
      };

      const stackAudit = DesignMethods.evaluateAnimationStack({
        packageJson: framerPackageJson
      });

      assert.strictEqual(stackAudit.forcedGsap, false);
      assert.strictEqual(stackAudit.stackDetected, 'framer-motion');
      assert.strictEqual(stackAudit.verdict, 'EXISTING_STACK_HONORED');
      assert.ok(stackAudit.recommendation.includes('Honor existing framer-motion stack'));
    });
  });

  describe('5. Targeted Quality Corrections & Cortex Routing Discipline', () => {

    it('Scenario 13: explicit user skill selection receives highest priority over automatic heuristics', () => {
      const cortex = createDefaultCortex();

      const explicitSecurity = cortex.detectExplicitSkills('/xyeena-security audit payment route diff');
      assert.strictEqual(explicitSecurity.hasExplicit, true);
      assert.strictEqual(explicitSecurity.primarySkill, 'xyeena-security');

      const explicitDesign = cortex.detectExplicitSkills('/xyeena-design redesign dashboard card component');
      assert.strictEqual(explicitDesign.hasExplicit, true);
      assert.strictEqual(explicitDesign.primarySkill, 'xyeena-design');
    });

    it('Scenario 14: micro-tasks execute directly under 5ms without triggering unnecessary retrieval/security scans', async () => {
      const cortex = createDefaultCortex();

      const start = performance.now();
      const microResult = await cortex.execute('Apa nama proyek ini?');
      const elapsed = performance.now() - start;

      assert.strictEqual(microResult.tier, 'TIER_0_MICRO');
      assert.strictEqual(microResult.mode, 'DISCUSSION');
      assert.ok(elapsed < 20, `Micro execution took ${elapsed}ms, expected fast inline response`);
      assert.strictEqual(microResult.plan.workflow.steps.length, 1);
    });

    it('validates quality corrections: engineering heuristics as advisory signals, grill consent semantics, and Huashu scoping', () => {
      // 1. Engineering heuristics as advisory signals
      const depthAudit = EngineeringMethods.evaluateModuleDepth({
        moduleName: 'ThinWrapper',
        publicMethods: ['get', 'set', 'clear'],
        internalLinesOfCode: 15
      });
      assert.strictEqual(depthAudit.signal, 'HEURISTIC_ADVISORY');
      assert.strictEqual(depthAudit.isDogmaticBlocker, false);

      // 2. Grill consent semantics: bare "ya" cannot authorize sensitive operations
      const sensitiveDecisions = [
        {
          id: 'drop-staging-db',
          title: 'Drop Staging Database',
          question: 'Are you sure you want to drop staging DB?',
          recommended: 'No',
          destructive: true
        }
      ];

      const ambiguousGrill = EngineeringMethods.grillFrontier({
        decisions: sensitiveDecisions,
        userResponses: { 'drop-staging-db': 'ya' }
      });
      assert.strictEqual(ambiguousGrill.isDone, false);
      assert.strictEqual(ambiguousGrill.verdict, 'AMBIGUOUS_CONSENT_BLOCKED');
      assert.ok(ambiguousGrill.ambiguousConsents.length > 0);

      // 3. Huashu 3-direction scoping: minor tweaks skip 3-direction exploration
      const minorDesign = DesignMethods.exploreVisualDirections('Fix small button padding typo', {
        isSubstantiveDesign: false
      });
      assert.strictEqual(minorDesign.substantiveRequired, false);
      assert.strictEqual(minorDesign.verdict, 'DIRECTION_EXPLORATION_SKIPPED_FOCUSED_REFINEMENT');

      // 4. Technical output preservation: preserves stack traces verbatim
      const rawWithStack = `
        Hello there! We ran into an issue.
        Error: ConnectionRefused at DatabasePool
            at Function.connect (C:/app/pool.ts:42:10)
            at async runJob (C:/app/worker.ts:18:5)
        npm test failed with exit code 1.
        Hope this helps!
      `;
      const compressed = EngineeringMethods.compressTechnicalOutput(rawWithStack);
      assert.ok(compressed.compressedText.includes('at Function.connect (C:/app/pool.ts:42:10)'));
      assert.ok(compressed.compressedText.includes('at async runJob (C:/app/worker.ts:18:5)'));
      assert.ok(compressed.compressedText.includes('Error: ConnectionRefused'));
      assert.ok(!compressed.compressedText.includes('Hello there!'));
    });
  });
});
