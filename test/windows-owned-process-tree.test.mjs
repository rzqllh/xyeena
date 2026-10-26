import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { requestOwnedProcessTermination } from '../src/owned-process-termination.mjs';

const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
async function eventually(what, maxMs=5000) {
  const limit=Date.now()+maxMs;
  while(Date.now()<limit) {
    if(what()) return;
    await delay(40);
  }
  throw new Error('Controlled dummy process did not start in time');
}

test('Windows: owned cancellation kills an actual dummy child and its descendant', {
  skip: process.platform!=='win32', timeout:15000
}, async t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'xyeena-tree-kill-'));
  // No agent, provider, model or user workspace is involved.
  const childFile=path.join(root,'child.mjs');
  const parentFile=path.join(root,'parent.mjs');
  const beatFile=path.join(root,'heartbeat.txt');
  const pidFile=path.join(root,'descendant.pid');
  fs.writeFileSync(childFile,
    "import fs from 'node:fs';\n"+
    "fs.writeFileSync(process.argv[2],String(process.pid));\n"+
    "setInterval(()=>fs.appendFileSync(process.argv[3],'x'),60);\n");
  fs.writeFileSync(parentFile,
    "import {spawn} from 'node:child_process';\n"+
    "import path from 'node:path';\n"+
    "import {fileURLToPath} from 'node:url';\n"+
    "spawn(process.execPath,[path.join(path.dirname(fileURLToPath(import.meta.url)),'child.mjs'),"+
    "process.argv[2],process.argv[3]],{stdio:'ignore',shell:false,windowsHide:true});\n"+
    "setInterval(()=>{},1000);\n");
  const parent=spawn(process.execPath,[parentFile,pidFile,beatFile],{
    cwd:root,stdio:'ignore',shell:false,windowsHide:true
  });
  try {
    await eventually(()=>fs.existsSync(pidFile)&&fs.existsSync(beatFile)&&
      fs.statSync(beatFile).size>=2);
    assert.ok(Number.isSafeInteger(parent.pid)&&parent.pid>0);
    requestOwnedProcessTermination(parent);
    await new Promise((resolve,reject)=>{
      if(parent.exitCode!=null || parent.signalCode!=null) return resolve();
      const timeout=setTimeout(()=>reject(new Error('Dummy parent did not exit after taskkill')),5000);
      parent.once('close',()=>{clearTimeout(timeout);resolve();});
    });
    await delay(250);
    const size=fs.statSync(beatFile).size;
    await delay(350);
    assert.equal(fs.statSync(beatFile).size,size,
      'Descendant heartbeat continued after an owned Windows process-tree kill');
  } finally {
    // Cleanup only known fixture PIDs when a test fails; never touch user processes.
    if(parent.exitCode==null&&parent.pid) spawnSync('taskkill',
      ['/PID',String(parent.pid),'/T','/F'],{stdio:'ignore',windowsHide:true,shell:false});
    if(fs.existsSync(pidFile)) {
      const pid=Number(fs.readFileSync(pidFile,'utf8'));
      if(Number.isSafeInteger(pid)&&pid>0)
        spawnSync('taskkill',['/PID',String(pid),'/T','/F'],
          {stdio:'ignore',windowsHide:true,shell:false});
    }
    fs.rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
});
