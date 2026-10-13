import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyUniversal } from "../lib/verify-universal.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bin = path.join(root, "bin", "xyeena-harness.mjs");
function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyeena-safety-"));
  const run = (...argv) => spawnSync(argv[0], argv.slice(1), { cwd: dir, encoding: "utf8" });
  try {
    assert.equal(run("git", "init", "-q").status, 0);
    assert.equal(run("git", "config", "user.email", "test@example.invalid").status, 0);
    assert.equal(run("git", "config", "user.name", "Test").status, 0);
    fs.writeFileSync(path.join(dir, "README.md"), "one\n");
    assert.equal(run("git", "add", ".").status, 0);
    assert.equal(run("git", "commit", "-qm", "initial").status, 0);
    fn(dir, run);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test("verification with zero executed checks is INCOMPLETE", () => fixture((dir) => {
  const config = { verification: { LOW: ["lint"] } };
  const v = verifyUniversal({ root: dir, risk: "LOW", config, quiet: true });
  assert.equal(v.ok, false);
  assert.equal(v.status, "INCOMPLETE");
  assert.equal(v.results.length, 0);
}));

test("explicit missing diff base fails rather than returning a false zero-change result", () => fixture((dir, run) => {
  const r = run("node", bin, "doctor", "--base", "origin/non-existent");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Explicit diff base/);
}));

test("implicit missing origin target is clearly reported and uses a valid fallback", () => fixture((dir, run) => {
  fs.writeFileSync(path.join(dir, "README.md"), "two\n");
  assert.equal(run("git", "add", ".").status, 0);
  assert.equal(run("git", "commit", "-qm", "second").status, 0);
  const r = run("node", bin, "doctor");
  assert.equal(r.status, 0);
  assert.match(r.stderr, /is unavailable/);
  assert.match(r.stdout, /changed vs HEAD\^: 1/);
}));

test("install-hook preserves existing pre-push hook", () => fixture((dir, run) => {
  const hook = path.join(dir, ".git", "hooks", "pre-push");
  fs.writeFileSync(hook, "#!/bin/sh\necho KEEP_ME\n");
  const r = run("node", bin, "install-hook");
  assert.equal(r.status, 2);
  assert.match(fs.readFileSync(hook, "utf8"), /KEEP_ME/);
}));
