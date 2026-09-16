import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { skillCatalog } from './catalog.mjs';
import { AGENTS } from './targets.mjs';

function parseMulti(answer, size) {
  const value = String(answer || '').trim().toLowerCase();
  if (!value) return [];
  if (value === 'all' || value === '*') return Array.from({ length: size }, (_, i) => i);
  const out = [];
  for (const token of value.split(',').map((v) => v.trim()).filter(Boolean)) {
    const n = Number(token);
    if (!Number.isInteger(n) || n < 1 || n > size) throw new Error(`invalid selection ${token}`);
    if (!out.includes(n - 1)) out.push(n - 1);
  }
  return out;
}

async function chooseOne(rl, title, choices, defaultIndex = 0) {
  console.log(`\n${title}`);
  choices.forEach((choice, i) => console.log(`  ${i + 1}. ${choice}`));
  while (true) {
    const answer = await rl.question(`Choose [${defaultIndex + 1}]: `);
    const index = answer.trim() ? Number(answer) - 1 : defaultIndex;
    if (Number.isInteger(index) && index >= 0 && index < choices.length) return index;
    console.log('Invalid selection.');
  }
}

async function chooseMany(rl, title, choices) {
  console.log(`\n${title}`);
  choices.forEach((choice, i) => console.log(`  ${i + 1}. ${choice}`));
  console.log('Enter comma-separated numbers, or "all".');
  while (true) {
    try {
      const answer = await rl.question('Select: ');
      const indexes = parseMulti(answer, choices.length);
      if (indexes.length) return indexes;
      console.log('Select at least one.');
    } catch (error) {
      console.log(error.message);
    }
  }
}

export async function promptInstallOptions() {
  if (!input.isTTY || !output.isTTY) {
    throw new Error('interactive install requires a TTY; use --agent and --skill flags for non-interactive installs');
  }
  const rl = readline.createInterface({ input, output });
  try {
    console.log('\nXyeena installer');

    const skillMode = await chooseOne(rl, 'Skills', [
      'Recommended',
      'All skills',
      'Choose individually',
    ], 0);

    let skills = 'recommended';
    if (skillMode === 1) skills = 'all';
    if (skillMode === 2) {
      const catalog = skillCatalog();
      const picked = await chooseMany(rl, 'Choose skills', catalog.map((s) => s.name));
      skills = picked.map((i) => catalog[i].name);
    }

    const agentEntries = Object.values(AGENTS);
    const pickedAgents = await chooseMany(rl, 'Target agents', agentEntries.map((a) => a.label));
    const agents = pickedAgents.map((i) => agentEntries[i].id);

    const scopeIndex = await chooseOne(rl, 'Installation scope', ['Project', 'Global'], 0);
    const modeIndex = await chooseOne(rl, 'Installation method', [
      'Smart links (recommended)',
      'Copy files',
    ], 0);

    return {
      skills,
      agents,
      scope: scopeIndex === 0 ? 'project' : 'global',
      mode: modeIndex === 0 ? 'smart' : 'copy',
    };
  } finally {
    rl.close();
  }
}

export function printInstallPlan(plan) {
  console.log('\nInstallation plan');
  console.log(`  Agents : ${plan.agentLabels.join(', ')}`);
  console.log(`  Scope  : ${plan.scope}`);
  console.log(`  Method : ${plan.mode === 'smart' ? 'smart links' : 'copy'}`);
  console.log(`  Skills : ${plan.skills.length}`);
  if (plan.addedDependencies.length) console.log(`  Added dependencies: ${plan.addedDependencies.join(', ')}`);
  if (plan.storeRoot) console.log(`  Store  : ${plan.storeRoot}`);
  for (const target of plan.skillTargets) console.log(`  Target : ${target}`);
}

export async function confirmInstall(plan) {
  if (!input.isTTY || !output.isTTY) return false;
  const rl = readline.createInterface({ input, output });
  try {
    printInstallPlan(plan);
    const answer = await rl.question('\nProceed? [y/N] ');
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}
