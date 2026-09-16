import { id, nowIso } from './util.mjs';
export const MESSAGE_TYPES=['ASSIGN','STATUS','QUESTION','RESULT','FINDING','CHALLENGE','RESPONSE','EVIDENCE','BLOCKED','FAILED','CANCEL','CAPABILITY_REQUEST'];
export function message({runId,taskId,from,to,type,payload={},artifactRefs=[],evidenceRefs=[],correlationId=null,causedBy=null}){
  if(!MESSAGE_TYPES.includes(type)) throw new Error(`invalid message type ${type}`);
  if(!runId||!taskId||!from||!to) throw new Error('message requires runId, taskId, from, to');
  return {message_id:id('msg'),run_id:runId,task_id:taskId,from,to,type,correlation_id:correlationId,caused_by:causedBy,payload,artifact_refs:artifactRefs,evidence_refs:evidenceRefs,created_at:nowIso()};
}
