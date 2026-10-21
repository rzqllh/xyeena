import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { availableSkills, parseChoice, selectSkillRuntimes } from './selection.mjs';
import { setupFilePlan, installStagedSetup } from './setup-upgrade.mjs';
import { discoverWorkspaceSkills } from './workspace-skills.mjs';

const HOSTS = Object.freeze([
  { id: 'hermes', label: 'Hermes Agent', folder: '.hermes/skills' },
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
  harness = 'none', update = false } = {}) {
  const root = safeRoot(cwd);
  const choice = setupSelection({ runtime, preset, harness });
  const filePlan = setupFilePlan({cwd:root,choice});
  const proposed = [...filePlan.create, ...filePlan.metadataUpdates,
    ...(update ? filePlan.conflicts : [])];
  return {
    kind: 'xyeena-setup', version: 2, cwd: root, ...choice, dryRun:true,
    fingerprint: filePlan.fingerprint, conflicts: filePlan.conflicts,
    conflictPolicy: update ? 'backup-replace' : 'keep',
    creates: filePlan.create, unchangedCount: filePlan.unchanged.length,
    metadataUpdates: filePlan.metadataUpdates,
    filesToWrite: proposed.length, previewPaths: proposed.slice(0,12),
    remainingPaths: Math.max(0,proposed.length-12),
    noGlobalEdits: true, noProviderCalls: true, noHostAuthChanges: true,
    next: filePlan.conflicts.length
      ? update ? 'Existing differing files will be backed up before replacement; confirm before continuing.'
        : 'Existing differing files will be PRESERVED. Use --update to back them up and replace them.'
      : 'No file conflicts found. Review the selection before confirmation.'
  };
}

export function applySetup({ cwd = process.cwd(), runtime, preset = 'essential',
  harness = 'none', update = false, yes = false, expectedFingerprint } = {}) {
  if (yes !== true) throw new Error('Setup installation requires explicit --yes or interactive confirmation');
  const preview = previewSetup({cwd,runtime,preset,harness,update});
  if (expectedFingerprint && preview.fingerprint !== expectedFingerprint)
    throw new Error('Installed files changed since the review screen. Run setup preview again');
  const result = installStagedSetup({
    cwd:preview.cwd,choice:preview,policy:update ? 'backup-replace' : 'keep',
    expectedFingerprint:preview.fingerprint
  });
  const diagnostics = preview.runtimes.map(host => {
    const items = discoverWorkspaceSkills({cwd:preview.cwd,runtime:host,includeGlobal:false});
    const orchestrator = items.find(item => item.name === 'xyeena-orchestrate');
    return { host, installed: !!orchestrator,
      availability: orchestrator?.availability || 'not-found',
      note: host === 'hermes'
        ? 'Project-local Hermes skills may require trusting the Git workspace inside Hermes before activation.'
        : 'Restart or reload the corresponding AI host to discover newly installed skills.' };
  });
  return { installed:true, filesWritten:result.written.length,
    cwd:preview.cwd, runtimes:preview.runtimes, skills:preview.skills, guards:preview.guards,
    conflictsPreserved:result.preserved, conflictsReplaced:result.replaced,
    conflictPolicy:result.conflictPolicy, backupDirectory:result.backupDirectory,
    unchangedCount:result.unchangedCount, diagnostics,
    providerAuthenticationConfigured:false, modelCallsMade:0 };
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
  explain(output, '\nXYEENA RIG — Setup / Upgrade (no account login or API key needed)');
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
  const basePlan = previewSetup({cwd:root,runtime:chosen,preset,harness});
  let update = false;
  if (basePlan.conflicts.length) {
    explain(output, '\nExisting skill/Harness files differ from the package ('+basePlan.conflicts.length+' conflict(s)).');
    for (const file of basePlan.conflicts.slice(0,12)) explain(output, '  ! '+file);
    if (basePlan.conflicts.length>12) explain(output, '  ...and '+(basePlan.conflicts.length-12)+' more.');
    explain(output, '  1. Keep existing custom files; install only missing files (safe default)');
    explain(output, '  2. Back up originals to .xyeena/backups, then replace with the current package');
    explain(output, '  0. Cancel without changes');
    const decision = String(await ask('Existing files [1/2/0, default 1]: ')).trim();
    if (decision === '0') {
      explain(output, 'Cancelled. No files written.');
      return {cancelled:true,installed:false,preview:basePlan};
    }
    if (!['','1','2'].includes(decision)) throw new Error('Unknown update selection; no changes made');
    update=decision==='2';
  }
  const plan = update ? previewSetup({cwd:root,runtime:chosen,preset,harness,update:true}) : basePlan;
  explain(output, '\nSTEP 4/4: Review before installation');
  explain(output, 'AI hosts: ' + plan.runtimes.join(', '));
  explain(output, 'Skill preset: ' + preset + ' (' + plan.skills.length + ' explicitly selected)');
  explain(output, 'Required skill dependencies: ' + (plan.autoDependencies.join(', ') || 'none'));
  explain(output, 'Harness: ' + harness);
  explain(output, 'Files to write: ' + plan.filesToWrite + ', only under this project');
  explain(output, 'Unchanged files: '+plan.unchangedCount);
  explain(output, 'Custom file conflicts: '+plan.conflicts.length+
    (update ? ' (BACKUP THEN REPLACE)' : ' (KEEP EXISTING)'));
  for (const file of plan.previewPaths) explain(output, '  + ' + file);
  if (plan.remainingPaths) explain(output, '  ...and ' + plan.remainingPaths + ' more files.');
  explain(output, 'You can cancel without making any changes.');
  if (!yesAnswer(await ask('Install exactly this selection? [y/N]: '))) {
    explain(output, 'Cancelled. No files written.');
    return {cancelled:true, installed:false, preview:plan};
  }
  const result = applySetup({cwd:root,runtime:chosen,preset,harness,update,yes:true,expectedFingerprint:plan.fingerprint});
  explain(output, '\nInstalled. Xyeena is configured for: ' + result.runtimes.join(', '));
  if (result.conflictsPreserved.length) explain(output, 'Preserved custom files: '+result.conflictsPreserved.length);
  if (result.conflictsReplaced.length) explain(output, 'Replaced with backups: '+result.conflictsReplaced.length);
  if (result.backupDirectory) explain(output, 'Backup directory: '+result.backupDirectory);
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
