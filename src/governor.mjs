export const STATES=['TRIAGE','DISCOVER','GRILL','RESEARCH','PROTOTYPE','DEFINE','PLAN','EXECUTE','DEBUG','VERIFY','REVIEW','RELEASE','CLOSE','ESCALATE'];
const transitions={
  TRIAGE:{route_execute:'EXECUTE',route_discover:'DISCOVER',route_define:'DEFINE'},
  DISCOVER:{need_grill:'GRILL',need_research:'RESEARCH',need_prototype:'PROTOTYPE',resolved:'DEFINE'},
  GRILL:{frontier_empty:'DEFINE',need_fact:'RESEARCH'},
  RESEARCH:{evidence_sufficient:'DEFINE',technical_unknown:'PROTOTYPE',blocked:'ESCALATE'},
  PROTOTYPE:{question_answered:'DEFINE',failed:'DEBUG'},
  DEFINE:{scope_locked:'PLAN',trivial:'EXECUTE',ambiguity:'DISCOVER'},
  PLAN:{plan_ready:'EXECUTE',plan_broken:'DEFINE'},
  EXECUTE:{implementation_ready:'VERIFY',failure:'DEBUG',scope_conflict:'DEFINE'},
  DEBUG:{root_cause_found:'EXECUTE',missing_fact:'RESEARCH',invalid_assumption:'DISCOVER',blocked:'ESCALATE'},
  VERIFY:{pass:'REVIEW',fail_implementation:'DEBUG',fail_requirement:'DEFINE',fail_test:'EXECUTE'},
  REVIEW:{pass:'RELEASE',notes:'RELEASE',changes_required:'EXECUTE',rethink:'DEFINE'},
  RELEASE:{no_external_action:'CLOSE',authorized:'CLOSE',needs_consent:'RELEASE'},
  ESCALATE:{resolved:'DEFINE',abort:'CLOSE'}
};
export function transition(state,event){
  if(!STATES.includes(state)) throw new Error(`unknown state ${state}`);
  const next=transitions[state]?.[event]; if(!next) throw new Error(`invalid transition ${state} --${event}--> ?`); return next;
}
export function initialRoute(risk={}){
  const v=(x)=>String(x||'LOW').toUpperCase();
  const ambiguity=v(risk.ambiguity), blast=v(risk.blastRadius), rev=String(risk.reversibility||'HIGH').toUpperCase(), gap=v(risk.evidenceGap), side=v(risk.sideEffects);
  if(ambiguity==='HIGH'||gap==='HIGH') return 'DISCOVER';
  if(blast==='HIGH'||rev==='LOW'||side==='HIGH') return 'DEFINE';
  return 'EXECUTE';
}
export function classifyFailure(kind){
  return ({implementation:'DEBUG',requirement:'DEFINE',architecture:'DISCOVER',test:'EXECUTE',dependency:'RESEARCH',unknown:'ESCALATE'})[kind]||'DEBUG';
}
export function breaker(history,{maxSameFinding=3,maxReviewCycles=3}={}){
  const findings=history.filter(x=>x.type==='finding').map(x=>x.signature).filter(Boolean);
  const counts=new Map(); for(const f of findings) counts.set(f,(counts.get(f)||0)+1);
  const repeated=[...counts.entries()].find(([,n])=>n>=maxSameFinding);
  const cycles=history.filter(x=>x.type==='review-cycle').length;
  if(repeated) return {trip:true,reason:`repeated finding ${repeated[0]} x${repeated[1]}`,action:'RE-DIAGNOSE'};
  if(cycles>=maxReviewCycles) return {trip:true,reason:`review cycles ${cycles}`,action:'ESCALATE'};
  return {trip:false};
}
