import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function commandExists(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "sh",
    process.platform === "win32" ? [cmd] : ["-lc", `command -v ${cmd}`],
    { stdio: "ignore" });
  return r.status === 0;
}

function detectPackageManager(root) {
  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(root, "bun.lockb")) || fs.existsSync(path.join(root, "bun.lock"))) return "bun";
  return "npm";
}

function readPkg(root) {
  const p = path.join(root, "package.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function nodeCandidates(root, logical) {
  const pkg = readPkg(root);
  if (!pkg) return [];
  const scripts = pkg.scripts || {};
  const aliases = {
    lint: ["lint"],
    typecheck: ["typecheck", "type-check", "check:types"],
    test: ["test", "test:unit"],
    build: ["build"],
    e2e: ["test:e2e", "e2e"]
  };
  const found = (aliases[logical] || [logical]).find((s) => scripts[s]);
  if (!found) return [];
  const pm = detectPackageManager(root);
  return [[pm, pm === "npm" ? ["run", found] : ["run", found], `node:${found}`]];
}

function pythonCandidates(root, logical) {
  const isPy = ["pyproject.toml","requirements.txt","Pipfile","poetry.lock","uv.lock"]
    .some((f) => fs.existsSync(path.join(root, f)));
  if (!isPy) return [];

  if (logical === "lint") {
    if (commandExists("ruff")) return [["ruff", ["check", "."], "python:ruff"]];
    if (commandExists("flake8")) return [["flake8", ["."], "python:flake8"]];
  }
  if (logical === "typecheck" && commandExists("mypy")) return [["mypy", ["."], "python:mypy"]];
  if (logical === "test" && commandExists("pytest")) return [["pytest", ["-q"], "python:pytest"]];
  if (logical === "build" && fs.existsSync(path.join(root, "pyproject.toml")) && commandExists("python")) {
    return [["python", ["-m", "build"], "python:build"]];
  }
  return [];
}

export function verifyUniversal({ root, risk, config, quiet = false }) {
  const requested = config.verification?.[risk] || [];
  const results = [];
  const skipped = [];

  for (const logical of requested) {
    const candidates = [
      ...nodeCandidates(root, logical),
      ...pythonCandidates(root, logical)
    ];

    if (!candidates.length) {
      skipped.push(`${logical}: no supported project-native command detected`);
      continue;
    }

    // Run one candidate per ecosystem. Avoid duplicate logical checks within same ecosystem.
    const byEcosystem = new Map();
    for (const c of candidates) {
      const ecosystem = c[2].split(":")[0];
      if (!byEcosystem.has(ecosystem)) byEcosystem.set(ecosystem, c);
    }

    for (const [ecosystem, [cmd, args, label]] of byEcosystem) {
      if (!quiet) process.stdout.write(`\n[harness] ${logical} (${ecosystem}): ${cmd} ${args.join(" ")}\n`);
      const start = Date.now();
      const r = spawnSync(cmd, args, { cwd: root, stdio: quiet ? "pipe" : "inherit", encoding: "utf8" });
      results.push({
        logical, ecosystem, label,
        command: `${cmd} ${args.join(" ")}`,
        ok: r.status === 0,
        status: r.status ?? 1,
        durationMs: Date.now() - start,
        stderr: quiet && r.stderr ? String(r.stderr).slice(-4000) : undefined,
        stdout: quiet && r.stdout ? String(r.stdout).slice(-4000) : undefined
      });
      if (r.status !== 0) return { results, skipped, ok: false };
    }
  }

  // Zero executed checks must not be reported as successful verification.
  // A repository can still be scanned in zero-config mode, but that is distinct
  // from having actually linted, tested, typechecked, or built the project.
  return {
    results,
    skipped,
    status: results.length === 0 ? "INCOMPLETE" : "PASSED",
    ok: results.length > 0 && results.every((r) => r.ok),
  };
}
