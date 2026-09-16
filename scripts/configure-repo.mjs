import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const args=process.argv.slice(2); const oi=args.indexOf('--owner'); const ri=args.indexOf('--repo');
if(oi<0||!args[oi+1]){console.error('Usage: npm run configure:repo -- --owner <github-user-or-org> [--repo xyeena]');process.exit(1)}
const owner=args[oi+1], repo=ri>=0&&args[ri+1]?args[ri+1]:'xyeena', root=process.cwd(), url=`https://github.com/${owner}/${repo}`;
const files=['package.json','.claude-plugin/plugin.json','.codex-plugin/plugin.json','.claude-plugin/marketplace.json'];
for(const rel of files){const p=path.join(root,rel); let s=fs.readFileSync(p,'utf8').replaceAll('https://github.com/YOUR_GITHUB_USERNAME/xyeena',url).replaceAll('git+https://github.com/YOUR_GITHUB_USERNAME/xyeena.git',`git+${url}.git`); fs.writeFileSync(p,s)}
console.log(`Configured repository metadata for ${url}`);
