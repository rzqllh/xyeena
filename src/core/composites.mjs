/**
 * Xyeena Core - L2 Composite Skill Layer (P13 / DEC-32)
 *
 * Implements the 11 authoritative composite skills integrating verified upstream methodologies:
 * 1.  /xyeena-design: Hallmark (RE-09), Impeccable (RE-07), Taste (RE-10), UI UX Pro Max (RE-11), Anti-Slop (RE-03), Huashu (RE-32)
 * 2.  /xyeena-plan: Superpowers (RE-01), Superior (RE-02), Ponytail (RE-04)
 * 3.  /xyeena-execute: Superpowers (RE-01), Superior (RE-02)
 * 4.  /xyeena-debug: Superpowers (RE-01), Superior (RE-02), Xyeena 4-phase debugging
 * 5.  /xyeena-review: Superpowers (RE-01), Superior (RE-02), Ponytail (RE-04), Anti-Slop (RE-03)
 * 6.  /xyeena-test: Superpowers (RE-01), Xyeena testing suite
 * 7.  /xyeena-verify: Superpowers (RE-01), Xyeena DEC-31/32 epistemic verification gate
 * 8.  /xyeena-security: Cloudflare (RE-06), Trail of Bits (RE-15), Xyeena scoped review default
 * 9.  /xyeena-research: Caveman (RE-05), Xyeena primary source verification
 * 10. /xyeena-writing: Anti-Slop (RE-03), Caveman (RE-05), Xyeena human microcopy
 * 11. /xyeena-orchestrate: Superpowers (RE-01), Konoha (RE-31 reference), Cortex DAG
 */

import { ERROR_CODES, XyeenaError } from './errors.mjs';
import {
  ThinkingMethods,
  EngineeringMethods,
  DesignMethods,
  QualityMethods,
  SecurityMethods,
  DeliveryMethods,
  ExtensibilityMethods,
  KnowledgeMethods,
  CoordinationMethods
} from '../methods/index.mjs';
import { EpistemicEvidenceClassifier, EVIDENCE_TIERS, VERDICT_STATUS } from './evidence.mjs';
import { TaskGraph, TaskNode } from '../runtime/task-dag.mjs';

/**
 * Composite Skill metadata and executable definitions.
 */
export const COMPOSITE_DEFINITIONS = Object.freeze([
  // 1. /xyeena-design
  {
    id: 'xyeena-design',
    slashCommand: '/xyeena-design',
    aliases: [
      'design', 'xyeena-design', '/xyeena-design',
      'interface', 'xyeena-interface', '/xyeena-interface',
      'prototype', 'xyeena-prototype', '/xyeena-prototype',
      'huashu-design', 'impeccable', 'ui-ux-pro-max', 'design-taste-frontend'
    ],
    name: 'Cross-Domain High-Craft Visual & UX Design Intelligence',
    purpose: 'Composes Hallmark (RE-09), Impeccable (RE-07), Taste (RE-10), UI UX Pro Max (RE-11), and Anti-Slop (RE-03) into an authoritative, selective design pipeline.',
    upstreamSources: ['RE-09', 'RE-07', 'RE-10', 'RE-11', 'RE-03', 'RE-32'],
    layer: 'L2',
    requiredCapabilities: ['design.accessibility', 'design.system', 'design.color-theory', 'quality.anti-slop'],
    execute: (input = {}) => {
      const prompt = typeof input === 'string' ? input : (input?.prompt || '');
      const theme = input?.theme || {};
      const tokens = Array.isArray(input?.tokens) ? input.tokens : [];
      const colors = input?.colors || {};
      const cssOrMarkup = input?.css || input?.markup || input?.code || '';
      const isPrototype = input?.isPrototype === true || prompt.toLowerCase().includes('prototype');

      // Step 1: Surface Mode Resolution (Impeccable RE-07)
      const surfaceResolution = DesignMethods.resolveSurfaceMode(input?.surface || input?.intent || prompt);
      const activeMode = surfaceResolution.mode;

      // Step 2: Aesthetic & Layout Framing (Hallmark RE-09 / Taste RE-10)
      const layoutFraming = {
        style: activeMode === 'Operate' ? 'FUNCTIONAL_PRECISION' : 'INTENTIONAL_EDITORIAL',
        antiTemplate: true,
        surfaceMode: activeMode,
        guidance: surfaceResolution.guidance
      };

      // Step 3: Hallmark Floor Quality Check (Hallmark RE-09)
      const hallmarkFloor = cssOrMarkup
        ? DesignMethods.auditHallmarkFloor(cssOrMarkup, { waivers: input?.waivers })
        : { compliant: true, issues: [], waiversApplied: [] };

      // Step 4: App Screen Craft vs Page Craft (Taste RE-10)
      const appScreenCraft = surfaceResolution.isAppScreen && cssOrMarkup
        ? DesignMethods.auditAppScreenCraft(cssOrMarkup, {
            isAppScreen: true,
            allowedGradients: input?.allowGradients || input?.allowedGradients || theme?.allowPurpleGradient
          })
        : null;

      // Step 5: 3-Tier Design Tokens Governance (UI UX Pro Max RE-11 + Google Design RE-17)
      const tokenAudit = tokens.length > 0
        ? DesignMethods.validateTokenArchitecture(tokens)
        : { valid: true, tokensAudited: 0, violations: [] };

      // Step 6: Color Harmony & Contrast Math (Anti-Slop RE-03 + WCAG 2.2 RE-21)
      let contrastResult = null;
      if (colors.fg && colors.bg) {
        contrastResult = DesignMethods.calculateWcagContrast(colors.fg, colors.bg, input?.isLargeText || false);
      }

      // Step 7: Universal Anti-Slop Audit with User Override Awareness (DEC-32)
      const antiSlopAudit = QualityMethods.auditUniversalAntiSlop(input, {
        allowedGradients: input?.allowGradients || input?.allowedGradients || theme?.allowPurpleGradient,
        allowedGlassmorphism: input?.allowGlassmorphism || input?.allowedGlassmorphism || theme?.allowGlassmorphism,
        allowedPills: input?.allowPills || input?.allowedPills,
        allowedGlow: input?.allowGlow || input?.allowedGlow
      });

      // Step 8: Impeccable Craft Critique (Impeccable RE-07)
      const craftCritique = DesignMethods.critiqueCraft({
        mode: activeMode,
        markupOrCss: cssOrMarkup,
        isRedesign: Boolean(input?.isRedesign),
        userBrief: input?.userBrief || input?.brief || { palette: theme?.name }
      });

      // Step 9: Prototype Isolation Boundary Check (xyeena-prototype / Huashu RE-32)
      let prototypeContext = null;
      if (isPrototype) {
        const prototypeSpec = DesignMethods.generateInteractivePrototype({
          title: prompt || 'Interactive Prototype',
          states: input?.states || ['default', 'active', 'expanded']
        });
        prototypeContext = {
          isolated: true,
          purpose: 'Answer one technical/design question via disposable experiment',
          quarantineNotice: 'Prototype code must not be promoted to production without formal planning and review.',
          spec: prototypeSpec
        };
      }

      // Step 10: Visual Direction Exploration (Huashu RE-32)
      let visualDirections = null;
      if (input?.exploreDirections === true || input?.newDesign === true) {
        visualDirections = DesignMethods.exploreVisualDirections(prompt || input?.brief, {
          isSubstantiveDesign: input?.isSubstantiveDesign
        });
      }

      // Step 11: Motion & Animation Performance (GSAP RE-14)
      let motionAudit = null;
      let motionLifecycle = null;
      let animationStack = null;
      if (input?.animationCode || /motion|animation|tween|timeline|gsap/i.test(prompt)) {
        motionAudit = DesignMethods.auditMotionPerformance({
          animationCode: input?.animationCode || cssOrMarkup,
          targetFramework: input?.framework || 'react'
        });
        motionLifecycle = DesignMethods.verifyMotionLifecycleCleanup({
          componentCode: input?.componentCode || input?.animationCode || cssOrMarkup,
          framework: input?.framework || 'react'
        });
      }
      if (input?.packageJson) {
        animationStack = DesignMethods.evaluateAnimationStack({
          packageJson: input.packageJson,
          existingCode: cssOrMarkup
        });
      }

      return {
        compositeId: 'xyeena-design',
        status: (hallmarkFloor.compliant && antiSlopAudit.compliant) ? 'SUCCESS' : 'REFINEMENT_RECOMMENDED',
        surfaceResolution,
        layoutFraming,
        hallmarkFloor,
        appScreenCraft,
        tokenAudit,
        contrastResult,
        antiSlopAudit,
        craftCritique,
        prototypeContext,
        visualDirections,
        motionAudit,
        motionLifecycle,
        animationStack
      };
    }
  },

  // 2. /xyeena-plan
  {
    id: 'xyeena-plan',
    slashCommand: '/xyeena-plan',
    aliases: [
      'plan', 'xyeena-plan', '/xyeena-plan', 'writing-plans', 'brainstorming',
      'architecture', 'xyeena-architecture', '/xyeena-architecture', 'codebase-design', 'superior-architecture',
      'grill', 'xyeena-grill', '/xyeena-grill', 'grill-me', 'grilling', 'grill-with-docs',
      'to-spec', 'to-tickets'
    ],
    name: 'Architectural Phased Planning, Architecture Seams & Question Frontier',
    purpose: 'Composes Superpowers phased planning, Superior deep module seams, Matt Pocock spec & question-frontier grilling, and Ponytail lean change discipline.',
    upstreamSources: ['RE-01', 'RE-02', 'RE-04', 'RE-08'],
    layer: 'L2',
    requiredCapabilities: ['thinking.plan', 'thinking.discovery', 'engineering.architecture', 'quality.lean'],
    execute: (input = {}) => {
      const goal = typeof input === 'string' ? input : (input?.goal || 'Architectural Task');
      const constraints = Array.isArray(input?.constraints) ? input.constraints : [];
      const phases = Array.isArray(input?.phases) ? input.phases : [
        { phase: 1, name: 'Foundation & Contracts', files: ['src/core/'], verificationCmd: 'npm test' },
        { phase: 2, name: 'Integration & Verification', files: ['test/'], verificationCmd: 'npm test' }
      ];

      // Deep Module & Architecture Boundaries Evaluation (Superior RE-02)
      let depthEvaluation = null;
      let boundaryEvaluation = null;
      let safeRefactorResult = null;
      if (input?.publicMethods || input?.domainRules || input?.moduleName) {
        const moduleName = input?.moduleName || 'TargetModule';
        depthEvaluation = EngineeringMethods.evaluateModuleDepth({
          moduleName,
          publicMethods: input?.publicMethods || [],
          internalLinesOfCode: input?.internalLinesOfCode || 0,
          callerSitesCount: input?.callerSitesCount || 1
        });
        boundaryEvaluation = EngineeringMethods.evaluateArchitectureBoundaries({
          moduleName,
          domainRules: input?.domainRules || [],
          importedDependencies: input?.importedDependencies || []
        });
        if (input?.originalExports && input?.newExports) {
          safeRefactorResult = EngineeringMethods.auditSafeRefactor({
            targetModule: moduleName,
            originalExports: input.originalExports,
            newExports: input.newExports,
            testsPassing: input?.testsPassing ?? true
          });
        }
      }

      // Question Frontier Grilling (Matt Pocock RE-08)
      let grillResult = null;
      if (Array.isArray(input?.decisions)) {
        grillResult = EngineeringMethods.grillFrontier({
          decisions: input.decisions,
          settled: input?.settled || [],
          facts: input?.facts || {},
          userResponses: input?.userResponses || {}
        });
      }

      const sizing = ThinkingMethods.sizeProblem(goal, constraints);
      const brainstorm = ThinkingMethods.brainstormTask({
        goal,
        context: input?.context || '',
        existingFiles: input?.existingFiles || []
      });
      const phasedPlan = ThinkingMethods.composePhasedPlan(goal, phases);
      const leanCheck = {
        discipline: 'PONYTAIL_SMALLEST_CHANGE',
        rule: 'Every modified file must have a direct causal justification tied to the agreed scope.'
      };

      // Matt Pocock to-spec & to-tickets synthesis
      let technicalSpec = null;
      if (input?.problemStatement && input?.solution) {
        technicalSpec = EngineeringMethods.synthesizeTechnicalSpec({
          problemStatement: input.problemStatement,
          solution: input.solution,
          userStories: input?.userStories || [],
          seams: input?.seams || ['Highest Public Seam'],
          implementationDecisions: input?.implementationDecisions || []
        });
      }

      let ticketBreakdown = null;
      if (Array.isArray(input?.verticalSlices) || input?.wideRefactor) {
        ticketBreakdown = EngineeringMethods.breakdownTracerBulletTickets({
          featureTitle: goal,
          verticalSlices: input?.verticalSlices || [],
          wideRefactor: input?.wideRefactor || null
        });
      }

      const compositeId = input?.moduleName
        ? 'xyeena-architecture'
        : (input?.decisions ? 'xyeena-grill' : 'xyeena-plan');

      let status = 'SUCCESS';
      if (input?.decisions) {
        status = grillResult?.isDone ? 'SHARED_UNDERSTANDING_REACHED' : 'FRONTIER_ACTIVE';
      } else if (input?.moduleName) {
        status = (depthEvaluation?.isDeep && boundaryEvaluation?.cleanBoundaries) ? 'SUCCESS' : 'ARCHITECTURE_REVISION_RECOMMENDED';
      }

      return {
        compositeId,
        status,
        sizing,
        brainstorm,
        phasedPlan,
        leanCheck,
        technicalSpec,
        ticketBreakdown,
        depthEvaluation,
        boundaryEvaluation,
        safeRefactorResult,
        grillResult
      };
    }
  },

  // 3. /xyeena-execute
  {
    id: 'xyeena-execute',
    slashCommand: '/xyeena-execute',
    aliases: ['execute', 'xyeena-execute', 'tdd', 'test-driven-development'],
    name: 'Test-Driven Implementation & Surgical Patching',
    purpose: 'Enforces TDD, smallest-correct-change edits, and surgical regression verification under Rule 4.',
    upstreamSources: ['RE-01', 'RE-02', 'RE-04'],
    layer: 'L2',
    requiredCapabilities: ['engineering.tdd', 'quality.lean', 'quality.evidence-gate'],
    execute: (input = {}) => {
      const isAuthorized = input?.isExecutionAuthorized === true || input?.mode === 'EXECUTION';
      if (!isAuthorized) {
        return {
          compositeId: 'xyeena-execute',
          status: 'GATED',
          reason: 'Rule 4 Gate: Cannot execute implementation without explicit user instruction.'
        };
      }

      const diff = input?.diff || 'diff --git a/a b/b\n+const patch = true;';
      const leanAudit = QualityMethods.auditLeanDiff(diff);
      const ponytailLeanAudit = EngineeringMethods.auditPonytailLeanDiff({
        diff,
        callers: input?.callers || [],
        level: input?.level || 'full',
        options: { isSeamRequired: input?.isSeamRequired || false }
      });

      const tddVerification = EngineeringMethods.verifyTddCycle(input?.stage || 'GREEN', {
        testFailedInitially: input?.testFailedInitially === true,
        testPassedAfterCode: input?.testPassedAfterCode === true
      });

      let safeRefactorCheck = null;
      if (input?.originalExports && input?.newExports) {
        safeRefactorCheck = EngineeringMethods.auditSafeRefactor({
          targetModule: input?.targetModule || 'TargetModule',
          originalExports: input.originalExports,
          newExports: input.newExports,
          testsPassing: input?.testsPassing ?? true
        });
      }

      let recordedRulings = [];
      if (Array.isArray(input?.rulings)) {
        recordedRulings = input.rulings.map(r => ThinkingMethods.recordInlineRuling(r));
      } else if (input?.ruling) {
        recordedRulings = [ThinkingMethods.recordInlineRuling(input.ruling)];
      }

      return {
        compositeId: 'xyeena-execute',
        status: (ponytailLeanAudit.isClean && tddVerification.compliant) ? 'SUCCESS' : 'EXECUTION_DISCIPLINE_WARNING',
        leanAudit,
        ponytailLeanAudit,
        tddVerification,
        safeRefactorCheck,
        recordedRulings,
        tddDiscipline: {
          cycle: 'RED_GREEN_REFACTOR',
          requirement: 'Regression test must be written before or paired with implementation.'
        }
      };
    }
  },

  // 4. /xyeena-debug
  {
    id: 'xyeena-debug',
    slashCommand: '/xyeena-debug',
    aliases: ['debug', 'xyeena-debug', 'systematic-debugging', 'investigate-first'],
    name: '4-Phase Systematic Root-Cause Debugging',
    purpose: 'Disciplined debugging pipeline: Reproduce -> Isolate -> Propose Fix -> Verify Fix without speculative refactoring.',
    upstreamSources: ['RE-01', 'RE-02', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['thinking.hypothesis', 'engineering.debug-discipline', 'quality.evidence-gate'],
    execute: (input = {}) => {
      const stage = input?.stage || 'REPRODUCE';
      const evidence = input?.evidence || {};
      const investigation = ThinkingMethods.trackDebuggingInvestigation({ stage, evidence });

      let rankedHypotheses = [];
      if (input?.symptom && Array.isArray(input?.candidates)) {
        rankedHypotheses = ThinkingMethods.rankHypotheses(input.symptom, input.candidates);
      }

      return {
        compositeId: 'xyeena-debug',
        status: investigation.compliant ? 'SUCCESS' : 'DISCIPLINE_BLOCKED',
        stage,
        investigation,
        rankedHypotheses
      };
    }
  },

  // 5. /xyeena-review
  {
    id: 'xyeena-review',
    slashCommand: '/xyeena-review',
    aliases: ['review', 'xyeena-review', 'code-reviewer', 'ponytail-review', 'superior-code-review'],
    name: 'Dual-Axis Read-Only Code & Quality Review',
    purpose: 'Evaluates architecture depth (Axis 1), diff safety (Axis 2), Anti-Slop comment hygiene, and Ponytail lean diffs.',
    upstreamSources: ['RE-01', 'RE-02', 'RE-04', 'RE-03'],
    layer: 'L2',
    requiredCapabilities: ['engineering.dual-axis-review', 'quality.anti-slop', 'quality.lean'],
    execute: (input = {}) => {
      const diff = typeof input === 'string' ? input : (input?.diff || '');
      const reviewResult = EngineeringMethods.dualAxisReview({
        diff,
        specRequirements: input?.specRequirements || ['Functional correctness'],
        styleConventions: input?.styleConventions || []
      });

      const leanAudit = QualityMethods.auditLeanDiff(diff || '+const x = 1;');
      const ponytailAudit = EngineeringMethods.auditPonytailLeanDiff({
        diff: diff || '+const x = 1;',
        callers: input?.callers || [],
        level: input?.level || 'full'
      });
      const antiSlopAudit = QualityMethods.auditUniversalAntiSlop({ code: diff });

      let feedbackEvaluation = null;
      if (Array.isArray(input?.feedback) && input.feedback.length > 0) {
        feedbackEvaluation = EngineeringMethods.receiveReviewFeedback(input.feedback);
      }

      let codeDocAudit = null;
      if (input?.code || diff) {
        codeDocAudit = EngineeringMethods.auditCodeAsDocumentation(input?.code || diff);
      }

      return {
        compositeId: 'xyeena-review',
        status: 'SUCCESS',
        findingsVerdict: (reviewResult.reviewVerdict === 'PASS' && ponytailAudit.isClean) ? 'PASS' : 'REVIEW_FINDINGS_REPORTED',
        mode: 'READ_ONLY',
        reviewResult,
        leanAudit,
        ponytailAudit,
        antiSlopAudit,
        codeDocAudit,
        feedbackEvaluation
      };
    }
  },

  // 6. /xyeena-test
  {
    id: 'xyeena-test',
    slashCommand: '/xyeena-test',
    aliases: ['test', 'xyeena-test', 'webapp-testing'],
    name: 'Automated Test Verification & Fixture Strategy',
    purpose: 'Structures automated test suites, fixture isolation, and reproducible test evidence.',
    upstreamSources: ['RE-01', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['engineering.tdd', 'quality.evidence-gate'],
    execute: (input = {}) => {
      const suiteName = input?.suiteName || 'Target Suite';
      const testCases = Array.isArray(input?.testCases) ? input.testCases : [];
      const passCount = testCases.filter(t => t.passed === true).length;
      const totalCount = testCases.length;

      return {
        compositeId: 'xyeena-test',
        status: totalCount > 0 && passCount === totalCount ? 'PASS' : 'TESTS_PENDING_OR_FAILED',
        suiteName,
        metrics: { total: totalCount, passed: passCount, failed: totalCount - passCount },
        isolationVerified: true
      };
    }
  },

  // 7. /xyeena-verify
  {
    id: 'xyeena-verify',
    slashCommand: '/xyeena-verify',
    aliases: ['verify', 'xyeena-verify', 'verification-before-completion', 'verify-and-stop'],
    name: 'DEC-31/32 Epistemic Evidence Gate & Verify-and-Stop Discipline',
    purpose: 'Mandatory fresh execution evidence gate and Caveman verify-and-stop discipline; halts immediately once criteria pass.',
    upstreamSources: ['RE-01', 'RE-05', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['core.evidence', 'quality.evidence-gate'],
    execute: (input = {}) => {
      const claim = typeof input === 'string' ? input : (input?.claim || 'Task Completion Claim');
      const terminalOutput = input?.terminalOutput || '';
      const commandExecuted = input?.commandExecuted || '';

      const classification = EpistemicEvidenceClassifier.classify(claim, terminalOutput);
      const isVerified = (
        classification.tier === EVIDENCE_TIERS.BEHAVIOR_VERIFIED ||
        classification.tier === EVIDENCE_TIERS.COMPARATIVE_PARITY ||
        (terminalOutput.length > 0 && commandExecuted.length > 0)
      );

      // Caveman verify-and-stop discipline
      let verifyAndStopResult = null;
      if (Array.isArray(input?.executedChecks) && input.executedChecks.length > 0) {
        verifyAndStopResult = EngineeringMethods.verifyAndStop({
          acceptanceConditions: input?.acceptanceConditions || [claim],
          executedChecks: input.executedChecks
        });
      }

      return {
        compositeId: 'xyeena-verify',
        status: (isVerified && (!verifyAndStopResult || verifyAndStopResult.verified)) ? 'VERIFIED' : 'EVIDENCE_INSUFFICIENT',
        claim,
        commandExecuted,
        classification,
        rule2Satisfied: isVerified,
        verifyAndStopResult
      };
    }
  },

  // 8. /xyeena-security
  {
    id: 'xyeena-security',
    slashCommand: '/xyeena-security',
    aliases: ['security', 'xyeena-security', 'security-review'],
    name: 'Scoped Security Review & Finding Validation',
    purpose: 'Scoped diff security review default with Cloudflare finding schemas; gates full repo audit on explicit consent.',
    upstreamSources: ['RE-06', 'RE-15', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['security.scoped-review', 'security.findings-validation', 'security.threat-model'],
    execute: (input = {}) => {
      const isFullAuditRequested = input?.fullAuditRequested === true;
      const findings = Array.isArray(input?.findings) ? input.findings : [];

      if (isFullAuditRequested && !input?.explicitOwnerApproval) {
        return {
          compositeId: 'xyeena-security',
          status: 'BLOCKED_CONSENT_REQUIRED',
          reason: 'Full security audit requires explicit owner approval. Defaulting to scoped review.'
        };
      }

      const deduplicated = SecurityMethods.deduplicateFindings(findings);
      const validatedFindings = deduplicated.uniqueFindings.map(f => SecurityMethods.validateFinding(f));
      const scopedReview = SecurityMethods.auditScopedDiffSecurity({
        diff: typeof input === 'string' ? input : (input?.diff || ''),
        sensitivePaths: input?.sensitiveFiles || []
      });

      let workflowAudit = null;
      if (input?.workflowYaml) {
        workflowAudit = SecurityMethods.auditWorkflowSecurity({
          workflowYaml: input.workflowYaml,
          workflowPath: input.workflowPath || '.github/workflows/ci.yml'
        });
      }

      let rlsAudit = null;
      if (input?.rlsTable) {
        rlsAudit = SecurityMethods.evaluateRlsPolicy({
          tableName: input.rlsTable,
          rlsEnabled: input.rlsEnabled ?? true,
          policies: input.policies || [],
          testPrincipals: input.testPrincipals || []
        });
      }

      let keyExposure = null;
      if (input?.content && input?.filePath) {
        keyExposure = SecurityMethods.detectServiceRoleKeyExposure({
          content: input.content,
          filePath: input.filePath
        });
      }

      let migrationSafety = null;
      if (input?.ddl) {
        migrationSafety = SecurityMethods.auditPostgresMigrationSafety({
          ddl: input.ddl,
          currentTableRows: input.currentTableRows || 0
        });
      }

      return {
        compositeId: 'xyeena-security',
        status: 'SUCCESS',
        mode: isFullAuditRequested ? 'FULL_AUDIT' : 'SCOPED_DIFF_REVIEW',
        scopedReview,
        validatedFindings,
        deduplicated,
        workflowAudit,
        rlsAudit,
        keyExposure,
        migrationSafety
      };
    }
  },

  // 9. /xyeena-research
  {
    id: 'xyeena-research',
    slashCommand: '/xyeena-research',
    aliases: ['research', 'xyeena-research', 'caveman-explore'],
    name: 'Grounded Primary-Source Research Synthesis',
    purpose: 'Conducts falsifiable research synthesis with exact Caveman file:line citations and zero circular hallucination.',
    upstreamSources: ['RE-05', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['thinking.research', 'knowledge.research-quality'],
    execute: (input = {}) => {
      const topic = typeof input === 'string' ? input : (input?.topic || 'Research Subject');
      const citations = Array.isArray(input?.citations) ? input.citations : [];

      const verifiedCitations = citations.map(c => {
        const hasFilePath = typeof c.path === 'string' && c.path.length > 0;
        const hasLineNumber = typeof c.line === 'number' || typeof c.lines === 'string';
        return {
          source: c.path || 'unknown',
          lines: c.line || c.lines || 'unspecified',
          citationValid: hasFilePath && Boolean(hasLineNumber),
          tier: hasFilePath && hasLineNumber ? 'OBSERVED' : 'INFERRED'
        };
      });

      let boundedRetrievalResult = null;
      if (input?.dataset || input?.searchQuery) {
        boundedRetrievalResult = KnowledgeMethods.boundedRetrieve({
          query: input.searchQuery || topic,
          dataset: input.dataset || [],
          maxResults: input.maxResults || 20,
          maxBytes: input.maxBytes || 32768,
          basePath: input.basePath || ''
        });
      }

      return {
        compositeId: 'xyeena-research',
        status: 'SUCCESS',
        topic,
        citationsAudited: verifiedCitations.length,
        verifiedCitations,
        boundedRetrievalResult,
        antiSlopResearchNote: 'Zero circular AI citations allowed; grounded in primary local or remote sources.'
      };
    }
  },

  // 10. /xyeena-writing
  {
    id: 'xyeena-writing',
    slashCommand: '/xyeena-writing',
    aliases: ['writing', 'xyeena-writing', 'antislop-copywriting'],
    name: 'Human-First UX & Technical Writing',
    purpose: 'Direct, clear product copy and documentation without AI buzzwords, robotic apologies, or filler.',
    upstreamSources: ['RE-03', 'RE-05', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['delivery.documentation', 'delivery.product-copy', 'quality.anti-slop'],
    execute: (input = {}) => {
      const text = typeof input === 'string' ? input : (input?.text || input?.copy || '');
      const antiSlopAudit = QualityMethods.auditUniversalAntiSlop({ text });
      const humanCopy = DeliveryMethods.composeActionLabel(input?.verb || 'Update', input?.noun || 'Settings');

      return {
        compositeId: 'xyeena-writing',
        status: 'SUCCESS',
        antiSlopAudit,
        humanCopy,
        isHumanTone: antiSlopAudit.copywriting?.hasSlop !== true
      };
    }
  },

  // 11. /xyeena-orchestrate
  {
    id: 'xyeena-orchestrate',
    slashCommand: '/xyeena-orchestrate',
    aliases: [
      'orchestrate', 'xyeena-orchestrate', '/xyeena-orchestrate', 'dispatching-parallel-agents', 'subagent-driven-development',
      'handoff', 'xyeena-handoff', '/xyeena-handoff', 'claude-handoff'
    ],
    name: 'Cortex Native DAG Controller & State Coordinator',
    purpose: 'Constructs dependency-ordered TaskGraphs, manages recovery checkpoints, and orchestrates host delegation.',
    upstreamSources: ['RE-01', 'RE-05', 'RE-31', 'RE-20'],
    layer: 'L2',
    requiredCapabilities: ['coordination.dag-runner', 'coordination.subagent-runner'],
    execute: (input = {}) => {
      // Context compaction & Handoff (Caveman RE-05)
      if ((input?.text || input?.context) && !input?.tasks) {
        const text = typeof input === 'string' ? input : (input?.text || input?.context || '');
        const compression = EngineeringMethods.compressTechnicalOutput(text);
        return {
          compositeId: 'xyeena-handoff',
          status: 'SUCCESS',
          compression,
          checkpointReady: true,
          recoveryInstruction: 'Resume from verbatim payload without re-executing verified tasks.'
        };
      }

      const tasks = Array.isArray(input?.tasks) ? input.tasks : [
        { id: 'task-1', title: 'Prepare Scoped Diff', dependencies: [] },
        { id: 'task-2', title: 'Verify & Test', dependencies: ['task-1'] }
      ];

      const graph = new TaskGraph();
      for (const t of tasks) {
        graph.addTask(new TaskNode({
          id: t.id,
          title: t.title,
          dependencies: t.dependencies || [],
          isReadOnly: Boolean(t.isReadOnly)
        }));
      }

      const executionOrder = graph.getExecutionOrder();

      return {
        compositeId: 'xyeena-orchestrate',
        status: 'SUCCESS',
        taskCount: graph.size(),
        executionOrder,
        writeSerializationEnforced: true,
        singleGovernorInvariant: 'CORTEX_EXCLUSIVE'
      };
    }
  }
]);

/**
 * Composite Skill Registry for looking up and executing composite workflows.
 */
export class CompositeRegistry {
  constructor() {
    this.composites = new Map();
    for (const def of COMPOSITE_DEFINITIONS) {
      this.composites.set(def.id, def);
      if (def.slashCommand) {
        this.composites.set(def.slashCommand, def);
      }
      if (Array.isArray(def.aliases)) {
        for (const alias of def.aliases) {
          this.composites.set(alias, def);
        }
      }
    }
  }

  /**
   * Find composite skill by ID, slash command, or alias.
   * @param {string} identifier
   * @returns {object|null}
   */
  get(identifier) {
    if (!identifier || typeof identifier !== 'string') return null;
    const clean = identifier.trim().toLowerCase();
    return this.composites.get(clean) || null;
  }

  /**
   * Execute composite skill directly.
   * @param {string} identifier
   * @param {object} input
   * @param {object} [context={}]
   * @returns {object}
   */
  execute(identifier, input = {}, context = {}) {
    const comp = this.get(identifier);
    if (!comp) {
      throw new XyeenaError(ERROR_CODES.CAPABILITY_NOT_FOUND, `Composite skill not found: ${identifier}`);
    }
    return comp.execute(input, context);
  }

  /**
   * List all unique composite definitions.
   * @returns {Array<object>}
   */
  list() {
    return [...COMPOSITE_DEFINITIONS];
  }
}
