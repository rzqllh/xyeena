import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { SKILLS_DIR, PACKAGE_ROOT } from './paths.mjs';

export function availableSkills() {
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')))
    .map(e => e.name).sort();
}


/** Resolve mandatory skill dependencies for preview and installation. */
export function skillDependencyClosure(requested) {
  const available = new Set(availableSkills());
  const selected = new Set();
  const visiting = new Set();
  const visit = name => {
    if (!available.has(name)) throw new Error('Unknown skill: ' + name);
    if (visiting.has(name)) throw new Error('Cyclic skill dependency: ' + name);
    if (selected.has(name)) return;
    visiting.add(name);
    const contract = path.join(SKILLS_DIR, name, 'capability.json');
    if (fs.existsSync(contract)) {
      const dependencies = JSON.parse(fs.readFileSync(contract,'utf8')).dependencies?.required || [];
      for (const dependency of dependencies) visit(dependency);
    }
    visiting.delete(name);
    selected.add(name);
  };
  for (const skill of requested) visit(skill);
  return [...selected];
}

export function skillDescription(name) {
  const contract=path.join(SKILLS_DIR,name,'capability.json');
  try {
    const meta=JSON.parse(fs.readFileSync(contract,'utf8')).metadata;
    return String(meta?.description||'').replace(/\s+/g,' ').trim();
  } catch { return ''; }
}

export function guardrailDescription(name) {
  const labels = {
    '00-core':'Core process and evidence rules',
    '10-profile':'Project-specific context',
    '20-product':'Product hierarchy and invariants',
    '30-design':'UI, UX, accessibility and motion',
    '40-engineering':'Architecture and runtime contracts',
    '50-quality':'Verification, tests and review',
    '60-security':'Security, privacy and authorization',
    '70-performance':'Responsiveness and resource budgets',
    '80-operations':'Git, deployments and rollback',
    '90-hygiene':'Repository and documentation hygiene',
    '95-agent-safety':'Tool use and external-content safety'
  };
  return labels[name]||name;
}

export function availableHarnessGroups() {
  return fs.readdirSync(path.join(PACKAGE_ROOT,'harness','guides'), {withFileTypes:true})
    .filter(x=>x.isDirectory()).map(x=>x.name).sort();
}

export function parseChoice(raw, options, { allowAll = true } = {}) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) throw new Error('Select at least one option; nothing was installed.');
  if (allowAll && (value === 'all' || value === '*')) return [...options];
  const result = [];
  for (const entry of value.split(',').map(s => s.trim()).filter(Boolean)) {
    const selected = /^\d+$/.test(entry) ? options[Number(entry) - 1] : options.find(s => s.toLowerCase() === entry);
    if (!selected) throw new Error('Unknown selection: ' + entry);
    if (!result.includes(selected)) result.push(selected);
  }
  if (!result.length) throw new Error('No options selected.');
  return result;
}

export function explicitSelection(flags) {
  const components = flags.components || flags.component;
  if (!components) throw new Error('Non-interactive install requires --components skills|harness|all. Nothing was installed.');
  const selected = parseChoice(components, ['skills', 'harness']);
  const wantsSkills = selected.includes('skills');
  const runtimes = wantsSkills ? parseChoice(flags.runtime || '', ['antigravity', 'claude', 'codex']) : [];
  const skills = wantsSkills ? parseChoice(flags.skills || '', availableSkills()) : [];
  const guards = selected.includes('harness') ? parseChoice(flags.guards || '', availableHarnessGroups()) : [];
  return { components: selected, runtimes, skills, guards };
}

export async function interactiveSelection({ input = process.stdin, output = process.stdout } = {}) {
  if (!input.isTTY || !output.isTTY) throw new Error('Interactive setup needs a terminal. Supply --components, --runtime and --skills for CI.');
  const rl = createInterface({ input, output });
  try {
    output.write('\nXyeena Setup — choose what to install\n');
    output.write('Nothing is installed until you confirm.\n\n');
    output.write('  1. Skills\n  2. Harness\n  3. All (Skills + Harness)\n  0. Cancel\n');
    const first = (await rl.question('\nComponent [1/2/3/0]: ')).trim();
    if (first === '0' || !first) return null;
    const components = first === '1' ? ['skills'] : first === '2' ? ['harness'] : first === '3' ? ['skills','harness'] : null;
    if (!components) throw new Error('Invalid component selection. Nothing was installed.');
    let runtimes = [], skills = [], guards = [];
    if (components.includes('skills')) {
      const runtimesAvailable = ['antigravity','claude','codex'];
      output.write('\nAgent runtimes — comma-separated numbers or "all":\n');
      runtimesAvailable.forEach((v,i) => output.write('  ' + (i+1) + '. ' + v + '\n'));
      runtimes = parseChoice(await rl.question('Runtime(s): '),runtimesAvailable);
      const names = availableSkills();
      output.write('\nSkills — comma-separated numbers/names or "all":\n');
      names.forEach((v,i) => output.write('  ' + (i+1) + '. ' + v + (skillDescription(v)?' — '+skillDescription(v):'') + '\n'));
      skills = parseChoice(await rl.question('Skill(s): '), names);
    }
    if(components.includes('harness')) {
      const groups=availableHarnessGroups();
      output.write('\nHarness guardrails — comma-separated numbers or "all":\n');
      groups.forEach((v,i)=>output.write('  ' + (i+1) + '. ' + v + ' — ' + guardrailDescription(v) + '\n'));
      guards=parseChoice(await rl.question('Guardrail group(s): '),groups);
    }
    output.write('\nSelection: ' + components.join(' + ') + '\n');
    if (runtimes.length) output.write('Runtimes: ' + runtimes.join(', ') + '\nSkills: ' + skills.join(', ') + '\n');
    if (skills.length) {
      const required=skillDependencyClosure(skills).filter(name=>!skills.includes(name));
      if (required.length) output.write('Also required: ' + required.join(', ') + ' (mandatory skill dependencies)\n');
    }
    if (components.includes('harness')) output.write('Harness guardrails: '+guards.join(', ')+'\n');
    const ok = (await rl.question('\nProceed? [y/N]: ')).trim().toLowerCase();
    return ok === 'y' || ok === 'yes' ? { components, runtimes, skills, guards } : null;
  } finally { rl.close(); }
}
