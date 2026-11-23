/**
 * Veyra Writing Engine — veyra-writing
 * Concise human technical copy, buzzword elimination, character economy.
 * Zero external dependencies.
 */

export function detectMarketingSlop(text = '') {
  if (typeof text !== 'string') return [];
  const SLOP_BUZZWORDS = [
    /\b(?:revolutionize|revolutionary|game-changer|game-changing|paradigm shift)\b/gi,
    /\b(?:seamless|seamlessly|unleash|empower|testament to)\b/gi,
    /\b(?:delve into|cutting-edge|next-level|innovative solution)\b/gi
  ];

  const violations = [];
  for (const pat of SLOP_BUZZWORDS) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      violations.push({ buzzword: m[0], index: m.index });
    }
  }

  return violations;
}

export function calculateReadabilityEconomy(text = '') {
  if (typeof text !== 'string' || text.length === 0) return { wordCount: 0, charCount: 0, averageWordLength: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean);
  const charCount = text.length;
  const avgLen = words.length > 0 ? Number((charCount / words.length).toFixed(2)) : 0;

  return {
    wordCount: words.length,
    charCount,
    averageWordLength: avgLen,
    isEconomical: avgLen < 7.5
  };
}

export function calculateFleschReadingEase(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  if (words.length === 0 || sentences.length === 0) return 100;
  const syllablesEst = words.length * 1.4;
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllablesEst / words.length);
  return Number(Math.max(0, Math.min(100, score)).toFixed(1));
}
