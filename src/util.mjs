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

function assignFlag(out, key, value) {
  if (out[key] === undefined) { out[key] = value; return; }
  if (Array.isArray(out[key])) { out[key].push(value); return; }
  out[key] = [out[key], value];
}

export function parseFlags(args) {
  const out = { _: [] };
  const aliases = { a: 'agent', s: 'skill', y: 'yes', g: 'global', h: 'help' };
  const booleanFlags = new Set(['yes', 'global', 'copy', 'force', 'dryRun', 'all', 'help']);

  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('-') || token === '-') { out._.push(token); continue; }

    let raw;
    let inline;
    if (token.startsWith('--')) {
      [raw, inline] = token.slice(2).split('=', 2);
    } else {
      raw = aliases[token.slice(1)] || token.slice(1);
    }
    const key = (aliases[raw] || raw).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (inline !== undefined) { assignFlag(out, key, inline); continue; }
    if (booleanFlags.has(key)) { assignFlag(out, key, true); continue; }
    if (i + 1 < args.length && !args[i + 1].startsWith('-')) assignFlag(out, key, args[++i]);
    else assignFlag(out, key, true);
  }
  return out;
}

export function flagList(value) {
  if (value === undefined || value === null || value === false) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
}
