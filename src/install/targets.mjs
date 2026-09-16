import os from 'node:os';
import path from 'node:path';

export const AGENTS = Object.freeze({
  antigravity: Object.freeze({
    id: 'antigravity',
    label: 'Antigravity',
    projectSkills: '.agents/skills',
    globalSkills: ['.gemini', 'antigravity', 'skills'],
    projectAgents: '.agents/agents',
    globalAgents: ['.gemini', 'config', 'agents'],
    projectRule: ['.agents', 'rules', 'xyeena-core.md'],
  }),
  claude: Object.freeze({
    id: 'claude',
    label: 'Claude Code',
    projectSkills: '.claude/skills',
    globalSkills: ['.claude', 'skills'],
    projectAgents: '.claude/agents',
    globalAgents: ['.claude', 'agents'],
    projectRule: null,
  }),
  codex: Object.freeze({
    id: 'codex',
    label: 'Codex',
    projectSkills: '.agents/skills',
    globalSkills: ['.codex', 'skills'],
    projectAgents: null,
    globalAgents: null,
    projectRule: null,
  }),
});

export function normalizeAgents(value) {
  if (value === 'all') return Object.keys(AGENTS);
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  const out = [];
  for (const raw of values.flatMap((v) => String(v).split(','))) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const normalized = name === 'claude-code' ? 'claude' : name;
    if (!AGENTS[normalized]) throw new Error(`unsupported agent ${raw}; use ${Object.keys(AGENTS).join(', ')}`);
    if (!out.includes(normalized)) out.push(normalized);
  }
  return out;
}

export function skillTarget(agentName, scope, cwd, home = os.homedir()) {
  const agent = AGENTS[agentName];
  if (!agent) throw new Error(`unsupported agent ${agentName}`);
  if (scope === 'global') return path.join(home, ...agent.globalSkills);
  return path.join(cwd, agent.projectSkills);
}

export function agentTarget(agentName, scope, cwd, home = os.homedir()) {
  const agent = AGENTS[agentName];
  const rel = scope === 'global' ? agent?.globalAgents : agent?.projectAgents;
  if (!rel) return null;
  return Array.isArray(rel) ? path.join(home, ...rel) : path.join(cwd, rel);
}

export function ruleTarget(agentName, scope, cwd) {
  const agent = AGENTS[agentName];
  if (!agent?.projectRule || scope !== 'project') return null;
  return path.join(cwd, ...agent.projectRule);
}
