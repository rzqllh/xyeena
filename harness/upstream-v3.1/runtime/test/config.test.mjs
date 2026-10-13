import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "../lib/config.mjs";

test("missing config falls back to embedded universal defaults", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-config-"));
  const loaded = loadConfig(root);
  assert.equal(loaded.bootstrap, true);
  assert.equal(loaded.initialized, false);
  assert.equal(loaded.source, "embedded universal defaults");
  assert.equal(loaded.config.schemaVersion, 3);
});

test(".xyeena/config.json takes precedence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-config-primary-"));
  fs.mkdirSync(path.join(root, ".xyeena"), { recursive: true });
  const cfg = {
    schemaVersion: 3,
    risk: { default: "LOW", rules: [] },
    verification: { LOW: [] },
    scan: {},
    remoteGate: {}
  };
  fs.writeFileSync(path.join(root, ".xyeena", "config.json"), JSON.stringify(cfg));
  const loaded = loadConfig(root);
  assert.equal(loaded.bootstrap, false);
  assert.equal(loaded.source, ".xyeena/config.json");
  assert.equal(loaded.config.risk.default, "LOW");
});
