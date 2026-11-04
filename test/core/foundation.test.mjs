import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ERROR_CODES,
  XyeenaError,
  estimateTokens,
  EffortBudgetGovernor,
  BUDGET_LIMITS,
  EvidenceLedger,
  EvidenceRecord,
  EVIDENCE_TIERS,
  VERDICT_STATUS,
  PolicyGovernor,
  EXECUTION_MODES,
  PERMISSION_TYPES,
  CapabilityRegistry,
  CAPABILITY_LAYERS,
  IntentRouter,
  TASK_TIERS,
  CapabilityResolver,
  HostNegotiator,
  SUPPORT_LEVELS,
  FallbackHandler,
  BehavioralKernel,
  WorkflowComposer
} from '../../src/core/index.mjs';

describe('M1 Core Foundation: Unit Verification Suite', () => {

  describe('Budget & Token Governor', () => {
    it('estimates tokens accurately based on BPE character ratio', () => {
      const text = 'Hello world, this is a test string for token estimation.';
      const tokens = estimateTokens(text);
      assert.ok(tokens > 0);
      assert.strictEqual(tokens, Math.ceil(text.length / 3.8));
    });

    it('enforces maximum token budget and trips breaker on excess', () => {
      const gov = new EffortBudgetGovernor({ maxTokens: 100 });
      gov.consume(50);
      assert.strictEqual(gov.consumedTokens, 50);
      assert.throws(() => gov.consume(60), (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.BUDGET_EXCEEDED;
      });
      assert.strictEqual(gov.tripped, true);
    });

    it('trips circuit breaker on repeated retries', () => {
      const gov = new EffortBudgetGovernor({ maxRetries: 2 });
      gov.recordRetry('test 1');
      gov.recordRetry('test 2');
      assert.throws(() => gov.recordRetry('test 3'), (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.BREAKER_TRIPPED;
      });
    });
  });

  describe('Evidence & Anti-Hallucination', () => {
    it('records 4-tier epistemic claims correctly', () => {
      const ledger = new EvidenceLedger();
      const rec = new EvidenceRecord({
        claim: 'File exists on disk',
        tier: EVIDENCE_TIERS.OBSERVED,
        provenance: 'package.json',
        status: VERDICT_STATUS.VERIFIED
      });
      ledger.add(rec);
      assert.strictEqual(ledger.records.length, 1);
      assert.strictEqual(ledger.summary().verified, 1);
    });

    it('assertVerification validates exit code 0 and records verification', () => {
      const ledger = new EvidenceLedger();
      const rec = ledger.assertVerification('Test suite passes', {
        exitCode: 0,
        stdout: '10 tests passed'
      });
      assert.strictEqual(rec.status, VERDICT_STATUS.VERIFIED);
    });

    it('assertVerification throws MISSING_EVIDENCE on non-zero exit code', () => {
      const ledger = new EvidenceLedger();
      assert.throws(() => {
        ledger.assertVerification('Failing command', {
          exitCode: 1,
          stderr: 'SyntaxError'
        });
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.MISSING_EVIDENCE;
      });
    });

    it('forbidUnverifiedPass blocks claims of success without grounded proof', () => {
      const ledger = new EvidenceLedger();
      assert.throws(() => {
        ledger.forbidUnverifiedPass('all tests PASS');
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.MISSING_EVIDENCE;
      });
    });
  });

  describe('Policy Governor & Scope Fencing', () => {
    it('blocks write actions when in DISCUSSION mode', () => {
      const policy = new PolicyGovernor({ mode: EXECUTION_MODES.DISCUSSION });
      assert.throws(() => {
        policy.assertWriteAllowed('edit file src/index.mjs');
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.SCOPE_VIOLATION;
      });
    });

    it('allows write actions when in EXECUTION mode with permission', () => {
      const policy = new PolicyGovernor({
        mode: EXECUTION_MODES.EXECUTION,
        allowedPermissions: [PERMISSION_TYPES.WORKSPACE_WRITE]
      });
      assert.doesNotThrow(() => {
        policy.assertWriteAllowed('edit file src/index.mjs');
      });
    });

    it('rejects path traversal attempts resolving outside workspace', () => {
      const policy = new PolicyGovernor({ workspaceRoot: process.cwd() });
      assert.throws(() => {
        policy.assertPathInScope('../../secret.txt');
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.SCOPE_VIOLATION;
      });
    });

    it('blocks manual action boundary operations (e.g. git_push)', () => {
      const policy = new PolicyGovernor();
      assert.throws(() => {
        policy.checkManualActionBoundary('git_push');
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.BLOCKED_MANUAL_ACTION;
      });
    });
  });

  describe('Registry & Circular Dependency Detection', () => {
    it('registers contracts and resolves dependencies in topological order', () => {
      const reg = new CapabilityRegistry();
      reg.register({
        id: 'cap.base',
        layer: CAPABILITY_LAYERS.L0,
        dependencies: []
      });
      reg.register({
        id: 'cap.dependent',
        layer: CAPABILITY_LAYERS.L1,
        dependencies: ['cap.base']
      });

      const resolved = reg.resolveDependencies(['cap.dependent']);
      assert.deepStrictEqual(resolved, ['cap.base', 'cap.dependent']);
    });

    it('detects and throws on circular dependencies', () => {
      const reg = new CapabilityRegistry();
      reg.register({ id: 'a', layer: CAPABILITY_LAYERS.L1, dependencies: ['b'] });
      reg.register({ id: 'b', layer: CAPABILITY_LAYERS.L1, dependencies: ['a'] });

      assert.throws(() => {
        reg.validate();
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.CIRCULAR_DEPENDENCY;
      });
    });
  });

  describe('Intent Router & Strict Negative Triggers', () => {
    const router = new IntentRouter();

    it('classifies question/opinion as DISCUSSION mode', () => {
      const mode = router.classifyIntent('menurut lu gimana arsitektur ini?');
      assert.strictEqual(mode, EXECUTION_MODES.DISCUSSION);
    });

    it('classifies explicit implementation instruction as EXECUTION mode', () => {
      const mode = router.classifyIntent('tolong implement sekarang modul router');
      assert.strictEqual(mode, EXECUTION_MODES.EXECUTION);
    });

    it('classifies debug requests as DIAGNOSE mode', () => {
      const mode = router.classifyIntent('kenapa error ini muncul saat test gagal?');
      assert.strictEqual(mode, EXECUTION_MODES.DIAGNOSE);
    });

    it('identifies EXPLICIT_RISK_GATE for full security audit', () => {
      const mode = router.classifyIntent('jalankan full security audit sekarang');
      assert.strictEqual(mode, EXECUTION_MODES.EXPLICIT_RISK_GATE);
    });

    it('strictly throws on negative trigger match for unrequested full security audit', () => {
      assert.throws(() => {
        router.assertNegativeTriggerSafe('security.full-audit', 'coba review file auth', EXECUTION_MODES.DISCUSSION);
      }, (err) => {
        return err instanceof XyeenaError && err.code === ERROR_CODES.NEGATIVE_TRIGGER_MATCH;
      });
    });
  });

  describe('Behavioral Kernel (L0) & Composer', () => {
    it('formats L0 kernel prompt well within the <= 1500 token budget', () => {
      const kernel = new BehavioralKernel();
      const prompt = kernel.formatKernelPrompt();
      const tokens = kernel.getTokenCount();
      assert.ok(tokens > 0);
      assert.ok(tokens <= BUDGET_LIMITS.L0_KERNEL_MAX_TOKENS, `Tokens ${tokens} should be <= 1500`);
    });

    it('composes runtime payload with minimal overhead for micro task', () => {
      const composer = new WorkflowComposer();
      const payload = composer.compose({
        prompt: 'Halo, siapa namamu?',
        mode: EXECUTION_MODES.DISCUSSION,
        tier: TASK_TIERS.TIER_0_MICRO,
        activeCapabilities: []
      });
      assert.strictEqual(payload.stats.domainCapabilityCount, 0);
      assert.ok(payload.stats.estimatedTokens < 800);
    });
  });

  describe('Host Negotiator & Fallback', () => {
    it('detects available features and reports honest support levels', () => {
      const negotiator = new HostNegotiator(process.env, { run_command: true, write_file: true });
      const matrix = negotiator.negotiateFeatureMatrix();
      assert.strictEqual(matrix.terminal_execution, SUPPORT_LEVELS.SUPPORTED);
      assert.strictEqual(matrix.filesystem_write, SUPPORT_LEVELS.SUPPORTED);
      assert.strictEqual(matrix.subagent_delegation, SUPPORT_LEVELS.DEGRADED);
    });

    it('resolves safe single-agent fallback when subagents are unavailable', () => {
      const fallback = new FallbackHandler();
      const strategy = fallback.resolveFallback('subagent_delegation', SUPPORT_LEVELS.DEGRADED);
      assert.strictEqual(strategy.action, 'FALLBACK_SINGLE_AGENT');
    });

    it('reports manual action halt when terminal is unavailable', () => {
      const fallback = new FallbackHandler();
      const strategy = fallback.resolveFallback('terminal_execution', SUPPORT_LEVELS.UNAVAILABLE);
      assert.strictEqual(strategy.action, 'HALT_MANUAL_BOUNDARY');
      assert.strictEqual(strategy.status, 'BLOCKED: TERMINAL UNAVAILABLE');
    });
  });

});
