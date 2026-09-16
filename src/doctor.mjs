import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function linkInfo(file) {
  try {
    const stat = fs.lstatSync(file);
    return { exists: true, link: stat.isSymbolicLink() };
  } catch {
    return { exists: false, link: false };
  }
}

export function doctor(cwd = process.cwd()) {
  const git = spawnSync('git', ['--version'], { encoding: 'utf8' });
  const manifest = path.join(cwd, '.xyeena', 'install.json');
  const installed = fs.existsSync(manifest);
  const data = installed ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : null;
  return {
    node: process.version,
    git: git.status === 0 ? git.stdout.trim() : 'not found',
    installed,
    manifest: data,
    paths: {
      store: fs.existsSync(path.join(cwd, '.xyeena', 'store', 'skills')),
      agentSkills: linkInfo(path.join(cwd, '.agents', 'skills')),
      antigravityAgents: fs.existsSync(path.join(cwd, '.agents', 'agents')),
      claudeSkills: linkInfo(path.join(cwd, '.claude', 'skills')),
      claudeAgents: fs.existsSync(path.join(cwd, '.claude', 'agents')),
    },
  };
}
