import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateContracts } from "../lib/contracts.mjs";

test("contract rules can require and forbid content", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xh-contract-"));
  fs.mkdirSync(path.join(root, "app"), { recursive: true });
  fs.writeFileSync(path.join(root, "app", "page.tsx"), 'import { PageContainer } from "./x";\nBAD_TERM');
  const config = {
    contracts: [{
      id: "page-contract",
      include: ["app/**"],
      requireRegex: ["PageContainer"],
      forbidRegex: ["BAD_TERM"]
    }]
  };
  const findings = evaluateContracts({ root, files: ["app/page.tsx"], config });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "contract-forbidden");
});
