import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {PACKAGE_ROOT,VERSION} from '../src/paths.mjs';

const read=file=>fs.readFileSync(path.join(PACKAGE_ROOT,file),'utf8');
const json=file=>JSON.parse(read(file));

test('isolated 0.5.0 candidate has consistent npm, CLI and native plugin metadata',()=>{
  assert.equal(VERSION,'0.5.0');
  const pkg=json('package.json'),lock=json('package-lock.json');
  assert.equal(pkg.name,'xyeena-agent');
  assert.equal(pkg.version,VERSION);
  assert.equal(lock.version,VERSION);
  assert.equal(lock.packages[''].version,VERSION);
  for(const descriptor of ['plugin.json','.claude-plugin/plugin.json','.codex-plugin/plugin.json'])
    assert.equal(json(descriptor).version,VERSION,descriptor);
  assert.equal(pkg.publishConfig.access,'public');
});

test('0.5.0 candidate cannot be mistaken for an already published npm install',()=>{
  const readme=read('README.md'),site=read('site/index.html');
  const gate=read('docs/xyeena-rig/RELEASE-CANDIDATE-0.5.0.md');
  const workflow=read('.github/workflows/publish.yml');
  assert.match(readme,/xyeena-agent@0\.5\.0/);
  assert.match(readme,/unpublished/i);
  assert.match(readme,/xyeena-agent@0\.4\.1/);
  assert.match(site,/npm v0\.4\.1/);
  assert.match(site,/xyeena-agent@0\.5\.0 is an unpublished release candidate/);
  assert.match(gate,/PUBLICATION_NOT_AUTHORIZED/);
  assert.match(gate,/issues\/34/);
  assert.match(gate,/issues\/36/);
  assert.match(gate,/issues\/37/);
  assert.match(workflow,/release:\s*\n\s+types:\s*\[published\]/);
  assert.doesNotMatch(workflow,/^\s+push:/m);
  assert.doesNotMatch(workflow,/\$\{\{\s*secrets\./);
});
