import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { searchDesignKnowledge } from '../skills/xyeena-interface/scripts/search-design-knowledge.mjs';

describe('v1 selective design knowledge lookup (reference-only)', () => {
  it('finds operational guidance without loading every upstream', () => {
    const r = searchDesignKnowledge('dashboard filter', { surface: 'operate', limit: 4 });
    assert.equal(r.status, 'REFERENCE_ONLY');
    assert.ok(r.results.some(x => x.id === 'ui-operational-hierarchy'));
    assert.ok(r.results.length <= 4);
    assert.ok(r.results.every(x => x.upstreamRefs.length > 0));
  });

  it('filters a Next.js result by stack but excludes it from vanilla', () => {
    const modern = searchDesignKnowledge('Next.js server client', { stack: 'nextjs' });
    assert.ok(modern.results.some(x => x.id === 'nextjs-server-client'));
    const plain = searchDesignKnowledge('Next.js server client', { stack: 'vanilla' });
    assert.ok(!plain.results.some(x => x.id === 'nextjs-server-client'));
  });

  it('supports focus and reduced motion quality floor lookups', () => {
    assert.ok(searchDesignKnowledge('focus keyboard').results.some(x => x.id === 'a11y-focus'));
    assert.ok(searchDesignKnowledge('reduced motion').results.some(x => x.id === 'hallmark-floor'));
  });

  it('rejects unbounded, unknown and nonsensical arguments', () => {
    assert.throws(() => searchDesignKnowledge(''), /query/);
    assert.throws(() => searchDesignKnowledge('a'.repeat(257)), /query/);
    assert.throws(() => searchDesignKnowledge('accessibility', { limit: 200 }), /limit/);
    assert.throws(() => searchDesignKnowledge('accessibility', { stack: '../secrets' }), /Unsupported stack/);
    assert.throws(() => searchDesignKnowledge('accessibility', { surface: 'invalid' }), /Unsupported stack/);
  });
});
