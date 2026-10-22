import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverWorkspaceSkills } from './workspace-skills.mjs';
import { supportedSkillHosts } from './skill-hosts.mjs';

const MARKERS = Object.freeze({
  hermes: ['.hermes/config.yaml','.hermes/skills'],
  gemini: ['.gemini/settings.json','.gemini/skills'],
  antigravity: ['.agents/hooks.json','.agents/rules'],
  codex: ['.codex/config.toml','.agents/skills'],
  claude: ['.claude/settings.json','.claude/skills']
});
const COMMANDS={hermes:'hermes',gemini:'gemini',antigravity:'antigravity',codex:'codex',claude:'claude'};
function pathInfo(file) {
  try {const s=fs.lstatSync(file);return !s.isSymbolicLink()&&(s.isDirectory()||s.isFile());}
  catch{return false;}
}
function executableHint(command, env=process.env, platform=process.platform) {
  const paths=String(env.Path||env.PATH||'').split(path.delimiter).filter(Boolean).slice(0,128);
  const endings=platform==='win32'?['.exe','.com','.cmd','.bat','']:[''];
  return paths.some(dir=>endings.some(ext=>pathInfo(path.join(dir,command+ext))));
}
export function inspectSetupHosts({cwd=process.cwd(),env=process.env,platform=process.platform}={}) {
  const root=fs.realpathSync(path.resolve(cwd));
  return supportedSkillHosts().map(host=>{
    const markers=MARKERS[host].filter(marker=>pathInfo(path.join(root,marker)));
    const hostCommandAvailable=executableHint(COMMANDS[host],env,platform);
    const sharedOnly=markers.length>0&&markers.every(marker=>marker.startsWith('.agents/'));
    return {host,projectMarkers:markers,hostCommandAvailable,
      level:hostCommandAvailable?'executable-on-PATH':sharedOnly?'shared-folder-only':
        markers.length?'project-markers-only':'undetected',
      confirmedRunning:false};
  });
}

/** Read-only health report; never authenticates, invokes a model, or installs dependencies. */
export function setupHealthCheck({cwd=process.cwd(),runtime,includeGlobal=false}={}) {
  if(!supportedSkillHosts().includes(runtime))throw new Error('Choose one supported runtime with --runtime');
  const root=fs.realpathSync(path.resolve(cwd));
  const host=inspectSetupHosts({cwd:root}).find(x=>x.host===runtime);
  const skills=discoverWorkspaceSkills({cwd:root,runtime,includeGlobal});
  const orchestrator=skills.find(x=>x.name==='xyeena-rig' && x.availability==='detected') ||
    skills.find(x=>x.name==='xyeena-orchestrate' && x.availability==='detected') ||
    skills.find(x=>['xyeena-rig','xyeena-orchestrate'].includes(x.name));
  let manifest=null;
  try {manifest=JSON.parse(fs.readFileSync(path.join(root,'.xyeena/install.json'),'utf8'));}
  catch {/* missing or invalid manifest is informational */}
  const eligible=skills.filter(x=>x.availability==='detected');
  return {runtime,cwd:root,filesystem:{
    manifestVersion:manifest?.version||null,
    hostListedInManifest:Array.isArray(manifest?.runtimes)&&manifest.runtimes.includes(runtime),
    installedSkillCount:skills.length,eligibleSkillCount:eligible.length,
    orchestratorFound:!!orchestrator,
    orchestratorName:orchestrator?.name||null,
    orchestratorEligibility:orchestrator?.availability||'not-found',
    unavailableSkills:skills.filter(x=>x.availability!=='detected')
      .map(x=>({name:x.name,reason:x.availability}))
  },hostDetection:host,
    hostActivationVerified:false,modelCallPerformed:false,
    next:!orchestrator?'Install the xyeena-rig compact entry or legacy xyeena-orchestrate skill':
      orchestrator.availability!=='detected'?'Resolve native host trust/platform restrictions':
      'Reload the AI host and confirm native skill activation in an actual session; filesystem checks alone cannot verify this'};
}
