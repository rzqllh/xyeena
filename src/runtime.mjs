import path from 'node:path';

export const RUNTIMES = Object.freeze({
  antigravity: Object.freeze({
    id: 'antigravity',
    skillDir: '.agents/skills',
    agentDir: '.agents/agents',
    ruleDir: '.agents/rules',
    nativeManifest: 'plugin.json',
    features: ['skills', 'rules', 'agents', 'hooks', 'mcp'],
  }),
  claude: Object.freeze({
    id: 'claude',
    skillDir: '.claude/skills',
    agentDir: '.claude/agents',
    nativeManifest: '.claude-plugin/plugin.json',
    features: ['skills', 'agents', 'hooks', 'mcp'],
  }),
  codex: Object.freeze({
    id: 'codex',
    skillDir: '.agents/skills',
    agentDir: null,
    nativeManifest: '.codex-plugin/plugin.json',
    marketplaceManifest: '.agents/plugins/marketplace.json',
    features: ['skills', 'agents', 'plugins'],
  }),
});

export function runtimeDescriptor(name) {
  const value = RUNTIMES[name];
  if (!value) throw new Error(`unsupported runtime ${name}; use ${Object.keys(RUNTIMES).join(', ')}, or all`);
  return value;
}

export function runtimeTargets(cwd, runtimes) {
  const out = new Map();
  for (const runtime of runtimes) {
    const descriptor = runtimeDescriptor(runtime);
    const target = path.join(cwd, descriptor.skillDir);
    const current = out.get(target) || [];
    current.push(runtime);
    out.set(target, current);
  }
  return [...out.entries()].map(([target, owners]) => ({ target, runtimes: owners }));
}
