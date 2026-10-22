const SUPERPOWERS = new Set(['brainstorming','writing-plans','executing-plans','subagent-driven-development',
  'systematic-debugging','test-driven-development','requesting-code-review','receiving-code-review',
  'verification-before-completion','using-git-worktrees']);
const KEY_GATES = Object.freeze(['permission-boundary','scope-control','evidence-before-claim','anti-loop','external-content-trust']);
const WORD = (goal,pattern) => pattern.test(String(goal||'').toLowerCase());
/** Provider files are hints only; prefix/name is not proof of a trusted plugin installation. */
export function inspectOptionalProviders(inventory=[]) {
  const eligible=inventory.filter(s=>s && s.availability==='detected');
  const superior=eligible.filter(s=>s.name.startsWith('superior-')).map(s=>s.name);
  const superpowers=eligible.filter(s=>SUPERPOWERS.has(s.name)).map(s=>s.name);
  return {
    superior:{status:superior.length?'candidate':'not-detected',skills:superior},
    superpowers:{status:superpowers.length?'candidate':'not-detected',skills:superpowers}
  };
}
/** No simulated workers: a backend is selectable only with an explicit healthy, actionable adapter. */
export function selectSubagentBackend({task={},backends={},maxParallel=2}={}) {
  if (!Number.isInteger(maxParallel) || maxParallel<1 || maxParallel>16)
    throw new Error('Invalid subagent parallel budget');
  const needed=task.requiresDelegation===true;
  const independent=task.independent===true;
  const readOnly=task.readOnly===true;
  const isolated=task.isolatedWorktrees===true;
  const cap = independent && (readOnly || isolated) ? maxParallel : 1;
  if (!needed) return {backend:'inline',parallelism:1,reason:'delegation-not-needed'};
  for (const kind of ['simpul','native']) {
    const backend=backends[kind];
    if (backend?.enabled===true && backend?.healthy===true && backend?.adapterAvailable===true &&
        (readOnly || backend.supportsWrites===true) &&
        (cap===1 || backend.supportsParallel===true))
      return {backend:kind,parallelism:cap,reason:'verified-backend-capability'};
  }
  return {backend:'inline',parallelism:1,reason:'no-verified-subagent-backend'};
}
/** Honest orchestration contract: policy decisions, never inferred host execution or trust. */
export function buildEnterprisePolicy({goal='',state='TRIAGE',inventory=[],selectedSkills=[],backends={}}={}) {
  const providers=inspectOptionalProviders(inventory);
  const selected=new Set(selectedSkills);
  const selectedExternal=inventory.filter(s=>selected.has(s.name) && s.availability==='detected' &&
    !s.name.startsWith('xyeena-')).map(s=>s.name);
  const nativeReady=selected.has('xyeena-rig') || selected.has('xyeena-orchestrate');
  const ui=WORD(goal,/\b(ui|ux|frontend|design|responsive|accessibility|antarmuka|tampilan)\b/);
  const debug=state==='DEBUG'||WORD(goal,/\b(debug|bug|regression|error|crash|gagal)\b/);
  const security=state==='REVIEW'||WORD(goal,/\b(security|auth|permission|secret|credential|keamanan)\b/);
  const release=state==='RELEASE'||WORD(goal,/\b(deploy|release|publish|merge|push)\b/);
  const contextual=[...(ui?['design','accessibility']:[]),...(debug?['regression','testing']:[]),
    ...(security?['security','review']:[]),...(release?['release','rollback']:[])];
  const task = {requiresDelegation:false,independent:false,readOnly:true};
  return {schema:1,workflowOwner:'xyeena-rig',nativeFallbackAvailable:nativeReady,
    optionalProviders:providers,selectedExternalSkills:selectedExternal,
    harness:{corePolicy:KEY_GATES,contextualRequested:[...new Set(contextual)],
      coreEnforcedBy:'xyeena-and-host-operation-boundaries',
      contextualEnforcement:'requires-installed-project-harness-and-live-adapter'},
    delegation:selectSubagentBackend({task,backends}),
    limitations:['Skill inventory does not prove plugin activation or trust.',
      'Headless orchestration is read-only; native live IDE dispatch is not confirmed.',
      'Simpul and host-native subagents require separate live adapter health checks.']};
}
