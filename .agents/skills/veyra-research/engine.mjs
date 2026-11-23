/**
 * Veyra Research Engine — veyra-research
 * Primary-source evidence bounding, citation extraction, provenance verification.
 * Zero external dependencies.
 */

export function validateSourceEvidence(claim, sourceText, options = {}) {
  if (!claim || typeof claim !== 'string') return { valid: false, reason: 'EMPTY_CLAIM', matchScore: 0 };
  if (!sourceText || typeof sourceText !== 'string') return { valid: false, reason: 'NO_SOURCE_TEXT', matchScore: 0 };

  const claimWords = claim.toLowerCase().match(/\b[a-z0-9_-]{3,}\b/g) || [];
  if (claimWords.length === 0) return { valid: false, reason: 'NO_INFORMATIVE_TERMS', matchScore: 0 };

  const sourceLower = sourceText.toLowerCase();
  let matched = 0;
  for (const w of claimWords) {
    if (sourceLower.includes(w)) matched++;
  }

  const matchScore = Number((matched / claimWords.length).toFixed(3));
  const threshold = options.minMatchScore || 0.6;
  const isDirectQuote = sourceText.includes(claim.trim());

  return {
    valid: matchScore >= threshold || isDirectQuote,
    isDirectQuote,
    matchScore,
    matchedTerms: matched,
    totalTerms: claimWords.length,
    tier: options.sourceTier || 'SECONDARY'
  };
}

export function extractCitations(text) {
  if (typeof text !== 'string') return [];
  const citations = [];
  const urlRegex = /https?:\/\/[^\s"'>)]+/g;
  const fileRegex = /(?:file:\/\/\/?[^\s"'>)]+|[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+\.[a-zA-Z0-9]+(?:#L\d+(?:-L\d+)?)?)/g;

  let m;
  while ((m = urlRegex.exec(text)) !== null) {
    citations.push({ type: 'URL', target: m[0], index: m.index });
  }
  while ((m = fileRegex.exec(text)) !== null) {
    if (!m[0].startsWith('http')) {
      citations.push({ type: 'FILE', target: m[0], index: m.index });
    }
  }
  return citations;
}

export function auditSourceProvenance(claims = []) {
  if (!Array.isArray(claims)) return { verifiedRatio: 0, items: [] };
  const items = claims.map(c => {
    const hasSource = Boolean(c.source && c.source.length > 0);
    const hasEvidence = Boolean(c.evidence && c.evidence.length > 0);
    const verified = hasSource && (c.tier === 'PRIMARY' || hasEvidence);
    return {
      claim: c.claim || '',
      verified,
      tier: c.tier || 'UNKNOWN',
      source: c.source || null
    };
  });
  const verifiedCount = items.filter(i => i.verified).length;
  return {
    verifiedRatio: items.length > 0 ? Number((verifiedCount / items.length).toFixed(3)) : 1.0,
    totalClaims: items.length,
    verifiedCount,
    items
  };
}

export function calculateCredibilityTier(urlOrPath = '') {
  if (typeof urlOrPath !== 'string') return 'UNKNOWN';
  if (urlOrPath.startsWith('workspace/') || urlOrPath.startsWith('docs/')) return 'PRIMARY_REPOSITORY_DOC';
  if (urlOrPath.includes('github.com') || urlOrPath.includes('nodejs.org') || urlOrPath.includes('w3.org')) return 'OFFICIAL_UPSTREAM';
  if (urlOrPath.includes('stackoverflow.com') || urlOrPath.includes('medium.com')) return 'TERTIARY_COMMUNITY';
  return 'SECONDARY_SOURCE';
}
