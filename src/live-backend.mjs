import { selectSubagentBackend } from './enterprise-policy.mjs';

const clone = obj => structuredClone(obj);
const safeEvidence = refs => Array.isArray(refs)
  ? [...new Set(refs.filter(x => typeof x==='string' && x.trim() && x.length<=1024))].slice(0,64)
  : [];
function validTask(task) {
  if (!task || typeof task!=='object' || typeof task.id!=='string' || !task.id ||
      typeof task.title!=='string' || !task.title.trim() ||
      !task.scope || typeof task.scope!=='object')
    throw new Error('Delegation requires a bounded task ID, title and scope');
  if (task.scope.operationClass && !['safe','external','destructive'].includes(task.scope.operationClass))
    throw new Error('Unsupported task operation class');
  if (typeof task.scope.readOnly!=='boolean') throw new Error('Task must declare readOnly explicitly');
}
async function healthyAdapter(adapter,probeTimeoutMs=3000) {
  if (!adapter || typeof adapter.probe!=='function' ||
      typeof adapter.executeTask!=='function' || typeof adapter.cancelTask!=='function') return null;
  let timer;
  try {
    const capabilities=await Promise.race([
      Promise.resolve().then(()=>adapter.probe()),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Probe timed out')),probeTimeoutMs);})
    ]);
    if (capabilities?.healthy!==true || capabilities.noNestedDelegation!==true) return null;
    return {enabled:true,healthy:true,adapterAvailable:true,
      supportsWrites:capabilities.supportsWrites===true,
      supportsParallel:capabilities.supportsParallel===true};
  } catch {return null;}
  finally {clearTimeout(timer);}
}
/**
 * Adapter-only execution boundary. No synthetic agent IDs or provider-side setup.
 * The controller must supply real authenticated and scoped Simpul/native adapters.
 */
export async function dispatchScopedTask({task,inlineAdapter,backends={},approvedTaskIds=[],
  verifyEvidence=null,authorizeOperation=null,maxParallel=2,timeoutMs=120000,onEvent=null}={}) {
  validTask(task);
  if (!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>300000)
    throw new Error('Invalid dispatch timeout');
  if (!Array.isArray(approvedTaskIds)) throw new Error('Explicit approvedTaskIds list is required');
  if (verifyEvidence!==null && typeof verifyEvidence!=='function')
    throw new Error('Independent verifier must be a function');
  if (onEvent!==null && typeof onEvent!=='function') throw new Error('Invalid event callback');
  if (!inlineAdapter || typeof inlineAdapter.executeTask!=='function')
    throw new Error('Real inline adapter required for safe fallback');
  const permission=task.scope.operationClass||'safe';
  if (task.scope.readOnly!==true||permission!=='safe') {
    if (!approvedTaskIds.includes(task.id))
      throw new Error('Task-scoped authorization required; host approval is separately mandatory');
    if (typeof authorizeOperation!=='function' || await authorizeOperation(clone(task))!=='allow-once')
      throw new Error('An explicit allow-once host authorization callback is mandatory');
  }
  const offers={};
  if (task.requiresDelegation===true) {
    for (const backend of ['simpul','native']) {
      const capabilities=await healthyAdapter(backends[backend]);
      if (capabilities) offers[backend]=capabilities;
    }
  }
  const decision=selectSubagentBackend({
    task:{requiresDelegation:task.requiresDelegation===true,
      independent:task.independent===true,readOnly:task.scope.readOnly===true,
      isolatedWorktrees:task.isolatedWorktrees===true},
    backends:offers,maxParallel
  });
  const adapter=decision.backend==='inline' ? inlineAdapter : backends[decision.backend];
  const controller=new AbortController();
  let timer;
  onEvent?.({type:'task.started',taskId:task.id,backend:decision.backend});
  try {
    const invoke=Promise.resolve().then(()=>adapter.executeTask(clone(task),{
      signal:controller.signal,noNestedDelegation:true,parallelism:decision.parallelism
    }));
    const timeout=new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('Scoped task execution timed out')),timeoutMs);
    });
    const result=await Promise.race([invoke,timeout]);
    if (decision.backend!=='inline' && (typeof result?.workerId!=='string' || !result.workerId.trim()))
      throw new Error('Subagent adapter did not return a real worker identifier');
    const evidence=safeEvidence(result?.evidenceRefs);
    let verified=false;
    if (result?.verified===true && evidence.length>0 && verifyEvidence) {
      try {verified=await verifyEvidence(clone(task),[...evidence],result)===true;}
      catch {verified=false;}
    }
    const output={taskId:task.id,backend:decision.backend,parallelism:decision.parallelism,
      status:verified?'VERIFIED':'REVIEW_REQUIRED',verified,
      evidenceRefs:evidence,workerId:typeof result?.workerId==='string'?result.workerId:null};
    onEvent?.({type:'task.finished',...output});
    return output;
  } catch(error) {
    controller.abort();
    if (decision.backend!=='inline') {
      try {await adapter.cancelTask({taskId:task.id,reason:'failed-or-timed-out'});}
      catch {/* cancellation is best-effort; never claim task completion */}
    } else if (typeof adapter.cancelTask==='function') {
      try {await adapter.cancelTask({taskId:task.id,reason:'failed-or-timed-out'});}
      catch {/* best-effort */}
    }
    onEvent?.({type:'task.failed',taskId:task.id,backend:decision.backend});
    throw error;
  } finally {clearTimeout(timer);}
}
