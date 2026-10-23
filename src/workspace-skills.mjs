import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRegistry } from './registry.mjs';
import { resolveCapabilities } from './resolver.mjs';
import { skillLocations, pluginLocations, requireSkillHost, supportedSkillHosts } from './skill-hosts.mjs';

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
function managedSkillLink(directory, name, home) {
  const target=path.join(directory,name);
  try {
    if(!fs.lstatSync(target).isSymbolicLink())return false;
    const root=path.join(home,'.xyeena','skill-store');
    for(const part of [path.join(home,'.xyeena'),root])
      if(fs.lstatSync(part).isSymbolicLink())return false;
    const realRoot=fs.realpathSync(root),realTarget=fs.realpathSync(target);
    const relative=path.relative(realRoot,realTarget);
    if(!relative||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))return false;
    if(relative.split(path.sep).length!==2)return false; // vVERSION/skill-content-hash only
    return fs.statSync(realTarget).isDirectory() && fs.lstatSync(realTarget).isDirectory();
  }catch{return false}
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
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) || !fields.description ||
        name !== fallbackName) return null;
    const platformValue = fields.platforms;
    let platforms = null;
    if (platformValue !== undefined) {
      if (!/^\[[^\]\r\n]*\]$/.test(platformValue)) return null;
      platforms = platformValue.slice(1, -1).split(',').map(x => x.trim().replace(/^(['"])(.*)\1$/, '$2'));
      if (!platforms.length || platforms.some(x => !['windows', 'macos', 'linux'].includes(x))) return null;
    }
    let dependencies = [];
    const depValue = fields.dependencies || fields.requires;
    if (depValue !== undefined) {
      if (/^\[[^\]\r\n]*\]$/.test(depValue)) {
        dependencies = depValue.slice(1, -1).split(',').map(x => x.trim().replace(/^(['"])(.*)\1$/, '$2')).filter(Boolean);
      } else if (/^[a-z0-9][a-z0-9-]{0,63}$/.test(depValue)) {
        dependencies = [depValue];
      }
    }
    return { name, description: fields.description, platforms, dependencies };
  } catch { return null; }
}

function readPluginManifest(pluginDir) {
  for (const manifestName of ['plugin.json', 'gemini-extension.json', 'extension.json', 'package.json']) {
    const file = path.join(pluginDir, manifestName);
    try {
      if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 65536) continue;
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        const name = typeof parsed.name === 'string' && /^[a-z0-9@/._-]+$/i.test(parsed.name)
          ? parsed.name : path.basename(pluginDir);
        const version = typeof parsed.version === 'string' ? parsed.version : null;
        const description = typeof parsed.description === 'string' ? parsed.description : '';
        const enabled = parsed.disabled !== true && parsed.enabled !== false;
        return { name, version, description, enabled };
      }
    } catch { /* continue */ }
  }
  return { name: path.basename(pluginDir), version: null, description: '', enabled: true };
}

/** Discover installed Agent Skills and plugins. Only Xyeena-managed links to its immutable home store are followed. */
export function discoverWorkspaceSkills({ cwd = process.cwd(), runtime = 'antigravity',
  home = os.homedir(), includeGlobal = true, env = process.env } = {}) {
  requireSkillHost(runtime);
  const locations = skillLocations({ cwd, runtime, home, includeGlobal, env });
  const plugins = pluginLocations({ cwd, runtime, home, includeGlobal, env });
  const found = new Map(), seenPaths = new Set(), shadowed = [];

  const visitSkill = (dir, entry, loc) => {
    if (entry.name.startsWith('.')) return false;
    const isDir = entry.isDirectory();
    const isSymlink = entry.isSymbolicLink();
    const isManaged = isSymlink && managedSkillLink(dir, entry.name, home);
    if (!isDir && !isSymlink) return false;

    const skillPath = path.join(dir, entry.name, 'SKILL.md');
    if (isSymlink && !isManaged) {
      const metadata = readMetadata(skillPath, entry.name) || { name: entry.name, description: 'Blocked unmanaged symlink skill' };
      const blockedRecord = {
        name: metadata.name,
        description: metadata.description,
        platforms: metadata.platforms || null,
        dependencies: metadata.dependencies || [],
        missingDependencies: [],
        path: skillPath,
        canonicalPath: skillPath,
        runtime: loc.runtime,
        scope: loc.scope,
        source: loc.pluginName ? 'plugin' : loc.scope,
        pluginName: loc.pluginName || null,
        pluginVersion: loc.pluginVersion || null,
        installed: true,
        enabled: loc.pluginEnabled !== false,
        trusted: false,
        eligible: false,
        executable: false,
        availability: 'blocked-symlink',
        rank: (loc.scope === 'workspace' ? 1 : 3) + (loc.pluginName ? 1 : 0),
        provenance: {
          root: loc.base,
          relative: loc.relative || '',
          type: loc.pluginName ? 'plugin' : 'standalone',
          pluginName: loc.pluginName || null,
          scope: loc.scope
        }
      };
      if (!found.has(metadata.name)) found.set(metadata.name, blockedRecord);
      else shadowed.push({ ...blockedRecord, availability: 'collision-shadowed' });
      return true;
    }

    const metadata = readMetadata(skillPath, entry.name);
    if (!metadata) return false;
    let canonical;
    try { canonical = fs.realpathSync(skillPath); } catch { return false; }
    if (seenPaths.has(canonical)) return true;
    seenPaths.add(canonical);

    const osName = process.platform === 'win32' ? 'windows' :
      process.platform === 'darwin' ? 'macos' : 'linux';
    const isPlatform = !metadata.platforms || metadata.platforms.includes(osName);
    const isTrusted = !loc.requiresTrust;
    const isEnabled = loc.pluginEnabled !== false;
    const availability = !isEnabled ? 'disabled' :
      !isTrusted ? 'requires-host-trust' :
      !isPlatform ? 'incompatible-platform' : 'detected';
    const eligible = availability === 'detected';
    const currentRank = (loc.scope === 'workspace' ? 1 : 3) + (loc.pluginName ? 1 : 0);

    const record = {
      name: metadata.name,
      description: metadata.description,
      platforms: metadata.platforms,
      dependencies: metadata.dependencies || [],
      missingDependencies: [],
      path: skillPath,
      canonicalPath: canonical,
      runtime: loc.runtime,
      scope: loc.scope,
      source: loc.pluginName ? 'plugin' : loc.scope,
      pluginName: loc.pluginName || null,
      pluginVersion: loc.pluginVersion || null,
      installed: true,
      enabled: isEnabled,
      trusted: isTrusted,
      eligible,
      executable: eligible,
      availability,
      rank: currentRank,
      provenance: {
        root: loc.base,
        relative: loc.relative || '',
        type: loc.pluginName ? 'plugin' : 'standalone',
        pluginName: loc.pluginName || null,
        scope: loc.scope
      }
    };

    const previous = found.get(metadata.name);
    if (!previous) {
      found.set(metadata.name, record);
    } else {
      const prevEligible = previous.availability === 'detected';
      const currEligible = availability === 'detected';
      if (!prevEligible && currEligible) {
        shadowed.push({ ...previous, availability: 'collision-shadowed', shadowedBy: record.path });
        found.set(metadata.name, record);
      } else if (prevEligible && !currEligible) {
        shadowed.push({ ...record, availability: 'collision-shadowed', shadowedBy: previous.path });
      } else if (currentRank < previous.rank) {
        shadowed.push({ ...previous, availability: 'collision-shadowed', shadowedBy: record.path });
        found.set(metadata.name, record);
      } else {
        shadowed.push({ ...record, availability: 'collision-shadowed', shadowedBy: previous.path });
      }
    }
    return true;
  };

  const entries = dir => {
    try { return fs.readdirSync(dir, { withFileTypes: true })
      .filter(x => (x.isDirectory() || x.isSymbolicLink()) && !x.name.startsWith('.'))
      .sort((a,b) => a.name.localeCompare(b.name)).slice(0, 256); }
    catch { return []; }
  };

  // 1. Standalone skills
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

  // 2. Host-native plugins
  for (const loc of plugins) {
    if (!safeDirectory(loc.base) || (loc.relative && !safeTree(loc.base, loc.relative))) continue;
    const dir = loc.relative ? path.join(loc.base, loc.relative) : loc.base;
    if (!safeDirectory(dir)) continue;
    for (const entry of entries(dir)) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const pluginDir = path.join(dir, entry.name);
      if (!safeDirectory(pluginDir)) continue;
      const manifest = readPluginManifest(pluginDir);
      const pluginLoc = { ...loc, pluginName: manifest.name, pluginVersion: manifest.version,
        pluginEnabled: manifest.enabled };
      // Check skills/ subfolder
      const skillsDir = path.join(pluginDir, 'skills');
      if (safeDirectory(skillsDir)) {
        for (const skillEntry of entries(skillsDir)) {
          visitSkill(skillsDir, skillEntry, pluginLoc);
        }
      }
      // Check direct SKILL.md in plugin root
      if (fs.existsSync(path.join(pluginDir, 'SKILL.md'))) {
        visitSkill(dir, entry, pluginLoc);
      }
    }
  }

  // 3. Resolve dependency closure
  const detectedSkillNames = new Set([...found.values()].filter(s => s.availability === 'detected').map(s => s.name));
  for (const skill of found.values()) {
    if (skill.dependencies && skill.dependencies.length > 0) {
      const missing = skill.dependencies.filter(dep => !detectedSkillNames.has(dep));
      if (missing.length > 0) {
        skill.missingDependencies = missing;
        skill.executable = false;
        skill.eligible = false;
        if (skill.availability === 'detected') skill.availability = 'missing-dependency';
      }
    }
  }

  const result = [...found.values()];
  result.shadowed = shadowed;
  return result;
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
  home = os.homedir(), includeGlobal = true, env = process.env } = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('A non-empty prompt is required');
  if (!Number.isInteger(maxSupporting) || maxSupporting < 0 || maxSupporting > 8) throw new Error('Invalid supporting-skill budget');
  if (runtime === 'all') throw new Error('Select one host for routing; use all for inventory only');
  const discovered = discoverWorkspaceSkills({ cwd, runtime, home, includeGlobal, env });
  const installed = discovered.filter(skill => skill.availability === 'detected' && skill.executable !== false);
  const installedByName = new Map(installed.map(skill => [skill.name, skill]));
  const allBuiltinCaps = loadRegistry();
  const allBuiltinNames = new Set(allBuiltinCaps.map(cap => cap.metadata.name));
  const builtins = allBuiltinCaps.filter(cap => installedByName.has(cap.metadata.name) &&
    (!(cap.activation?.states?.length) || cap.activation.states.includes(state)));
  const builtinNames = new Set(builtins.map(cap => cap.metadata.name));
  const routed = resolveCapabilities(builtins, { prompt, state, paths, maxSupporting });
  const candidates = [...routed.candidates, ...installed.filter(skill => !allBuiltinNames.has(skill.name))
    .map(skill => externalScore(skill, prompt)).filter(Boolean)]
    .sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
  const primary = candidates[0] || null;
  const primaryContract = builtins.find(cap => cap.metadata.name === primary?.name);
  const primarySkill = primary ? installedByName.get(primary.name) : null;
  const primaryDeps = new Set(primarySkill?.dependencies || []);
  const allowed = new Set([...(primaryContract?.chain?.allowed || []), ...primaryDeps]);
  const supporting = primary ? candidates.slice(1).filter(item => allowed.has(item.name) || item.score >= 30)
    .slice(0, maxSupporting) : [];
  const detail = value => value ? { ...value, path: installedByName.get(value.name).path,
    runtime: installedByName.get(value.name).runtime, scope: installedByName.get(value.name).scope,
    source: builtinNames.has(value.name) ? 'xyeena' : (installedByName.get(value.name).source || 'external') } : null;
  return { mode: 'preview-only', executed: false, runtime, kernel: installedByName.has('xyeena-core') ? 'xyeena-core' : null,
    primary: detail(primary), supporting: supporting.map(detail),
    installedCount: installed.length, detectedCount: discovered.length,
    unavailable: discovered.filter(skill => skill.availability !== 'detected' || skill.executable === false), candidates: candidates.map(detail) };
}


/** Per-host inventory avoids falsely assuming that a skill in one AI host exists in another. */
export function skillAvailabilityMatrix(options = {}) {
  const hosts = {};
  for (const runtime of supportedSkillHosts()) {
    const skills = discoverWorkspaceSkills({ ...options, runtime });
    hosts[runtime] = { detected: skills.length,
      requiresTrust: skills.filter(skill => skill.availability === 'requires-host-trust').length,
      skills: skills.map(skill => ({ name: skill.name, scope: skill.scope, path: skill.path,
        availability: skill.availability })) };
  }
  return { mode: 'inventory-only', executed: false, hosts };
}
