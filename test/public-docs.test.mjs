import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from '../src/paths.mjs';

const read = relative => fs.readFileSync(path.join(PACKAGE_ROOT, relative), 'utf8');
const retired = [
  'ACCEPTANCE_MATRIX.md', 'EVIDENCE.md', 'NATIVE_ACCEPTANCE_HANDOFF.md',
  'README.md', 'REQUIREMENTS_TRACEABILITY.md', 'ROADMAP.md',
  'RISK_REGISTER.md', 'TASK_TRACKER.md'
].map(name => `docs/xyeena-rig/${name}`);

function markdownFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}

test('internal handoffs stay out of the maintained documentation', () => {
  for (const file of retired) assert.equal(fs.existsSync(path.join(PACKAGE_ROOT, file)), false, file);
});

test('public guides have working relative links', () => {
  const docs = [path.join(PACKAGE_ROOT, 'README.md'), path.join(PACKAGE_ROOT, 'CONTRIBUTING.md'),
    path.join(PACKAGE_ROOT, 'SECURITY.md'), ...markdownFiles(path.join(PACKAGE_ROOT, 'docs'))];
  for (const file of docs) {
    const text = fs.readFileSync(file, 'utf8').replace(/```[^\n]*\n[\s\S]*?```/g, '');
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(target))), `${file}: ${target}`);
    }
  }
});

test('release documentation separates the package, source, and native host evidence', () => {
  const version = JSON.parse(read('package.json')).version;
  const status = read('docs/STATUS.md');
  assert.ok(read('README.md').includes(`xyeena-agent@${version}`));
  assert.match(status, /unreleased/i);
  assert.match(status, /Antigravity CLI 1\.4\.7/);
  assert.match(status, /Antigravity IDE 2\.5\.5/);
  assert.match(status, /LIVE BLOCKED/);
  assert.match(status, /LIVE PARTIAL/);
  assert.match(status, /hostEnforcement: UNVERIFIED/);
  assert.match(status, /after provider execution/);
  assert.match(status, /final owner approval/i);
  for (const issue of [34, 36, 37]) assert.ok(status.includes(`/issues/${issue}`));
  assert.match(status, /Simpul is a separate optional integration/);
});

test('security, attribution, and supported operational guides remain available', () => {
  for (const file of ['LICENSE', 'NOTICE.md', 'SECURITY.md', 'CONTRIBUTING.md',
    'docs/README.md', 'docs/STATUS.md', 'docs/CLI-REFERENCE.md',
    'docs/ARCHITECTURE.md', 'docs/xyeena-rig/ARCHITECTURE.md', 'docs/xyeena-rig/RUNBOOK.md']) {
    assert.ok(fs.statSync(path.join(PACKAGE_ROOT, file)).isFile(), file);
  }
  assert.match(read('docs/xyeena-rig/RUNBOOK.md'), /git worktree add --detach/);
  assert.match(read('docs/xyeena-rig/RUNBOOK.md'), /ops preflight --dir/);
});
