import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
export function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
export function nowIso() { return new Date().toISOString(); }
export function id(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}
export function normalizeText(v = '') {
  return String(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export function within(parent, child) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
export function copyDir(src, dst, { force = false, dryRun = false } = {}) {
  if (!fs.existsSync(src)) throw new Error(`source does not exist: ${src}`);
  const actions = [];
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) actions.push(...copyDir(s, d, { force, dryRun }));
    else if (ent.isFile()) {
      if (fs.existsSync(d) && !force) {
        const a = fs.readFileSync(s);
        const b = fs.readFileSync(d);
        if (!a.equals(b)) throw new Error(`refusing to overwrite modified file: ${d} (use --force)`);
        continue;
      }
      actions.push(d);
      if (!dryRun) {
        ensureDir(path.dirname(d));
        fs.copyFileSync(s, d);
      }
    }
  }
  return actions;
}
export function parseFlags(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const [raw, inline] = a.slice(2).split('=', 2);
    const key = raw.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (inline !== undefined) { out[key] = inline; continue; }
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) out[key] = args[++i];
    else out[key] = true;
  }
  return out;
}
