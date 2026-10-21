import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Host layouts are independent of model providers and skill contents. */
export const SKILL_HOSTS = Object.freeze({
  antigravity: Object.freeze({ workspace: ['.agents/skills', '.agent/skills'],
    global: ['.gemini/config/skills', '.gemini/antigravity/skills'], nested: false }),
  gemini: Object.freeze({ workspace: ['.agents/skills', '.gemini/skills'],
    global: ['.agents/skills', '.gemini/skills'], nested: false }),
  codex: Object.freeze({ workspace: ['.agents/skills'], global: ['.agents/skills'], nested: false }),
  claude: Object.freeze({ workspace: ['.claude/skills'], global: ['.claude/skills'], nested: false }),
  hermes: Object.freeze({ workspace: ['.hermes/skills', '.agents/skills'],
    global: ['.hermes/skills'], nested: true })
});
export const supportedSkillHosts = () => Object.keys(SKILL_HOSTS);
export function requireSkillHost(runtime) {
  if (runtime !== 'all' && !Object.hasOwn(SKILL_HOSTS, runtime))
    throw new Error('Unknown skill runtime: ' + runtime);
  return runtime === 'all' ? supportedSkillHosts() : [runtime];
}
function readSmallFile(file, max = 65536) {
  try {
    if (fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile() || fs.statSync(file).size > max)
      return '';
    return fs.readFileSync(file, 'utf8');
  } catch { return ''; }
}
/** Reads a strict subset of YAML list scalars without executing YAML tags. */
export function hermesSkillSettings(home = os.homedir(), env = process.env) {
  const profileRoot = typeof env.HERMES_HOME === 'string' && env.HERMES_HOME.trim()
    ? path.resolve(env.HERMES_HOME) : path.join(home, '.hermes');
  const yaml = readSmallFile(path.join(profileRoot, 'config.yaml'));
  const settings = { profileRoot, createDir: null, externalDirs: [], trustedProjectDirs: [], projectDiscovery: true };
  if (!yaml) return settings;
  let inSkills = false, subsection = '';
  for (const line of yaml.split(/\r?\n/)) {
    if (/^\S[^#]*:\s*(?:#.*)?$/.test(line)) {
      inSkills = /^skills:\s*(?:#.*)?$/.test(line);
      subsection = '';
      continue;
    }
    if (!inSkills) continue;
    const entry = /^  ([\w_]+):\s*(.*)$/.exec(line);
    if (entry) {
      subsection = entry[1];
      if (subsection === 'project_discovery' && /^(false|true)\s*(?:#.*)?$/.test(entry[2]))
        settings.projectDiscovery = entry[2].startsWith('true');
      if (subsection === 'create_dir' && entry[2].trim()) {
        let dest = entry[2].trim().replace(/^(['"])(.*)\1$/, '$2');
        if (!/[!&*\r\n\0]/.test(dest)) {
          dest = dest.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m,k) => env[k] || '');
          if (dest.startsWith('~/') || dest.startsWith('~\\')) dest = path.join(home, dest.slice(2));
          settings.createDir = path.resolve(profileRoot, dest);
        }
      }
      continue;
    }
    const item = /^    - (.+?)\s*$/.exec(line);
    if (!item || !['external_dirs','trusted_project_dirs'].includes(subsection)) continue;
    let value = item[1].replace(/^(['"])(.*)\1$/, '$2').trim();
    if (!value || value.includes('\0') || value.startsWith('!') || value.startsWith('&') || value.startsWith('*')) continue;
    // Expand variable placeholders, never execute shell commands or YAML directives.
    value = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, k) => env[k] || '');
    if (value.startsWith('~/') || value.startsWith('~\\')) value = path.join(home, value.slice(2));
    const absolute = path.resolve(profileRoot, value);
    (subsection === 'external_dirs' ? settings.externalDirs : settings.trustedProjectDirs).push(absolute);
  }
  return settings;
}
export function nearestGitRoot(cwd) {
  let dir = fs.realpathSync(path.resolve(cwd));
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
/** Ordered folders only; host trust and permission remain separate concerns. */
export function skillLocations({ cwd = process.cwd(), runtime = 'antigravity',
  home = os.homedir(), includeGlobal = true, env = process.env } = {}) {
  const targets = requireSkillHost(runtime);
  const workspace = fs.realpathSync(path.resolve(cwd));
  const locations = [];
  for (const host of targets) {
    const spec = SKILL_HOSTS[host];
    const hermes = host === 'hermes' ? hermesSkillSettings(home, env) : null;
    const gitRoot = host === 'hermes' ? nearestGitRoot(workspace) : workspace;
    if (host !== 'hermes' || (hermes.projectDiscovery && gitRoot)) {
      for (const relative of spec.workspace) {
        locations.push({ base: gitRoot, relative, runtime: host, scope: 'workspace',
          nested: spec.nested, requiresTrust: host === 'hermes' &&
            !hermes.trustedProjectDirs.some(dir => {
              try { return fs.realpathSync(dir) === gitRoot; } catch { return false; }
            }) });
      }
    }
    if (!includeGlobal) continue;
    if (host !== 'hermes') {
      for (const relative of spec.global)
        locations.push({ base: home, relative, runtime: host, scope: 'global',
          nested: spec.nested, requiresTrust: false });
    }
    if (host === 'hermes') {
      locations.push({ base: hermes.profileRoot, relative: 'skills', runtime: host,
        scope: 'global', nested: true, requiresTrust: false });
      if (hermes.createDir)
        locations.push({ base: hermes.createDir, relative: '', runtime: host,
          scope: 'create-dir', nested: true, requiresTrust: false });
      for (const external of hermes.externalDirs.slice(0, 32))
        locations.push({ base: external, relative: '', runtime: host, scope: 'external',
          nested: true, requiresTrust: false });
    }
  }
  return locations;
}
