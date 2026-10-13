import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PACKAGE_ROOT } from './paths.mjs';

// Upstream `init` scaffolds AGENTS.md outside the selective installer;
// install-hook changes Git hooks. Neither operation is exposed by this bridge.
const SUPPORTED = new Set(['doctor','adapters','audit','changed','risk','scan','verify','prepush']);

export function runHarness(command, { cwd = process.cwd(), base = null, explicitBase = false, evidence = false } = {}) {
  if (!SUPPORTED.has(command)) {
    console.error('Unsupported harness command: ' + command + '. Use "xyeena init" for selective configuration.');
    return 2;
  }
  const entry = path.join(PACKAGE_ROOT, 'harness', 'upstream-v3.1', 'runtime', 'xyeena-harness.mjs');
  const args = [entry, command];
  if (base) args.push('--base', base);
  if (evidence) args.push('--evidence');
  const child = spawnSync(process.execPath, args, {
    cwd: path.resolve(cwd), stdio: 'inherit', windowsHide: true, timeout: 15 * 60 * 1000,
  });
  if (child.error) {
    console.error('Harness execution failed: ' + child.error.message);
    return 2;
  }
  return child.status === null ? 2 : child.status;
}
