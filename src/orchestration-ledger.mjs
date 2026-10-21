import fs from 'node:fs';
import path from 'node:path';
import { RunLedger } from './ledger.mjs';
import { createTask } from './task-graph.mjs';

function assertStateDirectorySafe(cwd) {
  const root = fs.realpathSync(path.resolve(cwd));
  for (const relative of ['.xyeena', path.join('.xyeena','runs')]) {
    const directory = path.join(root,relative);
    try {
      if (fs.lstatSync(directory).isSymbolicLink())
        throw new Error('Refusing linked orchestration run directory');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return root;
}

/** An opt-in, resumable audit trail: no model answer, prompts beyond the user's goal, or secrets. */
export async function recordOrchestrationRun(plan, executor) {
  if (!plan || plan.schema !== 1 || plan.executed !== false ||
      typeof executor !== 'function') throw new Error('A valid preview and executor are required');
  const root = assertStateDirectorySafe(plan.cwd);
  const ledger = RunLedger.create(root,{goal:plan.goal,cwd:root});
  const task = createTask({title:plan.goal.slice(0,200),scope:{
    runtime:plan.runtime,readOnly:true,operationClass:'safe'
  }});
  ledger.append({type:'task.created',task});
  ledger.append({type:'task.transitioned',task_id:task.id,to:'RUNNING'});
  ledger.append({type:'workflow.transitioned',to:'EXECUTE'});
  try {
    const result=await executor();
    // Caller model completion is not independent verification.
    ledger.append({type:'task.transitioned',task_id:task.id,to:'REVIEW_REQUIRED'});
    ledger.append({type:'workflow.transitioned',to:'VERIFY'});
    ledger.append({type:'artifact.recorded',artifact:{
      id:'model-result-summary',type:'execution-status',status:'REVIEW_REQUIRED',
      runtime:plan.runtime, selectedSkills:plan.selectedSkills,
      usageTokens:Number.isSafeInteger(result?.usageTokens)?result.usageTokens:null,
      verified:false
    }});
    return {runId:path.basename(ledger.runDir),state:'REVIEW_REQUIRED',result};
  } catch (error) {
    ledger.append({type:'task.transitioned',task_id:task.id,to:'FAILED'});
    ledger.append({type:'workflow.transitioned',to:'DEBUG'});
    // Never persist host error text: it may contain credentials, private paths, or task context.
    ledger.append({type:'artifact.recorded',artifact:{
      id:'model-result-summary',type:'execution-status',status:'FAILED',runtime:plan.runtime,
      verified:false
    }});
    throw error;
  }
}
