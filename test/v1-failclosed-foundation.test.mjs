import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EngineeringMethods } from '../src/methods/engineering.mjs';

describe('v1 fail-closed engineering gates', () => {
  it('does not grant PASS for a diff containing requirement words', () => {
    const result = EngineeringMethods.dualAxisReview({
      diff: '+ const authentication = true; // secure login implementation complete',
      specRequirements: ['Secure login implementation']
    });
    assert.equal(result.specSatisfaction[0].satisfied, false);
    assert.equal(result.specSatisfaction[0].verificationStatus, 'NOT_VERIFIED');
    assert.equal(result.reviewVerdict, 'REVIEW_REQUIRED');
  });

  it('does not grant PASS with an empty or clean diff', () => {
    const result = EngineeringMethods.dualAxisReview({
      diff: '',
      specRequirements: ['Request is authorized and audited']
    });
    assert.equal(result.reviewVerdict, 'REVIEW_REQUIRED');
    assert.equal(result.standardsVerdict, 'STATIC_SCAN_NO_FINDINGS');
  });

  it('marks dependency cycles blocked rather than complete', () => {
    const decisions = [
      { id: 'a', title: 'A', question: 'A?', recommended: 'A', blockedBy: ['b'] },
      { id: 'b', title: 'B', question: 'B?', recommended: 'B', blockedBy: ['a'] }
    ];
    const result = EngineeringMethods.grillFrontier({ decisions });
    assert.equal(result.frontierCount, 0);
    assert.equal(result.unresolvedCount, 2);
    assert.equal(result.isDone, false);
    assert.equal(result.verdict, 'DECISION_GRAPH_BLOCKED');
  });

  it('marks unknown prerequisites blocked rather than complete', () => {
    const result = EngineeringMethods.grillFrontier({
      decisions: [
        { id: 'a', title: 'A', question: 'A?', recommended: 'A', blockedBy: ['not-defined'] }
      ],
      settled: ['not-defined']
    });
    assert.equal(result.isDone, false);
    assert.deepEqual(result.blockedDecisions[0].unknownPrerequisites, ['not-defined']);
    assert.equal(result.verdict, 'DECISION_GRAPH_BLOCKED');
  });

  it('rejects blank responses and unknown response IDs as settlements', () => {
    const result = EngineeringMethods.grillFrontier({
      decisions: [{ id: 'a', title: 'A', question: 'A?', recommended: 'A' }],
      userResponses: { a: '   ', ghost: 'yes' }
    });
    assert.equal(result.isDone, false);
    assert.equal(result.settledCount, 0);
    assert.equal(result.frontierCount, 1);
  });

  it('rejects duplicate decision IDs even when a response is recorded', () => {
    const result = EngineeringMethods.grillFrontier({
      decisions: [
        { id: 'a', title: 'A', question: 'A?', recommended: 'A' },
        { id: 'a', title: 'Duplicate', question: 'B?', recommended: 'B' }
      ],
      userResponses: { a: 'choice' }
    });
    assert.equal(result.isDone, false);
    assert.equal(result.verdict, 'INVALID_DECISION_GRAPH');
  });

  it('requires explicit referent for ambiguous consent on sensitive decisions', () => {
    const result = EngineeringMethods.grillFrontier({
      decisions: [
        { id: 'publish', title: 'Publish', question: 'Publish package?', recommended: 'No', publish: true }
      ],
      userResponses: { publish: 'yes' }
    });
    assert.equal(result.isDone, false);
    assert.equal(result.verdict, 'AMBIGUOUS_CONSENT_BLOCKED');
  });
});
