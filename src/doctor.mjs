import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
export function doctor(cwd=process.cwd()){
  const git=spawnSync('git',['--version'],{encoding:'utf8'}); const manifest=path.join(cwd,'.xyeena','install.json');
  return {node:process.version,git:git.status===0?git.stdout.trim():'not found',installed:fs.existsSync(manifest),manifest:fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):null,
    paths:{agentSkills:fs.existsSync(path.join(cwd,'.agents','skills')),antigravityAgents:fs.existsSync(path.join(cwd,'.agents','agents')),claudeSkills:fs.existsSync(path.join(cwd,'.claude','skills')),claudeAgents:fs.existsSync(path.join(cwd,'.claude','agents'))}};
}
