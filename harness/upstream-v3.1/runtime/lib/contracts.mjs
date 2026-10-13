import fs from "node:fs";
import path from "node:path";
import { matchesAny } from "./glob.mjs";

export function evaluateContracts({ root, files, config }) {
  const findings = [];

  for (const rule of config.contracts || []) {
    const targets = files.filter((f) => matchesAny(f, rule.include || ["**/*"]) && !matchesAny(f, rule.exclude || []));
    for (const rel of targets) {
      const full = path.join(root, rel);
      if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;
      const text = fs.readFileSync(full, "utf8");

      for (const req of rule.requireRegex || []) {
        if (!new RegExp(req, "m").test(text)) {
          findings.push({ severity: rule.severity || "BLOCK", type: "contract-required", rule: rule.id, file: rel, detail: req });
        }
      }
      for (const deny of rule.forbidRegex || []) {
        if (new RegExp(deny, "m").test(text)) {
          findings.push({ severity: rule.severity || "BLOCK", type: "contract-forbidden", rule: rule.id, file: rel, detail: deny });
        }
      }
    }
  }

  return findings;
}
