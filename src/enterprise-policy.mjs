const SUPERPOWERS = new Set([
  'brainstorming', 'writing-plans', 'executing-plans', 'subagent-driven-development',
  'systematic-debugging', 'test-driven-development', 'requesting-code-review', 'receiving-code-review',
  'verification-before-completion', 'using-git-worktrees', 'using-superpowers', 'writing-skills',
  'diagnosing-superpowers', 'dispatching-parallel-agents'
]);

export const NATIVE_EQUIVALENCE = Object.freeze({
  // Superpowers workflow methodology -> Xyeena native capabilities
  'brainstorming': 'xyeena-plan',
  'writing-plans': 'xyeena-plan',
  'executing-plans': 'xyeena-execute',
  'subagent-driven-development': 'xyeena-orchestrate',
  'systematic-debugging': 'xyeena-debug',
  'test-driven-development': 'xyeena-test',
  'requesting-code-review': 'xyeena-review',
  'receiving-code-review': 'xyeena-review',
  'verification-before-completion': 'xyeena-verify',
  'using-git-worktrees': 'xyeena-core',
  'using-superpowers': 'xyeena-orchestrate',
  'writing-skills': 'xyeena-skillcraft',
  'diagnosing-superpowers': 'xyeena-debug',
  'dispatching-parallel-agents': 'xyeena-orchestrate',

  // Superior specialist capabilities -> Xyeena native capabilities
  'superior-logic': 'xyeena-architecture',
  'superior-testing': 'xyeena-test',
  'superior-code-review': 'xyeena-review',
  'superior-reliability': 'xyeena-core',
  'superior-api-security': 'xyeena-security',
  'superior-performance': 'xyeena-architecture',
  'superior-lean': 'xyeena-architecture',
  'superior-ui': 'xyeena-interface',
  'superior-ui-audit': 'xyeena-interface',
  'superior-ux': 'xyeena-interface',
  'superior-accessibility': 'xyeena-interface',
  'superior-responsive': 'xyeena-interface',
  'superior-docs': 'xyeena-writing',
  'superior-copy': 'xyeena-writing',
  'superior-comments': 'xyeena-writing',
  'superior-delivery': 'xyeena-release',
  'superior-database': 'xyeena-architecture',
  'superior-debugging': 'xyeena-debug'
});

export function nativeFallbackForSkill(skillName) {
  return NATIVE_EQUIVALENCE[skillName] || 'xyeena-core';
}

const KEY_GATES = Object.freeze(['permission-boundary','scope-control','evidence-before-claim','anti-loop','external-content-trust']);
const WORD = (goal,pattern) => pattern.test(String(goal||'').toLowerCase());

/** Provider files are hints only; prefix/name is not proof of a trusted plugin installation. */
export function inspectOptionalProviders(inventory=[]) {
  const all = Array.isArray(inventory) ? inventory : [];
  const eligible = all.filter(s => s && s.availability === 'detected');
  const disabled = all.filter(s => s && s.availability === 'disabled');
  const untrusted = all.filter(s => s && s.availability === 'requires-host-trust');
  const incompatible = all.filter(s => s && s.availability === 'incompatible-platform');

  const supEligible = eligible.filter(s => s.name && s.name.startsWith('superior-')).map(s => s.name);
  const supDisabled = disabled.filter(s => s.name && s.name.startsWith('superior-')).map(s => s.name);
  const supUntrusted = untrusted.filter(s => s.name && s.name.startsWith('superior-')).map(s => s.name);
  const supIncompatible = incompatible.filter(s => s.name && s.name.startsWith('superior-')).map(s => s.name);

  const powEligible = eligible.filter(s => s.name && SUPERPOWERS.has(s.name)).map(s => s.name);
  const powDisabled = disabled.filter(s => s.name && SUPERPOWERS.has(s.name)).map(s => s.name);
  const powUntrusted = untrusted.filter(s => s.name && SUPERPOWERS.has(s.name)).map(s => s.name);
  const powIncompatible = incompatible.filter(s => s.name && SUPERPOWERS.has(s.name)).map(s => s.name);

  const supStatus = supEligible.length ? 'candidate' :
    supDisabled.length ? 'disabled' :
    supUntrusted.length ? 'untrusted' :
    supIncompatible.length ? 'incompatible' : 'not-detected';

  const powStatus = powEligible.length ? 'candidate' :
    powDisabled.length ? 'disabled' :
    powUntrusted.length ? 'untrusted' :
    powIncompatible.length ? 'incompatible' : 'not-detected';

  return {
    superior: {
      status: supStatus,
      skills: supEligible,
      disabled: supDisabled,
      untrusted: supUntrusted,
      incompatible: supIncompatible,
      eligibleCount: supEligible.length
    },
    superpowers: {
      status: powStatus,
      skills: powEligible,
      disabled: powDisabled,
      untrusted: powUntrusted,
      incompatible: powIncompatible,
      eligibleCount: powEligible.length
    }
  };
}

/**
 * Arbitrate workflow methodology, specialist quality, and native fallback.
 * Xyeena Rig is the SINGLE governor; prevents competing task controllers or duplicate lifecycles.
 */
export function arbitrateWorkflow({ goal = '', state = 'TRIAGE', inventory = [], selectedSkills = [], backends = {} } = {}) {
  const providers = inspectOptionalProviders(inventory);
  const selected = new Set(selectedSkills);
  const detectedNames = new Set(inventory.filter(s => s && s.availability === 'detected').map(s => s.name));
  const nativeReady = detectedNames.has('xyeena-rig') || detectedNames.has('xyeena-orchestrate') || selected.has('xyeena-rig') || selected.has('xyeena-orchestrate');

  const powEligible = providers.superpowers.status === 'candidate';
  const supEligible = providers.superior.status === 'candidate';
  const powBlocked = ['disabled', 'untrusted', 'incompatible'].includes(providers.superpowers.status);
  const supBlocked = ['disabled', 'untrusted', 'incompatible'].includes(providers.superior.status);

  let mode = 'native-standalone';
  const deduplications = [];
  const rationale = [];
  const fallbackMappings = {};

  if (powEligible && supEligible) {
    mode = 'integrated-dual-provider';
    rationale.push('Both Superpowers and Superior are eligible. Superpowers supplies methodology, Superior supplies specialist quality, Xyeena governs.');
    // Deduplication of overlapping roles:
    // If both code-review capabilities exist in selection:
    if ((selected.has('superior-code-review') || selected.has('superior-testing')) &&
        (selected.has('requesting-code-review') || selected.has('receiving-code-review') || selected.has('test-driven-development'))) {
      deduplications.push('Code review and testing unified: Superior provides specialist criteria; Superpowers provides step workflow; duplicate review passes suppressed.');
    }
  } else if (powEligible && !supEligible) {
    mode = 'superpowers-with-native-specialist';
    rationale.push('Superpowers active for workflow methodology; native Xyeena capabilities provide specialist quality.');
    if (supBlocked) {
      rationale.push(`Superior is ${providers.superior.status}; falling back to native specialist modules.`);
    }
  } else if (!powEligible && supEligible) {
    mode = 'superior-with-native-workflow';
    rationale.push('Superior active for specialist quality; native Xyeena capabilities provide workflow methodology.');
    if (powBlocked) {
      rationale.push(`Superpowers is ${providers.superpowers.status}; falling back to native workflow modules.`);
    }
  } else {
    mode = 'native-standalone';
    rationale.push('Neither external provider is active. Native Xyeena executes complete workflow with zero outside dependencies.');
    if (powBlocked || supBlocked) {
      rationale.push(`External providers blocked or unavailable (Superpowers: ${providers.superpowers.status}, Superior: ${providers.superior.status}).`);
    }
  }

  // Populate fallback mappings for all non-eligible skills
  for (const s of selectedSkills) {
    if (!detectedNames.has(s)) {
      fallbackMappings[s] = nativeFallbackForSkill(s);
    }
  }

  // Compute arbitrated active skills for execution (deduplicating roles and replacing blocked skills)
  const arbitratedSkills = [];
  for (const s of selectedSkills) {
    if (s === 'xyeena-rig' || s === 'xyeena-orchestrate') {
      arbitratedSkills.push(s);
      continue;
    }
    if (providers.superpowers.skills.includes(s) && !powEligible) {
      arbitratedSkills.push(nativeFallbackForSkill(s));
      continue;
    }
    if (providers.superior.skills.includes(s) && !supEligible) {
      arbitratedSkills.push(nativeFallbackForSkill(s));
      continue;
    }
    // Prune duplicate review passes if both providers are active
    if (powEligible && supEligible) {
      if ((s === 'requesting-code-review' || s === 'receiving-code-review') &&
          (selected.has('superior-code-review') || selected.has('xyeena-review'))) {
        continue;
      }
    }
    if (!detectedNames.has(s)) {
      arbitratedSkills.push(nativeFallbackForSkill(s));
      continue;
    }
    arbitratedSkills.push(s);
  }

  const activeSuperpowers = powEligible ? providers.superpowers.skills.filter(s => selected.has(s)) : [];
  const activeSuperior = supEligible ? providers.superior.skills.filter(s => selected.has(s)) : [];
  const nativeFallbackSkills = Object.values(fallbackMappings);

  return {
    mode,
    workflowOwner: 'xyeena-rig',
    singleGovernorEnforced: true,
    competingControllersBlocked: true,
    arbitratedSkills: [...new Set(arbitratedSkills)],
    superpowers: {
      status: providers.superpowers.status,
      activeSkills: activeSuperpowers,
      delegatedRole: powEligible ? 'workflow-methodology' : null
    },
    superior: {
      status: providers.superior.status,
      activeSkills: activeSuperior,
      delegatedRole: supEligible ? 'specialist-quality' : null
    },
    nativeFallback: {
      active: mode !== 'integrated-dual-provider' || Object.keys(fallbackMappings).length > 0,
      nativeReady,
      fallbackSkills: [...new Set(nativeFallbackSkills)],
      mappings: fallbackMappings
    },
    deduplications,
    rationale
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
        backend?.executionReady!==false &&
        (readOnly || backend.supportsWrites===true) &&
        (cap===1 || backend.supportsParallel===true))
      return {backend:kind,parallelism:cap,reason:'verified-backend-capability'};
  }
  return {backend:'inline',parallelism:1,reason:'no-verified-subagent-backend'};
}

/** Honest orchestration contract: policy decisions, never inferred host execution or trust. */
export function buildEnterprisePolicy({goal='',state='TRIAGE',inventory=[],selectedSkills=[],backends={}}={}) {
  const providers=inspectOptionalProviders(inventory);
  const arbitration=arbitrateWorkflow({goal,state,inventory,selectedSkills,backends});
  const selected=new Set(selectedSkills);
  const selectedExternal=inventory.filter(s=>selected.has(s.name) && s.availability==='detected' &&
    !s.name.startsWith('xyeena-')).map(s=>s.name);
  const nativeReady=selected.has('xyeena-rig') || selected.has('xyeena-orchestrate') || arbitration.nativeFallback.nativeReady;
  const ui=WORD(goal,/\b(ui|ux|frontend|design|responsive|accessibility|antarmuka|tampilan)\b/);
  const debug=state==='DEBUG'||WORD(goal,/\b(debug|bug|regression|error|crash|gagal)\b/);
  const security=state==='REVIEW'||WORD(goal,/\b(security|auth|permission|secret|credential|keamanan)\b/);
  const release=state==='RELEASE'||WORD(goal,/\b(deploy|release|publish|merge|push)\b/);
  const contextual=[...(ui?['design','accessibility']:[]),...(debug?['regression','testing']:[]),
    ...(security?['security','review']:[]),...(release?['release','rollback']:[])];
  const task = {requiresDelegation:false,independent:false,readOnly:true};
  return {
    schema: 1,
    workflowOwner: 'xyeena-rig',
    nativeFallbackAvailable: nativeReady,
    optionalProviders: providers,
    arbitration,
    selectedExternalSkills: selectedExternal,
    harness: {
      corePolicy: KEY_GATES,
      contextualRequested: [...new Set(contextual)],
      coreEnforcedBy: 'xyeena-and-host-operation-boundaries',
      contextualEnforcement: 'requires-installed-project-harness-and-live-adapter'
    },
    delegation: selectSubagentBackend({task,backends}),
    limitations: [
      'Skill inventory does not prove plugin activation or trust.',
      'Headless orchestration is read-only; native live IDE dispatch is not confirmed.',
      'Simpul and host-native subagents require separate live adapter health checks.'
    ]
  };
}
