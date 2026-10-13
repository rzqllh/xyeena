import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const folder = path.resolve('harness/upstream-v3.1/runtime/test');
const testFiles = fs.readdirSync(folder).filter(name => name.endsWith('.test.mjs')).map(name=>path.join(folder,name));
if (!testFiles.length) { console.error('No vendored Harness v3.1 tests found'); process.exit(2); }
const result = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit', windowsHide: true });
process.exitCode = result.status === null ? 2 : result.status;
