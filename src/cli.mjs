import path from 'node:path'; import fs from 'node:fs';
import { parseFlags } from './util.mjs'; import { VERSION, PACKAGE_ROOT } from './paths.mjs'; import { install } from './install.mjs'; import { doctor } from './doctor.mjs'; import { validateSource } from './validate.mjs'; import { loadRegistry } from './registry.mjs'; import { resolveCapabilities } from './resolver.mjs'; import { runEvals } from './eval.mjs'; import { RunLedger } from './ledger.mjs';
const help=`Xyeena ${VERSION}

Usage:
  xyeena init [--runtime all|antigravity|claude|codex] [--dir PATH] [--force] [--dry-run]
  xyeena doctor [--dir PATH]
  xyeena check [--source PATH]
  xyeena list
  xyeena resolve --prompt TEXT [--state TRIAGE] [--path FILE]
  xyeena eval
  xyeena run-init --goal TEXT [--dir PATH]
  xyeena version
`;
export async function main(args){
 const cmd=args[0]||'help', f=parseFlags(args.slice(1));
 if(['help','--help','-h'].includes(cmd)){console.log(help);return} if(['version','--version','-v'].includes(cmd)){console.log(VERSION);return}
 if(cmd==='init'){const cwd=path.resolve(f.dir||process.cwd()); const r=install({cwd,runtime:f.runtime||'all',force:!!f.force,dryRun:!!f.dryRun}); console.log(`${r.dryRun?'Would install':'Installed'} Xyeena ${VERSION} for ${r.runtimes.join(', ')}`); console.log(`Files: ${r.actions.length}`); console.log('Run: npx xyeena-agent doctor');return}
 if(cmd==='doctor'){console.log(JSON.stringify(doctor(path.resolve(f.dir||process.cwd())),null,2));return}
 if(cmd==='check'){const r=validateSource(path.resolve(f.source||PACKAGE_ROOT)); if(!r.ok){for(const e of r.errors)console.error(`FAIL ${e}`);process.exitCode=1}else console.log(`PASS ${r.capabilities.length} capabilities + runtime manifests`);return}
 if(cmd==='list'){for(const c of loadRegistry())console.log(`${c.metadata.name}	${c.activation.class}	${c.metadata.category}`);return}
 if(cmd==='resolve'){if(!f.prompt)throw new Error('--prompt is required'); const r=resolveCapabilities(loadRegistry(),{prompt:f.prompt,state:f.state||'TRIAGE',paths:f.path?[f.path]:[]}); console.log(JSON.stringify(r,null,2));return}
 if(cmd==='eval'){const r=runEvals(); for(const d of r.details)console.log(`${d.ok?'PASS':'FAIL'} ${d.name}: ${d.actual}`); console.log(`
${r.pass} passed, ${r.fail} failed`); if(r.fail)process.exitCode=1;return}
 if(cmd==='run-init'){const cwd=path.resolve(f.dir||process.cwd()); const l=RunLedger.create(cwd,{goal:f.goal||'',cwd}); console.log(l.runDir);return}
 throw new Error(`unknown command ${cmd}

${help}`);
}
