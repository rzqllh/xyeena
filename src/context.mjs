import path from 'node:path'; import fs from 'node:fs'; import { ensureDir, writeJson } from './util.mjs';
const roles={
  pm:{claimStatuses:['VERIFIED','INFERRED','UNKNOWN','ASSUMED'],includeTasks:true,includeRejected:true},
  executor:{claimStatuses:['VERIFIED','INFERRED','UNKNOWN'],includeTasks:true,includeRejected:false},
  auditor:{claimStatuses:['VERIFIED','INFERRED','UNKNOWN'],includeTasks:true,includeRejected:true},
  researcher:{claimStatuses:['VERIFIED','UNKNOWN'],includeTasks:false,includeRejected:false},
  designer:{claimStatuses:['VERIFIED','INFERRED','UNKNOWN'],includeTasks:true,includeRejected:false},
  security:{claimStatuses:['VERIFIED','INFERRED','UNKNOWN'],includeTasks:true,includeRejected:true}
};
export function compileContextPack({snapshot,role='executor',taskId=null,outDir}){
  const policy=roles[role]||roles.executor, task=taskId?snapshot.tasks[taskId]||null:null;
  const claims=Object.values(snapshot.claims).filter(c=>policy.claimStatuses.includes(c.status)&&c.freshness!=='STALE');
  const decisions=Object.values(snapshot.decisions).filter(d=>policy.includeRejected||!['REJECTED','DEFERRED'].includes(d.status));
  const pack={run_id:snapshot.run_id,role,workflow_state:snapshot.workflow_state,goal:snapshot.goal,task,claims,decisions,tasks:policy.includeTasks?snapshot.tasks:undefined};
  ensureDir(outDir); writeJson(path.join(outDir,'context.json'),pack); writeJson(path.join(outDir,'claims.json'),claims); writeJson(path.join(outDir,'decisions.json'),decisions);
  fs.writeFileSync(path.join(outDir,'brief.md'),`# Context pack

Role: ${role}
Workflow: ${snapshot.workflow_state}
Goal: ${snapshot.goal||'(unspecified)'}
${task?`Task: ${task.id} — ${task.title||''}
`:''}
Use this pack as the scoped source of task context. Do not infer requirements from unrelated parent conversation.
`);
  return pack;
}
