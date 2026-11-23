/**
 * Veyra Orchestrate Engine — veyra-orchestrate
 * Native collaboration, optional governor, sequential fallback, and task intent routing (DEC-21, DEC-22, DEC-23).
 * Zero external dependencies.
 */

export function detectHostEnvironment(env = process.env) {
  if (env.GEMINI_CLI || env.ANTIGRAVITY_AGENT) return 'GEMINI_ANTIGRAVITY';
  if (env.CODEX_CLI || env.CODEX_SANDBOX) return 'CODEX';
  if (env.CLAUDE_CODE || env.ANTHROPIC_CLI) return 'CLAUDE';
  return 'GENERIC_NODE';
}

export function resolveExecutionStrategy(hasNativeSubagents = false) {
  if (hasNativeSubagents) {
    return {
      strategy: 'NATIVE_PARALLEL_COLLABORATION',
      governorOptional: true,
      sequentialFallback: false
    };
  }
  return {
    strategy: 'TRANSPARENT_SEQUENTIAL_FALLBACK',
    governorOptional: true,
    sequentialFallback: true,
    warning: 'NATIVE_SUBAGENTS_UNAVAILABLE_RUNNING_SEQUENTIALLY'
  };
}

export const KNOWN_SKILLS = [
  'veyra-core', 'veyra-context', 'veyra-handoff', 'veyra-research',
  'veyra-grill', 'veyra-plan', 'veyra-architecture', 'veyra-execute',
  'veyra-debug', 'veyra-prototype', 'veyra-test', 'veyra-review',
  'veyra-verify', 'veyra-security', 'veyra-release', 'veyra-interface',
  'veyra-writing', 'veyra-skillcraft', 'veyra-orchestrate'
];

export function routeTaskByIntent(userPrompt = '', options = {}) {
  if (options && options.overrideSkill && typeof options.overrideSkill === 'string') {
    const override = options.overrideSkill.toLowerCase().trim();
    if (override === 'veyra-ui' || override === 'ui') return 'veyra-interface';
    if (KNOWN_SKILLS.includes(override)) return override;
    if (KNOWN_SKILLS.includes(`veyra-${override}`)) return `veyra-${override}`;
    return options.overrideSkill;
  }
  if (typeof userPrompt !== 'string' || userPrompt.length === 0) return 'veyra-core';
  const lower = userPrompt.toLowerCase().trim();

  const explicitPrefixMatch = lower.match(/^(?:run\s+|use\s+)(?:skill\s+)?([a-z0-9_-]+)/i);
  if (explicitPrefixMatch) {
    const rawSkill = explicitPrefixMatch[1];
    if (rawSkill === 'veyra-ui' || rawSkill === 'ui') return 'veyra-interface';
    if (KNOWN_SKILLS.includes(rawSkill)) return rawSkill;
    if (KNOWN_SKILLS.includes(`veyra-${rawSkill}`)) return `veyra-${rawSkill}`;
  }

  const colonPrefixMatch = lower.match(/^([a-z0-9_-]+)\s*[:\-]\s+/i);
  if (colonPrefixMatch) {
    const rawSkill = colonPrefixMatch[1];
    if (rawSkill === 'veyra-ui' || rawSkill === 'ui') return 'veyra-interface';
    if (KNOWN_SKILLS.includes(rawSkill)) return rawSkill;
    if (KNOWN_SKILLS.includes(`veyra-${rawSkill}`)) return `veyra-${rawSkill}`;
  }

  const slashCommandMatch = lower.match(/^\/([a-z0-9_-]+)/i);
  if (slashCommandMatch) {
    const rawSkill = slashCommandMatch[1];
    if (rawSkill === 'veyra-ui' || rawSkill === 'ui') return 'veyra-interface';
    if (KNOWN_SKILLS.includes(rawSkill)) return rawSkill;
    if (KNOWN_SKILLS.includes(`veyra-${rawSkill}`)) return `veyra-${rawSkill}`;
  }

  if (/\b(?:contrast|kontras|ui|interface|accessibility|aksesibilitas|warna|color|theme|token|touch target|hallmark)\b/i.test(lower)) {
    return 'veyra-interface';
  }
  if (/\b(?:debug|crash|root cause|flaky|failure log|regression|investigate)\b/i.test(lower)) {
    return 'veyra-debug';
  }
  if (/\b(?:architecture|arsitektur|coupling|circular|boundary|seam|boundaries)\b/i.test(lower)) {
    return 'veyra-architecture';
  }
  if (/\b(?:security|keamanan|secret|leak|rls|injection|traversal|credentials)\b/i.test(lower)) {
    return 'veyra-security';
  }
  if (/\b(?:plan|rencana|dag|cycle|blast radius|phases|schedule)\b/i.test(lower)) {
    return 'veyra-plan';
  }
  if (/\b(?:handoff|checkpoint|resume|continue|session|sesi)\b/i.test(lower)) {
    return 'veyra-handoff';
  }
  if (/\b(?:research|riset|evidence|provenance|citation|primary source)\b/i.test(lower)) {
    return 'veyra-research';
  }
  if (/\b(?:execute|eksekusi|implement|tdd|patch|minimal change)\b/i.test(lower)) {
    return 'veyra-execute';
  }
  if (/\b(?:verify|verifikasi|receipt|completion claim|proof)\b/i.test(lower)) {
    return 'veyra-verify';
  }
  if (/\b(?:review|diff|dual-axis|code review|audit code)\b/i.test(lower)) {
    return 'veyra-review';
  }
  if (/\b(?:writing|copy|readability|marketing slop|flesch|dokumentasi)\b/i.test(lower)) {
    return 'veyra-writing';
  }
  if (/\b(?:test|suite|assertion density|test runner)\b/i.test(lower)) {
    return 'veyra-test';
  }
  if (/\b(?:prototype|spike|sandbox|throwaway)\b/i.test(lower)) {
    return 'veyra-prototype';
  }
  if (/\b(?:release|semver|migration rollback|release gate)\b/i.test(lower)) {
    return 'veyra-release';
  }
  if (/\b(?:skillcraft|author skill|frontmatter|yaml skill)\b/i.test(lower)) {
    return 'veyra-skillcraft';
  }

  return 'veyra-core';
}

export function compileOrchestrationReceipts(executionTraces = []) {
  const passed = executionTraces.filter(t => t.success).length;
  return {
    totalTasks: executionTraces.length,
    passedTasks: passed,
    failedTasks: executionTraces.length - passed,
    allPassed: passed === executionTraces.length && executionTraces.length > 0,
    timestamp: new Date().toISOString()
  };
}
