import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-package-'));
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(file,args,cwd=root,extraEnv={}) {
  const r=spawnSync(file,args,{cwd,encoding:'utf8',timeout:120000,windowsHide:true,shell:process.platform==='win32' && /\.(cmd|bat)$/i.test(file),
    env:{...process.env,npm_config_audit:'false',npm_config_fund:'false',...extraEnv}});
  if(r.error||r.status!==0)throw new Error(file+' '+args.join(' ')+'\n'+(r.error?.message||r.stderr||r.stdout));
  return r.stdout;
}
try {
  const packed=JSON.parse(run(npm,['pack','--json','--pack-destination',scratch]));
  const metadata=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  if(packed[0]?.name!==metadata.name || packed[0]?.version!==metadata.version) {
    throw new Error('Packed artifact metadata differs from package.json');
  }
  const files=new Set((packed[0].files||[]).map(f=>f.path.replace(/\\/g,'/')));
  for(const required of [
    'bin/xyeena.mjs','README.md','LICENSE','NOTICE.md',
    'harness/upstream-v3.1/LICENSE',
    'harness/upstream-v3.1/runtime/xyeena-harness.mjs',
    'harness/guides/00-core/anti-slop.md',
    'skills/xyeena-core/SKILL.md'
  ]) {
    if(!files.has(required))throw new Error('Missing required npm package file: '+required);
  }
  const originalGuards=[...files].filter(p=>/^harness\/guides\/[^/]+\/(?!README\.md$)[^/]+\.md$/.test(p));
  if(originalGuards.length!==41) {
    throw new Error('Expected 41 original guardrail docs; found '+originalGuards.length);
  }
  const prohibited=[...files].filter(p=>
    /(^|\/)(node_modules|\.git|\.harness|\.superpowers|\.gemini|prompt-dump|session-dump)(\/|$)/i.test(p) ||
    /(^|\/)\.env(?:\.|$)/i.test(p) ||
    /(^|\/)(LICENSE-NOT-SET\.md|\.DS_Store|Thumbs\.db)$/i.test(p) ||
    /\.(?:pem|p12|pfx|key|log)$/i.test(p)
  );
  if(prohibited.length)throw new Error('Forbidden npm package paths: '+prohibited.join(', '));
  if(metadata.dependencies && Object.keys(metadata.dependencies).length) {
    throw new Error('Unexpected runtime dependencies in zero-dependency release');
  }
  const tar=path.join(scratch,packed[0].filename);
  const consumer=path.join(scratch,'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer,'package.json'),'{"name":"xyeena-consumer-smoke","version":"1.0.0","private":true}\n');
  run(npm,['install','--offline','--no-audit','--no-fund','--ignore-scripts',tar],consumer);
  const bin=path.join(consumer,'node_modules','xyeena-agent','bin','xyeena.mjs');
  const missing=spawnSync(process.execPath,[bin,'init'],{cwd:consumer,encoding:'utf8'});
  if(missing.status===0)throw new Error('Missing selections unexpectedly installed.');
  if(fs.existsSync(path.join(consumer,'.xyeena')))throw new Error('Non-interactive no-selection modified project.');
  run(process.execPath,[bin,'init','--components','harness','--guards','00-core','--yes'],consumer);
  if(!fs.existsSync(path.join(consumer,'.xyeena','config.json')))throw new Error('Packaged harness config was not installed.');
  if(fs.existsSync(path.join(consumer,'.agents')))throw new Error('Harness-only unexpectedly installed skills.');
  run(process.execPath,[bin,'init','--components','skills','--runtime','codex','--skills','xyeena-interface','--yes'],consumer);
  if(!fs.existsSync(path.join(consumer,'.agents','skills','xyeena-core','SKILL.md')))throw new Error('Missing required dependency in packed consumer.');
  if(fs.existsSync(path.join(consumer,'.claude')))throw new Error('Unselected Claude runtime was installed.');
  const beginner=path.join(scratch,'beginner');
  fs.mkdirSync(beginner);
  const guidedPreview=JSON.parse(run(process.execPath,
    [bin,'setup','--runtime','hermes,gemini','--preset','essential','--dry-run'],beginner));
  if(!guidedPreview.filesToWrite || fs.readdirSync(beginner).length !== 0)
    throw new Error('Packed beginner setup preview changed the project or had no actions');
  run(process.execPath,[bin,'setup','--runtime','hermes,gemini',
    '--preset','essential','--yes'],beginner);
  for (const hostPath of ['.hermes/skills',' .gemini/skills'.trim()]) {
    if(!fs.existsSync(path.join(beginner,hostPath,'xyeena-orchestrate','SKILL.md')))
      throw new Error('Packed setup did not install orchestrator for '+hostPath);
  }
  if(fs.existsSync(path.join(beginner,'AGENTS.md')) || fs.existsSync(path.join(beginner,'.claude')))
    throw new Error('Beginner setup modified unselected hosts or root policies');
  const portableHome=path.join(scratch,'portable-profile');
  fs.mkdirSync(portableHome);
  const portableEnv=process.platform==='win32'?{USERPROFILE:portableHome}:{HOME:portableHome};
  const portableProject=path.join(scratch,'portable-project');
  fs.mkdirSync(portableProject);
  const portableArgs=['setup','--scope','global','--mode','symlink','--runtime','antigravity,gemini','--preset','essential'];
  const portablePlan=JSON.parse(run(process.execPath,[bin,...portableArgs,'--dry-run'],portableProject,portableEnv));
  if(portablePlan.scope!=='global'||portablePlan.mode!=='symlink'||fs.readdirSync(portableHome).length)
    throw new Error('Packed portable setup dry-run did not stay read-only');
  run(process.execPath,[bin,...portableArgs,'--yes'],portableProject,portableEnv);
  for(const folder of ['.gemini/config/skills','.gemini/skills']) {
    const target=path.join(portableHome,folder,'xyeena-orchestrate');
    if(!fs.lstatSync(target).isSymbolicLink()||
      !fs.readFileSync(path.join(target,'SKILL.md'),'utf8').includes('xyeena-orchestrate'))
      throw new Error('Packed global symlink source missing: '+target);
  }
  if(fs.readdirSync(portableProject).length)
    throw new Error('Global setup wrote to current workspace');
  console.log('PASS packed consumer: workspace copy + user-global symlink installs from npm tarball.');
} finally {fs.rmSync(scratch,{recursive:true,force:true})}
