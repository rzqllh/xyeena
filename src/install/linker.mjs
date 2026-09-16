import fs from 'node:fs';
import path from 'node:path';
import { copyDir, ensureDir } from '../util.mjs';

function lstatOrNull(file) {
  try { return fs.lstatSync(file); } catch { return null; }
}

function sameLink(dst, src) {
  const stat = lstatOrNull(dst);
  if (!stat?.isSymbolicLink()) return false;
  try {
    const linked = fs.readlinkSync(dst);
    const resolved = path.resolve(path.dirname(dst), linked);
    return path.resolve(resolved) === path.resolve(src);
  } catch {
    return false;
  }
}

export function linkDir(src, dst, { force = false, dryRun = false } = {}) {
  const existing = lstatOrNull(dst);
  if (existing) {
    if (sameLink(dst, src)) return [];
    if (!force) throw new Error(`refusing to replace existing path: ${dst} (use --force)`);
    if (!dryRun) fs.rmSync(dst, { recursive: true, force: true });
  }
  if (!dryRun) {
    ensureDir(path.dirname(dst));
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(path.resolve(src), dst, type);
  }
  return [dst];
}

function copyFile(src, dst, { force = false, dryRun = false } = {}) {
  if (fs.existsSync(dst) && !force) {
    const a = fs.readFileSync(src);
    const b = fs.readFileSync(dst);
    if (!a.equals(b)) throw new Error(`refusing to overwrite modified file: ${dst} (use --force)`);
    return [];
  }
  if (!dryRun) {
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
  }
  return [dst];
}

export function executeActions(actions, { force = false, dryRun = false } = {}) {
  const touched = [];
  for (const action of actions) {
    if (action.type === 'copy-dir') {
      const existing = lstatOrNull(action.dst);
      if (existing?.isSymbolicLink()) {
        if (!force) throw new Error(`refusing to copy over link: ${action.dst} (use --force)`);
        if (!dryRun) fs.rmSync(action.dst, { recursive: true, force: true });
      }
      touched.push(...copyDir(action.src, action.dst, { force, dryRun }));
      continue;
    }
    if (action.type === 'link-dir') {
      touched.push(...linkDir(action.src, action.dst, { force, dryRun }));
      continue;
    }
    if (action.type === 'copy-file') {
      touched.push(...copyFile(action.src, action.dst, { force, dryRun }));
      continue;
    }
    throw new Error(`unknown install action ${action.type}`);
  }
  return touched;
}
