import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateSourceEvidence, extractCitations, auditSourceProvenance } from '../../skills/veyra-research/engine.mjs';
import { generateQuestionFrontier, detectAmbiguities, evaluateInterviewProgress } from '../../skills/veyra-grill/engine.mjs';
import { validatePlanDAG, estimateBlastRadius } from '../../skills/veyra-plan/engine.mjs';
import { auditModuleBoundaries, calculateAfferentEfferentCoupling } from '../../skills/veyra-architecture/engine.mjs';

describe('Veyra Wave 2 — Discovery & Planning Skills', () => {
  test('veyra-research: validates primary evidence and extracts citations', () => {
    const sourceText = 'The Veyra architecture mandates 19 co-equal skills and strictly prohibits unverified claims.';
    const claim = 'Veyra architecture mandates 19 co-equal skills';
    const evalRes = validateSourceEvidence(claim, sourceText, { sourceTier: 'PRIMARY' });

    assert.equal(evalRes.valid, true);
    assert.equal(evalRes.isDirectQuote, true);
    assert.equal(evalRes.tier, 'PRIMARY');

    const citations = extractCitations('See https://github.com/obra/superpowers and workspace/docs/ROADMAP.md#L45');
    assert.equal(citations.length, 2);
    assert.equal(citations[0].type, 'URL');
    assert.equal(citations[1].type, 'FILE');
  });

  test('veyra-grill: generates question frontier and detects ambiguities', () => {
    const proposal = {
      title: 'Caching Subsystem',
      goals: ['Reduce latency by 50%'],
      assumptions: ['Redis memory is unlimited'],
      risks: ['Network partition during failover']
    };
    const frontier = generateQuestionFrontier(proposal);
    assert.ok(frontier.frontierSize >= 2);
    assert.ok(frontier.questions.some(q => q.category === 'ASSUMPTION_VALIDATION'));

    const ambiguities = detectAmbiguities('We will somehow make the system robust and scalable.');
    assert.ok(ambiguities.length >= 3);
  });

  test('veyra-plan: detects circular dependencies in execution DAG', () => {
    const cyclicPhases = [
      {
        id: 'phase-1',
        tasks: [
          { id: 'task-a', dependsOn: ['task-b'] },
          { id: 'task-b', dependsOn: ['task-a'] }
        ]
      }
    ];
    const dagResult = validatePlanDAG(cyclicPhases);
    assert.equal(dagResult.valid, false);
    assert.equal(dagResult.reason, 'CIRCULAR_DEPENDENCY');

    const validPhases = [
      {
        id: 'phase-1',
        tasks: [
          { id: 'task-1', dependsOn: [] },
          { id: 'task-2', dependsOn: ['task-1'] }
        ]
      }
    ];
    const validResult = validatePlanDAG(validPhases);
    assert.equal(validResult.valid, true);
  });

  test('veyra-architecture: enforces clean architecture boundaries and coupling metrics', () => {
    const modules = [
      { name: 'OrderDomain', layer: 'DOMAIN', imports: ['/infra/database.mjs'] },
      { name: 'OrderController', layer: 'UI', imports: ['/domain/order.mjs'] }
    ];
    const boundaryCheck = auditModuleBoundaries(modules);
    assert.equal(boundaryCheck.clean, false);
    assert.equal(boundaryCheck.violationCount, 1);
    assert.equal(boundaryCheck.violations[0].rule, 'DOMAIN_LAYER_INVERSION_VIOLATION');

    const graph = {
      OrderDomain: [],
      OrderService: ['OrderDomain'],
      OrderController: ['OrderService']
    };
    const coupling = calculateAfferentEfferentCoupling('OrderService', graph);
    assert.equal(coupling.afferentCoupling, 1);
    assert.equal(coupling.efferentCoupling, 1);
    assert.equal(coupling.instabilityMetric, 0.5);
  });
});
