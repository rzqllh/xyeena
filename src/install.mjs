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


// Explicit, non-destructive installer used by the new CLI. The original install()
// remains available for existing library callers until the next major release.
export function installSelective({
  cwd = process.cwd(), components = [], runtimes = [], skills = [], guards = [], force = false, dryRun = false
} = {}) {
  cwd = path.resolve(cwd);
  if (!Array.isArray(components) || !components.length ||
      components.some(c => !['skills','harness'].includes(c))) {
    throw new Error('Choose skills, harness, or all explicitly.');
  }
  const selected = new Set();
  const available = new Set(fs.readdirSync(SKILLS_DIR,{withFileTypes:true})
    .filter(x=>x.isDirectory() && fs.existsSync(path.join(SKILLS_DIR,x.name,'SKILL.md')))
    .map(x=>x.name));
  const visit = name => {
    if (!available.has(name)) throw new Error('Unknown skill: ' + name);
    if (selected.has(name)) return;
    selected.add(name);
    const meta=path.join(SKILLS_DIR,name,'capability.json');
    if (fs.existsSync(meta)) {
      const deps=JSON.parse(fs.readFileSync(meta,'utf8')).dependencies?.required || [];
      for(const d of deps) visit(d);
    }
  };
  if (components.includes('skills')) {
    if (!runtimes.length || !skills.length) throw new Error('Choose at least one runtime and skill.');
    for (const name of runtimes) runtimeDescriptor(name);
    for (const name of skills) visit(name);
  }
  const targets = components.includes('skills') ? runtimeTargets(cwd,runtimes) : [];
  const steps=[];
  const addDir=(src,dst)=>{ // Dry-run preflight checks every selected path before writing.
    steps.push({src,dst,kind:'dir'});
    return copyDir(src,dst,{force,dryRun:true});
  };
  const addFile=(src,dst)=>{
    if (fs.existsSync(dst) && !force &&
        !fs.readFileSync(src).equals(fs.readFileSync(dst))) {
      throw new Error('Refusing to overwrite modified file: ' + dst + ' (use --force)');
    }
    steps.push({src,dst,kind:'file'});
    return fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst)) ? [] : [dst];
  };
  const actions=[];
  for (const {target} of targets) {
    for (const name of selected) {
      actions.push(...addDir(path.join(SKILLS_DIR,name),path.join(target,name)));
    }
  }
  // Native role definitions are only installed when the orchestration capability is selected.
  if (selected.has('xyeena-orchestrate')) {
    for (const agentDir of new Set(runtimes.map(r=>runtimeDescriptor(r).agentDir).filter(Boolean))) {
      actions.push(...addDir(path.join(PACKAGE_ROOT,'agents'),path.join(cwd,agentDir)));
    }
  }
  if (selected.has('xyeena-core') && runtimes.includes('antigravity')) {
    actions.push(...addFile(path.join(PACKAGE_ROOT,'rules','xyeena-core.md'),
      path.join(cwd,'.agents','rules','xyeena-core.md')));
  }
  if (components.includes('harness')) {
    // Harness is explicit: no hook installation, no automatic commands, no changes to AGENTS.md.
    const cfg=path.join(cwd,'.xyeena','config.json');
    const src=path.join(PACKAGE_ROOT,'harness','default-config.json');
    actions.push(...addFile(src,cfg));
    actions.push(...addFile(path.join(PACKAGE_ROOT,'harness','project-profile.template.md'),
      path.join(cwd,'.xyeena','profile.md')));
    if(!Array.isArray(guards)||!guards.length) throw new Error('Choose Harness guardrail group(s) or all explicitly.');
    const groups=new Set(fs.readdirSync(path.join(PACKAGE_ROOT,'harness','guides'),{withFileTypes:true})
      .filter(x=>x.isDirectory()).map(x=>x.name));
    for(const group of guards) {
      if(!groups.has(group)) throw new Error('Unknown Harness guardrail group: '+group);
      actions.push(...addDir(path.join(PACKAGE_ROOT,'harness','guides',group),
        path.join(cwd,'.xyeena','harness','guides',group)));
    }
  }
  const manifestPath=path.join(cwd,'.xyeena','install.json');
  const prior=fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath,'utf8')) : {};
  const manifest={
    version:VERSION,
    components:[...new Set([...(prior.components||[]),...components])],
    runtimes:[...new Set([...(prior.runtimes||[]),...runtimes])],
    skills:[...new Set([...(prior.skills||[]),...selected])].sort(),
    guards:[...new Set([...(prior.guards||[]),...guards])].sort(),
    installed_at:new Date().toISOString(),
    skill_targets: targets.map(x=>({path:path.relative(cwd,x.target),runtimes:x.runtimes})),
    agent_targets: prior.agent_targets||[]
  };
  if (!dryRun) {
    for(const s of steps) {
      if(s.kind==='dir') copyDir(s.src,s.dst,{force,dryRun:false});
      else {
        if (fs.existsSync(s.dst) && fs.readFileSync(s.src).equals(fs.readFileSync(s.dst))) continue;
        ensureDir(path.dirname(s.dst)); fs.copyFileSync(s.src,s.dst);
      }
    }
    writeJson(manifestPath,manifest);
  }
  return { components,runtimes,guards,skills:[...selected].sort(),
    autoDependencies:[...selected].filter(x=>!skills.includes(x)),
    actions,manifest,dryRun };
}
