import path from 'node:path';
import { parseFlags, flagList } from './util.mjs';
import { VERSION, PACKAGE_ROOT } from './paths.mjs';
import { install, buildInstallPlan } from './install.mjs';
import { promptInstallOptions, printInstallPlan, confirmInstall } from './install/prompt.mjs';
import { doctor } from './doctor.mjs';
import { validateSource } from './validate.mjs';
import { loadRegistry } from './registry.mjs';
import { resolveCapabilities } from './resolver.mjs';
import { runEvals } from './eval.mjs';
import { RunLedger } from './ledger.mjs';

const help = `Xyeena ${VERSION}

Usage:
  xyeena init
  xyeena init -a antigravity [-a claude] [-s xyeena-debug] [--global] [--copy] [-y]
  xyeena init --all [-y]
  xyeena init [--runtime antigravity|claude|codex|all]  # compatibility alias
  xyeena doctor [--dir PATH]
  xyeena check [--source PATH]
  xyeena list
  xyeena resolve --prompt TEXT [--state TRIAGE] [--path FILE]
  xyeena eval
  xyeena run-init --goal TEXT [--dir PATH]
  xyeena version

Init flags:
  -a, --agent NAME     Target agent; repeat or comma-separate
  -s, --skill NAME     Skill to install; repeat or comma-separate
  -g, --global         Install to user-global agent paths
      --copy           Copy instead of smart link/junction installation
      --all            All agents + all skills
  -y, --yes            Skip confirmation
      --force          Replace conflicting existing install paths
      --dry-run        Show plan without writing
`;

async function runInit(f) {
  const cwd = path.resolve(f.dir || process.cwd());
  const agentFlags = flagList(f.agent);
  const skillFlags = flagList(f.skill);
  const hasExplicitSelection = agentFlags.length || skillFlags.length || f.runtime || f.all;

  let options;
  if (!hasExplicitSelection) {
    options = await promptInstallOptions();
  } else {
    const agents = f.all ? 'all' : (agentFlags.length ? agentFlags : f.runtime);
    if (!agents) throw new Error('select at least one target with --agent/-a');
    options = {
      agents,
      skills: f.all ? 'all' : (skillFlags.length ? skillFlags : 'recommended'),
      scope: f.global ? 'global' : 'project',
      mode: f.copy ? 'copy' : 'smart',
    };
  }

  const plan = buildInstallPlan({ cwd, ...options });
  printInstallPlan(plan);

  if (f.dryRun) {
    const result = install({ cwd, ...options, force: !!f.force, dryRun: true });
    console.log(`\nWould install Xyeena ${VERSION}: ${result.skills.length} skills for ${result.agents.join(', ')}`);
    return;
  }

  if (!f.yes) {
    if (!process.stdin.isTTY) throw new Error('confirmation required in non-interactive mode; pass --yes');
    const ok = await confirmInstall(plan);
    if (!ok) { console.log('Installation cancelled.'); return; }
  }

  const result = install({ cwd, ...options, force: !!f.force });
  console.log(`\nInstalled Xyeena ${VERSION}`);
  console.log(`Agents: ${result.agents.join(', ')}`);
  console.log(`Skills: ${result.skills.length}`);
  console.log(`Method: ${result.manifest.mode}`);
  console.log('Run: npx xyeena-agent doctor');
}

export async function main(args) {
  const cmd = args[0] || 'help';
  const f = parseFlags(args.slice(1));
  if (['help', '--help', '-h'].includes(cmd) || f.help) { console.log(help); return; }
  if (['version', '--version', '-v'].includes(cmd)) { console.log(VERSION); return; }

  if (cmd === 'init') { await runInit(f); return; }
  if (cmd === 'doctor') { console.log(JSON.stringify(doctor(path.resolve(f.dir || process.cwd())), null, 2)); return; }
  if (cmd === 'check') {
    const r = validateSource(path.resolve(f.source || PACKAGE_ROOT));
    if (!r.ok) { for (const e of r.errors) console.error(`FAIL ${e}`); process.exitCode = 1; }
    else console.log(`PASS ${r.capabilities.length} capabilities + runtime manifests`);
    return;
  }
  if (cmd === 'list') { for (const c of loadRegistry()) console.log(`${c.metadata.name}\t${c.activation.class}\t${c.metadata.category}`); return; }
  if (cmd === 'resolve') {
    if (!f.prompt) throw new Error('--prompt is required');
    const paths = flagList(f.path);
    const r = resolveCapabilities(loadRegistry(), { prompt: String(f.prompt), state: f.state || 'TRIAGE', paths });
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  if (cmd === 'eval') {
    const r = runEvals();
    for (const d of r.details) console.log(`${d.ok ? 'PASS' : 'FAIL'} ${d.name}: ${d.actual}`);
    console.log(`\n${r.pass} passed, ${r.fail} failed`);
    if (r.fail) process.exitCode = 1;
    return;
  }
  if (cmd === 'run-init') {
    const cwd = path.resolve(f.dir || process.cwd());
    const l = RunLedger.create(cwd, { goal: f.goal || '', cwd });
    console.log(l.runDir);
    return;
  }
  throw new Error(`unknown command ${cmd}\n\n${help}`);
}
