import test from "node:test";
import assert from "node:assert/strict";
import { globToRegExp, matchesAny } from "../lib/glob.mjs";

test("glob handles ** and *", () => {
  assert.equal(globToRegExp("**/auth/**").test("src/auth/login.ts"), true);
  assert.equal(globToRegExp("**/auth/**").test("auth/login.ts"), true);
  assert.equal(globToRegExp("docs/**").test("docs/a/b.md"), true);
  assert.equal(globToRegExp("**/*.md").test("README.md"), true);
});

test("matchesAny normalizes windows separators", () => {
  assert.equal(matchesAny("src\\auth\\x.ts", ["**/auth/**"]), true);
});
