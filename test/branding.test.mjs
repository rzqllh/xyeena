import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PACKAGE_ROOT, VERSION } from '../src/paths.mjs';

const load = file => JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, file), 'utf8'));

test('Rig branding preserves published technical package and plugin identifiers', () => {
  const pkg = load('package.json');
  assert.equal(pkg.name, 'xyeena-agent');
  assert.equal(pkg.version, VERSION);
  assert.equal(pkg.bin.xyeena, 'bin/xyeena.mjs');
  assert.equal(pkg.bin['xyeena-agent'], 'bin/xyeena.mjs');
  assert.match(pkg.description, /Xyeena Rig/);
  assert.equal(load('plugin.json').name, 'xyeena');
  assert.equal(load('.claude-plugin/plugin.json').name, 'xyeena');
  assert.equal(load('.codex-plugin/plugin.json').name, 'xyeena');
  assert.equal(load('.claude-plugin/marketplace.json').plugins[0].name, 'xyeena');
  assert.equal(load('.agents/plugins/marketplace.json').plugins[0].name, 'xyeena');
  assert.equal(load('.codex-plugin/plugin.json').interface.displayName, 'Xyeena Rig');
  assert.match(fs.readFileSync(path.join(PACKAGE_ROOT, 'README.md'), 'utf8'), /^# Xyeena Rig\r?\n/);
});

test('Rig CLI help is branded while the version-only output remains stable', () => {
  const command = path.join(PACKAGE_ROOT, 'bin', 'xyeena.mjs');
  const help = spawnSync(process.execPath, [command, 'help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, new RegExp('Xyeena Rig ' + VERSION.replaceAll('.', '\\.') ));
  const version = spawnSync(process.execPath, [command, 'version'], { encoding: 'utf8' });
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), VERSION);
});
