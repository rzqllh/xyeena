import fs from 'node:fs';
import path from 'node:path';

const CORE = Object.freeze(['permission-boundary','scope-control','evidence-before-claim',
  'anti-loop','external-content-trust']);
const GROUPS = Object.freeze({
  design:'30-design',accessibility:'30-design',regression:'50-quality',
  testing:'50-quality',security:'60-security',review:'50-quality',
  release:'80-operations',rollback:'80-operations'
});
function safeInstalledGuide(root,group) {
  const guide=path.join(root,'.xyeena','harness','guides',group);
  let cursor=root;
  for (const segment of path.relative(root,guide).split(path.sep)) {
    cursor=path.join(cursor,segment);
    try { if (fs.lstatSync(cursor).isSymbolicLink()) return false; }
    catch { return false; }
  }
  try { return fs.statSync(guide).isDirectory() && fs.statSync(path.join(guide,'README.md')).isFile(); }
  catch { return false; }
}
/** Read-only Rig policy inspection. Does not invent an installed project Harness. */
export function inspectRigHarness({cwd=process.cwd(),contextualRequested=[]}={}) {
  const root=fs.realpathSync(path.resolve(cwd));
  if (!fs.statSync(root).isDirectory()) throw new Error('Harness workspace must be a directory');
  const required=[...new Set(contextualRequested.map(x=>GROUPS[x]).filter(Boolean))];
  const installed=required.filter(group=>safeInstalledGuide(root,group));
  return {schema:1,core:{rules:[...CORE],status:'rig-read-only-boundary'},
    contextual:{requested:required,installed,missing:required.filter(x=>!installed.includes(x)),
      enforcement:'guide-presence-only; live host injection not verified'},
    executable:{scope:'read-only-one-shot',writeGates:'not-supported',independentVerification:'required'}};
}
/** An actual local preflight gate for the supported safe read-only execution path. */
export function enforceRigPreflight(plan,{consent=false}={}) {
  if (consent!==true) throw new Error('Harness preflight requires explicit model-call consent');
  if (!plan || plan.schema!==1 || !plan.ready || !plan.hostExecutionAvailable)
    throw new Error('Harness preflight requires a ready, supported orchestration preview');
  if (!['/xyeena-rig','/xyeena-orchestrate'].includes(plan.entrypoint) ||
      !plan.selectedSkills?.includes(plan.entrypoint.slice(1)))
    throw new Error('Harness preflight refuses missing workflow governor');
  if (plan.execution!=='cli-one-shot' && plan.execution!=='sdk-one-shot')
    throw new Error('Harness preflight refuses unsupported execution mode');
  const root=fs.realpathSync(path.resolve(plan.cwd));
  if (root!==plan.cwd) throw new Error('Harness workspace root changed since preview');
  return {status:'PASS',scope:'read-only',operationClass:'safe',rules:[...CORE],
    externalActionsAuthorized:false,destructiveActionsAuthorized:false,
    independentlyVerified:false};
}
