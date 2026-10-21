import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { availableSkills, parseChoice, selectSkillRuntimes } from './selection.mjs';
import { installSelective } from './install.mjs';
import { discoverWorkspaceSkills } from './workspace-skills.mjs';

const HOSTS = Object.freeze([
  { id: 'hermes', label: 'Hermes / Xyn (local or Telegram gateway)', folder: '.hermes/skills' },
  { id: 'gemini', label: 'Gemini CLI', folder: '.gemini/skills' },
  { id: 'antigravity', label: 'Google Antigravity IDE', folder: '.agents/skills' },
  { id: 'codex', label: 'OpenAI Codex', folder: '.agents/skills' },
  { id: 'claude', label: 'Claude Code', folder: '.claude/skills' },
]);
const PRESETS = Object.freeze({
  essential: ['xyeena-orchestrate'],
  balanced: ['xyeena-orchestrate', 'xyeena-debug', 'xyeena-plan', 'xyeena-review', 'xyeena-test', 'xyeena-verify'],
});
const GUARDS = Object.freeze({
  none: [],
  essential: ['00-core', '50-quality', '60-security'],
});
const HAS_OWN = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function safeRoot(cwd) {
  const root = fs.realpathSync(path.resolve(cwd));
  if (!fs.statSync(root).isDirectory()) throw new Error('Project directory does not exist');
  return root;
}
export function setupRuntimeHints(cwd) {
  const root = safeRoot(cwd);
  const hints = [];
  for (const host of HOSTS) {
    const candidate = path.join(root, host.folder === '.agents/skills' ? '.agents' : path.dirname(host.folder));
    try {
      if (fs.lstatSync(candidate).isDirectory() && !fs.lstatSync(candidate).isSymbolicLink())
        hints.push(host.id);
    } catch { /* runtime not detected */ }
  }
  // .agents/ is shared by Antigravity and Codex, so these are hints, not proof.
  return [...new Set(hints)];
}
export function setupSelection({ runtime, preset = 'essential', harness = 'none' } = {}) {
  if (typeof runtime !== 'string' || !runtime.trim())
    throw new Error('Choose the AI runtime(s) explicitly with --runtime or use interactive setup.');
  const runtimes = selectSkillRuntimes(runtime);
  if (!['essential','balanced','complete'].includes(preset))
    throw new Error('Unknown setup preset: use essential, balanced or complete');
  if (!['none','essential','full'].includes(harness))
    throw new Error('Unknown harness option: use none, essential or full');
  const inventory = availableSkills();
  const skills = preset === 'complete' ? inventory : PRESETS[preset].filter(name => inventory.includes(name));
  if (preset !== 'complete' && skills.length !== PRESETS[preset].length)
    throw new Error('Setup preset is missing packaged skills; package may be incomplete');
  const guards = harness === 'full' ? fs.readdirSync(new URL('../harness/guides/', import.meta.url),
    { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort() : GUARDS[harness];
  return {
    components: guards.length ? ['skills', 'harness'] : ['skills'],
    runtimes, skills, guards, preset, harness
  };
}

/** Inspect all conflicts and exact paths before *any* installation. No writes. */
export function previewSetup({ cwd = process.cwd(), runtime, preset = 'essential',
  harness = 'none' } = {}) {
  const root = safeRoot(cwd);
  const choice = setupSelection({ runtime, preset, harness });
  const result = installSelective({cwd:root, ...choice, dryRun:true, force:false});
  const paths = result.actions.map(action => path.relative(root, action).split(path.sep).join('/'));
  return {
    kind: 'xyeena-setup', version: 1, cwd: root, ...choice, dryRun:true,
    autoDependencies: result.autoDependencies, filesToWrite: paths.length,
    previewPaths: paths.slice(0, 12),
    remainingPaths: Math.max(0, paths.length - 12),
    noGlobalEdits: true, noProviderCalls: true, noHostAuthChanges: true,
    next: 'Review the preview, then approve setup. No existing customized files are overwritten.'
  };
}

export function applySetup({ cwd = process.cwd(), runtime, preset = 'essential',
  harness = 'none', yes = false } = {}) {
  if (yes !== true) throw new Error('Setup installation requires explicit --yes or interactive confirmation');
  const preview = previewSetup({cwd,runtime,preset,harness});
  const result = installSelective({cwd:preview.cwd, components:preview.components,
    runtimes:preview.runtimes, skills:preview.skills, guards:preview.guards,
    dryRun:false, force:false});
  const diagnostics = preview.runtimes.map(host => {
    const items = discoverWorkspaceSkills({cwd:preview.cwd,runtime:host,includeGlobal:false});
    const orchestrator = items.find(item => item.name === 'xyeena-orchestrate');
    return { host, installed: !!orchestrator,
      availability: orchestrator?.availability || 'not-found',
      note: host === 'hermes'
        ? 'Project-local Hermes skills may require trusting the Git workspace inside Hermes before activation.'
        : 'Restart or reload the corresponding AI host to discover newly installed skills.' };
  });
  return {installed:true, filesWritten:result.actions.length,
    cwd:preview.cwd, runtimes:preview.runtimes, skills:result.skills,
    guards:result.guards, autoDependencies:result.autoDependencies, diagnostics,
    providerAuthenticationConfigured:false, modelCallsMade:0};
}

function explain(output, message) { output.write(message + '\n'); }
function chosenHosts(answer) {
  const normalized = String(answer).trim().toLowerCase();
  if (!normalized) throw new Error('Choose at least one host; nothing was installed');
  const selected = parseChoice(normalized, HOSTS.map(x => x.id), {allowAll:false});
  return selected.join(',');
}
const yesAnswer = a => /^(y|yes|ya|iya)$/i.test(String(a).trim());

/** Injectable ask() makes the genuine conversational flow testable offline. */
export async function guidedSetup({ cwd = process.cwd(), ask, output = process.stdout } = {}) {
  if (typeof ask !== 'function') throw new Error('Guided setup requires an interactive terminal');
  const root = safeRoot(cwd);
  explain(output, '\nXYEENA RIG — First-time setup (no account login or API key needed)');
  explain(output, 'Project: ' + root);
  explain(output, 'This only copies the skills you select into THIS project.');
  explain(output, 'It will not modify your AI app, passwords, global folders, Git hooks or root AGENTS.md.');
  const hints = setupRuntimeHints(root);
  explain(output, '\nSTEP 1/4: Which AI tools will use Xyeena?');
  for (let i = 0; i < HOSTS.length; i++) {
    const h = HOSTS[i];
    explain(output, '  ' + (i+1) + '. ' + h.label +
      (hints.includes(h.id) ? '  [folder detected; confirm yourself]' : ''));
  }
  explain(output, 'You can select multiple, e.g. 1,2. Antigravity and Codex share .agents/skills.');
  const chosen = chosenHosts(await ask('AI tool number(s), e.g. 1,2: '));
  explain(output, '\nSTEP 2/4: Which skills should be installed?');
  explain(output, '  1. Essential — orchestrator + mandatory dependencies (smallest footprint)');
  explain(output, '  2. Balanced — orchestrator, planning, debugging, review, tests and verification');
  explain(output, '  3. Complete — all packaged skills (more files, not automatic model usage)');
  const preset = ({'1':'essential','2':'balanced','3':'complete'})[String(await ask('Choose 1 / 2 / 3: ')).trim()];
  if (!preset) throw new Error('Invalid skill preset; no files were installed');
  explain(output, '\nSTEP 3/4: Add optional Harness safety guides?');
  explain(output, '  1. None — skills only (simplest setup)');
  explain(output, '  2. Essential — core, quality and security guides');
  explain(output, '  3. Full — all packaged Harness guardrail groups');
  const harness = ({'1':'none','2':'essential','3':'full'})[String(await ask('Choose 1 / 2 / 3: ')).trim()];
  if (!harness) throw new Error('Invalid Harness selection; no files were installed');
  const plan = previewSetup({cwd:root,runtime:chosen,preset,harness});
  explain(output, '\nSTEP 4/4: Review before installation');
  explain(output, 'AI hosts: ' + plan.runtimes.join(', '));
  explain(output, 'Skill preset: ' + preset + ' (' + plan.skills.length + ' explicitly selected)');
  explain(output, 'Required skill dependencies: ' + (plan.autoDependencies.join(', ') || 'none'));
  explain(output, 'Harness: ' + harness);
  explain(output, 'New/changed files: ' + plan.filesToWrite + ', only under this project');
  for (const file of plan.previewPaths) explain(output, '  + ' + file);
  if (plan.remainingPaths) explain(output, '  ...and ' + plan.remainingPaths + ' more files.');
  explain(output, 'You can cancel without making any changes.');
  if (!yesAnswer(await ask('Install exactly this selection? [y/N]: '))) {
    explain(output, 'Cancelled. No files written.');
    return {cancelled:true, installed:false, preview:plan};
  }
  const result = applySetup({cwd:root,runtime:chosen,preset,harness,yes:true});
  explain(output, '\nInstalled. Xyeena is configured for: ' + result.runtimes.join(', '));
  for (const d of result.diagnostics)
    explain(output, '  ' + d.host + ': ' + d.availability + '. ' + d.note);
  explain(output, 'Next: reopen your AI app, then ask it to use xyeena-orchestrate.');
  explain(output, 'To check installed skills: npx xyeena-agent skills matrix --local-only');
  explain(output, 'To preview routing without tokens: npx xyeena-agent orchestrate preview --runtime ' +
    result.runtimes[0] + ' --goal "review project"');
  explain(output, 'No API keys, host account permissions, or model execution were changed.');
  return result;
}

export async function interactiveSetup({ cwd = process.cwd(),
  input = process.stdin, output = process.stdout } = {}) {
  if (!input.isTTY || !output.isTTY)
    throw new Error('Interactive setup requires a terminal. Use setup --runtime HOST --preset essential --dry-run or --yes.');
  const rl = createInterface({input,output});
  try { return await guidedSetup({cwd,ask:prompt=>rl.question(prompt),output}); }
  finally {rl.close();}
}
