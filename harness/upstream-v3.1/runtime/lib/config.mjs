import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LEGACY_CONFIG_NAMES = [
  "xyeena-harness.config.json",
  "xyeena-harness.config.example.json"
];

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const EMBEDDED_DEFAULTS = path.resolve(THIS_DIR, "..", "default-config.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function validateConfig(c, source) {
  const schema = c.schemaVersion ?? c.version;
  if (![2, 3].includes(schema)) {
    throw new Error(`Unsupported harness config schema in ${source}: ${schema ?? "missing"}`);
  }
  if (!c.risk || !c.verification || !c.scan || !c.remoteGate) {
    throw new Error(`Incomplete harness config in ${source}`);
  }
}

export function loadEmbeddedDefaults() {
  const parsed = readJson(EMBEDDED_DEFAULTS);
  validateConfig(parsed, EMBEDDED_DEFAULTS);
  return parsed;
}

export function loadConfig(root) {
  const primary = path.join(root, ".xyeena", "config.json");
  if (fs.existsSync(primary)) {
    const parsed = readJson(primary);
    validateConfig(parsed, primary);
    return { config: parsed, path: primary, source: ".xyeena/config.json", initialized: true, bootstrap: false };
  }

  for (const name of LEGACY_CONFIG_NAMES) {
    const p = path.join(root, name);
    if (fs.existsSync(p)) {
      const parsed = readJson(p);
      validateConfig(parsed, p);
      return {
        config: parsed,
        path: p,
        source: name,
        initialized: name !== "xyeena-harness.config.example.json",
        bootstrap: name === "xyeena-harness.config.example.json"
      };
    }
  }

  return {
    config: loadEmbeddedDefaults(),
    path: null,
    source: "embedded universal defaults",
    initialized: false,
    bootstrap: true
  };
}
