import { matchesAny } from "./glob.mjs";

export const ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function classifyRisk(files, config) {
  if (!files.length) return { level: "LOW", reasons: ["No changed files detected."] };

  let level = config.risk?.default || "MEDIUM";
  const reasons = [];

  // Start LOW if every changed file matches a LOW rule, otherwise default.
  const lowRule = (config.risk?.rules || []).find((r) => r.level === "LOW");
  if (lowRule && files.every((f) => matchesAny(f, lowRule.patterns || []))) {
    level = "LOW";
    reasons.push("All changed files match LOW-risk patterns.");
  }

  for (const rule of config.risk?.rules || []) {
    const hits = files.filter((f) => matchesAny(f, rule.patterns || []));
    if (hits.length && ORDER[rule.level] > ORDER[level]) {
      level = rule.level;
    }
    if (hits.length && rule.level !== "LOW") {
      reasons.push(`${rule.level}: ${hits.slice(0, 8).join(", ")}${hits.length > 8 ? "…" : ""}`);
    }
  }

  return { level, reasons: reasons.length ? reasons : [`Default risk: ${level}`] };
}
