import path from 'node:path';
import { writeJson } from './util.mjs';
import { buildInstallPlan } from './install/planner.mjs';
import { executeActions } from './install/linker.mjs';

export function install({
  cwd = process.cwd(),
  agents,
  agent,
  runtime,
  skills,
  skill,
  scope = 'project',
  mode = 'smart',
  force = false,
  dryRun = false,
  home,
} = {}) {
  const selectedAgents = agents || agent || runtime || 'antigravity';
  const selectedSkills = skills || skill || (runtime === 'all' ? 'all' : 'recommended');
  const plan = buildInstallPlan({
    cwd,
    agents: selectedAgents,
    skills: selectedSkills,
    scope,
    mode,
    home,
  });

  const touched = executeActions(plan.actions, { force, dryRun });
  const manifest = {
    version: plan.version,
    agents: plan.agents,
    runtimes: plan.agents,
    scope: plan.scope,
    mode: plan.mode,
    requested_skills: plan.requestedSkills,
    skills: plan.skills,
    added_dependencies: plan.addedDependencies,
    installed_at: new Date().toISOString(),
    skill_targets: plan.skillTargets.map((target) => plan.scope === 'project' ? path.relative(cwd, target) || '.' : target),
    agent_targets: plan.agentTargets.map((target) => plan.scope === 'project' ? path.relative(cwd, target) || '.' : target),
    store: plan.storeRoot ? (plan.scope === 'project' ? path.relative(cwd, plan.storeRoot) || '.' : plan.storeRoot) : null,
  };
  if (!dryRun) writeJson(plan.manifestPath, manifest);

  return {
    agents: plan.agents,
    runtimes: plan.agents,
    skills: plan.skills,
    actions: touched,
    manifest,
    plan,
    dryRun,
  };
}

export { buildInstallPlan } from './install/planner.mjs';
export { executeActions } from './install/linker.mjs';
