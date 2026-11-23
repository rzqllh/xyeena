import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function findTestFiles(dir) {
  let files = [];
  if (!dir) return files;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findTestFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      files.push(full);
    }
  }
  return files;
}

const testFiles = findTestFiles('tests').sort();
const res = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
process.exit(res.status ?? (res.signal ? 1 : 0));
