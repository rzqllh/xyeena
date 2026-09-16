import fs from 'node:fs';
import path from 'node:path';
import { loadRegistry } from './registry.mjs';

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

export function validateSource(root) {
  const skills = path.join(root, 'skills');
  const registry = loadRegistry(skills);
  const errors = [];
  for (const cap of registry) {
    const file = path.join(cap.__dir, 'SKILL.md');
    if (!fs.existsSync(file)) { errors.push(`${cap.metadata.name}: missing SKILL.md`); continue; }
    const fm = frontmatter(fs.readFileSync(file, 'utf8'));
    if (!fm) { errors.push(`${cap.metadata.name}: missing YAML frontmatter`); continue; }
    if (fm.name !== cap.metadata.name) errors.push(`${cap.metadata.name}: SKILL.md name mismatch`);
    if (!fm.description) errors.push(`${cap.metadata.name}: description required`);
    if ((fm.description || '').length > 1024) errors.push(`${cap.metadata.name}: description >1024 chars`);
  }
  const agentsDir = path.join(root, 'agents');
  if (!fs.existsSync(agentsDir)) errors.push('agents/: missing native agent definitions');
  else {
    for (const ent of fs.readdirSync(agentsDir, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const fm = frontmatter(fs.readFileSync(path.join(agentsDir, ent.name), 'utf8'));
      if (!fm?.name || !fm?.description) errors.push(`agents/${ent.name}: name and description required`);
    }
  }

  for (const p of ['plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.agents/plugins/marketplace.json']) {
    try { JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')); }
    catch (e) { errors.push(`${p}: invalid JSON (${e.message})`); }
  }
  return { ok: errors.length === 0, errors, capabilities: registry.map((c) => c.metadata.name) };
}
