import fs from "node:fs";
import path from "node:path";

function exists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return null; }
}

function packageDeps(root) {
  const pkg = readJsonSafe(path.join(root, "package.json")) || {};
  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.peerDependencies || {})
  };
}

export function detectProject(root, changedFiles = []) {
  const deps = packageDeps(root);
  const adapters = ["generic-git"];
  const signals = [];

  if (exists(root, "package.json")) {
    adapters.push("node");
    signals.push("package.json");
  }

  if (deps.next) {
    adapters.push("nextjs");
    signals.push("next dependency");
  }

  if (
    exists(root, "pyproject.toml") ||
    exists(root, "requirements.txt") ||
    exists(root, "Pipfile") ||
    exists(root, "poetry.lock") ||
    exists(root, "uv.lock")
  ) {
    adapters.push("python");
    signals.push("python project files");
  }

  if (
    exists(root, "pnpm-workspace.yaml") ||
    exists(root, "turbo.json") ||
    exists(root, "nx.json") ||
    exists(root, "lerna.json")
  ) {
    adapters.push("monorepo");
    signals.push("monorepo tooling");
  }

  if (exists(root, "vercel.json") || exists(root, ".vercel/project.json")) {
    adapters.push("vercel");
    signals.push("vercel config");
  }

  if (exists(root, ".github")) {
    adapters.push("github");
    signals.push(".github");
  }

  if (
    exists(root, "index.html") &&
    !exists(root, "package.json") &&
    !exists(root, "pyproject.toml")
  ) {
    adapters.push("static-web");
    signals.push("standalone index.html");
  }

  const docsOnly = changedFiles.length > 0 && changedFiles.every((f) =>
    /(^|\/)(README|CHANGELOG|LICENSE)[^/]*$/i.test(f) ||
    /^docs\//.test(f) ||
    /\.(md|mdx|txt)$/i.test(f)
  );
  if (docsOnly) {
    adapters.push("docs-only");
    signals.push("docs-only change set");
  }

  return {
    adapters: [...new Set(adapters)],
    signals
  };
}
