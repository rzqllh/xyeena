import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-package-'));
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(file,args,cwd=root) {
  const r=spawnSync(file,args,{cwd,encoding:'utf8',timeout:120000,windowsHide:true,shell:process.platform==='win32',
    env:{...process.env,npm_config_audit:'false',npm_config_fund:'false'}});
  if(r.error||r.status!==0)throw new Error(file+' '+args.join(' ')+'\n'+(r.error?.message||r.stderr||r.stdout));
  return r.stdout;
}
try {
  const packed=JSON.parse(run(npm,['pack','--json','--pack-destination',scratch]));
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
  console.log('PASS packed consumer: no implicit all, harness-only, selective skills + dependencies.');
} finally {fs.rmSync(scratch,{recursive:true,force:true})}
