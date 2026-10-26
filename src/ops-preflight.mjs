import fs from 'node:fs';
import path from 'node:path';
import {inspectSetupHosts} from './setup-health.mjs';

const HOOK_GROUP='xyeena-rig-guided';
const FILE_MAX=65536;
const issue=id=> 'https://github.com/rzqllh/xyeena/issues/'+id;

function ordinaryFile(root,file) {
  try {
    const relative=path.relative(root,file);
    if (relative.startsWith('..')||path.isAbsolute(relative)) return false;
    let current=root, last=null;
    for(const segment of relative.split(path.sep)){
      current=path.join(current,segment);
      last=fs.lstatSync(current);
      // Reject links and junctions at every level: never inspect a hook
      // manifest/runner redirected to a third-party workspace.
      if(last.isSymbolicLink()) return false;
    }
    return Boolean(last?.isFile()&&last.size<=FILE_MAX);
  } catch { return false; }
}
function inspectHook(root,platform) {
  const config=path.join(root,'.agents','hooks.json');
  const runner=path.join(root,'.xyeena','hooks','antigravity-guided.mjs');
  // The installer writes exactly these native host hook invocations.
  // Substring checks would mistake `echo antigravity-guided.mjs PreToolUse`
  // (or a different command that mentions that filename) for a live hook.
  // Source registration is still NOT proof the host ever invokes it.
  const expectedCommand=platform==='win32'
    ? 'node ../.xyeena/hooks/antigravity-guided.mjs PreToolUse'
    : `"${process.execPath}" "${runner}" PreToolUse`;
  const base={manifest:'MISSING',groupPresent:false,preToolUseRegistered:false,
    preToolUseEnabled:null,runnerPresent:ordinaryFile(root,runner),
    hostEnforcement:'UNVERIFIED',hostActivationVerified:false};
  if (!ordinaryFile(root,config)) {
    if (fs.existsSync(config)) base.manifest='UNTRUSTED_OR_OVERSIZE';
    return base;
  }
  let parsed;
  try { parsed=JSON.parse(fs.readFileSync(config,'utf8')); }
  catch { return {...base,manifest:'INVALID_JSON'}; }
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
    return {...base,manifest:'INVALID_JSON'};
  const group=parsed[HOOK_GROUP];
  if(!group||typeof group!=='object'||Array.isArray(group))
    return {...base,manifest:'PRESENT'};
  const pre=group.PreToolUse;
  // Require the one managed safety event and one canonical command.
  // Reject extra/different hook entries instead of reporting a broad
  // false-positive registration for a partial or tampered hook group.
  const event=Array.isArray(pre)&&pre.length===1 ? pre[0] : null;
  const hook=Array.isArray(event?.hooks)&&event.hooks.length===1 ? event.hooks[0] : null;
  const eligible=event?.matcher==='*'&&hook?.type==='command'&&
    hook.command===expectedCommand&&hook.timeout===3;
  return {...base,manifest:'PRESENT',groupPresent:true,
    preToolUseRegistered:Boolean(eligible),
    // Enabled config is only a hint; it is never native host proof.
    preToolUseEnabled:eligible&&group.enabled!==false&&
      event.enabled!==false&&event.disabled!==true&&
      hook.enabled!==false&&hook.disabled!==true};
}

/** Read-only, redacted prerequisites. Never invokes AI, MCP, hooks or host CLI. */
export function inspectOpsPreflight({cwd=process.cwd(),env=process.env,
  platform=process.platform}={}) {
  const root=fs.realpathSync(path.resolve(cwd));
  const inventory=inspectSetupHosts({cwd:root,env,platform});
  const commands=inventory.map(h=>({
    host:h.host,candidateDetected:h.hostCommandAvailable,
    commandNames:h.detectedCommands,confirmedRunning:false,
    nativeActivationVerified:false
  }));
  return {
    schema:1,project:'xyeena-rig',acceptanceScope:'rig-native-hosts',
    mode:'read-only-prerequisite-inventory',modelCallPerformed:false,
    filesModified:false,configurationChanged:false,
    // Deliberately do not expose user home, workspace, auth files or command lines.
    workspace:{gitMetadataPresent:fs.existsSync(path.join(root,'.git'))},
    commands,
    guidedHook:inspectHook(root,platform),
    nativeAcceptance:{antigravityCli:'NOT_TESTED_BY_PREFLIGHT',
      antigravityIde:'NOT_TESTED_BY_PREFLIGHT',
      hermes:'NOT_TESTED_BY_PREFLIGHT',
      codex:'NOT_TESTED_BY_PREFLIGHT',claude:'NOT_TESTED_BY_PREFLIGHT',
      gemini:'NOT_TESTED_BY_PREFLIGHT'},
    remainingGates:[
      {issue:34,link:issue(34),purpose:'Antigravity IDE native interception'},
      {issue:36,link:issue(36),purpose:'Codex, Claude, Gemini native host acceptance'},
      {issue:37,link:issue(37),purpose:'Hermes native cancellation and host authorization'}
    ],
    note:'RIG-native host prerequisites only. Optional external worker integrations and provider billing acceptance are outside this report. Command presence and hook files do not establish native activation, interception, or authorization.'
  };
}
