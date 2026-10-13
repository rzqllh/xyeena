import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT, VERSION } from '../src/paths.mjs';

test('CLI, published package, and npm lockfile use one version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT,'package.json'),'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT,'package-lock.json'),'utf8'));
  assert.equal(VERSION, pkg.version);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('Harness v3.1 snapshot is a private source component', () => {
  const main=JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT,'package.json'),'utf8'));
  const upstream=JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT,'harness','upstream-v3.1','package.json'),'utf8'));
  assert.ok(main.files.includes('harness/'), 'Harness source must ship with main package');
  assert.equal(main.license,'MIT');
  assert.equal(upstream.private,true,'Vendored Harness must not become a second publishable package');
  assert.equal(upstream.license,'MIT');
  assert.ok(fs.existsSync(path.join(PACKAGE_ROOT,'harness','upstream-v3.1','LICENSE')));
  assert.equal(fs.existsSync(path.join(PACKAGE_ROOT,'harness','upstream-v3.1','LICENSE-NOT-SET.md')),false);
});
