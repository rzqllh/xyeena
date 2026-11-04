/**
 * Xyeena Native Methods - Engineering Suite
 * Deep module seams, dual-axis review, TDD red-green verification,
 * application logic isolation, root-cause 5-whys tracing, test strategy formulation,
 * performance budget auditing, reliability & circuit breaking, data modeling, and release gating.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class EngineeringMethods {
  /**
   * Evaluate module seam: deep module vs shallow wrapper (engineering.architecture).
   * A deep module has a simple interface with rich internal behavior.
   * @param {object} params
   * @param {string[]} params.publicMethods - Exported method signatures
   * @param {number} params.internalLinesOfCode - Lines of internal implementation
   * @returns {object} Seam depth evaluation
   */
  static evaluateModuleSeam({ publicMethods = [], internalLinesOfCode = 0 }) {
    const methodCount = publicMethods.length;
    const depthRatio = methodCount > 0 ? internalLinesOfCode / methodCount : 0;
    const isDeep = depthRatio >= 15;

    return {
      exposedMethods: methodCount,
      internalLines: internalLinesOfCode,
      depthRatio: Math.round(depthRatio),
      classification: isDeep ? 'DEEP_MODULE' : 'SHALLOW_WRAPPER',
      recommendation: isDeep
        ? 'Seam is well-balanced.'
        : 'Module may be too shallow; consider consolidating into caller.'
    };
  }

  /**
   * Dual-axis code review separating Standards compliance from Spec satisfaction (engineering.code-review).
   * @param {object} params
   * @param {string} params.diff - Git patch or diff content
   * @param {string[]} params.specRequirements - List of acceptance criteria
   * @param {string[]} [params.styleConventions=[]] - Repository style rules
   * @returns {object} Dual-axis review report
   */
  static dualAxisReview({ diff = '', specRequirements = [], styleConventions = [] }) {
    const findings = [];

    // Standards checks
    if (diff.includes('console.log(')) {
      findings.push({
        axis: 'STANDARDS',
        level: 'WARNING',
        message: 'Avoid raw console.log in committed production code.'
      });
    }

    // Spec satisfaction checks: verify each requirement's essential keyword exists in diff
    const lowerDiff = diff.toLowerCase();
    const specEvaluations = specRequirements.map(req => {
      const words = req.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const isSatisfied = words.some(w => lowerDiff.includes(w));
      return {
        requirement: req,
        satisfied: isSatisfied
      };
    });

    return {
      standardsFindings: findings,
      specSatisfaction: specEvaluations,
      reviewVerdict: findings.length === 0 ? 'PASS' : 'REVISION_REQUESTED'
    };
  }

  /**
   * Enforce TDD red-green-refactor cycle (engineering.tdd).
   * @param {'RED' | 'GREEN' | 'REFACTOR'} currentStage
   * @param {object} evidence
   * @param {boolean} evidence.testFailedInitially - Verified test failure before implementation
   * @param {boolean} evidence.testPassedAfterCode - Verified test pass after code
   */
  static verifyTddCycle(currentStage, evidence = {}) {
    if (currentStage === 'GREEN' && !evidence.testFailedInitially) {
      return {
        compliant: false,
        reason: 'TDD violation: Test was not observed failing (RED) prior to implementation.'
      };
    }
    if (currentStage === 'REFACTOR' && (!evidence.testFailedInitially || !evidence.testPassedAfterCode)) {
      return {
        compliant: false,
        reason: 'TDD violation: Cannot refactor before proving RED -> GREEN transition.'
      };
    }
    return {
      compliant: true,
      stage: currentStage,
      status: 'TDD_COMPLIANT'
    };
  }

  /**
   * Evaluate clean business logic boundaries vs framework coupling (engineering.application-logic).
   * @param {object} params
   * @param {string} params.moduleName
   * @param {string[]} params.importedFrameworks - e.g. ['express', 'pg', 'react']
   * @param {boolean} params.pureFunctionsOnly - True if core logic has no direct I/O
   */
  static evaluateApplicationLogic({ moduleName, importedFrameworks = [], pureFunctionsOnly = false }) {
    const frameworkCoupling = importedFrameworks.filter(f => /express|fastify|koa|next|react|vue|svelte/i.test(f));
    const isIsolated = frameworkCoupling.length === 0 && pureFunctionsOnly;

    return {
      moduleName,
      isIsolated,
      frameworkCoupling,
      verdict: isIsolated ? 'CLEAN_DOMAIN_ISOLATION' : 'FRAMEWORK_COUPLED',
      recommendation: isIsolated
        ? 'Domain logic is cleanly separated from transport/framework dependencies.'
        : `Decouple domain logic from ${frameworkCoupling.join(', ')} using dependency injection or port/adapter seams.`
    };
  }

  /**
   * Trace systematic root-cause using 5-Whys causal chain (engineering.root-cause).
   * @param {object} params
   * @param {string} params.symptom
   * @param {string[]} params.whyChain - Progressive causal statements
   */
  static traceRootCause5Whys({ symptom, whyChain = [] }) {
    if (!symptom || typeof symptom !== 'string') {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Root cause tracing requires a symptom.');
    }
    if (!Array.isArray(whyChain) || whyChain.length < 3) {
      return {
        symptom,
        depth: whyChain.length,
        isSufficientDepth: false,
        verdict: 'SUPERFICIAL_INVESTIGATION',
        recommendation: 'Must trace at least 3 to 5 levels of causality to identify the systemic defect, not merely the immediate trigger.'
      };
    }

    return {
      symptom,
      depth: whyChain.length,
      causalChain: [...whyChain],
      rootCause: whyChain[whyChain.length - 1],
      isSufficientDepth: true,
      verdict: 'SYSTEMIC_ROOT_CAUSE_ISOLATED'
    };
  }

  /**
   * Formulate balanced test strategy following test pyramid principles (engineering.test-strategy).
   * @param {object} params
   * @param {number} params.unitTestsCount
   * @param {number} params.integrationTestsCount
   * @param {number} params.e2eTestsCount
   */
  static formulateTestStrategy({ unitTestsCount = 0, integrationTestsCount = 0, e2eTestsCount = 0 }) {
    const total = unitTestsCount + integrationTestsCount + e2eTestsCount;
    if (total === 0) {
      return { total: 0, balanced: false, verdict: 'ZERO_TEST_COVERAGE' };
    }

    const unitShare = unitTestsCount / total;
    const e2eShare = e2eTestsCount / total;

    // Ideal pyramid: Unit ~60-80%, Integration ~15-30%, E2E ~5-15%
    const isPyramidBalanced = unitShare >= 0.50 && e2eShare <= 0.25;

    return {
      totalTests: total,
      distribution: {
        unit: Math.round(unitShare * 100),
        integration: Math.round((integrationTestsCount / total) * 100),
        e2e: Math.round(e2eShare * 100)
      },
      balanced: isPyramidBalanced,
      verdict: isPyramidBalanced ? 'BALANCED_TEST_PYRAMID' : 'INVERTED_TEST_ICE_CREAM_CONE',
      advice: isPyramidBalanced
        ? 'Test distribution ensures fast feedback with reliable integration coverage.'
        : 'Too heavy on slow E2E tests or lacking fast unit regression tests.'
    };
  }

  /**
   * Audit performance and latency against budgeted SLA (engineering.performance).
   * @param {object} params
   * @param {string} params.operationName
   * @param {number} params.measuredLatencyMs
   * @param {number} params.budgetLatencyMs
   */
  static auditPerformanceBudget({ operationName, measuredLatencyMs, budgetLatencyMs }) {
    const compliant = measuredLatencyMs <= budgetLatencyMs;
    const marginPercent = Math.round(((budgetLatencyMs - measuredLatencyMs) / budgetLatencyMs) * 100);

    return {
      operation: operationName,
      measuredLatencyMs,
      budgetLatencyMs,
      compliant,
      marginPercent,
      verdict: compliant ? 'WITHIN_PERFORMANCE_BUDGET' : 'SLA_BUDGET_BREACH'
    };
  }

  /**
   * Evaluate reliability, retry backoff, and circuit breaker configuration (engineering.reliability).
   * @param {object} params
   * @param {number} params.maxRetries
   * @param {'EXPONENTIAL'|'LINEAR'|'CONSTANT'} params.backoffType
   * @param {number} params.maxDelayMs
   * @param {boolean} params.jitterEnabled
   */
  static evaluateReliabilityStrategy({ maxRetries, backoffType = 'EXPONENTIAL', maxDelayMs, jitterEnabled = true }) {
    const isSafe = maxRetries <= 5 && backoffType === 'EXPONENTIAL' && maxDelayMs >= 1000 && jitterEnabled;

    return {
      maxRetries,
      backoffType,
      maxDelayMs,
      jitterEnabled,
      isSafe,
      verdict: isSafe ? 'RESILIENT_BACKOFF_CONFIG' : 'DANGEROUS_RETRY_CONFIG',
      advice: isSafe
        ? 'Retries adhere to exponential backoff with jitter to prevent thundering herd.'
        : 'Retries risk causing stampeding failure; configure exponential backoff, maximum ceiling, and jitter.'
    };
  }

  /**
   * Compose a two-phase non-destructive database/state migration plan (engineering.data).
   * @param {string} entity
   * @param {string} changeDescription
   */
  static planTwoPhaseMigration(entity, changeDescription) {
    return {
      entity,
      changeDescription,
      phase1_Expand: {
        action: 'Add new columns/fields with nullable/default values; dual-write enabled.',
        destructive: false,
        rollbackPath: 'Stop writes to new field, ignore column.'
      },
      phase2_Contract: {
        action: 'Backfill historical data, switch reads to new field, deprecate old field.',
        destructive: false,
        prerequisite: 'Verify 100% of read/write traffic on new field for at least 1 cycle.'
      }
    };
  }

  /**
   * Evaluate release readiness checklist against strict quality gates (engineering.release).
   * @param {object} params
   * @param {boolean} params.allTestsPassing
   * @param {boolean} params.zeroBlockingBugs
   * @param {boolean} params.cleanWorkingTree
   * @param {boolean} params.rollbackDocumented
   */
  static evaluateReleaseReadiness({ allTestsPassing, zeroBlockingBugs, cleanWorkingTree, rollbackDocumented }) {
    const ready = allTestsPassing && zeroBlockingBugs && cleanWorkingTree && rollbackDocumented;
    const blockingReasons = [];

    if (!allTestsPassing) blockingReasons.push('Unresolved failing tests');
    if (!zeroBlockingBugs) blockingReasons.push('Open critical/blocking bugs');
    if (!cleanWorkingTree) blockingReasons.push('Uncommitted or dirty working tree');
    if (!rollbackDocumented) blockingReasons.push('Missing documented rollback procedure');

    return {
      ready,
      blockingReasons,
      verdict: ready ? 'RELEASE_GATE_APPROVED' : 'RELEASE_GATE_BLOCKED'
    };
  }
}
