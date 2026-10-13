import test from "node:test";
import assert from "node:assert/strict";
import { classifyRisk } from "../lib/risk.mjs";

const config = {
  risk: {
    default: "MEDIUM",
    rules: [
      { level: "HIGH", patterns: ["**/auth/**"] },
      { level: "MEDIUM", patterns: ["**/components/**"] },
      { level: "LOW", patterns: ["**/*.md"] }
    ]
  }
};

test("docs-only is LOW", () => {
  assert.equal(classifyRisk(["README.md", "docs/a.md"], config).level, "LOW");
});

test("auth escalates HIGH", () => {
  assert.equal(classifyRisk(["src/auth/session.ts"], config).level, "HIGH");
});

test("code defaults MEDIUM", () => {
  assert.equal(classifyRisk(["src/lib/a.ts"], config).level, "MEDIUM");
});
