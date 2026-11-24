import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateToolCall } from '../../skills/veyra-core/hook.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HOOK = join(ROOT, 'skills', 'veyra-core', 'hook.mjs');
const event = (tool, input) => ({ hook_event_name: 'BeforeTool', tool_name: tool, tool_input: input });
const run = (root, e) => spawnSync(process.execPath, [HOOK], { cwd: root, encoding: 'utf8', input: JSON.stringify(e) });
const withProject = fn => {
  const root = mkdtempSync(join(tmpdir(), 'veyra-hook-'));
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};

test('native PreToolUse adapter blocks writes and shell by default with exit code 2', () => withProject(root => {
  for (const e of [event('Write',{file_path:'src/a.ts'}),event('Bash',{command:'rm -rf .'}),event('apply_patch',{patch:'*** Begin Patch'})]) {
    const result = run(root,e);
    assert.equal(result.status,2,result.stdout + result.stderr);
    assert.match(result.stderr,/VEYRA_SCOPE_DENIED/);
  }
}));
test('owner scope policy allows only path-matched edit tool inputs', () => withProject(root => {
  mkdirSync(join(root,'.veyra'));
  writeFileSync(join(root,'.veyra','scope.json'),JSON.stringify({
    version:1,readOnly:false,allowedPatterns:['src/**'],allowShell:false
  }));
  const good = run(root,event('Edit',{file_path:'src/feature.ts'}));
  assert.equal(good.status,0,good.stderr);
  assert.equal(JSON.parse(good.stdout).constructor,Object);
  for(const path of ['.env','src/../secrets.env','../outside.txt','docs/readme.md','src/%252e%252e/outside']) {
    assert.equal(run(root,event('Edit',{file_path:path})).status,2,path);
  }
  assert.equal(run(root,event('Bash',{command:'npm test'})).status,2);
}));
test('unsafe policy blocks, no guessed tool input or implicit shell permission', () => withProject(root => {
  mkdirSync(join(root,'.veyra'));
  writeFileSync(join(root,'.veyra','scope.json'),'{}');
  assert.equal(run(root,event('Write',{file_path:'src/a.ts'})).status,2);
  assert.equal(evaluateToolCall(event('Write',{}),{cwd:root}).allowed,false);
}));

test('native PreToolUse adapter rejects symlink escape even when the lexical path matches', () => {
  if (process.platform === 'win32') return; // Windows symlink creation is privilege-dependent
  withProject(root => {
    const outside = mkdtempSync(join(tmpdir(), 'veyra-escape-'));
    try {
      mkdirSync(join(root,'.veyra'));
      writeFileSync(join(root,'.veyra','scope.json'),JSON.stringify({
        version:1,readOnly:false,allowedPatterns:['src/**'],allowShell:false
      }));
      symlinkSync(outside, join(root,'src'), 'dir');
      const output = run(root,event('Edit',{file_path:'src/outside.ts'}));
      assert.equal(output.status,2,output.stdout+output.stderr);
    } finally { rmSync(outside,{recursive:true,force:true}); }
  });
});
