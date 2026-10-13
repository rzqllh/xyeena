import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { SKILLS_DIR } from './paths.mjs';

export function availableSkills() {
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')))
    .map(e => e.name).sort();
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
  return { components: selected, runtimes, skills };
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
    let runtimes = [], skills = [];
    if (components.includes('skills')) {
      const runtimesAvailable = ['antigravity','claude','codex'];
      output.write('\nAgent runtimes — comma-separated numbers or "all":\n');
      runtimesAvailable.forEach((v,i) => output.write('  ' + (i+1) + '. ' + v + '\n'));
      runtimes = parseChoice(await rl.question('Runtime(s): '),runtimesAvailable);
      const names = availableSkills();
      output.write('\nSkills — comma-separated numbers/names or "all":\n');
      names.forEach((v,i) => output.write('  ' + (i+1) + '. ' + v + '\n'));
      skills = parseChoice(await rl.question('Skill(s): '), names);
    }
    output.write('\nSelection: ' + components.join(' + ') + '\n');
    if (runtimes.length) output.write('Runtimes: ' + runtimes.join(', ') + '\nSkills: ' + skills.join(', ') + '\n');
    if (components.includes('harness')) output.write('Harness: project configuration and guardrails (non-destructive)\n');
    const ok = (await rl.question('\nProceed? [y/N]: ')).trim().toLowerCase();
    return ok === 'y' || ok === 'yes' ? { components, runtimes, skills } : null;
  } finally { rl.close(); }
}
