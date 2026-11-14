import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT, VERSION } from '../src/paths.mjs';

const read = file => fs.readFileSync(path.join(PACKAGE_ROOT, file), 'utf8');
const json = file => JSON.parse(read(file));

test('candidate metadata is aligned without claiming an npm publication', () => {
  assert.equal(VERSION, '0.5.0');
  const pkg = json('package.json');
  const lock = json('package-lock.json');
  assert.equal(pkg.version, VERSION);
  assert.equal(lock.version, VERSION);
  assert.equal(lock.packages[''].version, VERSION);
  for (const descriptor of ['plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    assert.equal(json(descriptor).version, VERSION, descriptor);
  }
  assert.match(read('README.md'), /xyeena-agent@0\.5\.0.*belum dipublikasikan/i);
  assert.match(read('README.md'), /xyeena-agent@0\.4\.1/);
  assert.match(read('site/index.html'), /npm v0\.4\.1/);
  assert.match(read('docs/STATUS.md'), /unpublished/);
});

test('unreleased source cannot publish from a branch push', () => {
  const workflow = read('.github/workflows/publish.yml');
  assert.match(workflow, /release:\s*\n\s+types:\s*\[published\]/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.doesNotMatch(workflow, /\$\{\{\s*secrets\./);
  assert.match(read('docs/STATUS.md'), /Antigravity IDE 2\.5\.5/);
  for (const issue of [34, 36, 37]) assert.match(read('docs/STATUS.md'), new RegExp('issues/' + issue));
});
