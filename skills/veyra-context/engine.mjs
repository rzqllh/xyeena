/**
 * Veyra Context Engine — veyra-context
 * Context economy, token payload compression, memory boundary preservation.
 * Zero external dependencies (pure Node.js ES Module).
 */

const REMOVABLE_POLITE_PREAMBLES = [
  /^(?:certainly|sure|absolutely|of course)[,!.\s][^\n]*\n?/gim,
  /^(?:as an ai language model|as an assistant)[^\n]*\n?/gim,
  /^(?:i hope this|hope this helps|feel free to ask|please let me know)[^\n]*\n?/gim,
  /^(?:saya dengan senang hati|tentu saja|berikut adalah)[^\n]*\n?/gim
];

export function extractTechnicalFacts(text) {
  if (typeof text !== 'string') return { paths: [], hashes: [], decisions: [], numbers: [] };

  const paths = Array.from(new Set(text.match(/(?:[a-zA-Z]:[\\/][^\s\r\n"'>)]+|[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+\.[a-zA-Z0-9]+)/g) || []));
  const hashes = Array.from(new Set(text.match(/\b[a-f0-9]{40,64}\b/gi) || []));
  const decisions = Array.from(new Set(text.match(/\bDEC-\d{2}\b/g) || []));
  const numbers = Array.from(new Set(text.match(/\b\d+(?:\.\d+)?%/g) || []));

  return { paths, hashes, decisions, numbers };
}

export function compressContext(text, options = {}) {
  if (typeof text !== 'string') return { compressedText: '', originalBytes: 0, compressedBytes: 0, compressionRatio: 0, preservedFacts: { paths: [], hashes: [], decisions: [], numbers: [] } };

  const originalBytes = Buffer.byteLength(text, 'utf8');
  const facts = extractTechnicalFacts(text);

  let cleaned = text;
  for (const pat of REMOVABLE_POLITE_PREAMBLES) {
    cleaned = cleaned.replace(pat, '');
  }
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (options.mode === 'ULTRA') {
    cleaned = cleaned.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  const compressedBytes = Buffer.byteLength(cleaned, 'utf8');
  const compressionRatio = originalBytes > 0 ? Number((compressedBytes / originalBytes).toFixed(4)) : 1.0;

  return {
    compressedText: cleaned,
    originalBytes,
    compressedBytes,
    compressionRatio,
    preservedFacts: facts
  };
}

export function calculateInformationDensity(text) {
  if (typeof text !== 'string' || text.length === 0) return { tokenCountEst: 0, technicalDensity: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean);
  const tokenCountEst = Math.ceil(words.length * 1.3);
  const facts = extractTechnicalFacts(text);
  const totalFactCount = facts.paths.length + facts.hashes.length + facts.decisions.length + facts.numbers.length;
  const technicalDensity = words.length > 0 ? Number((totalFactCount / words.length).toFixed(3)) : 0;
  return { tokenCountEst, wordCount: words.length, totalFactCount, technicalDensity };
}

export function enforceMemoryBoundary(entries = [], maxRecent = 6, anchorKeys = []) {
  if (!Array.isArray(entries)) return [];
  if (entries.length <= maxRecent) return entries;
  const head = entries.slice(0, 2);
  const tail = entries.slice(-4);
  const compacted = {
    id: 'summary-compaction',
    type: 'COMPACTED_SUMMARY',
    text: `Compacted ${entries.length - 6} middle turns to preserve memory boundary.`
  };
  return [...head, compacted, ...tail];
}

export function verifyFactPreservation(originalText, compressedText) {
  const origFacts = extractTechnicalFacts(originalText);
  const missing = [];
  for (const cat of ['paths', 'hashes', 'decisions', 'numbers']) {
    for (const item of origFacts[cat]) {
      if (!compressedText.includes(item)) missing.push({ category: cat, item });
    }
  }
  const totalFacts = origFacts.paths.length + origFacts.hashes.length + origFacts.decisions.length + origFacts.numbers.length;
  const retainedCount = totalFacts - missing.length;
  return {
    preserved: missing.length === 0,
    totalFacts,
    retainedCount,
    recallRatio: totalFacts > 0 ? Number((retainedCount / totalFacts).toFixed(4)) : 1.0,
    missing
  };
}
