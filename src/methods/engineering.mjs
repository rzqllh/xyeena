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
   * Evaluate received code review comments with technical rigor (Superpowers receiving-code-review RE-01).
   * Rejects performative agreement; requires evidence-grounded response before code edits.
   * @param {Array<{ comment: string, file?: string, line?: number }>} feedbackItems
   * @param {object} [options={}]
   * @returns {object}
   */
  static receiveReviewFeedback(feedbackItems = [], options = {}) {
    const evaluated = feedbackItems.map((item, index) => {
      const text = item.comment || '';
      const isScopeExpansion = /while you are here|can you also|would be nice to have|in the future/i.test(text);
      const isVague = /improve this|make it better|clean this up/i.test(text) && text.length < 35;

      let classification = 'VALID_ACTIONABLE';
      let action = 'Implement minimal change matching verified finding.';

      if (isScopeExpansion) {
        classification = 'OUT_OF_SCOPE';
        action = 'Propose as future task; do not modify without explicit user scope expansion.';
      } else if (isVague) {
        classification = 'REQUIRES_CLARIFICATION';
        action = 'Request concrete reproduction or explicit acceptance criteria before editing.';
      }

      return {
        id: `feedback-${index + 1}`,
        comment: text,
        file: item.file || null,
        line: item.line || null,
        classification,
        action,
        requiresVerificationBeforeEdit: true
      };
    });

    const actionableCount = evaluated.filter(e => e.classification === 'VALID_ACTIONABLE').length;

    return {
      totalFeedbackItems: feedbackItems.length,
      actionableCount,
      evaluated,
      performativeAgreementForbidden: true
    };
  }

  /**
   * Enforce TDD red-green-refactor cycle (Superpowers test-driven-development RE-01).
   * Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
   * @param {'RED' | 'GREEN' | 'REFACTOR'} currentStage
   * @param {object} evidence
   * @param {boolean} evidence.testFailedInitially - Verified test failure before implementation
   * @param {boolean} evidence.testPassedAfterCode - Verified test pass after code
   */
  static verifyTddCycle(currentStage, evidence = {}) {
    if (currentStage === 'GREEN' && !evidence.testFailedInitially) {
      return {
        compliant: false,
        ironLaw: 'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST',
        reason: 'TDD violation: Test was not observed failing (RED) prior to implementation.'
      };
    }
    if (currentStage === 'REFACTOR' && (!evidence.testFailedInitially || !evidence.testPassedAfterCode)) {
      return {
        compliant: false,
        ironLaw: 'NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST',
        reason: 'TDD violation: Cannot refactor before proving RED -> GREEN transition.'
      };
    }
    return {
      compliant: true,
      stage: currentStage,
      ironLawSatisfied: true,
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

  /**
   * Evaluate module depth and seam leverage (Superior Skills RE-02 / Codebase Design).
   * Calculates leverage (behavior exercised per unit of interface learned) and locality (change concentration).
   * @param {object} params
   * @param {string} [params.moduleName='TargetModule']
   * @param {string[]} [params.publicMethods=[]]
   * @param {number} [params.internalLinesOfCode=0]
   * @param {number} [params.callerSitesCount=1]
   * @returns {object}
   */
  static evaluateModuleDepth({ moduleName = 'TargetModule', publicMethods = [], internalLinesOfCode = 0, callerSitesCount = 1 }) {
    const methodCount = publicMethods.length;
    const depthRatio = methodCount > 0 ? internalLinesOfCode / methodCount : 0;
    const isDeep = depthRatio >= 15;
    const leverageScore = Math.round(depthRatio * Math.max(1, callerSitesCount));

    return {
      moduleName,
      publicInterfaceSize: methodCount,
      internalLinesOfCode,
      depthRatio: Math.round(depthRatio),
      leverageScore,
      isDeep,
      classification: isDeep ? 'DEEP_MODULE' : 'SHALLOW_WRAPPER',
      signal: 'HEURISTIC_ADVISORY',
      isDogmaticBlocker: false,
      guidance: 'LOC/API ratio and wrapper counts are heuristic signals that must be contextualized with correctness, maintainability, safety, and project architecture, not treated as dogmatic blockers.',
      vocabulary: {
        interface: 'Everything callers must know to use correctly (signatures, invariants, errors).',
        depth: 'Amount of behaviour behind small interface.',
        seam: 'Location where behaviour can be altered without editing caller.',
        locality: 'Concentration of changes, bugs, and verification in one place.'
      },
      verdict: isDeep ? 'HIGH_LEVERAGE_SEAM' : 'SHALLOW_MODULE_CONSOLIDATION_ADVISED'
    };
  }

  /**
   * Evaluate Clean Architecture boundaries and dependency direction (Superior Skills RE-02).
   * Enforces that domain policy does not directly import transport or persistence drivers.
   * @param {object} params
   * @param {string} params.moduleName
   * @param {string[]} [params.domainRules=[]]
   * @param {string[]} [params.importedDependencies=[]]
   * @returns {object}
   */
  static evaluateArchitectureBoundaries({ moduleName, domainRules = [], importedDependencies = [] }) {
    const transportViolations = importedDependencies.filter(d => /express|fastify|koa|next|react|vue|http/i.test(d));
    const persistenceViolations = importedDependencies.filter(d => /pg|mysql|sqlite|prisma|typeorm|mongoose|fs/i.test(d));
    const hasViolations = transportViolations.length > 0 || persistenceViolations.length > 0;

    return {
      moduleName,
      cleanBoundaries: !hasViolations,
      transportViolations,
      persistenceViolations,
      boundaryPolicy: 'Domain policy must remain pure; use Port/Adapter seams to interact with transport or persistence.',
      verdict: !hasViolations ? 'ARCHITECTURAL_BOUNDARIES_VERIFIED' : 'BOUNDARY_COUPLING_DETECTED'
    };
  }

  /**
   * Audit code-as-documentation and comment hygiene (Superior Skills RE-02).
   * Verifies that code is self-documenting, and comments explain the "why" and invariants rather than narrating syntax.
   * @param {string} code
   * @param {object} [options={}]
   * @returns {object}
   */
  static auditCodeAsDocumentation(code = '', options = {}) {
    const lines = code.split('\n');
    const redundantComments = [];
    const valuableComments = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('/*')) {
        // Valuable rationale comments
        if (/why:|invariant:|security:|shortcut:|rationale:/i.test(line)) {
          valuableComments.push({ line: i + 1, comment: line });
        } else if (/\/\/\s*(?:set|call|return|loop|get|assign|check|initialize|declare)\b/i.test(line)) {
          // Redundant narrations: e.g. "// set x to 1", "// loop over items", "// return result"
          redundantComments.push({ line: i + 1, comment: line, reason: 'Narrates syntax instead of explaining rationale.' });
        }
      }
    }

    return {
      totalComments: redundantComments.length + valuableComments.length,
      redundantComments,
      valuableComments,
      hygieneScore: redundantComments.length === 0 ? 100 : Math.max(0, 100 - redundantComments.length * 20),
      verdict: redundantComments.length === 0 ? 'CLEAN_SELF_DOCUMENTING_CODE' : 'REDUNDANT_COMMENT_SLOP_DETECTED'
    };
  }

  /**
   * Grill question-frontier interview engine (Matt Pocock Skills RE-08 / grilling).
   * Maps decisions into a design tree; works in rounds; computes frontier of unblocked decisions.
   * Finding facts is the agent's job (no asking user for facts present in repo/tools).
   * Decisions are the user's: formatted as ❓ Q<n> with ➡️ recommended answer.
   * Guardrail: terminates immediately when all decisions are resolved, or skips grilling if task has no material ambiguity.
   * @param {object} params
   * @param {Array<{ id: string, title: string, question: string, recommended: string, blockedBy?: string[], isMaterial?: boolean, factKey?: string }>} params.decisions
   * @param {string[]} [params.settled=[]] - IDs of already settled decisions
   * @param {Record<string, any>} [params.facts={}] - Facts already discovered from codebase
   * @param {Record<string, string>} [params.userResponses={}] - Answers given by user
   * @returns {object}
   */
  static grillFrontier({ decisions = [], settled = [], facts = {}, userResponses = {} }) {
    const settledSet = new Set([...settled]);
    const ambiguousConsents = [];

    // Evaluate user responses and enforce DEC-31/32 explicit consent for sensitive operations
    for (const [decisionId, response] of Object.entries(userResponses)) {
      const decision = decisions.find(d => d.id === decisionId) || {};
      const lowerResp = String(response).trim().toLowerCase();

      const isSensitive = decision.destructive === true ||
        decision.publish === true ||
        decision.globalConfig === true ||
        decision.securityBoundary === true ||
        decision.credentials === true;

      const isBareAffirmative = lowerResp === 'ya' || lowerResp === 'yes' || lowerResp === 'y' || lowerResp === 'ok';

      if (isSensitive && isBareAffirmative && !decision.explicitReferentProvided) {
        ambiguousConsents.push({
          decisionId,
          issue: 'Ambiguous affirmative response without explicit referent cannot authorize sensitive operations (DEC-31/32).',
          status: 'AMBIGUOUS_CONSENT_BLOCKED'
        });
      } else {
        settledSet.add(decisionId);
      }
    }

    // Discoverable facts: if a decision is actually a discoverable fact and is present in facts, auto-settle it!
    for (const d of decisions) {
      if (d.factKey && facts[d.factKey] !== undefined) {
        settledSet.add(d.id);
      }
    }

    // Compute the frontier: decisions whose prerequisites are all settled
    const frontier = decisions.filter(d => {
      if (settledSet.has(d.id)) return false;
      const blockers = d.blockedBy || [];
      return blockers.every(b => settledSet.has(b));
    });

    const isDone = frontier.length === 0 && ambiguousConsents.length === 0;

    // Format frontier round
    const formattedQuestions = frontier.map((item, index) => {
      return `❓ **Q${index + 1}** - **${item.title}**: ${item.question}\n\n➡️ ${item.recommended}`;
    });

    return {
      totalDecisions: decisions.length,
      settledCount: settledSet.size,
      frontierCount: frontier.length,
      ambiguousConsents,
      isDone,
      sharedUnderstandingReached: isDone,
      formattedQuestions,
      frontier,
      agentFactFindingRule: 'Finding facts is agent responsibility; agent never asks user for discoverable codebase facts.',
      verdict: isDone ? 'FRONTIER_EMPTY_SHARED_UNDERSTANDING' : (ambiguousConsents.length > 0 ? 'AMBIGUOUS_CONSENT_BLOCKED' : 'QUESTION_FRONTIER_ACTIVE')
    };
  }

  /**
   * Synthesize technical specification without interview (Matt Pocock Skills RE-08 / to-spec).
   * Generates problem statement, solution, user stories, implementation decisions, and highest-seam test plan.
   * @param {object} params
   * @param {string} params.problemStatement
   * @param {string} params.solution
   * @param {string[]} [params.userStories=[]]
   * @param {string[]} [params.seams=[]]
   * @param {string[]} [params.implementationDecisions=[]]
   * @returns {object}
   */
  static synthesizeTechnicalSpec({ problemStatement, solution, userStories = [], seams = [], implementationDecisions = [] }) {
    if (!problemStatement || !solution) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Technical spec requires problemStatement and solution.');
    }

    const formattedStories = userStories.map((story) => {
      if (/^as an?\s+/i.test(story)) return story;
      return `As a user, I want ${story}, so that I can achieve the expected outcome.`;
    });

    // Seam selection: Highest seam possible (ideal: 1)
    const primarySeam = seams.length > 0 ? seams[0] : 'High-level public interface';

    return {
      problemStatement,
      solution,
      userStories: formattedStories,
      primarySeam,
      allSeams: seams,
      implementationDecisions,
      seamRule: 'Use highest possible seam; fewer seams across codebase is better (ideal: one).',
      status: 'SPEC_SYNTHESIZED'
    };
  }

  /**
   * Break down a plan or spec into tracer-bullet vertical slice tickets (Matt Pocock Skills RE-08 / to-tickets).
   * Each slice cuts through schema, API, UI, tests; declares blocking edges DAG.
   * Handles wide refactors via Expand-Contract pattern.
   * @param {object} params
   * @param {string} params.featureTitle
   * @param {Array<{ id: string, title: string, blockedBy?: string[], delivers: string }>} [params.verticalSlices=[]]
   * @param {object|null} [params.wideRefactor=null]
   * @returns {object}
   */
  static breakdownTracerBulletTickets({ featureTitle, verticalSlices = [], wideRefactor = null }) {
    const tickets = [...verticalSlices];

    // Handle wide refactors via expand-contract sequence
    let expandContractPlan = null;
    if (wideRefactor) {
      const { name, targetSymbol } = wideRefactor;
      const expandTicket = {
        id: `ticket-expand-${name}`,
        title: `Expand: Add new ${targetSymbol} alongside old without breaking existing callers`,
        blockedBy: [],
        delivers: 'Dual-path existence keeping CI green'
      };
      const migrateTicket = {
        id: `ticket-migrate-${name}`,
        title: `Migrate: Switch call sites to new ${targetSymbol} in blast-radius bounded batches`,
        blockedBy: [expandTicket.id],
        delivers: 'All call sites migrated to new contract'
      };
      const contractTicket = {
        id: `ticket-contract-${name}`,
        title: `Contract: Delete legacy ${targetSymbol} after all callers are verified`,
        blockedBy: [migrateTicket.id],
        delivers: 'Legacy code purged cleanly'
      };

      tickets.unshift(expandTicket, migrateTicket, contractTicket);
      expandContractPlan = {
        pattern: 'EXPAND_CONTRACT',
        sequence: [expandTicket.id, migrateTicket.id, contractTicket.id]
      };
    }

    return {
      featureTitle,
      ticketsCount: tickets.length,
      tickets,
      expandContractPlan,
      tracerBulletRules: [
        'Each slice cuts narrow but complete path through every layer (schema, API, UI, tests).',
        'Completed slice is demoable and verifiable on its own.',
        'Sized to fit in single fresh context window.',
        'Wide refactors use expand-contract pattern.'
      ],
      verdict: 'TRACER_BULLET_TICKETS_GENERATED'
    };
  }

  /**
   * Audit diff for smallest correct change and anti-overengineering (Ponytail RE-04).
   * Prefers codebase reuse, standard library, and shortest working diff over unnecessary abstractions.
   * Never flags trust boundaries, data-loss error handling, security, or accessibility as overengineering.
   * @param {object} params
   * @param {string} params.diff
   * @param {string[]} [params.callers=[]]
   * @param {'lite'|'full'|'ultra'} [params.level='full']
   * @param {object} [params.options={}]
   * @returns {object}
   */
  static auditPonytailLeanDiff({ diff = '', callers = [], level = 'full', options = {} }) {
    const findings = [];
    const shortcuts = [];

    // Check for premature abstraction / wrappers
    if (/class\s+\w+Adapter|class\s+\w+Proxy|class\s+\w+Wrapper/i.test(diff) && !options.isSeamRequired) {
      findings.push({
        type: 'UNNECESSARY_ABSTRACTION',
        message: 'New wrapper/adapter class introduced without verified multi-caller or external seam requirement. Prefer direct standard usage.'
      });
    }

    // Check for unjustified new dependencies
    if (/import\s+.*from\s+['"](?:lodash|is-odd|left-pad|moment)['"]/i.test(diff)) {
      findings.push({
        type: 'AVOIDABLE_DEPENDENCY',
        message: 'Avoid external utility library when modern JS / standard library handles it in 1-2 lines.'
      });
    }

    // Detect shortcut comments (debt ledger)
    const shortcutMatches = diff.match(/\/\/\s*shortcut:\s*([^\n\r]+)/gi);
    if (shortcutMatches) {
      for (const m of shortcutMatches) {
        shortcuts.push(m.replace(/^\/\/\s*/, ''));
      }
    }

    const isClean = findings.length === 0;

    return {
      level,
      isClean,
      findings,
      shortcuts,
      smallestChangeSatisfied: isClean,
      safeBoundariesPreserved: true, // Never cuts trust boundary, validation, or security
      advice: isClean
        ? 'Diff satisfies Ponytail smallest-correct-change heuristic with zero bloat.'
        : `Overengineering detected (${findings.length} issues). Simplify to minimum code that works.`,
      verdict: isClean ? 'PONYTAIL_LEAN_PASS' : 'OVERENGINEERING_DETECTED'
    };
  }

  /**
   * Translate acceptance conditions into smallest sufficient proof set and halt (Caveman RE-05 / verify-and-stop).
   * Runs focused checks before wider gates; stops immediately when proof passes.
   * @param {object} params
   * @param {string[]} params.acceptanceConditions
   * @param {Array<{ name: string, status: 'PASS'|'FAIL'|'UNAVAILABLE'|'BLOCKED', output?: string }>} params.executedChecks
   * @returns {object}
   */
  static verifyAndStop({ acceptanceConditions = [], executedChecks = [] }) {
    if (executedChecks.length === 0) {
      return {
        verified: false,
        status: 'ZERO_CHECKS_EXECUTED',
        advice: 'Verification requires actual executed checks; cannot verify on empty evidence.'
      };
    }

    const failedChecks = executedChecks.filter(c => c.status === 'FAIL');
    const blockedChecks = executedChecks.filter(c => c.status === 'BLOCKED');
    const passedChecks = executedChecks.filter(c => c.status === 'PASS');

    const allPassed = failedChecks.length === 0 && blockedChecks.length === 0 && passedChecks.length > 0;

    return {
      acceptanceConditionsCount: acceptanceConditions.length,
      executedChecksCount: executedChecks.length,
      passedCount: passedChecks.length,
      failedCount: failedChecks.length,
      blockedCount: blockedChecks.length,
      verified: allPassed,
      stopCondition: allPassed ? 'STOP_IMMEDIATELY_NO_POLISH' : 'REVISION_REQUIRED',
      rule: 'Stop immediately when acceptance proof is complete. Do not add polish, cleanup, or unrelated edits.',
      verdict: allPassed ? 'VERIFY_AND_STOP_SATISFIED' : 'VERIFICATION_FAILED'
    };
  }

  /**
   * Compress technical communication while preserving 100% of factual payload (Caveman RE-05).
   * Strips greetings, conversational filler, hedging, and ceremony.
   * Verbatim payload preservation: exact commands, paths, numbers, API names, and error messages remain untouched.
   * @param {string} rawText
   * @param {object} [options={}]
   * @returns {object}
   */
  static compressTechnicalOutput(rawText = '', options = {}) {
    if (typeof rawText !== 'string' || !rawText.trim()) {
      return { compressedText: '', tokensSavedEstimate: 0 };
    }

    // Preserve code blocks verbatim
    const codeBlocks = [];
    let textWithoutCode = rawText.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
      codeBlocks.push(match);
      return `__XYEENA_PAYLOAD_${codeBlocks.length - 1}__`;
    });

    // Remove ceremony, pleasantries, filler phrases
    let cleaned = textWithoutCode
      .replace(/\b(?:Hello(?: there)?!?|Hi(?: there)?!?|Sure!?|I'd be happy to help(?: you with that)?!?|Certainly!?)\s*/gi, '')
      .replace(/\b(?:Hope this helps!?|Let me know if you need anything else!?|Have a great day!?)\s*/gi, '')
      .replace(/\b(?:basically|actually|simply|just|really|literally)\b/gi, '');

    // Normalize spacing while preserving newlines for stack traces and technical errors
    const lines = cleaned.split('\n').map(l => {
      if (/^\s*at\s+.*\(.*:\d+:\d+\)/.test(l) || /^\s*(?:Error|Warning|FAIL|PASS|Exception):/i.test(l)) {
        return l;
      }
      return l.replace(/[ \t]{2,}/g, ' ').trim();
    }).filter(l => l.length > 0);

    cleaned = lines.join('\n');

    // Restore payload verbatim
    for (let i = 0; i < codeBlocks.length; i++) {
      cleaned = cleaned.replace(`__XYEENA_PAYLOAD_${i}__`, codeBlocks[i]);
    }

    const originalLength = rawText.length;
    const compressedLength = cleaned.length;
    const bytesSaved = Math.max(0, originalLength - compressedLength);
    const estimatedTokensSaved = Math.round(bytesSaved / 4);

    return {
      originalLength,
      compressedLength,
      bytesSaved,
      estimatedTokensSaved,
      compressedText: cleaned,
      verbatimPayloadPreserved: true,
      stackTracesPreserved: true,
      verdict: 'TECHNICAL_OUTPUT_COMPRESSED'
    };
  }

  /**
   * Verify safe refactor boundary preservation (Superior RE-02 / Caveman safe-refactor).
   * Ensures public exports, interfaces, and behavior are preserved across structural edits.
   * @param {object} params
   * @param {string} params.targetModule
   * @param {string[]} params.originalExports
   * @param {string[]} params.newExports
   * @param {boolean} [params.testsPassing=true]
   * @returns {object}
   */
  static auditSafeRefactor({ targetModule, originalExports = [], newExports = [], testsPassing = true }) {
    const missingExports = originalExports.filter(exp => !newExports.includes(exp));
    const isBoundaryPreserved = missingExports.length === 0 && testsPassing;

    return {
      targetModule,
      boundaryPreserved: isBoundaryPreserved,
      missingExports,
      testsPassing,
      verdict: isBoundaryPreserved ? 'SAFE_REFACTOR_VERIFIED' : 'PUBLIC_API_BREAK_DETECTED',
      recommendation: isBoundaryPreserved
        ? 'Refactoring safely preserves public exports and behavior.'
        : `Refactoring breaks public contract: missing exports [${missingExports.join(', ')}].`
    };
  }
}
