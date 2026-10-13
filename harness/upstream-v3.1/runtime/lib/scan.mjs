import fs from "node:fs";
import path from "node:path";
import { matchesAny } from "./glob.mjs";

function isProbablyText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) suspicious++;
  }
  return suspicious / Math.max(1, sample.length) < 0.02;
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

export function scanRepository({ root, files, config }) {
  const findings = [];
  const scan = config.scan || {};
  const allow = scan.allowPaths || [];

  for (const rel of files) {
    const normalized = rel.replaceAll("\\", "/");
    if (matchesAny(normalized, allow)) continue;

    if (matchesAny(normalized, scan.blockedPaths || [])) {
      findings.push({ severity: "BLOCK", type: "blocked-path", file: normalized, detail: "Blocked artifact path." });
    }

    const base = path.basename(normalized);
    if ((scan.blockedTrackedEnvNames || []).includes(base) && !(scan.allowedEnvNames || []).includes(base)) {
      findings.push({ severity: "BLOCK", type: "tracked-env", file: normalized, detail: `Tracked sensitive env file: ${base}` });
    }

    const full = path.join(root, normalized);
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;
    if (fs.statSync(full).size > (scan.maxTextFileBytes || 1000000)) continue;

    const buf = fs.readFileSync(full);
    if (!isProbablyText(buf)) continue;
    const text = buf.toString("utf8");

    for (const pattern of scan.blockedContentPatterns || []) {
      let re;
      try {
        re = new RegExp(pattern.regex, "gim");
      } catch {
        findings.push({ severity: "WARN", type: "invalid-config-regex", file: normalized, detail: pattern.name });
        continue;
      }
      const match = re.exec(text);
      if (match) {
        findings.push({
          severity: "BLOCK",
          type: "blocked-content",
          file: normalized,
          line: lineNumber(text, match.index),
          detail: pattern.name
        });
      }
    }
  }
  return findings;
}
