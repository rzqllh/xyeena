import { loadRegistry } from '../registry.mjs';

export const RECOMMENDED_SKILLS = Object.freeze([
  'xyeena-core',
  'xyeena-context',
  'xyeena-grill',
  'xyeena-research',
  'xyeena-plan',
  'xyeena-execute',
  'xyeena-debug',
  'xyeena-test',
  'xyeena-verify',
  'xyeena-review',
  'xyeena-interface',
  'xyeena-security',
  'xyeena-orchestrate',
  'xyeena-release',
]);

export function skillCatalog() {
  return loadRegistry().map((cap) => ({
    name: cap.metadata.name,
    description: cap.metadata.description,
    category: cap.metadata.category,
    required: [...(cap.dependencies?.required || [])],
    dir: cap.__dir,
  }));
}

function normalizeRequested(requested) {
  if (!requested || requested === 'recommended') return [...RECOMMENDED_SKILLS];
  if (requested === 'all' || requested === '*') return skillCatalog().map((s) => s.name);
  const values = Array.isArray(requested) ? requested : String(requested).split(',');
  return values.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
}

export function resolveSkillSelection(requested = 'recommended') {
  const catalog = skillCatalog();
  const byName = new Map(catalog.map((s) => [s.name, s]));
  const seeds = normalizeRequested(requested);
  if (!seeds.length) throw new Error('select at least one skill');
  for (const name of seeds) {
    if (!byName.has(name)) throw new Error(`unknown skill ${name}`);
  }

  const ordered = [];
  const seen = new Set();
  function add(name) {
    if (seen.has(name)) return;
    const skill = byName.get(name);
    if (!skill) throw new Error(`unknown required skill ${name}`);
    for (const dep of skill.required) add(dep);
    seen.add(name);
    ordered.push(name);
  }
  for (const name of seeds) add(name);

  return {
    requested: seeds,
    installed: ordered,
    addedDependencies: ordered.filter((name) => !seeds.includes(name)),
    catalog,
  };
}
