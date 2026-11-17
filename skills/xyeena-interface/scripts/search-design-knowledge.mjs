import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const indexPath = fileURLToPath(new URL('../knowledge/design-index.json', import.meta.url));
const source = JSON.parse(readFileSync(indexPath, 'utf8'));
const allowedSurfaces = new Set(['any', 'persuade', 'operate', 'read', 'experience']);
const allowedStacks = new Set(['any', 'nextjs', 'react', 'tailwind', 'vanilla']);

function tokens(value) {
  return String(value).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(word => word.length >= 2);
}

/** Selective read-only, deterministic knowledge lookup. No remote fetch, no model or host execution. */
export function searchDesignKnowledge(query, { stack = 'any', surface = 'any', limit = 5 } = {}) {
  if (typeof query !== 'string' || !query.trim() || query.length > 256) throw new TypeError('query must be 1..256 characters');
  if (!allowedStacks.has(stack) || !allowedSurfaces.has(surface)) throw new TypeError('Unsupported stack or surface');
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new RangeError('limit must be integer from 1 to 20');
  const q = tokens(query), lower = query.toLowerCase().trim();
  if (!q.length) throw new TypeError('query must contain searchable text');

  const hits = source.records
    .filter(r => (stack === 'any' || r.stacks.includes('any') || r.stacks.includes(stack)) &&
      (surface === 'any' || r.surfaces.includes('any') || r.surfaces.includes(surface)))
    .map(record => {
      const keywords = record.keywords.map(x => x.toLowerCase());
      const keyTokens = new Set(keywords.flatMap(tokens));
      const titleTokens = new Set(tokens(record.title));
      const categoryTokens = new Set(record.categories.flatMap(tokens));
      let score = keywords.includes(lower) ? 20 : 0;
      for (const word of q) {
        if (keyTokens.has(word)) score += 5;
        if (titleTokens.has(word)) score += 3;
        if (categoryTokens.has(word)) score += 2;
      }
      if (stack !== 'any' && record.stacks.includes(stack)) score += 2;
      if (surface !== 'any' && record.surfaces.includes(surface)) score += 2;
      return { record, score };
    })
    .filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, limit);

  return {
    status: 'REFERENCE_ONLY',
    query,
    stack,
    surface,
    matched: hits.length,
    results: hits.map(({ record, score }) => ({
      id: record.id,
      title: record.title,
      score,
      categories: record.categories,
      guidance: record.guidance,
      checks: record.checks,
      upstreamRefs: record.refs
    })),
    limitation: 'Curated static guidance; verify versions, actual rendering, WCAG compliance and host behavior independently.'
  };
}

const directRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (directRun) {
  try {
    const [query, stack = 'any', surface = 'any'] = process.argv.slice(2);
    process.stdout.write(JSON.stringify(searchDesignKnowledge(query, { stack, surface }), null, 2) + '\n');
  } catch (error) {
    process.stderr.write('Design knowledge lookup failed: ' + String(error.message) + '\n');
    process.exitCode = 1;
  }
}
