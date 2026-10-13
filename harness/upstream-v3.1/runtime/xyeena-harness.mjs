#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  repoRoot, currentBranch, headSha, trackedFiles, untrackedFiles,
  changedFiles, indexDirty, worktreeDirty, isGitRepo, runGit
} from "./lib/git.mjs";
import { loadConfig } from "./lib/config.mjs";
import { classifyRisk } from "./lib/risk.mjs";
import { scanRepository } from "./lib/scan.mjs";
import { evaluateContracts } from "./lib/contracts.mjs";
import { writeEvidence } from "./lib/evidence.mjs";
import { detectProject } from "./lib/detect.mjs";
import { loadAdapters, mergeRiskRules } from "./lib/adapters.mjs";
import { verifyUniversal } from "./lib/verify-universal.mjs";
import { initializeProject } from "./lib/init.mjs";

const args = process.argv.slice(2);
const command = args[0] || "doctor";
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);

function fail(msg, code = 1) {
  console.error(`\n[xyeena] BLOCKED: ${msg}`);
  process.exit(code);
}
function info(msg) { console.log(`[xyeena] ${msg}`); }
function warn(msg) { console.warn(`[xyeena] WARN: ${msg}`); }

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const harnessRoot = path.resolve(THIS_DIR, "..");

if (command === "help" || flag("--help") || flag("-h")) {
  console.log(`Xyeena Harness 3.1

Usage:
  xyeena init
  xyeena doctor [--base origin/main]
  xyeena adapters
  xyeena audit [--base origin/main]
  xyeena changed [--base origin/main]
  xyeena risk [--base origin/main]
  xyeena scan
  xyeena verify [--base origin/main]
  xyeena prepush [--base origin/main]
  xyeena install-hook

Key behavior:
  doctor/audit/scan/verify do NOT require prior init.
  Missing config activates embedded universal defaults (bootstrap mode).
`);
  process.exit(0);
}

if (command === "version" || flag("--version") || flag("-v")) {
  const pkg = JSON.parse(fs.readFileSync(path.join(harnessRoot, "package.json"), "utf8"));
  console.log(pkg.version);
  process.exit(0);
}

if (command === "init") {
  const cwd = process.cwd();
  const result = initializeProject(cwd);
  info(`initialized target: ${cwd}`);
  info(`git repository: ${result.gitRepository ? "yes" : "no"}`);
  info(`target branch: ${result.targetBranch}`);
  info(`detected adapters: ${result.adapters.join(", ") || "(none)"}`);
  if (result.created.length) info(`created: ${result.created.join(", ")}`);
  if (result.skipped.length) info(`preserved existing: ${result.skipped.join(", ")}`);
  info(`.gitignore: ${result.gitignore}`);
  if (!result.gitRepository) warn("No Git repository detected. Config was created, but Git-specific checks become available after git init.");
  process.exit(0);
}

if (!isGitRepo(process.cwd())) {
  fail("This command needs a Git repository. Run `git init` first, or use `xyeena init` to scaffold configuration before Git exists.");
}

const root = repoRoot();
let loaded;
try { loaded = loadConfig(root); }
catch (e) { fail(`Configuration exists but is invalid: ${e.message}`); }

let { config } = loaded;
if (loaded.bootstrap) {
  info("bootstrap mode: no project config found; using embedded universal defaults.");
  info("This is not a blocker for doctor/audit/scan/verify. Run `xyeena init` when you want persistent project configuration.");
}

const configuredBase = config.targetBranch ? `origin/${config.targetBranch}` : "HEAD";
const requestedBase = getArg("--base", configuredBase);
const baseProvided = args.includes("--base");
function validRef(ref) {
  return runGit(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { allowFailure: true, cwd: root }).status === 0;
}
let base = requestedBase;
let baseStatus = "resolved";
if (!validRef(base)) {
  if (baseProvided) fail(`Explicit diff base '${base}' was not found. Supply a valid commit or branch.`, 2);
  const localTarget = config.targetBranch || "main";
  if (validRef(localTarget)) {
    base = localTarget;
    baseStatus = "local-fallback";
  } else if (validRef("HEAD^")) {
    base = "HEAD^";
    baseStatus = "previous-commit-fallback";
  } else if (validRef("HEAD")) {
    base = "HEAD";
    baseStatus = "head-only-fallback";
  } else {
    fail("No valid Git commit exists for comparison. Create the initial commit first.", 2);
  }
  warn(`Git base '${requestedBase}' is unavailable; comparing against '${base}' (${baseStatus}). Committed-change coverage may be incomplete.`);
}
const changed = changedFiles(base, root);

const detected = detectProject(root, changed);
const explicitAdapters = Array.isArray(config.adapters) ? config.adapters : [];
const adapterIds = config.adapterMode === "manual"
  ? explicitAdapters
  : [...new Set([...detected.adapters, ...explicitAdapters])];
const adapters = loadAdapters(harnessRoot, adapterIds);
config = mergeRiskRules(config, adapters);

let risk = classifyRisk(changed, config);
if (adapterIds.includes("docs-only") && risk.level !== "CRITICAL") {
  risk = { level: "LOW", reasons: [...risk.reasons, "docs-only adapter override"] };
}

function allFiles() { return [...new Set([...trackedFiles(root), ...untrackedFiles(root)])]; }
function findingsReport(title, findings) {
  if (!findings.length) { info(`${title}: clean`); return; }
  console.log(`\n${title}:`);
  for (const f of findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`- ${f.severity} ${f.type} ${loc}${f.rule ? ` [${f.rule}]` : ""}: ${f.detail}`);
  }
}
function runScan() {
  const findings = scanRepository({ root, files: allFiles(), config });
  findingsReport("Repository scan", findings);
  return findings;
}
function runContracts() {
  const findings = evaluateContracts({ root, files: allFiles(), config });
  findingsReport("Contract scan", findings);
  return findings;
}
function adapterSummary() { return adapterIds.length ? adapterIds.join(", ") : "(none)"; }

if (command === "doctor") {
  info(`root: ${root}`);
  info(`config: ${loaded.source}`);
  info(`mode: ${loaded.bootstrap ? "BOOTSTRAP" : "CONFIGURED"}`);
  info(`branch: ${currentBranch(root) || "(detached HEAD)"}`);
  const sha = headSha(root);
  info(`head: ${sha ? sha.slice(0, 12) : "(no commits yet)"}`);
  info(`changed vs ${base}: ${changed.length}`);
  info(`base status: ${baseStatus}`);
  info(`adapters: ${adapterSummary()}`);
  for (const s of detected.signals) console.log(`  - detected: ${s}`);
  info(`risk: ${risk.level}`);
  for (const reason of risk.reasons) console.log(`  - ${reason}`);
  info(`worktree: ${worktreeDirty(root) ? "dirty" : "clean"}`);
  process.exit(0);
}

if (command === "adapters") {
  console.log(JSON.stringify({ configMode: loaded.bootstrap ? "bootstrap" : "configured", adapters: adapterIds, signals: detected.signals }, null, 2));
  process.exit(0);
}

if (command === "changed") {
  console.log(JSON.stringify({ base, files: changed }, null, 2));
  process.exit(0);
}

if (command === "risk") {
  console.log(JSON.stringify({ base, adapters: adapterIds, ...risk, files: changed }, null, 2));
  process.exit(0);
}

if (command === "audit") {
  const scanFindings = runScan();
  const contractFindings = runContracts();
  const blocks = [...scanFindings, ...contractFindings].filter((f) => f.severity === "BLOCK");
  const warnings = [...scanFindings, ...contractFindings].filter((f) => f.severity !== "BLOCK");

  console.log("\nAudit summary:");
  console.log(`- configuration: ${loaded.bootstrap ? "bootstrap defaults (project config absent)" : loaded.source}`);
  console.log(`- adapters: ${adapterSummary()}`);
  console.log(`- risk: ${risk.level}`);
  console.log(`- changed files: ${changed.length}`);
  console.log(`- blockers found: ${blocks.length}`);
  console.log(`- non-blocking findings: ${warnings.length}`);
  if (loaded.bootstrap) console.log("- note: project-specific invariants were not assumed; run `xyeena init` to persist project configuration.");
  console.log("- audit mode is read-only; findings are reported without stopping early.");
  process.exit(0);
}

if (command === "scan") {
  const findings = [...runScan(), ...runContracts()];
  if (findings.some((f) => f.severity === "BLOCK")) process.exit(2);
  process.exit(0);
}

function doVerify(gate = "verify") {
  const scanFindings = [...runScan(), ...runContracts()];
  if (scanFindings.some((f) => f.severity === "BLOCK")) fail("Scan/contract gate failed.", 2);

  info(`${gate} risk: ${risk.level}`);
  info(`active adapters: ${adapterSummary()}`);
  const verification = verifyUniversal({ root, risk: risk.level, config });
  for (const s of verification.skipped) info(`skipped: ${s}`);
  if (verification.status === "INCOMPLETE") warn("No project-native verification check ran; this is not a verified PASS.");

  const payload = {
    schemaVersion: 2,
    harnessVersion: "3.1.0",
    generatedAt: new Date().toISOString(),
    gate,
    configMode: loaded.bootstrap ? "bootstrap" : "configured",
    configSource: loaded.source,
    branch: currentBranch(root),
    head: headSha(root),
    base,
    baseStatus,
    adapters: adapterIds,
    detectionSignals: detected.signals,
    risk,
    changedFiles: changed,
    scanFindings,
    verification
  };
  const evidencePath = (flag("--evidence") || gate === "prepush") ? writeEvidence({ root, payload }) : null;
  if (evidencePath) info(`evidence: ${path.relative(root, evidencePath)}`);
  if (!verification.ok) fail(`${gate} verification failed.`, 3);
  return verification;
}

if (command === "verify") {
  doVerify("verify");
  process.exit(0);
}

if (command === "prepush") {
  const branch = currentBranch(root);
  if ((config.protectedBranches || []).includes(branch) &&
      config.remoteGate?.blockProtectedBranchPush &&
      process.env.XYEENA_ALLOW_PROTECTED_PUSH !== "1") {
    fail(`Direct push from protected branch '${branch}'. Use a feature branch or explicitly set XYEENA_ALLOW_PROTECTED_PUSH=1 when authorized.`);
  }
  if (config.remoteGate?.requireCleanIndex && indexDirty(root)) {
    fail("Index contains staged-but-uncommitted changes. Commit or unstage before push.");
  }
  doVerify("prepush");
  info("pre-push gate passed");
  process.exit(0);
}

if (command === "install-hook") {
  const relativeHook = runGit(["rev-parse", "--git-path", "hooks/pre-push"], { cwd: root }).stdout;
  const hook = path.resolve(root, relativeHook);
  if (fs.existsSync(hook)) fail(`Existing pre-push hook preserved: ${hook}. Compose hooks manually.`, 2);
  const binPath = path.join(harnessRoot, "bin", "xyeena-harness.mjs");
  const script = `#!/bin/sh\nnode "${binPath}" prepush\n`;
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, script, { flag: "wx", mode: 0o755 });
  info(`installed ${hook}`);
  process.exit(0);
}

fail(`Unknown command '${command}'. Run \`xyeena help\`.`);
