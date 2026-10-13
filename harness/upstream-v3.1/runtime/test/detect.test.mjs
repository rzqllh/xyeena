import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { detectProject } from "../lib/detect.mjs";

test("detects node and nextjs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-detect-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({
    dependencies: { next: "16.0.0", react: "19.0.0" }
  }));
  const d = detectProject(root, ["src/app/page.tsx"]);
  assert.equal(d.adapters.includes("node"), true);
  assert.equal(d.adapters.includes("nextjs"), true);
});

test("detects python", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-detect-py-"));
  fs.writeFileSync(path.join(root, "pyproject.toml"), "[project]\nname='x'\n");
  const d = detectProject(root, ["src/a.py"]);
  assert.equal(d.adapters.includes("python"), true);
});

test("detects docs-only changes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-detect-docs-"));
  const d = detectProject(root, ["README.md", "docs/guide.md"]);
  assert.equal(d.adapters.includes("docs-only"), true);
});
