import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT, SKILLS_DIR, VERSION } from './paths.mjs';
import { copyDir, ensureDir, writeJson } from './util.mjs';
import { RUNTIMES, runtimeDescriptor, runtimeTargets } from './runtime.mjs';

export function install({ cwd = process.cwd(), runtime = 'all', force = false, dryRun = false } = {}) {
  const runtimes = runtime === 'all'
    ? Object.keys(RUNTIMES)
    : String(runtime).split(',').map((s) => s.trim()).filter(Boolean);
  for (const r of runtimes) runtimeDescriptor(r);

  const targets = runtimeTargets(cwd, runtimes);
  const actions = [];
  for (const { target } of targets) {
    for (const ent of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      actions.push(...copyDir(path.join(SKILLS_DIR, ent.name), path.join(target, ent.name), { force, dryRun }));
    }
  }

  // Install native project-agent definitions where the runtime has a documented project agent directory.
  const agentSource = path.join(PACKAGE_ROOT, 'agents');
  const agentTargets = new Map();
  for (const runtimeName of runtimes) {
    const descriptor = runtimeDescriptor(runtimeName);
    if (!descriptor.agentDir) continue;
    const target = path.join(cwd, descriptor.agentDir);
    if (!agentTargets.has(target)) agentTargets.set(target, []);
    agentTargets.get(target).push(runtimeName);
  }
  for (const [target] of agentTargets) {
    actions.push(...copyDir(agentSource, target, { force, dryRun }));
  }

  if (runtimes.includes('antigravity')) {
    const ruleDst = path.join(cwd, '.agents', 'rules', 'xyeena-core.md');
    if (!dryRun) {
      ensureDir(path.dirname(ruleDst));
      const src = path.join(PACKAGE_ROOT, 'rules', 'xyeena-core.md');
      if (fs.existsSync(ruleDst) && !force && fs.readFileSync(ruleDst, 'utf8') !== fs.readFileSync(src, 'utf8')) {
        throw new Error(`refusing to overwrite ${ruleDst}; use --force`);
      }
      fs.copyFileSync(src, ruleDst);
    }
    actions.push(ruleDst);
  }

  const manifest = {
    version: VERSION,
    runtimes,
    installed_at: new Date().toISOString(),
    skill_targets: targets.map(({ target, runtimes: owners }) => ({
      path: path.relative(cwd, target) || '.',
      runtimes: owners,
    })),
    agent_targets: [...agentTargets.entries()].map(([target, owners]) => ({
      path: path.relative(cwd, target) || '.',
      runtimes: owners,
    })),
  };
  if (!dryRun) writeJson(path.join(cwd, '.xyeena', 'install.json'), manifest);
  return { runtimes, actions, manifest, dryRun };
}
