import fs from "node:fs";
import path from "node:path";

export function writeEvidence({ root, payload }) {
  const dir = path.join(root, ".harness", "evidence");
  fs.mkdirSync(dir, { recursive: true });
  const latest = path.join(dir, "latest.json");
  fs.writeFileSync(latest, JSON.stringify(payload, null, 2) + "\n");
  return latest;
}

export function readEvidence(root) {
  const p = path.join(root, ".harness", "evidence", "latest.json");
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return null; }
}
