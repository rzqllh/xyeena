import path from 'node:path'; import fs from 'node:fs';
import { parseFlags } from './util.mjs'; import { VERSION, PACKAGE_ROOT } from './paths.mjs'; import { install, installSelective } from './install.mjs';
import { explicitSelection, interactiveSelection } from './selection.mjs';
import { runHarness } from './harness.mjs'; import { doctor } from './doctor.mjs'; import { validateSource } from './validate.mjs'; import { loadRegistry } from './registry.mjs'; import { resolveCapabilities } from './resolver.mjs'; import { runEvals } from './eval.mjs'; import { RunLedger } from './ledger.mjs';
import { guidedCommand } from './antigravity-guided.mjs';
import { discoverWorkspaceSkills, routeWorkspaceSkills, skillAvailabilityMatrix } from './workspace-skills.mjs';
import { createAntigravitySdkAdapter, previewAntigravitySdkTask } from './antigravity-sdk-adapter.mjs';
import { previewPortableHost, createPortableHostAdapter } from './portable-cli-adapter.mjs';
import { previewOrchestration, executeOrchestration } from './orchestrator.mjs';
import { recordOrchestrationRun } from './orchestration-ledger.mjs';
import { interactiveSetup, previewSetup, applySetup } from './setup.mjs';
const help=`Xyeena Rig ${VERSION}

Usage:
  xyeena setup                                  # beginner-friendly guided setup
  xyeena setup --runtime hermes,gemini --preset essential --harness none --dry-run
  xyeena setup --runtime hermes --preset balanced --harness essential --yes
  xyeena init                                   # interactive: Skills / Harness / All
  xyeena init --components skills --runtime codex --skills xyeena-core --yes
  xyeena init --components skills --runtime gemini,hermes --skills xyeena-orchestrate --yes
  xyeena init --components skills --runtime all-supported --skills all --yes
  xyeena init --components harness --guards 00-core,60-security --yes
  xyeena init --components all --runtime all --skills all --guards all --yes
  xyeena init --components ... --dry-run         # preview, no files written
  xyeena doctor [--dir PATH]                      # existing installation doctor
  xyeena harness doctor|audit|scan|verify|risk|changed|adapters [--dir PATH] [--base REF] [--evidence]
  xyeena audit|scan|verify|risk|changed|adapters [--dir PATH] [--base REF] [--evidence]
  xyeena check [--source PATH]
  xyeena list
  xyeena resolve --prompt TEXT [--state TRIAGE] [--path FILE]
  xyeena skills discover|matrix [--dir PATH] [--runtime antigravity|gemini|codex|claude|hermes|all] [--local-only]
  xyeena route --prompt TEXT [--dir PATH] [--runtime antigravity|gemini|codex|claude|hermes] [--state TRIAGE]
  xyeena orchestrate preview --runtime HOST --goal TEXT [--state AUTO|DEBUG|REVIEW|...]
  xyeena orchestrate run --runtime antigravity|gemini|hermes|codex|claude --goal TEXT --yes [--record] [--delegate]
  xyeena host preview --runtime gemini|hermes|codex|claude --goal TEXT [--dir PATH] [--local-only]
  xyeena host run --runtime gemini|hermes|codex|claude --goal TEXT --yes [--command EXECUTABLE]
  xyeena sdk preview --goal TEXT [--dir PATH] [--local-only]
  xyeena sdk run --goal TEXT --yes [--delegate] [--dir PATH] [--python PATH] [--timeout-ms N]
  xyeena eval
  xyeena run-init --goal TEXT [--dir PATH]
  xyeena guided preview|install|status|uninstall [--dir PATH] [--yes]
  xyeena guided list|resume [--id RUN_ID] [--dir PATH]
  xyeena guided bind --id RUN_ID --conversation UUID --yes
  xyeena guided unbind --conversation UUID --yes
  xyeena version
`;
export async function main(args){
 const cmd=args[0]||'help', f=parseFlags(args.slice(1));
 if(['help','--help','-h'].includes(cmd) || f.help || f._.includes('-h') || f._.includes('help')){console.log(help);return}
 if(['version','--version','-v'].includes(cmd)){console.log(VERSION);return}
 if(cmd==='setup'){
    const cwd=path.resolve(f.dir||process.cwd());
    if (!f.runtime) {
      if(f.yes||f.dryRun||f.preset||f.harness)throw new Error('Non-interactive setup requires --runtime HOST to prevent selecting tools implicitly');
      await interactiveSetup({cwd});
      return;
    }
    const options={cwd,runtime:f.runtime,preset:f.preset||'essential',harness:f.harness||'none'};
    if(f.dryRun) {
      console.log(JSON.stringify(previewSetup(options),null,2));return;
    }
    if(!f.yes)throw new Error('Pass --dry-run to preview or --yes for explicitly selected setup; no files changed');
    if(f.force)throw new Error('Beginner setup never overwrites custom files. Use advanced init only after reviewing conflicts');
    console.log(JSON.stringify(applySetup({...options,yes:true}),null,2));return;
  }
 if(cmd==='init'){
    const cwd=path.resolve(f.dir||process.cwd());
    let choice;
    if (f.components || f.component) {
      choice=explicitSelection(f);
      if (!f.yes && !f.dryRun) throw new Error('Pass --yes for non-interactive installation, or run "xyeena init" to choose interactively. Nothing was written.');
    } else if (f.dryRun && !process.stdin.isTTY) {
      console.log('No components selected; nothing to preview. Supply --components skills|harness|all.');
      return;
    } else {
      choice=await interactiveSelection();
    }
    if(!choice){console.log('Cancelled. No files changed.');return}
    const result=installSelective({cwd,...choice,force:!!f.force,dryRun:!!f.dryRun});
    console.log((result.dryRun?'Would install':'Installed')+' Xyeena Rig '+VERSION);
    console.log('Components: '+result.components.join(', '));
    if(result.runtimes.length) console.log('Runtimes: '+result.runtimes.join(', '));
    if(result.skills.length) console.log('Skills: '+result.skills.join(', '));
    if(result.guards.length) console.log('Guardrails: '+result.guards.join(', '));
    if(result.autoDependencies.length) console.log('Required dependencies: '+result.autoDependencies.join(', '));
    console.log('Files to write: '+result.actions.length);
    console.log('Inspect: xyeena doctor');
    return;
  }
 if(cmd==='harness'||['audit','scan','verify','risk','changed','adapters'].includes(cmd)){
    const subcmd=cmd==='harness'?(f._[0]||'doctor'):cmd;
    const status=runHarness(subcmd,{cwd:path.resolve(f.dir||process.cwd()),base:f.base||null,explicitBase:!!f.base,evidence:!!f.evidence});
    if(status!==0) process.exitCode=status;
    return;
  }
 if(cmd==='doctor'){console.log(JSON.stringify(doctor(path.resolve(f.dir||process.cwd())),null,2));return}
 if(cmd==='check'){const r=validateSource(path.resolve(f.source||PACKAGE_ROOT)); if(!r.ok){for(const e of r.errors)console.error(`[FAIL] ${e}`);process.exitCode=1}else console.log(`[PASS] ${r.capabilities.length} capabilities + runtime manifests`);return}
 if(cmd==='list'){for(const c of loadRegistry())console.log(`${c.metadata.name}\t${c.activation.class}\t${c.metadata.category}`);return}
 if(cmd==='resolve'){if(!f.prompt)throw new Error('--prompt is required'); const r=resolveCapabilities(loadRegistry(),{prompt:f.prompt,state:f.state||'TRIAGE',paths:f.path?[f.path]:[]}); console.log(JSON.stringify(r,null,2));return}
 if(cmd==='skills'){
    const directory=path.resolve(f.dir||process.cwd());
    if(f._[0]==='matrix'){
      console.log(JSON.stringify(skillAvailabilityMatrix({cwd:directory,includeGlobal:!f.localOnly}),null,2));return;
    }
    if(f._[0]!=='discover')throw new Error('Expected: xyeena skills discover|matrix');
    console.log(JSON.stringify(discoverWorkspaceSkills({cwd:directory,runtime:f.runtime||'antigravity',includeGlobal:!f.localOnly}),null,2));return;
  }
 if(cmd==='route'){
    if(typeof f.prompt!=='string'||!f.prompt.trim())throw new Error('--prompt TEXT is required');
    const result=routeWorkspaceSkills({cwd:path.resolve(f.dir||process.cwd()),runtime:f.runtime||'antigravity',
      prompt:f.prompt,state:f.state||'TRIAGE',paths:f.path?[f.path]:[],maxSupporting:f.maxSupporting===undefined?2:Number(f.maxSupporting),
      includeGlobal:!f.localOnly});
    console.log(JSON.stringify(result,null,2));return;
  }
 if(cmd==='orchestrate'){
    if(!['preview','run'].includes(f._[0]))throw new Error('Expected: xyeena orchestrate preview|run');
    const plan=previewOrchestration({cwd:path.resolve(f.dir||process.cwd()),runtime:f.runtime,
      goal:f.goal,state:f.state||'AUTO',includeGlobal:!f.localOnly,
      maxSupporting:f.maxSupporting===undefined?2:Number(f.maxSupporting)});
    if(f._[0]==='preview'){console.log(JSON.stringify(plan,null,2));return}
    if(!f.yes)throw new Error('Orchestrate run may invoke a real provider; pass --yes');
    const dispatch=()=>executeOrchestration(plan,{yes:true,delegate:!!f.delegate,
      ...(typeof f.command==='string'?{command:f.command}:{}),
      ...(typeof f.python==='string'?{python:f.python}:{}),
      ...(f.timeoutMs===undefined?{}:{timeoutMs:Number(f.timeoutMs)})});
    const result=f.record===true ? await recordOrchestrationRun(plan,dispatch) : await dispatch();
    console.log(JSON.stringify(result,null,2));return;
  }
 if(cmd==='host'){
    const subcommand=f._[0];
    if(!['preview','run'].includes(subcommand))throw new Error('Expected: xyeena host preview|run');
    const preview=previewPortableHost({cwd:path.resolve(f.dir||process.cwd()),
      runtime:f.runtime,goal:f.goal,includeGlobal:!f.localOnly});
    if(subcommand==='preview'){console.log(JSON.stringify(preview,null,2));return}
    if(!preview.ready)throw new Error(preview.reason);
    if(f.yes!==true)throw new Error('Host run makes a real model call; pass --yes for this invocation');
    const adapter=createPortableHostAdapter({cwd:preview.cwd,runtime:preview.runtime,selectedSkills:preview.requestedSkills,
      ...(typeof f.command==='string'?{command:f.command}:{}),
      ...(f.timeoutMs!==undefined?{timeoutMs:Number(f.timeoutMs)}:{})});
    const result=await adapter.executeTask({id:'host-one-shot',title:f.goal,
      scope:{readOnly:true,operationClass:'safe'}});
    console.log(JSON.stringify(result,null,2));return;
  }
 if(cmd==='sdk'){
    const subcommand=f._[0];
    if(!['preview','run'].includes(subcommand))throw new Error('Expected: xyeena sdk preview|run');
    if(typeof f.goal!=='string'||!f.goal.trim())throw new Error('--goal TEXT required');
    const preview=previewAntigravitySdkTask({cwd:path.resolve(f.dir||process.cwd()),goal:f.goal,includeGlobal:!f.localOnly});
    if(subcommand==='preview'){console.log(JSON.stringify(preview,null,2));return}
    if(f.yes!==true)throw new Error('SDK run makes a real model call; pass --yes for this invocation');
    const adapter=createAntigravitySdkAdapter({cwd:preview.cwd,skillPaths:preview.skillPaths,
      enableSubagents:f.delegate===true,
      ...(typeof f.python==='string'?{python:f.python}:{}),
      ...(f.timeoutMs!==undefined?{timeoutMs:Number(f.timeoutMs)}:{})});
    const result=await adapter.executeTask({id:'sdk-one-shot',title:f.goal,
      scope:{readOnly:true,operationClass:'safe'}});
    console.log(JSON.stringify({status:'REVIEW_REQUIRED', ...result, selectedSkills:preview.selectedSkills},null,2));
    return;
  }
 if(cmd==='eval'){const r=runEvals(); for(const d of r.details)console.log(`${d.ok?'PASS':'FAIL'} ${d.name}: ${d.actual}`); console.log(`\n${r.pass} passed, ${r.fail} failed`); if(r.fail)process.exitCode=1;return}
 if(cmd==='guided'){
    const result=guidedCommand(f._[0]||'preview',{cwd:path.resolve(f.dir||process.cwd()),yes:!!f.yes,id:f.id||null,conversationId:f.conversation||null});
    console.log(JSON.stringify(result,null,2));
    return;
  }
 if(cmd==='run-init'){const cwd=path.resolve(f.dir||process.cwd()); const l=RunLedger.create(cwd,{goal:f.goal||'',cwd}); console.log(l.runDir);return}
 throw new Error(`unknown command ${cmd}\n\n${help}`);
}
