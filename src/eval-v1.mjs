import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { sep, resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const exactNames = new Set(['STRUCTURE_VALID', 'TRIGGER_VERIFIED', 'BEHAVIOR_VERIFIED', 'HOST_VERIFIED']);

function safeFile(path) {
  if (!existsSync(path)) return false;
  const st = lstatSync(path);
  return st.isFile() && !st.isSymbolicLink();
}

export function validateSkillStructure(root, skillId) {
  const errors = [];
  if (!/^xyeena-[a-z][a-z-]*$/.test(skillId)) return { skillId, verdict: 'FAIL', errors: ['INVALID_SKILL_ID'] };
  const dir = resolve(root, 'skills', skillId);
  const skill = join(dir, 'SKILL.md');
  const contract = join(dir, 'capability.json');
  const proc = join(dir, 'references', 'procedure.md');
  for (const [label, file] of [['SKILL.md', skill], ['capability.json', contract], ['references/procedure.md', proc]]) {
    if (!safeFile(file)) errors.push('MISSING_OR_LINKED_' + label);
  }

  if (!errors.length) {
    const text = readFileSync(skill, 'utf8');
    const procedure = readFileSync(proc, 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
    if (!frontmatter) errors.push('INVALID_FRONTMATTER');
    else {
      if (!frontmatter[1].split(/\r?\n/).includes('name: ' + skillId)) errors.push('NAME_MISMATCH');
      if (!/^description:\s*\S/m.test(frontmatter[1])) errors.push('MISSING_DESCRIPTION');
    }
    for (const section of ['**Activate when:**', '**Do not activate for:**', '## Execution route', '**Output contract:**', '**Failure boundary:**']) {
      if (!text.includes(section)) errors.push('MISSING_SECTION_' + section);
    }
    for (const section of ['## Activation and exclusions', '## Operational procedure', '## Decision and recovery branches', '## Adversarial exercises', '## Upstream provenance']) {
      if (!procedure.includes(section) && !(section === '## Adversarial exercises' && procedure.includes('## Focused adversarial cases'))) errors.push('MISSING_PROCEDURE_' + section);
    }
    for (const [, relative] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|mailto:|#)/i.test(relative)) continue;
      const cleaned = relative.split('#')[0];
      const dest = resolve(dir, cleaned);
      if (isAbsolute(cleaned) || !dest.startsWith(dir + sep) || !safeFile(dest)) errors.push('INVALID_RELATIVE_REFERENCE_' + relative);
    }
    try {
      const parsed = JSON.parse(readFileSync(contract, 'utf8'));
      if (parsed.metadata?.name !== skillId) errors.push('CAPABILITY_NAME_MISMATCH');
    } catch {
      errors.push('INVALID_CAPABILITY_JSON');
    }
  }
  return { skillId, verdict: errors.length ? 'FAIL' : 'STRUCTURE_VALID', errors };
}

/**
 * This is STRUCTURE validation ONLY. There is deliberately no path that
 * promotes a markdown presence or router fixture to actual behavior/host proof.
 */
export function evaluateV1Structure({ root = defaultRoot, matrix } = {}) {
  const data = matrix ?? JSON.parse(readFileSync(resolve(root, 'evals/v1-skill-matrix.json'), 'utf8'));
  if (!Array.isArray(data.skills)) throw new TypeError('Expected matrix.skills');
  const results = data.skills.map(entry => {
    const structure = validateSkillStructure(root, entry.id);
    return {
      skillId: entry.id,
      gates: {
        STRUCTURE_VALID: structure.verdict === 'STRUCTURE_VALID' ? 'PASS' : 'FAIL',
        TRIGGER_VERIFIED: 'NOT_RUN',
        BEHAVIOR_VERIFIED: 'NOT_RUN',
        HOST_VERIFIED: 'NOT_RUN'
      },
      problems: structure.errors,
      evidenceScope: 'LOCAL_STATIC_FILE_INSPECTION'
    };
  });
  return {
    status: results.every(r => r.gates.STRUCTURE_VALID === 'PASS') ? 'STRUCTURE_ONLY_PASS' : 'STRUCTURE_INVALID',
    checked: results.length,
    structurePassed: results.filter(r => r.gates.STRUCTURE_VALID === 'PASS').length,
    triggerVerified: 0,
    behaviorVerified: 0,
    hostVerified: 0,
    results,
    caveat: 'Deterministic structure inspection is not live trigger, behavior, upstream or host verification.'
  };
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const report = evaluateV1Structure();
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.status !== 'STRUCTURE_ONLY_PASS') process.exitCode = 1;
}
