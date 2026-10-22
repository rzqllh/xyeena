import fs from 'node:fs';
import path from 'node:path';
import { supportedSkillHosts } from './skill-hosts.mjs';
import { routeWorkspaceSkills, discoverWorkspaceSkills } from './workspace-skills.mjs';
import { createPortableHostAdapter } from './portable-cli-adapter.mjs';
import { createAntigravitySdkAdapter } from './antigravity-sdk-adapter.mjs';
import { inventoryFingerprint } from './skill-cache.mjs';
import { inferWorkflowState } from './workflow-intent.mjs';
import { buildEnterprisePolicy } from './enterprise-policy.mjs';

const HOSTS = new Set(supportedSkillHosts());
const VALID_STATES = new Set(['TRIAGE','DISCOVER','GRILL','RESEARCH','PROTOTYPE','DEFINE','PLAN','EXECUTE','DEBUG','VERIFY','REVIEW','RELEASE','CLOSE','ESCALATE']);
const EXECUTABLE_HOSTS = new Set(['hermes','gemini','codex','claude','antigravity']);
const VALID_SKILL = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Single entry point with explicit host capability boundaries. No model calls in preview. */
export function previewOrchestration({ cwd = process.cwd(), runtime, goal, state = 'AUTO',
  includeGlobal = true, home, env = process.env, maxSupporting = 2 } = {}) {
  if (!HOSTS.has(runtime)) throw new Error('Choose a supported AI host');
  if (typeof goal !== 'string' || !goal.trim() || goal.length > 12000)
    throw new Error('Provide a non-empty bounded orchestration goal');
  if (state !== 'AUTO' && !VALID_STATES.has(state)) throw new Error('Unsupported workflow state');
  const inference = state === 'AUTO' ? inferWorkflowState(goal) : null;
  const resolvedState = inference?.state || state;
  if (!Number.isInteger(maxSupporting) || maxSupporting < 0 || maxSupporting > 7)
    throw new Error('Invalid supporting-skill budget');
  const root = fs.realpathSync(path.resolve(cwd));
  const settings = { cwd: root, runtime, includeGlobal, env, ...(home ? { home } : {}) };
  const inventory = discoverWorkspaceSkills(settings);
  const inventoryRevision = inventoryFingerprint(settings);
  const installed = inventory.filter(s => s.availability === 'detected');
  const governor = installed.find(s => s.name === 'xyeena-rig') || installed.find(s => s.name === 'xyeena-orchestrate');
  const route = routeWorkspaceSkills({ ...settings, state: resolvedState, prompt: goal, maxSupporting });
  const picked = [route.primary, ...route.supporting].filter(s => s && !['xyeena-orchestrate','xyeena-rig'].includes(s.name));
  const skills = [...new Set([...(governor ? [governor.name] : []), ...picked.map(s => s.name)])].slice(0, 8);
  const sdkSkillPaths = [...new Set(skills.map(name => inventory.find(s => s.name === name && s.availability === 'detected'))
    .filter(Boolean).map(s => path.dirname(s.path)))];
  const hasBridge = EXECUTABLE_HOSTS.has(runtime);
  const ready = !!governor;
  const enterprise = buildEnterprisePolicy({goal,state:resolvedState,inventory,selectedSkills:skills});
  return {
    schema: 1, mode: 'preview-only', executed: false, runtime, goal, cwd: root,
    state: resolvedState, stateSource: inference?.source || 'explicit',
    includeGlobal, maxSupporting, ...(home ? { home } : {}),
    ready, hostExecutionAvailable: hasBridge,
    execution: runtime === 'antigravity' ? 'sdk-one-shot' : 'cli-one-shot',
    entrypoint: governor?.name === 'xyeena-rig' ? '/xyeena-rig' : '/xyeena-orchestrate',
    enterprise,
    selectedSkills: skills, skillPaths: sdkSkillPaths, inventoryRevision,
    missingOrchestrator: !governor,
    unavailable: inventory.filter(s => s.availability !== 'detected').map(s => ({
      name: s.name, reason: s.availability
    })),
    requiresConsent: true,
    requiresManualHost: !hasBridge,
    reason: !ready ? 'xyeena-rig or xyeena-orchestrate is missing or not eligible in this runtime' :
      !hasBridge ? 'Native in-session dispatch must run inside the host; no CLI execution adapter is installed' : null,
    verification: 'NOT_EXECUTED'
  };
}

/** Runs only supported, safe read-only one-shot adapters; never claims verification. */
export async function executeOrchestration(plan, {
  yes = false, command, python, timeoutMs, delegate = false,
  portableAdapterFactory = createPortableHostAdapter,
  antigravityAdapterFactory = createAntigravitySdkAdapter
} = {}) {
  if (!plan || plan.schema !== 1 || plan.mode !== 'preview-only' || plan.executed !== false)
    throw new Error('Use a fresh orchestration preview before execution');
  if (!yes) throw new Error('A real provider-backed call requires explicit --yes');
  // Re-scan at execution time so a stale preview never asserts removed or untrusted skills.
  const fresh = previewOrchestration({ cwd: plan.cwd, runtime: plan.runtime, goal: plan.goal,
    state: plan.state, includeGlobal: plan.includeGlobal, maxSupporting: plan.maxSupporting,
    ...(plan.home ? { home: plan.home } : {}) });
  if (fresh.inventoryRevision !== plan.inventoryRevision ||
      JSON.stringify(fresh.selectedSkills) !== JSON.stringify(plan.selectedSkills) ||
      JSON.stringify(fresh.skillPaths) !== JSON.stringify(plan.skillPaths))
    throw new Error('Installed skill inventory changed since preview; preview again');
  if (!fresh.ready) throw new Error(fresh.reason || 'Orchestrator is unavailable');
  if (!fresh.hostExecutionAvailable) throw new Error(fresh.reason || 'No native host execution adapter');
  if (typeof delegate !== 'boolean') throw new Error('Invalid delegation flag');
  if (delegate && plan.runtime !== 'antigravity')
    throw new Error('Subagent delegation is not enabled for this host bridge');
  if (plan.selectedSkills.some(name => !VALID_SKILL.test(name)))
    throw new Error('Invalid selected skill');
  if (plan.runtime !== 'antigravity') {
    const adapter = portableAdapterFactory({
      cwd: plan.cwd, runtime: plan.runtime, selectedSkills: plan.selectedSkills,
      ...(command ? { command } : {}), ...(timeoutMs !== undefined ? { timeoutMs } : {})
    });
    const result = await adapter.executeTask({
      id: 'orchestrator-one-shot', title: plan.goal, state: 'READY', depends_on: [],
      scope: { readOnly: true, operationClass: 'safe' }
    });
    return { ...result, verified: false, evidenceRefs: [], status: 'REVIEW_REQUIRED',
      entrypoint: plan.entrypoint, selectedSkills: plan.selectedSkills };
  }
  const adapter = antigravityAdapterFactory({
    cwd: plan.cwd, skillPaths: plan.skillPaths, enableSubagents: delegate,
    ...(python ? { python } : {}), ...(timeoutMs !== undefined ? { timeoutMs } : {})
  });
  const result = await adapter.executeTask({
    id: 'orchestrator-one-shot', title: plan.goal, state: 'READY', depends_on: [],
    scope: { readOnly: true, operationClass: 'safe' }
  });
  return { ...result, verified: false, evidenceRefs: [], status: 'REVIEW_REQUIRED',
    entrypoint: plan.entrypoint, selectedSkills: plan.selectedSkills };
}
