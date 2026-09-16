import os from 'node:os';
import path from 'node:path';
import { PACKAGE_ROOT, SKILLS_DIR, VERSION } from '../paths.mjs';
import { resolveSkillSelection } from './catalog.mjs';
import { AGENTS, agentTarget, normalizeAgents, ruleTarget, skillTarget } from './targets.mjs';

export function buildInstallPlan({
  cwd = process.cwd(),
  agents,
  runtime,
  skills = 'recommended',
  scope = 'project',
  mode = 'smart',
  home = os.homedir(),
} = {}) {
  if (!['project', 'global'].includes(scope)) throw new Error('scope must be project or global');
  if (!['smart', 'copy'].includes(mode)) throw new Error('mode must be smart or copy');

  const agentNames = normalizeAgents(agents || runtime || 'antigravity');
  if (!agentNames.length) throw new Error('select at least one agent');
  const selection = resolveSkillSelection(skills);
  const actions = [];
  const uniqueSkillTargets = [...new Set(agentNames.map((name) => skillTarget(name, scope, cwd, home)))];
  const storeRoot = scope === 'global'
    ? path.join(home, '.xyeena', 'store', 'skills')
    : path.join(cwd, '.xyeena', 'store', 'skills');

  for (const skillName of selection.installed) {
    const src = path.join(SKILLS_DIR, skillName);
    if (mode === 'smart') {
      const stored = path.join(storeRoot, skillName);
      actions.push({ type: 'copy-dir', src, dst: stored, role: 'store-skill', skill: skillName });
      for (const targetRoot of uniqueSkillTargets) {
        actions.push({ type: 'link-dir', src: stored, dst: path.join(targetRoot, skillName), role: 'link-skill', skill: skillName });
      }
    } else {
      for (const targetRoot of uniqueSkillTargets) {
        actions.push({ type: 'copy-dir', src, dst: path.join(targetRoot, skillName), role: 'copy-skill', skill: skillName });
      }
    }
  }

  const agentSource = path.join(PACKAGE_ROOT, 'agents');
  const uniqueAgentTargets = [...new Set(agentNames.map((name) => agentTarget(name, scope, cwd, home)).filter(Boolean))];
  for (const target of uniqueAgentTargets) {
    actions.push({ type: 'copy-dir', src: agentSource, dst: target, role: 'runtime-agents' });
  }

  for (const name of agentNames) {
    const dst = ruleTarget(name, scope, cwd);
    if (!dst) continue;
    actions.push({
      type: 'copy-file',
      src: path.join(PACKAGE_ROOT, 'rules', 'xyeena-core.md'),
      dst,
      role: 'runtime-rule',
    });
  }

  const manifestPath = scope === 'global'
    ? path.join(home, '.xyeena', 'install.json')
    : path.join(cwd, '.xyeena', 'install.json');

  return {
    version: VERSION,
    cwd,
    home,
    agents: agentNames,
    agentLabels: agentNames.map((name) => AGENTS[name].label),
    scope,
    mode,
    requestedSkills: selection.requested,
    skills: selection.installed,
    addedDependencies: selection.addedDependencies,
    skillTargets: uniqueSkillTargets,
    agentTargets: uniqueAgentTargets,
    storeRoot: mode === 'smart' ? storeRoot : null,
    manifestPath,
    actions,
  };
}
