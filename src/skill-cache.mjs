import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { skillLocations } from './skill-hosts.mjs';
import { discoverWorkspaceSkills } from './workspace-skills.mjs';

const stamp = file => {
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) return 'symlink';
    return [stat.isDirectory() ? 'dir' : stat.isFile() ? 'file' : 'other',
      stat.size, stat.mtimeMs, stat.ctimeMs].join(':');
  } catch { return 'missing'; }
};
const children = directory => {
  try {
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter(x => x.isDirectory() && !x.isSymbolicLink() && !x.name.startsWith('.'))
      .map(x => x.name).sort().slice(0, 256);
  } catch { return []; }
};
/**
 * Stateless filesystem fingerprint. Includes root/category directory timestamps,
 * SKILL.md timestamps and Hermes active profile config; never reads skill bodies.
 */
export function inventoryFingerprint(options = {}) {
  const root = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  const env = options.env || process.env;
  const locations = skillLocations({ ...options, cwd: root, home, env });
  const parts = [options.runtime || 'antigravity', root, home, String(options.includeGlobal !== false)];
  for (const loc of locations) {
    const directory = loc.relative ? path.join(loc.base,loc.relative) : loc.base;
    parts.push(loc.runtime, loc.scope, String(loc.requiresTrust), directory, stamp(directory));
    for (const name of children(directory)) {
      const skill = path.join(directory,name);
      parts.push(name, stamp(skill), stamp(path.join(skill,'SKILL.md')));
      if (loc.nested) for (const sub of children(skill))
        parts.push(sub, stamp(path.join(skill,sub)), stamp(path.join(skill,sub,'SKILL.md')));
    }
  }
  if (locations.some(loc => loc.runtime === 'hermes')) {
    const profile = env.HERMES_HOME ? path.resolve(env.HERMES_HOME) : path.join(home,'.hermes');
    parts.push(profile,stamp(path.join(profile,'config.yaml')));
  }
  return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
}

/** In-process metadata cache; no files or background watchers, with automatic invalidation. */
export class SkillInventoryCache {
  constructor({ maxEntries = 16 } = {}) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 128)
      throw new Error('Invalid cache size');
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }
  get(options = {}) {
    const root = path.resolve(options.cwd || process.cwd());
    const home = path.resolve(options.home || os.homedir());
    const key = JSON.stringify([root, options.runtime || 'antigravity',home,options.includeGlobal !== false,
      options.env?.HERMES_HOME || process.env.HERMES_HOME || null]);
    const fingerprint = inventoryFingerprint(options);
    const existing = this.entries.get(key);
    if (existing?.fingerprint === fingerprint) return structuredClone(existing.value);
    const value = discoverWorkspaceSkills(options);
    this.entries.delete(key);
    this.entries.set(key,{fingerprint,value:structuredClone(value)});
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
    return structuredClone(value);
  }
  invalidate() { this.entries.clear(); }
}
