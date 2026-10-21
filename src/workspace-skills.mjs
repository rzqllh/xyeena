import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRegistry } from './registry.mjs';
import { resolveCapabilities } from './resolver.mjs';
import { skillLocations, requireSkillHost } from './skill-hosts.mjs';

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
    const name = fields.name || fallbackName;
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) || !fields.description) return null;
    return { name, description: fields.description };
  } catch { return null; }
}

/** Discover already-installed, local Agent Skills. Never execute SKILL.md or follow links. */
export function discoverWorkspaceSkills({ cwd = process.cwd(), runtime = 'antigravity',
  home = os.homedir(), includeGlobal = true, env = process.env } = {}) {
  requireSkillHost(runtime);
  const locations = skillLocations({ cwd, runtime, home, includeGlobal, env });
  const found = new Map(), seenPaths = new Set();
  const visitSkill = (dir, entry, loc) => {
    if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith('.')) return false;
    const skillPath = path.join(dir, entry.name, 'SKILL.md');
    const metadata = readMetadata(skillPath, entry.name);
    if (!metadata) return false;
    let canonical;
    try { canonical = fs.realpathSync(skillPath); } catch { return false; }
    if (seenPaths.has(canonical)) return true;
    seenPaths.add(canonical);
    // Native host must confirm project trust and skill enablement; detection is not activation.
    if (!found.has(metadata.name)) found.set(metadata.name, {
      ...metadata, path: skillPath, runtime: loc.runtime, scope: loc.scope,
      source: loc.scope, availability: loc.requiresTrust ? 'requires-host-trust' : 'detected'
    });
    return true;
  };
  const entries = dir => {
    try { return fs.readdirSync(dir, { withFileTypes: true })
      .filter(x => x.isDirectory() && !x.isSymbolicLink() && !x.name.startsWith('.'))
      .sort((a,b) => a.name.localeCompare(b.name)).slice(0, 256); }
    catch { return []; }
  };
  for (const loc of locations) {
    if (!safeDirectory(loc.base) || (loc.relative && !safeTree(loc.base, loc.relative))) continue;
    const dir = loc.relative ? path.join(loc.base, loc.relative) : loc.base;
    if (!safeDirectory(dir)) continue;
    for (const entry of entries(dir)) {
      if (visitSkill(dir, entry, loc) || !loc.nested) continue;
      const category = path.join(dir, entry.name);
      if (!safeDirectory(category)) continue;
      for (const skill of entries(category)) visitSkill(category, skill, loc);
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
  if (runtime === 'all') throw new Error('Select one host for routing; use all for inventory only');
  const discovered = discoverWorkspaceSkills({ cwd, runtime, home, includeGlobal });
  const installed = discovered.filter(skill => skill.availability !== 'requires-host-trust');
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
    installedCount: installed.length, detectedCount: discovered.length,
    unavailable: discovered.filter(skill => skill.availability === 'requires-host-trust'), candidates: candidates.map(detail) };
}
