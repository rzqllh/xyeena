import fs from 'node:fs';
import path from 'node:path';
import { readJson } from './util.mjs';
import { SKILLS_DIR } from './paths.mjs';

export function validateCapability(cap, folderName) {
  const errors=[];
  if(cap.apiVersion!=='xyeena.dev/v1alpha1') errors.push('apiVersion must be xyeena.dev/v1alpha1');
  if(cap.kind!=='Capability') errors.push('kind must be Capability');
  if(!cap.metadata?.name) errors.push('metadata.name is required');
  if(cap.metadata?.name!==folderName) errors.push(`metadata.name must match folder (${folderName})`);
  if(!Array.isArray(cap.type) || !cap.type.length) errors.push('type must be a non-empty array');
  if(!cap.activation?.class) errors.push('activation.class is required');
  if(!cap.dependencies?.required?.includes('xyeena-core') && folderName!=='xyeena-core') errors.push('non-core capability must require xyeena-core');
  return errors;
}

export function loadRegistry(skillsDir=SKILLS_DIR) {
  const caps=[];
  for(const ent of fs.readdirSync(skillsDir,{withFileTypes:true})){
    if(!ent.isDirectory()) continue;
    const dir=path.join(skillsDir,ent.name), file=path.join(dir,'capability.json');
    if(!fs.existsSync(file)) continue;
    const cap=readJson(file); cap.__dir=dir;
    const errors=validateCapability(cap,ent.name); if(errors.length) throw new Error(`${ent.name}: ${errors.join('; ')}`);
    caps.push(cap);
  }
  const names=new Set(caps.map(c=>c.metadata.name));
  for(const cap of caps){
    for(const dep of [...(cap.dependencies?.required||[]),...(cap.dependencies?.optional||[]),...(cap.chain?.allowed||[])]){
      if(!names.has(dep)) throw new Error(`${cap.metadata.name}: unknown capability reference ${dep}`);
    }
  }
  detectCycles(caps);
  return caps.sort((a,b)=>a.metadata.name.localeCompare(b.metadata.name));
}

function detectCycles(caps){
  const graph=new Map(caps.map(c=>[c.metadata.name,c.chain?.allowed||[]])); const visiting=new Set(), done=new Set();
  function visit(n,stack=[]){ if(done.has(n))return; if(visiting.has(n)) throw new Error(`capability chain cycle: ${[...stack,n].join(' -> ')}`); visiting.add(n); for(const m of graph.get(n)||[]) visit(m,[...stack,n]); visiting.delete(n); done.add(n); }
  for(const n of graph.keys()) visit(n);
}
