import fs from "node:fs";
import path from "node:path";

export function loadAdapters(rootOfHarness, ids) {
  const out = [];
  for (const id of ids) {
    const p = path.join(rootOfHarness, "adapters", `${id}.json`);
    if (!fs.existsSync(p)) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(p, "utf8")));
    } catch {}
  }
  return out;
}

export function mergeRiskRules(config, adapters) {
  const existing = [...(config.risk?.rules || [])];
  for (const adapter of adapters) {
    const risk = adapter.risk || {};
    if (risk.high?.length) existing.push({ level: "HIGH", patterns: risk.high });
    if (risk.medium?.length) existing.push({ level: "MEDIUM", patterns: risk.medium });
    if (risk.low?.length) existing.push({ level: "LOW", patterns: risk.low });
  }
  return {
    ...config,
    risk: {
      ...(config.risk || {}),
      rules: existing
    }
  };
}
