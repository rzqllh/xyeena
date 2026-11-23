/**
 * Veyra Skillcraft Engine — veyra-skillcraft
 * Skill authoring, YAML frontmatter validation, lifecycle management.
 * Zero external dependencies.
 */

export function validateSkillStructure(skillContent = '') {
  if (typeof skillContent !== 'string') return { valid: false, reason: 'EMPTY_CONTENT' };

  const frontmatterMatch = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return { valid: false, reason: 'MISSING_FRONTMATTER' };
  }

  const frontmatter = frontmatterMatch[1];
  const hasName = /name:\s*[a-z0-9_-]+/i.test(frontmatter);
  const hasDesc = /description:\s*.+/i.test(frontmatter);

  if (!hasName || !hasDesc) {
    return { valid: false, reason: 'INCOMPLETE_FRONTMATTER_FIELDS' };
  }

  const hasInvariants = skillContent.includes('## Invariants');
  return {
    valid: true,
    hasInvariants,
    byteSize: Buffer.byteLength(skillContent, 'utf8')
  };
}

export function auditSkillTokenBudget(skillContent = '', maxTokens = 1500) {
  const words = skillContent.trim().split(/\s+/).filter(Boolean);
  const estimatedTokens = Math.ceil(words.length * 1.3);
  return {
    estimatedTokens,
    maxTokens,
    withinBudget: estimatedTokens <= maxTokens
  };
}
