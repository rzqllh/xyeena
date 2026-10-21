import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRegistry } from './registry.mjs';
import { resolveCapabilities } from './resolver.mjs';

const TARGETS = Object.freeze({ antigravity: ['.agents/skills', '.agent/skills'], codex: ['.agents/skills'], claude: ['.claude/skills'] });
const GLOBAL_TARGETS = Object.freeze({ antigravity: ['.gemini/config/skills', '.gemini/antigravity/skills'], codex: ['.agents/skills'], claude: ['.claude/skills'] });
const STOPWORDS = new Set(['about','after','agent','agents','also','and','are','based','before','best','can','code','does','for','from','have','into','more','must','only','our','that','the','their','this','use','user','using','when','with','work','your']);
const words = value => [...new Set(String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [])]
  .filter(word => !STOPWORDS.has(word));

function safeDirectory(dir) {
  try { return fs.lstatSync(dir).isDirectory() && !fs.lstatSync(dir).isSymbolicLink(); }
  catch { return false; }
}
function safeTree(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (!safeDirectory(current)) return false;
  }
  return true;
}
function readMetadata(file, fallbackName) {
  try {
    if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 65536) return null;
    const content = fs.readFileSync(file, 'utf8');
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
    const frontmatter = content.split(/\r?\n---\s*\r?\n/, 2)[0].split(/\r?\n/).slice(1);
    const fields = {};
    for (let i = 0; i < frontmatter.length; i++) {
      const match = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(frontmatter[i]);
      if (!match) continue;
      let value = match[2].trim();
      if (value === '>' || value === '>-' || value === '|' || value === '|-') {
        const lines = [];
        while (i + 1 < frontmatter.length && /^\s+\S/.test(frontmatter[i + 1])) lines.push(frontmatter[++i].trim());
        value = lines.join(' ');
      }
      fields[match[1]] = value.replace(/^(['"])(.*)\1$/, '$2').slice(0, 1000);
    }
    return { name: fallbackName, description: fields.description || '' };
  } catch { return null; }
}

/** Discover already-installed, local Agent Skills. Never execute SKILL.md or follow links. */
export function discoverWorkspaceSkills({ cwd = process.cwd(), runtime = 'antigravity',
  home = os.homedir(), includeGlobal = true } = {}) {
  if (runtime !== 'all' && !Object.hasOwn(TARGETS, runtime)) throw new Error('Unknown runtime: ' + runtime);
  const root = fs.realpathSync(path.resolve(cwd));
  const targets = runtime === 'all' ? ['antigravity', 'claude', 'codex'] : [runtime];
  const locations = [
    ...targets.flatMap(target => TARGETS[target].map(relative => ({ base: root, relative, target, scope: 'workspace' }))),
    ...(includeGlobal ? targets.flatMap(target => GLOBAL_TARGETS[target].map(relative =>
      ({ base: home, relative, target, scope: 'global' }))) : [])
  ];
  const found = new Map();
  for (const { base, relative, target, scope } of locations) {
    if (!safeTree(base, relative)) continue;
    const dir = path.join(base, relative);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const skillPath = path.join(dir, entry.name, 'SKILL.md');
      const metadata = readMetadata(skillPath, entry.name);
      if (!metadata || found.has(entry.name)) continue;
      found.set(entry.name, { ...metadata, path: skillPath, runtime: target, scope, source: scope });
    }
  }
  return [...found.values()];
}

function externalScore(skill, prompt) {
  const text = String(prompt || '').toLowerCase();
  const queryWords = new Set(words(text));
  const nameWords = words(skill.name.replaceAll('-', ' '));
  const nameHits = nameWords.filter(word => queryWords.has(word)).length;
  const descriptionHits = words(skill.description).filter(word => queryWords.has(word)).length;
  // Metadata is a routing hint only, not trusted instructions. Avoid fuzzy one-word description matches.
  if (!nameHits && descriptionHits < 2) return null;
  const explicit = text.includes(skill.name.toLowerCase()) || text.includes(skill.name.replaceAll('-', ' ').toLowerCase());
  return { name: skill.name, score: (explicit ? 100 : 0) + Math.min(nameHits * 30, 90) +
    Math.min(descriptionHits * 5, 25), reasons: [explicit ? 'explicit-name' : nameHits ? 'name-overlap' : 'description-overlap'] };
}

/** Select from installed skills only. Built-in Xyeena contracts retain the existing resolver semantics. */
export function routeWorkspaceSkills({ cwd = process.cwd(), runtime = 'antigravity', prompt = '', state = 'TRIAGE', maxSupporting = 2, paths = [],
  home = os.homedir(), includeGlobal = true } = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('A non-empty prompt is required');
  if (!Number.isInteger(maxSupporting) || maxSupporting < 0 || maxSupporting > 8) throw new Error('Invalid supporting-skill budget');
  const installed = discoverWorkspaceSkills({ cwd, runtime, home, includeGlobal });
  const installedByName = new Map(installed.map(skill => [skill.name, skill]));
  const builtins = loadRegistry().filter(cap => installedByName.has(cap.metadata.name));
  const builtinNames = new Set(builtins.map(cap => cap.metadata.name));
  const routed = resolveCapabilities(builtins, { prompt, state, paths, maxSupporting });
  const candidates = [...routed.candidates, ...installed.filter(skill => !builtinNames.has(skill.name))
    .map(skill => externalScore(skill, prompt)).filter(Boolean)]
    .sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
  const primary = candidates[0] || null;
  const primaryContract = builtins.find(cap => cap.metadata.name === primary?.name);
  const allowed = new Set(primaryContract?.chain?.allowed || []);
  const supporting = primary ? candidates.slice(1).filter(item => allowed.has(item.name) || item.score >= 30)
    .slice(0, maxSupporting) : [];
  const detail = value => value ? { ...value, path: installedByName.get(value.name).path,
    runtime: installedByName.get(value.name).runtime, scope: installedByName.get(value.name).scope,
    source: builtinNames.has(value.name) ? 'xyeena' : 'external' } : null;
  return { mode: 'preview-only', executed: false, runtime, kernel: installedByName.has('xyeena-core') ? 'xyeena-core' : null,
    primary: detail(primary), supporting: supporting.map(detail),
    installedCount: installed.length, candidates: candidates.map(detail) };
}
